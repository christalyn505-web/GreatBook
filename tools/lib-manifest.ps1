<#
================================================================================
  tools/lib-manifest.ps1
--------------------------------------------------------------------------------
  Shared manifest reader. Dot-sourced by the other tools so there is exactly one
  piece of code that knows how to get data out of stories.js.
================================================================================
#>

<#
  Pull a JSON literal out of the manifest text.

  A regex would be wrong here: quizUrl holds a Google Form URL containing "//",
  and any comment-stripping or lazy bracket match would corrupt it. This walks
  the text with a bracket counter that understands string literals and escapes,
  so braces and slashes inside strings are ignored.
#>
function Get-JsonLiteral {
    param(
        [string]$Text,
        [string]$Anchor,
        [char]$Open,
        [char]$Close
    )

    $anchorIdx = $Text.IndexOf($Anchor)
    if ($anchorIdx -lt 0) { return $null }

    $start = $Text.IndexOf($Open, $anchorIdx + $Anchor.Length)
    if ($start -lt 0) { return $null }

    $depth     = 0
    $inString  = $false
    $escaped   = $false
    $quote     = [char]34
    $backslash = [char]92

    for ($p = $start; $p -lt $Text.Length; $p++) {
        $ch = $Text[$p]

        if ($escaped)           { $escaped = $false; continue }
        if ($ch -eq $backslash) { if ($inString) { $escaped = $true }; continue }
        if ($ch -eq $quote)     { $inString = -not $inString; continue }
        if ($inString)          { continue }

        if     ($ch -eq $Open)  { $depth++ }
        elseif ($ch -eq $Close) {
            $depth--
            if ($depth -eq 0) { return $Text.Substring($start, $p - $start + 1) }
        }
    }

    return $null
}

<#
  HTML-escape a value for insertion into markup.

  Shared rather than duplicated: the build writes pages with it and the
  verifier searches pages with it. If the two disagreed about escaping, the
  verifier would report a missing credit for any name containing an
  apostrophe - O'Brien, Dela Cruz-D'Souza - which is exactly the kind of false
  alarm that trains people to ignore the checker.
#>
function Esc {
    param([object]$Value)
    if ($null -eq $Value) { return '' }
    $t = [string]$Value
    $t = $t.Replace('&', '&amp;')
    $t = $t.Replace('<', '&lt;')
    $t = $t.Replace('>', '&gt;')
    $t = $t.Replace('"', '&quot;')
    $t = $t.Replace("'", '&#39;')
    return $t
}

function Read-Manifest {
    param([string]$Root)

    $path = Join-Path $Root 'stories.js'
    if (-not (Test-Path $path)) { throw "stories.js not found at $path" }

    $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $json = Get-JsonLiteral -Text $text -Anchor 'window.STORIES' -Open '[' -Close ']'

    if ($null -eq $json) { throw 'Could not find the window.STORIES array in stories.js.' }

    $stories = $json | ConvertFrom-Json
    if ($stories -isnot [System.Array]) { $stories = @($stories) }
    return $stories
}

function Read-Site {
    param([string]$Root)

    $path = Join-Path $Root 'stories.js'
    $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $json = Get-JsonLiteral -Text $text -Anchor 'window.SITE' -Open '{' -Close '}'

    if ($null -eq $json) { return [pscustomobject]@{} }
    return ($json | ConvertFrom-Json)
}
