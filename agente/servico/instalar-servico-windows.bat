@echo off
set AGENTE_DIR=%~dp0..
schtasks /Create /TN "CirqueiraX_Agente" /TR "python.exe \"%AGENTE_DIR%\agente.py\"" /SC ONLOGON /RL HIGHEST /F
echo Serviço do Agente CirqueiraX registrado no Agendador de Tarefas do Windows!
