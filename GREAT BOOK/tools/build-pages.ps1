<#
================================================================================
  tools/build-pages.ps1
--------------------------------------------------------------------------------
  Reads stories.js + templates/story.html, writes one story-NN.html per entry,
  and stamps the shared footer into every page.

  This is a DEV-TIME TOOL. Nothing in tools/ ships. The output is plain static
  HTML that opens by double-click with no server and no runtime dependencies.

  RUN IT:   double-click  build.bat   in the project root
  or:       powershell -ExecutionPolicy Bypass -File tools\build-pages.ps1

  Flags:    -Check      validate only, write nothing

  The build REFUSES TO RUN on a content error rather than emitting a page that
  quietly violates the brief. The four-paragraph limit in particular is a hard
  requirement, so it is enforced here where it cannot be forgotten.

  (PowerShell rather than Node because Node is not installed on the build
  machine and deadline day is the wrong time to fix that. Windows PowerShell
  5.1 ships with Windows, so this runs everywhere this project will be opened.)
================================================================================
#>

[CmdletBinding()]
param(
    [switch]$Check
)

$ErrorActionPreference = 'Stop'

$Root         = Split-Path -Parent $PSScriptRoot
$ManifestPath = Join-Path $Root 'stories.js'
$TemplatePath = Join-Path $Root 'tools\templates\story.html'

# Hard requirement from the brief, and the DEFAULT for every story. A story
# may raise it with "paragraphLimit" in the manifest - see Get-ParagraphLimit
# below - and doing so warns on every single build so it cannot go unnoticed.
$MaxParagraphs = 4

$Warnings = New-Object System.Collections.Generic.List[string]
$Problems = New-Object System.Collections.Generic.List[string]

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    # Set-Content -Encoding UTF8 writes a BOM in PS 5.1. Browsers cope, but a
    # clean file is a clean file.
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

<#
  The paragraph limit for one story.

  Four is the brief's number and the default. It is overridable per story
  because the groups hand in PICTURE BOOKS - one block of text per drawing -
  and group 1's flow is seven of those. Merging their seven into four is what
  the site used to do, and it meant three drawings stacked with no words
  between them.

  This is a real requirement being deliberately traded away for one story, so
  it is not silent: every build that sees an override prints it. If the brief
  turns out to be strict about the number, that line is where you will see it.
#>
<#
  Does this story use a video narration instead of an mp3?

  Defined up here rather than beside Select-Narration because the VALIDATION
  pass needs it too, and PowerShell binds a function when execution reaches
  its definition - a copy further down the file is not yet defined when the
  validation loop runs.
#>
function Test-HasVideo {
    param($Story)
    return ($null -ne $Story.video -and ([string]$Story.video).Trim() -ne '')
}

function Get-ParagraphLimit {
    param($Story)
    $limit = $Story.paragraphLimit
    if ($null -eq $limit) { return $MaxParagraphs }

    $n = 0.0
    if (-not [double]::TryParse([string]$limit, [ref]$n) -or $n -ne [math]::Floor($n) -or $n -lt 1) {
        return $MaxParagraphs   # validated and reported at the call site
    }
    return [int]$n
}

function Fail {
    param([string]$Message)
    Write-Host ''
    Write-Host '  BUILD FAILED' -ForegroundColor Red
    Write-Host ''
    Write-Host "  $Message"
    Write-Host ''
    exit 1
}

# Esc lives in lib-manifest.ps1, shared with the verifier so the two can never
# disagree about how a name was escaped.

function Test-Todo {
    param([object]$Value)
    if ($null -eq $Value) { return $false }
    return ([string]$Value).TrimStart() -match '^TODO'
}

# Get-JsonLiteral lives in lib-manifest.ps1 so the placeholder generator and
# this script cannot drift apart in how they read the manifest.
. (Join-Path $PSScriptRoot 'lib-manifest.ps1')

# -----------------------------------------------------------------------------
# Load the manifest
# -----------------------------------------------------------------------------

if (-not (Test-Path $ManifestPath)) { Fail "stories.js not found at $ManifestPath" }
if (-not (Test-Path $TemplatePath)) { Fail "template not found at $TemplatePath" }

$manifestText = [System.IO.File]::ReadAllText($ManifestPath, [System.Text.Encoding]::UTF8)

$storiesJson = Get-JsonLiteral -Text $manifestText -Anchor 'window.STORIES' -Open '[' -Close ']'
$siteJson    = Get-JsonLiteral -Text $manifestText -Anchor 'window.SITE'    -Open '{' -Close '}'

if ($null -eq $storiesJson) {
    Fail "Could not find the window.STORIES array in stories.js.`n         The assignment must look like:  window.STORIES = [ ... ];"
}

try {
    $Stories = $storiesJson | ConvertFrom-Json
} catch {
    Fail "window.STORIES is not valid JSON.`n         $($_.Exception.Message)`n`n  Check for a trailing comma, an unquoted key, or a stray comment inside the array."
}

$Site = $null
if ($null -ne $siteJson) {
    try { $Site = $siteJson | ConvertFrom-Json }
    catch { $Warnings.Add('window.SITE is not valid JSON - the footer will be blank.') }
}
if ($null -eq $Site) { $Site = [pscustomobject]@{} }

# ConvertFrom-Json unwraps a single-element array into a bare object.
if ($Stories -isnot [System.Array]) { $Stories = @($Stories) }

if ($Stories.Count -eq 0) { Fail 'window.STORIES is empty. Nothing to build.' }

# -----------------------------------------------------------------------------
# Validate
# -----------------------------------------------------------------------------

$requiredText = @('id', 'slug', 'title', 'group', 'writer', 'illustrator', 'narrator')

$seenIds   = @{}
$seenSlugs = @{}

for ($i = 0; $i -lt $Stories.Count; $i++) {
    $s = $Stories[$i]

    $where = "story index $i"
    if ($s.id) { $where += " (id `"$($s.id)`")" }

    foreach ($field in $requiredText) {
        $val = $s.$field
        if ($null -eq $val -or ([string]$val).Trim() -eq '') {
            $Problems.Add("$where : `"$field`" is empty.")
        } elseif (Test-Todo $val) {
            $Warnings.Add("$where : `"$field`" is still a TODO placeholder.")
        }
    }

    if ($s.id) {
        if ($seenIds.ContainsKey([string]$s.id)) { $Problems.Add("$where : duplicate id `"$($s.id)`".") }
        $seenIds[[string]$s.id] = $true
        if (-not ([string]$s.id -match '^\d{2}$')) {
            $Problems.Add("$where : id must be exactly two digits, e.g. `"01`".")
        }
    }

    if ($s.slug) {
        if ($seenSlugs.ContainsKey([string]$s.slug)) { $Problems.Add("$where : duplicate slug `"$($s.slug)`".") }
        $seenSlugs[[string]$s.slug] = $true
        if (-not ([string]$s.slug -match '^[a-z0-9-]+$')) {
            $Problems.Add("$where : slug must be lowercase letters, digits and hyphens only.")
        }
    }

    # --- THE FOUR-PARAGRAPH RULE ---------------------------------------------
    # "body" is a MIXED list read top to bottom: a string is a paragraph, an
    # object is one of the group's own storyboard panels printed between the
    # paragraphs. Only the STRINGS count against the brief's limit - a picture
    # is not a paragraph - so a group that drew nine panels keeps all nine.
    $body = $s.body
    if ($null -eq $body) {
        $Problems.Add("$where : `"body`" is missing.")
    } else {
        if ($body -isnot [System.Array]) { $body = @($body) }

        $paraCount = 0
        for ($b = 0; $b -lt $body.Count; $b++) {
            $block = $body[$b]

            if ($block -is [string]) {
                $paraCount++
                if (Test-Todo $block) {
                    $Warnings.Add("$where : paragraph $paraCount is still a TODO placeholder.")
                }
                continue
            }

            # Not a string, so it has to be a panel. Saying so plainly here is
            # worth it: the alternative is a page with the word
            # "@{image=...}" printed in the middle of the story.
            $img = $block.image
            if ($null -eq $img -or ([string]$img).Trim() -eq '') {
                $Problems.Add("$where : body block $($b + 1) is neither a paragraph nor a panel. It must be a string, or an object with an `"image`".")
                continue
            }

            if ($null -eq $block.alt -or ([string]$block.alt).Trim() -eq '') {
                $Warnings.Add("$where : body panel $img has no `"alt`" text - describe what it shows.")
            }

            $panelAbs = Join-Path $Root ((([string]$img) -replace '^\./', '') -replace '/', '\')
            if (-not (Test-Path $panelAbs)) {
                $Warnings.Add("$where : body panel file not found - $img")
            }
        }

        # The limit is per story and defaults to the brief's four. An override
        # is loud on purpose - see Get-ParagraphLimit.
        $limit = Get-ParagraphLimit $s

        if ($null -ne $s.paragraphLimit) {
            $raw = $s.paragraphLimit
            $n   = 0.0
            if (-not [double]::TryParse([string]$raw, [ref]$n) -or $n -ne [math]::Floor($n) -or $n -lt 1) {
                $Problems.Add("$where : `"paragraphLimit`" must be a whole number of 1 or more, got `"$raw`".")
            } elseif ($limit -ne $MaxParagraphs) {
                $Warnings.Add("$where : `"paragraphLimit`" is $limit, not the brief's $MaxParagraphs. Deliberate - one text block per drawing - but it IS the brief's rule being traded away, so check it still reads as intended.")
            }
        }

        if ($paraCount -eq 0) {
            $Problems.Add("$where : `"body`" has no paragraphs.")
        } elseif ($paraCount -gt $limit) {
            $Problems.Add("$where : `"body`" has $paraCount paragraphs, and this story allows $limit. Panel images do not count toward it.")
        }
    }

    # --- THE QUIZ -------------------------------------------------------------
    # A quiz with no questions is a warning: groups hand theirs in late. A quiz
    # with BROKEN questions is an error, because the failure is silent - an
    # out-of-range "answer" marks a correct choice wrong and nobody notices
    # until a student is looking at a red cross they did not earn.
    $quiz = $s.quiz
    if ($null -eq $quiz) {
        $Warnings.Add("$where : no `"quiz`" array yet - the page will show a `"quiz not written yet`" placeholder.")
    } else {
        if ($quiz -isnot [System.Array]) { $quiz = @($quiz) }
        if ($quiz.Count -eq 0) {
            $Warnings.Add("$where : `"quiz`" is empty - the page will show a `"quiz not written yet`" placeholder.")
        }

        for ($q = 0; $q -lt $quiz.Count; $q++) {
            $item  = $quiz[$q]
            $qWhere = "$where : quiz question $($q + 1)"

            if ($null -eq $item.q -or ([string]$item.q).Trim() -eq '') {
                $Problems.Add("$qWhere : `"q`" is empty.")
            } elseif (Test-Todo $item.q) {
                $Warnings.Add("$qWhere : still a TODO placeholder.")
            }

            $choices = $item.choices
            if ($null -eq $choices) {
                $Problems.Add("$qWhere : `"choices`" is missing.")
                continue
            }
            if ($choices -isnot [System.Array]) { $choices = @($choices) }

            if ($choices.Count -lt 2) {
                $Problems.Add("$qWhere : needs at least 2 choices, has $($choices.Count).")
                continue
            }
            if ($choices.Count -ne 4) {
                $Warnings.Add("$qWhere : has $($choices.Count) choices. The house style is 4.")
            }
            for ($c = 0; $c -lt $choices.Count; $c++) {
                if ($null -eq $choices[$c] -or ([string]$choices[$c]).Trim() -eq '') {
                    $Problems.Add("$qWhere : choice $($c + 1) is empty.")
                }
            }

            # "answer" is a zero-based index into "choices". PowerShell's JSON
            # reader hands back Int64 for whole numbers and Double for 1.0, so
            # check the VALUE is whole rather than trusting the type.
            $ans = $item.answer
            if ($null -eq $ans) {
                $Problems.Add("$qWhere : `"answer`" is missing. It is the 0-based index of the correct choice.")
            } else {
                $n = 0.0
                if (-not [double]::TryParse([string]$ans, [ref]$n) -or $n -ne [math]::Floor($n)) {
                    $Problems.Add("$qWhere : `"answer`" must be a whole number, got `"$ans`".")
                } elseif ($n -lt 0 -or $n -ge $choices.Count) {
                    $Problems.Add("$qWhere : `"answer`" is $ans but there are only $($choices.Count) choices (valid: 0 to $($choices.Count - 1)).")
                }
            }
        }
    }

    # --- soft checks: these never block the build -----------------------------

    if (Test-Todo $s.moral) { $Warnings.Add("$where : moral is still a TODO.") }

    # "cover" is the marquee card's image and is OPTIONAL - the table of
    # contents falls back to the illustration when a group has not made one.
    # It is checked here anyway, because a cover path that points at nothing
    # produces a broken card in the one interface that has no other symptom:
    # the story page still looks perfect.
    if ($null -ne $s.cover -and ([string]$s.cover).Trim() -ne '') {
        $coverAbs = Join-Path $Root ((([string]$s.cover) -replace '^\./', '') -replace '/', '\')
        if (-not (Test-Path $coverAbs)) {
            $Warnings.Add("$where : cover file not found - $($s.cover)")
        }
    } else {
        $Warnings.Add("$where : no cover image - the marquee card will reuse the illustration.")
    }

    # A story is narrated by EITHER an mp3 or a video, so only check the one it
    # actually uses. Checking both would report a permanently missing 03.mp3
    # for a story that was never going to have one, and a warning nobody can
    # clear is a warning everybody learns to scroll past.
    $narration = @('audio', $s.audio)
    if (Test-HasVideo $s) {
        $narration = @('video', $s.video)
        if ($null -ne $s.audio -and ([string]$s.audio).Trim() -ne '') {
            $Warnings.Add("$where : has BOTH `"audio`" and `"video`". The page shows the video and ignores the mp3 - clear `"audio`" to say so.")
        }
    }

    foreach ($pair in @(@('illustration', $s.illustration), $narration)) {
        $label = $pair[0]
        $rel   = $pair[1]
        if ($null -eq $rel -or [string]$rel -eq '') {
            $Warnings.Add("$where : no $label path set.")
            continue
        }
        $abs = Join-Path $Root (([string]$rel) -replace '^\./', '' -replace '/', '\')
        if (-not (Test-Path $abs)) {
            $Warnings.Add("$where : $label file not found - $rel")
        }
    }
}

if ($Problems.Count -gt 0) {
    $list = ($Problems | ForEach-Object { "         - $_" }) -join "`n"
    Fail "The manifest has $($Problems.Count) error(s):`n`n$list`n`n  Fix stories.js and run again. No files were written."
}

# -----------------------------------------------------------------------------
# Render
# -----------------------------------------------------------------------------

function Render-Footer {
    param($Site)
    $lines = @(
        '<footer class="site-footer">'
        '  <div class="site-footer__inner">'
        '    <div>'
        "      <p class=`"site-footer__title`">$(Esc $Site.title)</p>"
        "      <p>$(Esc $Site.subtitle)</p>"
        '    </div>'
        '    <div>'
        '      <dl>'
        '        <dt>School</dt>'
        "        <dd>$(Esc $Site.school)</dd>"
        '        <dt>Course</dt>'
        "        <dd>$(Esc $Site.course)</dd>"
        '      </dl>'
        '    </div>'
        '    <div>'
        '      <dl>'
        '        <dt>Instructor</dt>'
        "        <dd>$(Esc $Site.instructor)</dd>"
        '        <dt>Academic Year</dt>'
        "        <dd>$(Esc $Site.schoolYear)</dd>"
        '      </dl>'
        '    </div>'
        '  </div>'
        '</footer>'
    )
    return ($lines -join "`n")
}

<#
  Render the body.

  The list is MIXED on purpose. A string is a paragraph. An object with an
  "image" is one of the group's own storyboard panels, printed between the
  paragraphs the way their hand-in prints it - a picture, then the words for
  it, all the way down.

  Why panels live in "body" and not in a separate list: their POSITION is the
  whole point. A parallel array of images plus a set of index numbers saying
  where each one goes is the same information, written so that moving one
  paragraph silently moves every picture after it. Here the order on the page
  is the order in the file, and it is readable at a glance.

  The four-paragraph limit still holds; it is counted over the strings only,
  in the validation pass above.
#>
<#
  The subtitle, printed straight under the title.

  Emitted as the WHOLE ELEMENT or nothing at all. A story with no subtitle
  must not leave an empty <p> behind: the story head is a centred stack with
  its own rhythm, and a blank paragraph in the middle of it is a visible
  dent that nothing in the CSS explains.
#>
<#
  Delete one marked block from the template, markers and all.

  The template carries BOTH narration players - the mp3 transport and the
  video element - and the build keeps exactly one. Written as whole-line
  surgery so the emitted page has no orphan blank line where the other one
  used to be.

  Markup lives in the template on purpose. Moving the transport in here to
  build it conditionally would put forty lines of HTML in a PowerShell string,
  which is the one place nobody thinks to look for it.
#>
function Remove-MarkedBlock {
    param([string]$Html, [string]$Name)

    $startMark = "<!-- GB:$Name" + ":START"
    $endMark   = "<!-- GB:$Name" + ":END -->"

    $a = $Html.IndexOf($startMark)
    if ($a -lt 0) { return $Html }
    $b = $Html.IndexOf($endMark, $a)
    if ($b -lt 0) { return $Html }

    # widen to whole lines: back to the start of the marker's own line,
    # forward past the newline that ends the closing marker's line.
    $lineStart = $Html.LastIndexOf([char]10, $a)
    if ($lineStart -lt 0) { $lineStart = 0 } else { $lineStart++ }

    $lineEnd = $Html.IndexOf([char]10, $b + $endMark.Length)
    if ($lineEnd -lt 0) { $lineEnd = $Html.Length } else { $lineEnd++ }

    $rest = $Html.Substring($lineEnd)

    # The template separates the two players with a blank line. Removing one
    # block would otherwise leave that blank stacked on the next one, so take
    # a single following empty line with it.
    if ($rest.StartsWith([string][char]10)) {
        $rest = $rest.Substring(1)
    } elseif ($rest.StartsWith([string][char]13 + [string][char]10)) {
        $rest = $rest.Substring(2)
    }

    return $Html.Substring(0, $lineStart) + $rest
}

<#
  Strip the surviving block's own marker comments.

  The GB:FOOTER markers stay in the shipped pages because the build writes
  BETWEEN them on every run and needs to find them again. These two are
  different: they are a build-time switch, they are consumed once, and leaving
  them in a story page would advertise an injection point that does not exist.
#>
function Remove-BlockMarkers {
    param([string]$Html)

    foreach ($needle in @('<!-- GB:AUDIO:', '<!-- GB:VIDEO:')) {
        while ($true) {
            $a = $Html.IndexOf($needle)
            if ($a -lt 0) { break }

            $close = $Html.IndexOf('-->', $a)
            if ($close -lt 0) { break }

            $lineStart = $Html.LastIndexOf([char]10, $a)
            if ($lineStart -lt 0) { $lineStart = 0 } else { $lineStart++ }

            $lineEnd = $Html.IndexOf([char]10, $close)
            if ($lineEnd -lt 0) { $lineEnd = $Html.Length } else { $lineEnd++ }

            $Html = $Html.Substring(0, $lineStart) + $Html.Substring($lineEnd)
        }
    }
    return $Html
}

<#
  Keep the narration player this story actually uses.

  A story has EITHER an "audio" or a "video", never both on the page. The
  video is for a group who recorded a narrated animation rather than a
  voice track - see story 03.
#>
function Select-Narration {
    param([string]$Html, $Story)

    if (Test-HasVideo $Story) {
        $Html = Remove-MarkedBlock -Html $Html -Name 'AUDIO'
    } else {
        $Html = Remove-MarkedBlock -Html $Html -Name 'VIDEO'
    }
    return (Remove-BlockMarkers -Html $Html)
}

function Render-Subtitle {
    param($Story)
    $sub = $Story.subtitle
    if ($null -eq $sub -or ([string]$sub).Trim() -eq '') { return '' }
    return "      <p class=`"story__subtitle`">$(Esc $sub)</p>"
}

function Render-Body {
    param($Blocks, $Story)

    if ($null -eq $Blocks) { return '' }
    if ($Blocks -isnot [System.Array]) { $Blocks = @($Blocks) }

    $out = New-Object System.Collections.Generic.List[string]

    foreach ($block in $Blocks) {
        if ($block -is [string]) {
            $out.Add("      <p>$(Esc $block)</p>")
            continue
        }

        # Never let a panel go out with an empty alt. A screen reader would
        # announce the file name, and a broken path would show it on screen.
        $alt = $block.alt
        if ($null -eq $alt -or ([string]$alt).Trim() -eq '') {
            $alt = "Illustration for $($Story.title)"
        }

        $out.Add('      <figure class="story__panel">')
        $out.Add("        <img src=`"$(Esc $block.image)`" alt=`"$(Esc $alt)`" loading=`"lazy`" decoding=`"async`">")
        $out.Add('      </figure>')
    }

    return ($out -join "`n")
}

<#
  Bake the quiz into the page.

  What comes out is a PLAIN PRINTED QUIZ: every question, every choice, and
  the correct index on a data-attribute. js/quiz.js reads that back out of the
  DOM and replaces it with the one-question-at-a-time interactive version.

  Written this way round on purpose. The story pages do not load stories.js,
  and adding a second <script> to every page to carry data that is already
  static would be worse than reading the static thing. It also means the
  no-JS fallback is free and is guaranteed to hold exactly the same questions
  the interactive quiz asks - there is only one copy.

  The answers are visible in the page source. Unavoidable without a server,
  and acceptable here. See the note in stories.js.
#>
function Render-Quiz {
    param($Story)

    $quiz = $Story.quiz
    if ($null -eq $quiz) { $quiz = @() }
    if ($quiz -isnot [System.Array]) { $quiz = @($quiz) }

    if ($quiz.Count -eq 0) {
        return (@(
            '<p class="quiz-todo" role="note">Quiz not written yet</p>'
            '<p class="story__quiz-note">'
            '  Add this story&#39;s questions to its &quot;quiz&quot; array in stories.js, then rebuild.'
            '</p>'
        ) -join "`n      ")
    }

    $lines = New-Object System.Collections.Generic.List[string]

    $lines.Add('<div class="quiz" data-quiz>')
    $lines.Add('  <p class="quiz__eyebrow">Check what you remember</p>')
    $lines.Add('  <ol class="quiz__static">')

    foreach ($item in $quiz) {
        $choices = $item.choices
        if ($choices -isnot [System.Array]) { $choices = @($choices) }

        $lines.Add("    <li class=`"quiz__static-item`" data-answer=`"$([int]$item.answer)`">")
        $lines.Add("      <p class=`"quiz__static-q`">$(Esc $item.q)</p>")
        $lines.Add('      <ul class="quiz__static-choices">')
        foreach ($choice in $choices) {
            $lines.Add("        <li>$(Esc $choice)</li>")
        }
        $lines.Add('      </ul>')
        $lines.Add('    </li>')
    }

    $lines.Add('  </ol>')
    $lines.Add('</div>')

    # The template indents {{QUIZ}} by six spaces, so every line after the
    # first has to carry that indent itself to keep the output readable.
    return ($lines -join "`n      ")
}

function New-NavLink {
    param(
        [string]$Class, [string]$Href, [string]$Rel,
        [string]$Prefix, [string]$Label, [switch]$Forward, [switch]$Disabled
    )
    $arrowGlyph = if ($Forward) { '&rarr;' } else { '&larr;' }
    $arrow = "<span class=`"story__nav-arrow`" aria-hidden=`"true`">$arrowGlyph</span>"
    $text  = "<span class=`"u-visually-hidden`">$(Esc $Prefix)</span>" +
             "<span class=`"story__nav-label`">$(Esc $Label)</span>"

    $attrs = if ($Disabled) { 'aria-disabled="true" tabindex="-1" href="#"' }
             else { "href=`"$(Esc $Href)`" rel=`"$Rel`"" }

    $inner = if ($Forward) { "$text$arrow" } else { "$arrow$text" }
    return "<a class=`"$Class`" $attrs>$inner</a>"
}

$FooterStart = '<!-- GB:FOOTER:START'
$FooterEnd   = '<!-- GB:FOOTER:END -->'

function Inject-Footer {
    param([string]$Html, [string]$FooterHtml)

    $startIdx = $Html.IndexOf($FooterStart)
    $endIdx   = $Html.IndexOf($FooterEnd)
    if ($startIdx -lt 0 -or $endIdx -lt 0 -or $endIdx -lt $startIdx) { return $null }

    $startLineEnd = $Html.IndexOf('-->', $startIdx) + 3

    return $Html.Substring(0, $startLineEnd) + "`n" + $FooterHtml + "`n" + $Html.Substring($endIdx)
}

# -----------------------------------------------------------------------------
# Write
# -----------------------------------------------------------------------------

$template = [System.IO.File]::ReadAllText($TemplatePath, [System.Text.Encoding]::UTF8)
$footer   = Render-Footer -Site $Site
$written  = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $Stories.Count; $i++) {
    $s = $Stories[$i]

    # --- prev / next ----------------------------------------------------------
    # The arrow and the title are SEPARATE elements, which matters more than it
    # looks. The three links share one row that must never wrap, so the titles
    # have to be allowed to shrink and ellipsis out - and when the arrow is part
    # of the same text run, the ellipsis eats the arrow off the end of "next"
    # first. Split out, it is a flex child that never shrinks.
    #
    # The arrow is aria-hidden and a visually-hidden prefix carries the
    # direction instead, because "The Wish" and "Someday, Little Carabao Will
    # Know" sitting next to each other tell a screen-reader user nothing about
    # which way they lead. On narrow screens the title goes visually hidden and
    # only the arrow shows, so that prefix becomes the whole accessible name.

    if ($i -gt 0) {
        $prev = $Stories[$i - 1]
        $prevHtml = New-NavLink -Class 'story__nav-prev' -Href "./$($prev.slug).html" `
                                -Rel 'prev' -Prefix 'Previous story: ' -Label $prev.title
    } else {
        $prevHtml = New-NavLink -Class 'story__nav-prev' -Prefix 'This is the first story. ' `
                                -Label 'The Beginning' -Disabled
    }

    if ($i -lt $Stories.Count - 1) {
        $next = $Stories[$i + 1]
        $nextHtml = New-NavLink -Class 'story__nav-next' -Href "./$($next.slug).html" `
                                -Rel 'next' -Prefix 'Next story: ' -Label $next.title -Forward
    } else {
        $nextHtml = New-NavLink -Class 'story__nav-next' -Href './closing.html' `
                                -Rel 'next' -Prefix 'Last story. Continue to ' `
                                -Label 'The End' -Forward
    }

    $out = $template
    $out = $out.Replace('{{ID}}',           (Esc $s.id))
    $out = $out.Replace('{{TITLE_ALT}}',    (Esc $s.titleFil))
    $out = $out.Replace('{{TITLE}}',        (Esc $s.title))
    $out = $out.Replace('{{GROUP}}',        (Esc $s.group))
    $out = $out.Replace('{{WRITER}}',       (Esc $s.writer))
    $out = $out.Replace('{{ILLUSTRATOR}}',  (Esc $s.illustrator))
    $out = $out.Replace('{{NARRATOR}}',     (Esc $s.narrator))
    $out = $out.Replace('{{ILLUSTRATION}}', (Esc $s.illustration))
    $out = Select-Narration -Html $out -Story $s
    $out = $out.Replace('{{AUDIO}}',        (Esc $s.audio))
    $out = $out.Replace('{{VIDEO}}',        (Esc $s.video))
    # The poster keeps the video frame from sitting black before it is played.
    # The cover is the group's own title card; the illustration is the fallback
    # for a group who never drew one.
    $poster = $s.cover
    if ($null -eq $poster -or ([string]$poster).Trim() -eq '') { $poster = $s.illustration }
    $out = $out.Replace('{{POSTER}}',       (Esc $poster))
    $out = $out.Replace('{{MORAL}}',        (Esc $s.moral))
    # The token sits on a line of its own, so an empty subtitle takes the
    # whole line with it rather than leaving a blank one behind.
    $subtitle = Render-Subtitle $s
    if ($subtitle -eq '') {
        $out = $out.Replace("{{SUBTITLE}}`n", '')
    } else {
        $out = $out.Replace('{{SUBTITLE}}', $subtitle)
    }
    $out = $out.Replace('{{BODY}}',         (Render-Body $s.body $s))
    $out = $out.Replace('{{QUIZ}}',         (Render-Quiz $s))
    $out = $out.Replace('{{PREV}}',         $prevHtml)
    $out = $out.Replace('{{NEXT}}',         $nextHtml)

    $withFooter = Inject-Footer -Html $out -FooterHtml $footer
    if ($null -eq $withFooter) { Fail 'tools\templates\story.html is missing the GB:FOOTER markers.' }
    $out = $withFooter

    # Nothing should survive the substitution pass.
    $leftover = [regex]::Matches($out, '\{\{[A-Z_]+\}\}')
    if ($leftover.Count -gt 0) {
        $names = ($leftover | ForEach-Object { $_.Value } | Select-Object -Unique) -join ', '
        Fail "Unreplaced placeholder(s) in $($s.slug).html : $names"
    }

    $dest = Join-Path $Root "$($s.slug).html"
    if (-not $Check) { Write-Utf8NoBom -Path $dest -Content $out }
    $written.Add("$($s.slug).html")
}

# --- footer into the hand-written pages --------------------------------------

foreach ($name in @('index.html', 'closing.html')) {
    $file = Join-Path $Root $name
    if (-not (Test-Path $file)) {
        $Warnings.Add("$name not found - footer not stamped.")
        continue
    }
    $src = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $out = Inject-Footer -Html $src -FooterHtml $footer
    if ($null -eq $out) {
        $Warnings.Add("$name has no GB:FOOTER markers - footer not stamped.")
        continue
    }
    if (-not $Check -and $out -ne $src) { Write-Utf8NoBom -Path $file -Content $out }
    $written.Add("$name (footer)")
}

# -----------------------------------------------------------------------------
# Report
# -----------------------------------------------------------------------------

$mode = ''
if ($Check) { $mode = '  (check only, nothing written)' }

Write-Host ''
Write-Host "  GREAT BOOK - build$mode" -ForegroundColor Cyan
Write-Host ('  ' + ('-' * 60))
Write-Host "  stories:  $($Stories.Count)"
Write-Host "  written:  $($written.Count) file(s)"
foreach ($w in $written) { Write-Host "            $w" }

if ($Warnings.Count -gt 0) {
    Write-Host ''
    Write-Host "  $($Warnings.Count) thing(s) still to do:" -ForegroundColor Yellow
    foreach ($w in $Warnings) { Write-Host "    - $w" -ForegroundColor DarkYellow }
}

Write-Host ''
Write-Host '  Open index.html by double-click to test from file://' -ForegroundColor Green
Write-Host ''
