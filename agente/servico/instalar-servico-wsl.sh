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

echo ""
echo "=========================================================="
echo "  Instalação concluída no WSL!                            "
echo "=========================================================="
echo "• Para ver o status:        python3 agente.py status"
echo "• Para live monitor (-w):   python3 agente.py status -w"
echo "• Para testar um envio:     python3 agente.py send /caminho/imagem.png"
echo ""
