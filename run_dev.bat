@echo off
title Cons-IA Dev Server
cd /d "%~dp0"
rem dev.ps1 e UTF-8 sem BOM (ver AGENTS.md); o Windows PowerShell 5.1 leria o
rem arquivo como ANSI e quebraria os acentos, entao preferimos o pwsh 7.
where pwsh >nul 2>&1
if %errorlevel%==0 (
    pwsh -ExecutionPolicy Bypass -File dev.ps1 %*
) else (
    powershell -ExecutionPolicy Bypass -File dev.ps1 %*
)
pause
