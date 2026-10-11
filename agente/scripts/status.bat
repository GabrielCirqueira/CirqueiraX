@echo off
set SCRIPT_DIR=%~dp0
set AGENTE_DIR=%SCRIPT_DIR%..
python "%AGENTE_DIR%\agente.py" status %*
