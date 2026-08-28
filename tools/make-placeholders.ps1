<#
================================================================================
  tools/make-placeholders.ps1
--------------------------------------------------------------------------------
  Generates a 4:5 placeholder illustration per story so the site looks
  intentional before the real artwork arrives, and so the marquee's card
  proportions are visible today.

  RUN IT:   double-click  placeholders.bat   in the project root

  Existing files are NEVER overwritten. Drop a real 01.jpg in, point stories.js
  at it, and this script leaves it alone.

  ------------------------------------------------------------------------------
  4:5 PORTRAIT IS THE RATIO TO GIVE THE ILLUSTRATORS.
  It is what css/toc.css crops the marquee cards to.
  Deliver at 1600px on the long edge, JPG, quality ~80.
  ------------------------------------------------------------------------------
#>

$ErrorActionPreference = 'Stop'

$Root   = Split-Path -Parent $PSScriptRoot
$ImgDir = Join-Path $Root 'assets\img'

# Reuse the manifest reader from the build script rather than duplicating it.
. (Join-Path $PSScriptRoot 'lib-manifest.ps1')

$Stories = Read-Manifest -Root $Root

if ($Stories.Count -eq 0) {
    Write-Host '  No stories in stories.js - nothing to generate.' -ForegroundColor Red
    exit 1
}

$palettes = @(
    @('#7c4a32', '#241a13', '#c08a3e'),
    @('#4a5c3a', '#1c2418', '#a8b062'),
    @('#6b3a4a', '#241419', '#d4886a'),
    @('#3a4a5c', '#141c24', '#7aa0c0'),
    @('#5c4a2a', '#241c10', '#e0a955'),
    @('#4a3a5c', '#1a1424', '#9a86c0')
)

New-Item -ItemType Directory -Force -Path $ImgDir | Out-Null

$made = 0
$skipped = 0

for ($i = 0; $i -lt $Stories.Count; $i++) {
    $s = $Stories[$i]

    $rel = $s.illustration
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "./assets/img/$($s.id).svg" }

    $dest = Join-Path $Root ((([string]$rel) -replace '^\./', '') -replace '/', '\')

    if (Test-Path $dest) { $skipped++; continue }

    # Only generate SVGs. If the manifest points at a .jpg then real artwork is
    # expected there, and a fake one would just hide the gap.
    if ([System.IO.Path]::GetExtension($dest).ToLower() -ne '.svg') {
        Write-Host "  - $rel  (not .svg - expecting real artwork here)" -ForegroundColor DarkYellow
        $skipped++
        continue
    }

    $pal    = $palettes[$i % $palettes.Count]
    $base   = $pal[0]
    $deep   = $pal[1]
    $accent = $pal[2]

    $id = [string]$s.id

    # Deterministic pseudo-random terrain: same input, same output every run.
    $seed = 1
    [void][int]::TryParse($id, [ref]$seed)
    if ($seed -lt 1) { $seed = 1 }

    $h1 = 560 + (($seed * 37) % 120)
    $h2 = 680 + (($seed * 53) % 140)
    $cx = 220 + (($seed * 91) % 400)

    $h1b = $h1 - 90
    $h1c = $h1 + 20
    $h1d = $h1 - 40
    $h2b = $h2 - 110
    $h2c = $h2 + 30
    $h2d = $h2 - 20

    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="Placeholder illustration">
  <defs>
    <linearGradient id="sky$id" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="$base"/>
      <stop offset="100%" stop-color="$deep"/>
    </linearGradient>
    <radialGradient id="sun$id" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="$accent" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="$accent" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="800" height="1000" fill="url(#sky$id)"/>
  <circle cx="$cx" cy="300" r="220" fill="url(#sun$id)"/>
  <circle cx="$cx" cy="300" r="70" fill="$accent" opacity="0.85"/>

  <path d="M0 $h1 Q 200 $h1b 400 $h1c T 800 $h1d V1000 H0 Z" fill="$deep" opacity="0.55"/>
  <path d="M0 $h2 Q 260 $h2b 520 $h2c T 800 $h2d V1000 H0 Z" fill="$deep" opacity="0.9"/>

  <text x="400" y="905" text-anchor="middle" font-family="Georgia, serif"
        font-size="46" fill="#f6efe3" opacity="0.92">$id</text>
  <text x="400" y="948" text-anchor="middle" font-family="system-ui, sans-serif"
        font-size="19" letter-spacing="3" fill="#f6efe3" opacity="0.55">PLACEHOLDER ART</text>
</svg>
"@

    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($dest, $svg, $enc)
    $made++
}

Write-Host ''
Write-Host "  placeholders written: $made,  left alone: $skipped" -ForegroundColor Cyan
Write-Host '  ratio: 4:5 portrait - give the illustrators this ratio.' -ForegroundColor Green
Write-Host ''
