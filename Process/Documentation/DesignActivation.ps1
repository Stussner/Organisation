[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [Parameter(Mandatory, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string[]]$Selection
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$designRoot = Join-Path $projectRoot 'Documentation\Design'
$typeMap = @{
    Style     = '.css'
    Structure = '.html'
}

function ConvertTo-DesignActivation {
    param(
        [Parameter(Mandatory)]
        [string]$Value
    )

    $parts = $Value -split '=', 2
    if ($parts.Count -ne 2 -or [string]::IsNullOrWhiteSpace($parts[0]) -or [string]::IsNullOrWhiteSpace($parts[1])) {
        throw "Ungültige Auswahl '$Value'. Erwartet wird Typ=Preset, beispielsweise Style=LightNaviGator."
    }

    $requestedType = $parts[0].Trim()
    $type = $typeMap.Keys | Where-Object { $_ -ieq $requestedType } | Select-Object -First 1
    if ($null -eq $type) {
        throw "Unbekannter Typ '$requestedType'. Zulässig sind: $($typeMap.Keys -join ', ')."
    }

    $preset = $parts[1].Trim()
    if ($preset -match '[\\/:*?"<>|]') {
        throw "Ungültiger Presetname '$preset'. Der Name darf keine Pfad- oder Platzhalterzeichen enthalten."
    }

    $extension = $typeMap[$type]
    $source = Join-Path $designRoot "$type\Preset\$preset$extension"
    $target = Join-Path $designRoot "$type\Active$extension"

    [pscustomobject]@{
        Type   = $type
        Preset = $preset
        Source = $source
        Target = $target
    }
}

$items = foreach ($entry in $Selection) {
    ConvertTo-DesignActivation -Value $entry
}

$duplicates = $items | Group-Object Type | Where-Object Count -gt 1
if ($duplicates) {
    throw "Ein Typ darf pro Durchlauf nur einmal gewählt werden: $($duplicates.Name -join ', ')."
}

$missingSources = $items | Where-Object { -not (Test-Path -LiteralPath $_.Source -PathType Leaf) }
if ($missingSources) {
    $list = ($missingSources | ForEach-Object { "[$($_.Type)] $($_.Source)" }) -join [Environment]::NewLine
    throw "Mindestens ein Preset fehlt:`n$list"
}

foreach ($item in $items) {
    $operation = "Preset '$($item.Preset)' für Typ '$($item.Type)' aktivieren"
    if ($PSCmdlet.ShouldProcess($item.Target, $operation)) {
        if ($item.Type -eq 'Structure') {
            $content = Get-Content -LiteralPath $item.Source -Raw -Encoding UTF8
            $content = $content -replace '<link\s+rel="stylesheet"\s+href="[^"]*"\s*/?>', '<link rel="stylesheet" href="../Style/Active.css">'
            if ($content -notmatch '<script\s+src="\.\./Class/TableEditable\.js"\s*></script>') {
                if ($content -notmatch '</body>') { throw "Struktur-Preset enthält kein schließendes </body>: $($item.Source)" }
                $content = $content -replace '</body>', "  <script src=`"../Class/TableEditable.js`"></script>`r`n</body>"
            }
            Set-Content -LiteralPath $item.Target -Value $content -Encoding UTF8
        }
        else {
            Copy-Item -LiteralPath $item.Source -Destination $item.Target -Force
        }
        [pscustomobject]@{
            Type   = $item.Type
            Preset = $item.Preset
            Source = $item.Source
            Target = $item.Target
            Status = 'Aktiviert'
        }
    }
}
