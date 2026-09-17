@echo off
setlocal
set "starter=%~dp0Backup.ps1"

where wt.exe >nul 2>nul
if %errorlevel% equ 0 (
    start "Sicherung der Organization Base" wt.exe new-tab powershell.exe -NoLogo -NoProfile -STA -ExecutionPolicy RemoteSigned -File "%starter%" %*
) else (
    start "Sicherung der Organization Base" powershell.exe -NoLogo -NoProfile -STA -ExecutionPolicy RemoteSigned -File "%starter%" %*
)
