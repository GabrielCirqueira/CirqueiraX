#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$AGENTE_DIR/.venv"
PYTHON_BIN="$VENV_DIR/bin/python3"

echo "=========================================================="
echo "    Instalador do Agente CirqueiraX para WSL2 (Windows)   "
echo "=========================================================="
echo ""
echo "Este assistente configura o agente rodando no Linux (WSL)"
echo "para vigiar capturas de tela salvas no Windows (C:\\Users\\...)."
echo ""

if [ ! -f "$PYTHON_BIN" ]; then
    echo "• Criando ambiente virtual Python em: $VENV_DIR"
    python3 -m venv "$VENV_DIR"
fi

echo "• Verificando dependências Python..."
"$VENV_DIR/bin/pip" install -q -r "$AGENTE_DIR/requirements.txt"

"$PYTHON_BIN" "$AGENTE_DIR/agente.py" install

CURRENT_USER="$(whoami)"
loginctl enable-linger "$CURRENT_USER" 2>/dev/null || true

for user_dir in /mnt/c/Users/*/; do
    startup_dir="${user_dir}AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"
    if [ -d "$startup_dir" ]; then
        vbs_file="$startup_dir/cirqueirax-agente.vbs"
        printf 'Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.Run "wsl.exe -u %s --exec true", 0, False\r\n' "$CURRENT_USER" > "$vbs_file"
        echo "✔ Inicialização silenciosa no boot do Windows configurada em:"
        echo "  $vbs_file"
        break
    fi
done

echo ""
echo "=========================================================="
echo "  Instalação concluída no WSL!                            "
echo "=========================================================="
echo "• Para ver o status:        python3 agente.py status"
echo "• Para live monitor (-w):   python3 agente.py status -w"
echo "• Para testar um envio:     python3 agente.py send /caminho/imagem.png"
echo ""
