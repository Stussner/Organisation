<#
PowerShell helper for Ollama: download, test and optionally serve a model.
Run in a PowerShell with Ollama on PATH (native installer) from any location.
#>

param(
    [string]$ModelName = $(Read-Host "Model Identifier to pull (e.g. llama-2-7b-quant)")
)

$ollamaCmd = "ollama"

function Check-Command {
    param($cmd)
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

if (-not (Check-Command $ollamaCmd)) {
    Write-Error "'ollama' wurde nicht im PATH gefunden. Stelle sicher, dass Ollama installiert ist und 'ollama' im PATH liegt."
    exit 1
}

Write-Host "Ollama version:" -ForegroundColor Cyan
& $ollamaCmd --version

Write-Host "\nFreier Speicher (GB):" -ForegroundColor Cyan
Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{Name='FreeGB';Expression={[math]::Round($_.Free/1GB,2)}} | Format-Table -AutoSize

if (-not $ModelName) {
    $ModelName = Read-Host "Model Identifier to pull (e.g. llama-2-7b-quant)"
}

Write-Host "\nStarte Download: $ModelName" -ForegroundColor Yellow
& $ollamaCmd pull $ModelName

Write-Host "\nVerfügbare lokale Modelle:" -ForegroundColor Cyan
& $ollamaCmd list

Write-Host "\nKurzer Run-Check (generiert eine kurze Antwort):" -ForegroundColor Cyan
& $ollamaCmd run $ModelName --prompt "Hello from local model (quick test)" | Out-Host

$serve = Read-Host "Möchtest du einen HTTP-Serve für dieses Modell starten? (y/n)"
if ($serve -match '^[Yy]') {
    $port = Read-Host "Port (default 11434)"
    if (-not $port) { $port = 11434 }
    Write-Host "Starte Serve auf Port $port ..." -ForegroundColor Yellow
    Write-Host "Hinweis: Dieser Serve-Prozess läuft im Vordergrund. Öffne einen neuen Terminal, falls du weiterarbeiten willst." -ForegroundColor Gray
    Write-Host "Wenn Firewall-Regeln erforderlich sind, musst du diese separat freigeben." -ForegroundColor Gray
    & $ollamaCmd serve --model $ModelName --port $port
}

$update = Read-Host "Möchtest du cline.config.json mit dem Modellnamen aktualisieren? (y/n)"
if ($update -match '^[Yy]') {
    $cfgPath = "E:\\Programmierung\\Organisation\\Workspace\\VSCode\\Cline\\cline.config.json"
    if (-Not (Test-Path $cfgPath)) {
        Write-Error "cline.config.json nicht gefunden unter $cfgPath"
        exit 1
    }
    try {
        $json = Get-Content $cfgPath -Raw | ConvertFrom-Json
        $json.model = $ModelName
        $json.provider = "local"
        $json.localEndpoint = "http://localhost:$port"
        $json | ConvertTo-Json -Depth 10 | Set-Content $cfgPath -Encoding UTF8
        Write-Host "cline.config.json aktualisiert: model=$ModelName, provider=local, localEndpoint=http://localhost:$port" -ForegroundColor Green
    } catch {
        Write-Error "Fehler beim Aktualisieren der cline.config.json: $_"
    }
}

Write-Host "Fertig. Wenn du den Serve nicht gestartet hast, kannst du ihn später mit: ollama serve --model $ModelName --port 11434" -ForegroundColor Cyan
