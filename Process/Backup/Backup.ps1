[CmdletBinding()]
param(
    [switch] $OhneDialog,
    [ValidatePattern('^[A-Za-z0-9_]+$')]
    [string] $Erweiterung,
    [string[]] $Pfad
)

$ErrorActionPreference = 'Stop'

$quellordner = 'E:\Programmierung\Organisation'
$zielordner = 'E:\Programmierung\Sicherung\Organisation'
$projektname = 'Organisation'
# Projektrelative Wildcard-Muster. Diese Ausschlüsse gelten immer, auch bei -Pfad.
$fixierteExklusionen = @()

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Test-PfadInnerhalbQuelle {
    param([string] $Vollpfad)

    $quelle = [System.IO.Path]::GetFullPath($quellordner).TrimEnd('\')
    $kandidat = [System.IO.Path]::GetFullPath($Vollpfad).TrimEnd('\')
    return $kandidat.Equals($quelle, [System.StringComparison]::OrdinalIgnoreCase) -or
        $kandidat.StartsWith($quelle + '\', [System.StringComparison]::OrdinalIgnoreCase)
}

function Test-FixierteExklusion {
    param([string] $Vollpfad)

    $relativerPfad = Get-RelativerPfad -Stammordner $quellordner -Pfad $Vollpfad
    foreach ($muster in $fixierteExklusionen) {
        if ($relativerPfad -like $muster) {
            return $true
        }
    }
    return $false
}

function Get-Sicherungsdateien {
    $kandidaten = @()
    if ($null -eq $Pfad -or $Pfad.Count -eq 0) {
        $kandidaten = @(Get-ChildItem -LiteralPath $quellordner -Recurse -Force -File)
    } else {
        foreach ($angabe in $Pfad) {
            if ([string]::IsNullOrWhiteSpace($angabe)) {
                throw 'Eine leere Pfadangabe ist nicht zulässig.'
            }
            $vollpfad = if ([System.IO.Path]::IsPathRooted($angabe)) {
                [System.IO.Path]::GetFullPath($angabe)
            } else {
                [System.IO.Path]::GetFullPath((Join-Path $quellordner $angabe))
            }
            if (-not (Test-PfadInnerhalbQuelle -Vollpfad $vollpfad)) {
                throw "Pfad liegt außerhalb der Projektwurzel: $angabe"
            }
            if ([System.IO.File]::Exists($vollpfad)) {
                $kandidaten += Get-Item -LiteralPath $vollpfad -Force
            } elseif ([System.IO.Directory]::Exists($vollpfad)) {
                $kandidaten += @(Get-ChildItem -LiteralPath $vollpfad -Recurse -Force -File)
            } else {
                throw "Pfad nicht gefunden: $angabe"
            }
        }
    }

    return @($kandidaten |
        Where-Object { -not (Test-FixierteExklusion -Vollpfad $_.FullName) } |
        Sort-Object -Property FullName -Unique)
}

function Get-Sicherungsplan {
    if (-not [System.IO.Directory]::Exists($quellordner)) {
        throw "Quellordner nicht gefunden: $quellordner"
    }
    if (-not [System.IO.Directory]::Exists($zielordner)) {
        throw "Zielordner nicht gefunden: $zielordner"
    }

    $datum = Get-Date -Format 'yyyyMMdd'
    $zusatz = if ([string]::IsNullOrWhiteSpace($Erweiterung)) { '' } else { '_' + $Erweiterung }
    $index = $null
    for ($zahl = 0; $zahl -le 99; $zahl++) {
        $kandidat = '{0}_{1}{2:D2}{3}.zip' -f $projektname, $datum, $zahl, $zusatz
        if (-not [System.IO.File]::Exists((Join-Path $zielordner $kandidat))) {
            $index = $zahl
            break
        }
    }
    if ($null -eq $index) {
        throw "Für den Sicherungstag $datum sind bereits alle Indizes von 00 bis 99 belegt."
    }

    $dateien = @(Get-Sicherungsdateien)
    $groesse = ($dateien | Measure-Object -Property Length -Sum).Sum
    if ($null -eq $groesse) {
        $groesse = 0
    }

    $archivname = '{0}_{1}{2:D2}{3}.zip' -f $projektname, $datum, $index, $zusatz
    [pscustomobject]@{
        Dateien = $dateien
        Dateianzahl = $dateien.Count
        Gesamtgroesse = [int64] $groesse
        Archivname = $archivname
        Archivpfad = Join-Path $zielordner $archivname
        Pruefsummenpfad = Join-Path $zielordner ($archivname + '.sha256')
        Umfang = if ($null -eq $Pfad -or $Pfad.Count -eq 0) { 'Vollsicherung' } else { 'Ausgewählte Pfade: ' + ($Pfad -join '; ') }
    }
}

function Format-Groesse {
    param([int64] $Bytes)
    if ($Bytes -lt 1KB) { return "$Bytes Bytes" }
    if ($Bytes -lt 1MB) { return ('{0:N1} KB' -f ($Bytes / 1KB)) }
    if ($Bytes -lt 1GB) { return ('{0:N1} MB' -f ($Bytes / 1MB)) }
    return ('{0:N2} GB' -f ($Bytes / 1GB))
}

function Get-RelativerPfad {
    param(
        [string] $Stammordner,
        [string] $Pfad
    )

    $stammUri = [System.Uri]::new($Stammordner.TrimEnd('\') + '\')
    $pfadUri = [System.Uri]::new($Pfad)
    return [System.Uri]::UnescapeDataString($stammUri.MakeRelativeUri($pfadUri).ToString()).Replace('/', '\')
}

function Invoke-Sicherung {
    param($Plan)

    if ([System.IO.File]::Exists($Plan.Archivpfad)) {
        throw "Archivname ist inzwischen belegt und wird nicht überschrieben: $($Plan.Archivpfad)"
    }

    $teilarchiv = Join-Path $zielordner ('.{0}.{1}.partial' -f $Plan.Archivname, [guid]::NewGuid().ToString('N'))
    try {
        $dateistream = [System.IO.File]::Open($teilarchiv, [System.IO.FileMode]::CreateNew)
        try {
            $archiv = [System.IO.Compression.ZipArchive]::new($dateistream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
            try {
                foreach ($datei in $Plan.Dateien) {
                    $relativerPfad = (Get-RelativerPfad -Stammordner $quellordner -Pfad $datei.FullName).Replace('\', '/')
                    $eintragname = "$projektname/$relativerPfad"
                    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                        $archiv,
                        $datei.FullName,
                        $eintragname,
                        [System.IO.Compression.CompressionLevel]::Optimal
                    ) | Out-Null
                }
            } finally {
                $archiv.Dispose()
            }
        } finally {
            $dateistream.Dispose()
        }

        [System.IO.File]::Move($teilarchiv, $Plan.Archivpfad)
        $hash = (Get-FileHash -LiteralPath $Plan.Archivpfad -Algorithm SHA256).Hash.ToLowerInvariant()
        [System.IO.File]::WriteAllText(
            $Plan.Pruefsummenpfad,
            "$hash  *$($Plan.Archivname)`r`n",
            [System.Text.UTF8Encoding]::new($false)
        )

        $leseprobe = [System.IO.Compression.ZipFile]::OpenRead($Plan.Archivpfad)
        try {
            if ($leseprobe.Entries.Count -ne $Plan.Dateianzahl) {
                throw "Die Archivprüfung ergab $($leseprobe.Entries.Count) Einträge statt $($Plan.Dateianzahl) Dateien."
            }
        } finally {
            $leseprobe.Dispose()
        }

        $erneuterHash = (Get-FileHash -LiteralPath $Plan.Archivpfad -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($erneuterHash -ne $hash) {
            throw 'Die SHA-256-Prüfsumme stimmt nach der Archivprüfung nicht mehr überein.'
        }

        [pscustomobject]@{
            Archivpfad = $Plan.Archivpfad
            Pruefsummenpfad = $Plan.Pruefsummenpfad
            Dateianzahl = $Plan.Dateianzahl
            Hash = $hash
        }
    } catch {
        if ([System.IO.File]::Exists($teilarchiv)) {
            try { [System.IO.File]::Delete($teilarchiv) } catch { }
        }
        throw
    }
}

function Show-Dialog {
    param($Plan)

    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $fenster = [System.Windows.Forms.Form]::new()
    $fenster.Text = 'Sicherung der Organization Base'
    $fenster.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
    $fenster.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
    $fenster.MaximizeBox = $false
    $fenster.MinimizeBox = $false
    $fenster.ClientSize = [System.Drawing.Size]::new(690, 430)

    $titel = [System.Windows.Forms.Label]::new()
    $titel.Text = 'Sicherung der Organization Base'
    $titel.Font = [System.Drawing.Font]::new($fenster.Font, [System.Drawing.FontStyle]::Bold)
    $titel.AutoSize = $true
    $titel.Location = [System.Drawing.Point]::new(20, 18)
    $fenster.Controls.Add($titel)

    $hinweis = [System.Windows.Forms.Label]::new()
    $hinweis.Text = 'Die Quelle wird nicht verändert. Erst der folgende Button erstellt die Sicherung.'
    $hinweis.AutoSize = $true
    $hinweis.Location = [System.Drawing.Point]::new(20, 48)
    $fenster.Controls.Add($hinweis)

    $details = [System.Windows.Forms.TextBox]::new()
    $details.Multiline = $true
    $details.ReadOnly = $true
    $details.ScrollBars = [System.Windows.Forms.ScrollBars]::Vertical
    $details.Location = [System.Drawing.Point]::new(20, 80)
    $details.Size = [System.Drawing.Size]::new(650, 235)
    $details.Font = [System.Drawing.Font]::new('Consolas', 10)
    $details.Text = @(
        'Quelle:',
        $quellordner,
        '',
        'Ziel:',
        $zielordner,
        '',
        'Neues Archiv:',
        $Plan.Archivpfad,
        '',
        'Prüfsumme:',
        $Plan.Pruefsummenpfad,
        '',
        'Umfang:',
        $Plan.Umfang,
        '',
        ('{0} Dateien, {1}' -f $Plan.Dateianzahl, (Format-Groesse $Plan.Gesamtgroesse))
    ) -join [System.Environment]::NewLine
    $fenster.Controls.Add($details)

    $erstellen = [System.Windows.Forms.Button]::new()
    $erstellen.Text = 'Sicherung erstellen'
    $erstellen.Size = [System.Drawing.Size]::new(150, 30)
    $erstellen.Location = [System.Drawing.Point]::new(390, 370)
    $fenster.AcceptButton = $erstellen
    $fenster.Controls.Add($erstellen)

    $abbrechen = [System.Windows.Forms.Button]::new()
    $abbrechen.Text = 'Abbrechen'
    $abbrechen.Size = [System.Drawing.Size]::new(120, 30)
    $abbrechen.Location = [System.Drawing.Point]::new(550, 370)
    $abbrechen.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $fenster.CancelButton = $abbrechen
    $fenster.Controls.Add($abbrechen)

    $erstellen.add_Click({
        $erstellen.Enabled = $false
        $abbrechen.Enabled = $false
        $fenster.Cursor = [System.Windows.Forms.Cursors]::WaitCursor
        try {
            $ergebnis = Invoke-Sicherung -Plan $Plan
            [System.Windows.Forms.MessageBox]::Show(
                "Sicherung erfolgreich erstellt.`r`n`r`nArchiv:`r`n$($ergebnis.Archivpfad)`r`n`r`nDateien: $($ergebnis.Dateianzahl)`r`nSHA-256:`r`n$($ergebnis.Hash)",
                'Sicherung erfolgreich',
                'OK',
                'Information'
            ) | Out-Null
            $fenster.DialogResult = [System.Windows.Forms.DialogResult]::OK
            $fenster.Close()
        } catch {
            [System.Windows.Forms.MessageBox]::Show(
                "Die Sicherung wurde nicht erfolgreich abgeschlossen.`r`n`r`n$($_.Exception.Message)",
                'Sicherungsfehler',
                'OK',
                'Error'
            ) | Out-Null
            $erstellen.Enabled = $true
            $abbrechen.Enabled = $true
        } finally {
            $fenster.Cursor = [System.Windows.Forms.Cursors]::Default
        }
    })

    [void] $fenster.ShowDialog()
    $fenster.Dispose()
}

try {
    $plan = Get-Sicherungsplan
    if ($OhneDialog) {
        $ergebnis = Invoke-Sicherung -Plan $plan
        Write-Host "Sicherung erfolgreich: $($ergebnis.Archivpfad)"
        Write-Host "SHA-256: $($ergebnis.Hash)"
    } else {
        Show-Dialog -Plan $plan
    }
} catch {
    if ($OhneDialog) {
        throw
    }
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Sicherungsfehler', 'OK', 'Error') | Out-Null
}
