$ErrorActionPreference = "Stop"

$Origem = Split-Path $PSScriptRoot -Parent
$Destino = Join-Path $env:LOCALAPPDATA "CirqueiraX\agente"
$Python = Join-Path $env:LOCALAPPDATA "Programs\Python\Python311\python.exe"

if (-not (Test-Path $Python)) {
    $comando = Get-Command python -ErrorAction SilentlyContinue
    if (-not $comando) {
        throw "Python nao encontrado no Windows."
    }
    $Python = $comando.Source
}

New-Item -ItemType Directory -Force -Path (Join-Path $Destino "core") | Out-Null
Copy-Item (Join-Path $Origem "agente.py") $Destino -Force
Copy-Item (Join-Path $Origem "requirements.txt") $Destino -Force
Copy-Item (Join-Path $Origem "core\*") (Join-Path $Destino "core") -Force

$screenshots = Join-Path $env:USERPROFILE "Pictures\Screenshots"
if (-not (Test-Path $screenshots)) {
    $alternativa = Join-Path $env:USERPROFILE "Pictures\Capturas de tela"
    if (Test-Path $alternativa) {
        $screenshots = $alternativa
    }
}

$estado = Join-Path $env:USERPROFILE ".cirqueirax_enviados.json"
$envOrigem = Join-Path $Origem ".env"
$mapa = [ordered]@{}
if (Test-Path $envOrigem) {
    foreach ($linha in [System.IO.File]::ReadAllLines($envOrigem)) {
        if ($linha -match '^\s*#' -or $linha -notmatch '=') { continue }
        $partes = $linha.Split('=', 2)
        $mapa[$partes[0].Trim()] = $partes[1].Trim()
    }
}

if (-not $mapa.Contains("SERVER_URL") -or [string]::IsNullOrWhiteSpace($mapa["SERVER_URL"])) {
    $mapa["SERVER_URL"] = "https://x.cirqueira.com/api/v1/ingestao/print"
}
$mapa["WATCH_DIR"] = $screenshots
$mapa["STATE_FILE"] = $estado
$mapa["USE_POLLING"] = "false"
if (-not $mapa.Contains("DEBOUNCE_SECONDS")) { $mapa["DEBOUNCE_SECONDS"] = "3.0" }
if (-not $mapa.Contains("LOG_LEVEL")) { $mapa["LOG_LEVEL"] = "INFO" }
if (-not $mapa.Contains("POLLING_INTERVAL")) { $mapa["POLLING_INTERVAL"] = "1.5" }

$linhas = foreach ($chave in $mapa.Keys) { "$chave=$($mapa[$chave])" }
[System.IO.File]::WriteAllLines((Join-Path $Destino ".env"), $linhas)

$venvPython = Join-Path $Destino ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    & $Python -m venv (Join-Path $Destino ".venv")
}
& $venvPython -m pip install -q -r (Join-Path $Destino "requirements.txt")

$bat = @"
@echo off
cd /d "%~dp0"
echo em-execucao> "%LOCALAPPDATA%\CirqueiraX\agente.lock"
".venv\Scripts\python.exe" agente.py start
del "%LOCALAPPDATA%\CirqueiraX\agente.lock" 2>nul
"@
[System.IO.File]::WriteAllText((Join-Path $Destino "iniciar.bat"), $bat)

$vbs = @"
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
dest = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\CirqueiraX\agente"
runtime = sh.ExpandEnvironmentStrings("%USERPROFILE%") & "\.cirqueirax_runtime.json"
lock = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\CirqueiraX\agente.lock"
If fso.FileExists(lock) Then
  If DateDiff("s", fso.GetFile(lock).DateLastModified, Now) < 30 Then
    WScript.Quit 0
  End If
End If
vivo = False
If fso.FileExists(runtime) Then
  Set arquivo = fso.OpenTextFile(runtime, 1)
  txt = arquivo.ReadAll
  arquivo.Close
  Set re = New RegExp
  re.Pattern = """pid"":\s*(\d+)"
  Set achou = re.Execute(txt)
  If achou.Count > 0 Then
    pid = achou(0).SubMatches(0)
    Set ex = sh.Exec("cmd /c tasklist /FI ""PID eq " & pid & """ /NH")
    saida = LCase(ex.StdOut.ReadAll)
    If InStr(saida, pid) > 0 And InStr(saida, "nenhuma") = 0 And InStr(saida, "no tasks") = 0 Then
      vivo = True
    End If
  End If
End If
If Not vivo Then
  sh.Run "cmd /c """ & dest & "\iniciar.bat""", 0, False
End If
"@
$vbsPath = Join-Path $Destino "vigia.vbs"
[System.IO.File]::WriteAllText($vbsPath, $vbs)

$startup = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\cirqueirax-agente.vbs"
Copy-Item $vbsPath $startup -Force

$fso = New-Object -ComObject Scripting.FileSystemObject
$vbsCurto = $fso.GetFile($vbsPath).ShortPath
$cmdTarefa = Join-Path $env:TEMP "cirqueirax-criar-tarefa.cmd"
[System.IO.File]::WriteAllText(
    $cmdTarefa,
    "schtasks /Create /TN `"CirqueiraX_Agente`" /TR `"wscript.exe $vbsCurto`" /SC MINUTE /MO 1 /F`r`n"
)
cmd.exe /c $cmdTarefa | Out-Null
wscript.exe $vbsPath
Write-Output "Agente instalado em $Destino"
Write-Output "Pasta vigiada: $screenshots"
