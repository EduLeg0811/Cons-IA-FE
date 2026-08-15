# dev.ps1 — runs Main-Server (FastAPI) and o frontend (Vite) neste mesmo terminal, abre o browser
#   .\dev.ps1                            -> sobe Main-Server em ..\Main-Server e o Vite
#   .\dev.ps1 -NoServer                  -> só o Vite, apontando para um Main-Server já em execução
#   .\dev.ps1 -ServerPath D:\outro\path  -> Main-Server em outro diretório
#   .\dev.ps1 -ServerPort 8000           -> porta fixa do Main-Server (default: primeira livre a partir de 8000)
param(
    [string]$ServerPath = "",
    [int]$ServerPort = 0,
    [switch]$NoServer
)

$root = $PSScriptRoot

function Stop-ProcessTree {
    param (
        [int]$ParentId
    )
    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentId" -ErrorAction SilentlyContinue
    if ($children) {
        foreach ($child in $children) {
            Stop-ProcessTree -ParentId $child.ProcessId
        }
    }
    Stop-Process -Id $ParentId -Force -ErrorAction SilentlyContinue
}

function Stop-OrphanedProcess {
    param (
        [string]$PidFile,
        [string[]]$ExpectedNames
    )
    if (Test-Path $PidFile) {
        $pidVal = Get-Content $PidFile -Raw -ErrorAction SilentlyContinue
        if ($pidVal -and $pidVal -match '^\d+$') {
            $pidInt = [int]$pidVal
            $proc = Get-Process -Id $pidInt -ErrorAction SilentlyContinue
            if ($null -ne $proc) {
                $match = $false
                foreach ($name in $ExpectedNames) {
                    if ($proc.Name -eq $name -or $proc.Name -like "*$name*") {
                        $match = $true
                        break
                    }
                }
                if ($match) {
                    Write-Host "Finalizando instância órfã anterior (PID $pidInt)..." -ForegroundColor Yellow
                    Stop-ProcessTree -ParentId $pidInt
                }
            }
        }
        Remove-Item $PidFile -ErrorAction SilentlyContinue
    }
}

function Get-FreePort {
    param (
        [int]$StartPort
    )
    $port = $StartPort
    while ($true) {
        $properties = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()
        $listeners = $properties.GetActiveTcpListeners() | ForEach-Object { $_.Port }
        $connections = $properties.GetActiveTcpConnections() | ForEach-Object { $_.LocalEndPoint.Port }

        if ($port -notin $listeners -and $port -notin $connections) {
            return $port
        }
        $port++
    }
}

# Limpar processos órfãos de execuções anteriores no mesmo workspace
Stop-OrphanedProcess -PidFile "$root\.server.pid" -ExpectedNames @("powershell", "pwsh", "python")
Stop-OrphanedProcess -PidFile "$root\.frontend.pid" -ExpectedNames @("cmd", "node", "npm")

# Localizar o Main-Server
if (-not $ServerPath) {
    $ServerPath = Join-Path (Split-Path $root -Parent) "Main-Server"
}
$serverScript = Join-Path $ServerPath "run_dev.ps1"

if (-not $NoServer -and -not (Test-Path $serverScript)) {
    Write-Warning "Main-Server não encontrado em '$ServerPath'. Subindo apenas o frontend."
    Write-Warning "Use -ServerPath para indicar o diretório correto, ou -NoServer para silenciar este aviso."
    $NoServer = $true
}

# Procurar portas livres
if ($ServerPort -le 0) {
    $ServerPort = if ($NoServer) { 8000 } else { Get-FreePort -StartPort 8000 }
}
$frontendPort = Get-FreePort -StartPort 3000

# O proxy do Vite (vite.config.js) encaminha /api e /logs para este alvo
$env:VITE_DEV_API_TARGET = "http://127.0.0.1:$ServerPort"

# Iniciar Main-Server e frontend
$processes = @()

if (-not $NoServer) {
    # run_dev.ps1 do Main-Server também é UTF-8 sem BOM; pwsh 7 preserva os acentos.
    $psExe = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }
    $server = Start-Process $psExe `
        -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "run_dev.ps1", "-Port", $ServerPort `
        -WorkingDirectory $ServerPath -NoNewWindow -PassThru
    $server.Id | Out-File -FilePath "$root\.server.pid" -NoNewline -Encoding ascii
    $processes += $server
}

$frontend = Start-Process cmd -ArgumentList "/c", "npm run dev -- --port $frontendPort" -WorkingDirectory $root -NoNewWindow -PassThru
$frontend.Id | Out-File -FilePath "$root\.frontend.pid" -NoNewline -Encoding ascii
$processes += $frontend

Start-Sleep -Seconds 2
Start-Process "http://localhost:$frontendPort/"

if ($NoServer) {
    Write-Host "Main-Server: usando instância externa em http://127.0.0.1:$ServerPort"
} else {
    Write-Host "Main-Server (PID $($server.Id)) na porta $ServerPort  (docs: http://127.0.0.1:$ServerPort/docs)"
}
Write-Host "Frontend (PID $($frontend.Id)) na porta $frontendPort"
Write-Host "Pressione Ctrl+C para encerrar."

try {
    Wait-Process -Id ($processes | ForEach-Object { $_.Id }) -ErrorAction SilentlyContinue
} finally {
    foreach ($proc in $processes) {
        Stop-ProcessTree -ParentId $proc.Id
    }
    Remove-Item "$root\.server.pid" -ErrorAction SilentlyContinue
    Remove-Item "$root\.frontend.pid" -ErrorAction SilentlyContinue
}
