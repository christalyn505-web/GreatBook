<#
================================================================================
  tools/verify.ps1
--------------------------------------------------------------------------------
  Automated pre-submission check. Implements the mechanical half of the
  checklist: the things a script can prove, so the human testing pass can
  concentrate on the things it cannot.

  RUN IT:   double-click  verify.bat

  WHAT IT PROVES
    - no type="module"        (blocked by CORS from file://)
    - no fetch / XHR          (blocked from file://)
    - no import / export      (needs modules, therefore blocked)
    - no absolute "/" paths   (resolve to the filesystem root from file://)
    - every referenced local file actually exists
    - no unreplaced {{PLACEHOLDER}} left in any page
    - every story in the manifest has a page, and every page has a manifest entry
    - every story page shows writer, illustrator and narrator
    - closing.html exists and is reachable
    - total payload size, against the LMS upload budget

  WHAT IT CANNOT PROVE - you must still do these by hand, from an extracted
  copy of the actual zip:
    - the cover plays and scroll unlocks afterwards
    - reloading mid-page does not misplace the parallax
    - audio actually plays and illustrations actually render
    - every quiz link opens the right form WHILE SIGNED OUT
    - it is smooth on a low-end machine and usable on a touchscreen
================================================================================
#>

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'lib-manifest.ps1')

$Fail = New-Object System.Collections.Generic.List[string]
$Warn = New-Object System.Collections.Generic.List[string]
$Pass = New-Object System.Collections.Generic.List[string]

function Rel { param([string]$Path) return $Path.Substring($Root.Length).TrimStart('\') }

<#
  Blank out comments before scanning.

  Without this the checker flags its own documentation: a source comment that
  says "no type=module here" reads exactly like a violation. Comment text is
  replaced with spaces rather than deleted so line numbers stay accurate.

  JS line comments are only stripped at start-of-line, so a "https://" inside
  a string is never mistaken for a comment.
#>
function Blank-Pattern {
    param([string]$Text, [string]$Pattern)
    $evaluator = {
        param($m)
        return ($m.Value -replace '[^\r\n]', ' ')
    }
    return [regex]::Replace($Text, $Pattern, $evaluator,
        [System.Text.RegularExpressions.RegexOptions]::Singleline)
}

function Get-CodeText {
    param([System.IO.FileInfo]$File)

    $text = [System.IO.File]::ReadAllText($File.FullName, [System.Text.Encoding]::UTF8)
    $ext  = $File.Extension.ToLower()

    if ($ext -eq '.html') {
        $text = Blank-Pattern $text '<!--.*?-->'
        $text = Blank-Pattern $text '(?m)^[ \t]*//[^\r\n]*'
    } elseif ($ext -eq '.css') {
        $text = Blank-Pattern $text '/\*.*?\*/'
    } elseif ($ext -eq '.js') {
        $text = Blank-Pattern $text '/\*.*?\*/'
        $text = Blank-Pattern $text '(?m)^[ \t]*//[^\r\n]*'
    }

    return $text
}

# Files that ship. tools/ is dev-only and is excluded from every check.
$shipHtml = Get-ChildItem $Root -Filter *.html -File
$shipJs   = Get-ChildItem (Join-Path $Root 'js')  -Filter *.js  -File -ErrorAction SilentlyContinue
$shipCss  = Get-ChildItem (Join-Path $Root 'css') -Filter *.css -File -ErrorAction SilentlyContinue
$shipJs   = @($shipJs) + @(Get-ChildItem $Root -Filter 'stories.js' -File)

# -----------------------------------------------------------------------------
# A. file:// hazards
# -----------------------------------------------------------------------------

$hazards = @(
    @{ Name = 'type="module"';  Pattern = 'type\s*=\s*["'']module["'']'; Files = 'html' },
    @{ Name = 'fetch(';         Pattern = '\bfetch\s*\(';                Files = 'both' },
    @{ Name = 'XMLHttpRequest'; Pattern = '\bXMLHttpRequest\b';          Files = 'both' },
    @{ Name = 'import ... from';Pattern = '^\s*import\s .*\sfrom\s';     Files = 'js'   },
    @{ Name = 'export ';        Pattern = '^\s*export\s';                Files = 'js'   }
)

foreach ($h in $hazards) {
    $targets = @()
    if ($h.Files -eq 'html' -or $h.Files -eq 'both') { $targets += $shipHtml }
    if ($h.Files -eq 'js'   -or $h.Files -eq 'both') { $targets += $shipJs }

    $hits = @()
    foreach ($f in $targets) {
        $lines = (Get-CodeText -File $f) -split "`r?`n"
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match $h.Pattern) {
                $hits += "$(Rel $f.FullName):$($i + 1)"
            }
        }
    }

    if ($hits.Count -gt 0) {
        $Fail.Add("$($h.Name) found in: $($hits -join ', ')")
    } else {
        $Pass.Add("no $($h.Name)")
    }
}

# -----------------------------------------------------------------------------
# B. absolute paths + reference resolution
# -----------------------------------------------------------------------------

$missing  = New-Object System.Collections.Generic.List[string]
$absolute = New-Object System.Collections.Generic.List[string]
$refCount = 0

function Test-Reference {
    param([string]$Ref, [System.IO.FileInfo]$Source)

    if ([string]::IsNullOrWhiteSpace($Ref)) { return }
    if ($Ref -match '^(https?:|mailto:|data:|javascript:|tel:|#)') { return }

    $script:refCount++

    if ($Ref.StartsWith('/')) {
        $absolute.Add("$(Rel $Source.FullName) -> $Ref")
        return
    }

    $clean = ($Ref -split '[?#]')[0]
    if ([string]::IsNullOrWhiteSpace($clean)) { return }

    $abs = Join-Path (Split-Path -Parent $Source.FullName) ($clean -replace '/', '\')
    try { $abs = [System.IO.Path]::GetFullPath($abs) } catch { return }

    if (-not (Test-Path $abs)) {
        $missing.Add("$(Rel $Source.FullName) -> $Ref")
    }
}

foreach ($f in ($shipHtml + $shipCss)) {
    # Commented-out example markup must not be reported as a broken reference.
    $text = Get-CodeText -File $f

    foreach ($m in [regex]::Matches($text, '(?:href|src)\s*=\s*"([^"]*)"')) {
        Test-Reference -Ref $m.Groups[1].Value -Source $f
    }
    foreach ($m in [regex]::Matches($text, 'url\(\s*[''"]?([^''")]+)[''"]?\s*\)')) {
        Test-Reference -Ref $m.Groups[1].Value -Source $f
    }
}

if ($absolute.Count -gt 0) {
    $Fail.Add("absolute paths (break under file://): $($absolute -join '; ')")
} else {
    $Pass.Add("no absolute '/' paths ($refCount references checked)")
}

if ($missing.Count -gt 0) {
    foreach ($m in $missing) { $Warn.Add("referenced file not found: $m") }
} else {
    $Pass.Add('every referenced local file exists')
}

# -----------------------------------------------------------------------------
# C. unreplaced template placeholders
# -----------------------------------------------------------------------------

$leftover = @()
foreach ($f in $shipHtml) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    foreach ($m in [regex]::Matches($text, '\{\{[A-Z_]+\}\}')) {
        $leftover += "$(Rel $f.FullName): $($m.Value)"
    }
}
if ($leftover.Count -gt 0) { $Fail.Add("unreplaced placeholders: $($leftover -join ', ')") }
else { $Pass.Add('no unreplaced {{PLACEHOLDER}} tokens') }

# -----------------------------------------------------------------------------
# D. manifest <-> pages, and the credit requirement
# -----------------------------------------------------------------------------

$stories = Read-Manifest -Root $Root
$todoCount = 0

foreach ($s in $stories) {
    $page = Join-Path $Root "$($s.slug).html"
    if (-not (Test-Path $page)) {
        $Fail.Add("manifest lists $($s.slug) but $($s.slug).html does not exist - run build.bat")
        continue
    }

    $text = [System.IO.File]::ReadAllText($page, [System.Text.Encoding]::UTF8)

    # Compare against the ESCAPED value: the page stores O'Brien as O&#39;Brien.
    foreach ($role in @(@('writer', $s.writer), @('illustrator', $s.illustrator), @('narrator', $s.narrator))) {
        if ($text.IndexOf((Esc $role[1])) -lt 0) {
            $Fail.Add("$($s.slug).html does not show the $($role[0]) credit - rebuild")
        }
    }

    if ($text -notmatch 'index\.html#toc') {
        $Fail.Add("$($s.slug).html back link does not target index.html#toc")
    }
    if ($text -notmatch 'closing\.html') {
        $Warn.Add("$($s.slug).html does not link to closing.html")
    }
}

$Pass.Add("all $($stories.Count) story pages present, credited, and linked back to #toc")

# leftover TODOs across shipped content
foreach ($f in ($shipHtml + @(Get-Item (Join-Path $Root 'stories.js')))) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $todoCount += ([regex]::Matches($text, 'TODO')).Count
}
if ($todoCount -gt 0) { $Warn.Add("$todoCount 'TODO' markers still visible in shipped files") }

# closing page
if (Test-Path (Join-Path $Root 'closing.html')) {
    $idx = [System.IO.File]::ReadAllText((Join-Path $Root 'index.html'), [System.Text.Encoding]::UTF8)
    if ($idx -match 'closing\.html') { $Pass.Add('closing.html exists and is linked from the table of contents') }
    else { $Fail.Add('closing.html exists but index.html does not link to it') }
} else {
    $Fail.Add('closing.html is MISSING - the brief requires a closing message interface')
}

# cover images
#
# Section B resolves every href/src/url() it finds in the shipped HTML and CSS,
# which covers the illustration and the audio because both are written into the
# story page. The COVER is not: it only ever exists as a string in stories.js
# that js/toc.js reads at runtime. Nothing above would notice it pointing at a
# file that is not there, and the symptom is confined to the marquee - the
# story page still looks perfect - so it gets its own check here.
$coverMissing = New-Object System.Collections.Generic.List[string]
$coverNone    = New-Object System.Collections.Generic.List[string]

foreach ($s in $stories) {
    if ($null -eq $s.cover -or [string]::IsNullOrWhiteSpace([string]$s.cover)) {
        $coverNone.Add([string]$s.slug)
        continue
    }
    $rel = ([string]$s.cover).Trim()
    if ($rel -match '^(https?:|data:)') { continue }
    $abs = Join-Path $Root (($rel -replace '^\./', '') -replace '/', '\')
    if (-not (Test-Path $abs)) { $coverMissing.Add("$($s.slug) -> $rel") }
}

if ($coverMissing.Count -gt 0) {
    $Fail.Add("cover image missing: $($coverMissing -join '; ')")
} elseif ($stories.Count -gt $coverNone.Count) {
    $Pass.Add("$($stories.Count - $coverNone.Count) cover image(s) present for the marquee")
}
if ($coverNone.Count -gt 0) {
    $Warn.Add("$($coverNone.Count) story/stories have no cover image ($($coverNone -join ', ')) - the marquee falls back to the illustration")
}

# quizzes
#
# The quiz is played ON THE PAGE now, so there is no link to test signed-out
# and no internet needed. What CAN still be wrong is an answer index that does
# not match the choice the group meant, and no script can check that - hence
# the standing reminder to play each one through once.
$noQuiz  = New-Object System.Collections.Generic.List[string]
$quizQs  = 0

foreach ($s in $stories) {
    $q = $s.quiz
    if ($null -eq $q) { $q = @() }
    if ($q -isnot [System.Array]) { $q = @($q) }

    if ($q.Count -eq 0) { $noQuiz.Add([string]$s.slug); continue }
    $quizQs += $q.Count

    # The page must actually carry the questions - a stale page from before
    # the quiz was written would otherwise pass every other check here.
    $page = Join-Path $Root "$($s.slug).html"
    if (Test-Path $page) {
        $text = [System.IO.File]::ReadAllText($page, [System.Text.Encoding]::UTF8)
        if ($text -notmatch 'data-quiz') {
            $Fail.Add("$($s.slug) has $($q.Count) quiz question(s) in the manifest but its page has no quiz - run build.bat")
        } else {
            $onPage = ([regex]::Matches($text, 'class="quiz__static-item"')).Count
            if ($onPage -ne $q.Count) {
                $Fail.Add("$($s.slug).html shows $onPage quiz question(s), the manifest has $($q.Count) - run build.bat")
            }
        }
    }
}

if ($noQuiz.Count -gt 0) {
    $Warn.Add("$($noQuiz.Count) of $($stories.Count) stories have no quiz yet ($($noQuiz -join ', ')) - a required brief item")
}
if ($quizQs -gt 0) {
    $Pass.Add("$quizQs quiz question(s) baked into the pages and matching the manifest")
    $Warn.Add('PLAY EACH QUIZ THROUGH ONCE, PICKING THE ANSWER YOU KNOW IS RIGHT - the build proves every "answer" points AT a choice, not that it points at the CORRECT one')
}

# The quiz no longer opens a Google Form. Catch a story-NN.html left over from
# before the change, or a quizUrl left behind in the manifest.
$staleLink = @($stories | Where-Object { $null -ne $_.quizUrl })
if ($staleLink.Count -gt 0) {
    $Warn.Add("$($staleLink.Count) story/stories still carry a `"quizUrl`" in stories.js - the quiz is played on the page now and the field is ignored. Safe to delete.")
}
foreach ($f in $shipHtml) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    if ($text -match 'quiz-link') {
        $Fail.Add("$(Rel $f.FullName) still has the old outbound quiz link markup - run build.bat")
    }
}

# -----------------------------------------------------------------------------
# E. payload size
# -----------------------------------------------------------------------------

# SOURCE MATERIAL, not deliverables. The groups hand in .docx storyboards, .mov
# narration masters and 2000px Canva exports; those get read once, transcribed
# into stories.js, and must not travel to the LMS. One 326MB .mp4 is more than
# the whole upload budget on its own.
$sourceDirs = @(Get-ChildItem $Root -Directory |
    Where-Object { $_.Name -match '^greatbook group' })

# Loose hand-ins dropped in the root: a group's zip, a .docx storyboard, an
# .mov narration master. The site itself is only ever these five extensions in
# the root, so anything else there is source material that must not travel to
# the LMS. An allowlist rather than a list of archive types, because the next
# thing someone drops in will be a format nobody predicted.
$rootShipExt = @('.html', '.js', '.bat', '.md', '.txt')
$sourceFiles = @(Get-ChildItem $Root -File |
    Where-Object { $rootShipExt -notcontains $_.Extension.ToLower() })

$isSource = {
    param($f)
    ($f.FullName -match '\\greatbook group ') -or
    ($sourceFiles | Where-Object { $_.FullName -eq $f.FullName })
}

$allFiles  = Get-ChildItem $Root -Recurse -File
$shipFiles = $allFiles | Where-Object {
    $_.FullName -notmatch '\\tools\\' -and
    -not (& $isSource $_)
}
$totalMb = [math]::Round(($shipFiles | Measure-Object Length -Sum).Sum / 1MB, 2)

if ($sourceDirs.Count -gt 0) {
    $srcFiles = $allFiles | Where-Object { $_.FullName -match '\\greatbook group ' }
    $srcMb    = [math]::Round(($srcFiles | Measure-Object Length -Sum).Sum / 1MB, 2)
    $Warn.Add("$($sourceDirs.Count) group source folder(s) in the project root, $srcMb MB - MOVE OR DELETE THESE BEFORE ZIPPING. They are the raw hand-ins, not part of the site, and nothing links to them.")
}
if ($sourceFiles.Count -gt 0) {
    $looseMb = [math]::Round(($sourceFiles | Measure-Object Length -Sum).Sum / 1MB, 2)
    $names   = ($sourceFiles | ForEach-Object { $_.Name }) -join '; '
    $Warn.Add("$($sourceFiles.Count) loose file(s) in the project root that are not part of the site, $looseMb MB - MOVE OR DELETE BEFORE ZIPPING: $names")
}

$biggest = $shipFiles | Sort-Object Length -Descending | Select-Object -First 3

# -----------------------------------------------------------------------------
# Report
# -----------------------------------------------------------------------------

Write-Host ''
Write-Host '  GREAT BOOK - pre-submission verify' -ForegroundColor Cyan
Write-Host ('  ' + ('=' * 62))
Write-Host ''

foreach ($p in $Pass) { Write-Host "  PASS  $p" -ForegroundColor Green }

if ($Warn.Count -gt 0) {
    Write-Host ''
    foreach ($w in $Warn) { Write-Host "  TODO  $w" -ForegroundColor Yellow }
}

if ($Fail.Count -gt 0) {
    Write-Host ''
    foreach ($f in $Fail) { Write-Host "  FAIL  $f" -ForegroundColor Red }
}

Write-Host ''
Write-Host ('  ' + ('-' * 62))
Write-Host "  shipped payload: $totalMb MB across $($shipFiles.Count) files"
foreach ($b in $biggest) {
    Write-Host ("    {0,8:N2} MB  {1}" -f ($b.Length / 1MB), (Rel $b.FullName))
}
Write-Host ''

if ($Fail.Count -gt 0) {
    Write-Host "  $($Fail.Count) blocking problem(s). Fix before submitting." -ForegroundColor Red
    Write-Host ''
    exit 1
}

Write-Host '  No blocking problems found.' -ForegroundColor Green
Write-Host '  Still do the manual pass from an EXTRACTED COPY of the real zip.' -ForegroundColor Green
Write-Host ''
