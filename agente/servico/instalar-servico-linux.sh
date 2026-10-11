#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
USER_SYSTEMD_DIR="$HOME/.config/systemd/user"
VENV_DIR="$AGENTE_DIR/.venv"
PYTHON_BIN="$VENV_DIR/bin/python3"

echo "=========================================================="
echo "  Instalação do Serviço CirqueiraX Agente (Linux / WSL)   "
echo "=========================================================="

if [ ! -f "$PYTHON_BIN" ]; then
    echo "• Criando ambiente virtual Python em: $VENV_DIR"
    python3 -m venv "$VENV_DIR"
fi

if [ -f "$AGENTE_DIR/requirements.txt" ]; then
    echo "• Verificando dependências Python (watchdog, requests, python-dotenv)..."
    "$VENV_DIR/bin/pip" install -q -r "$AGENTE_DIR/requirements.txt"
fi

"$PYTHON_BIN" "$AGENTE_DIR/agente.py" install --no-service

mkdir -p "$USER_SYSTEMD_DIR"

cat <<EOF > "$USER_SYSTEMD_DIR/cirqueirax-agente.service"
[Unit]
Description=Agente de Ingestao de Prints CirqueiraX
After=network.target network-online.target

[Service]
Type=simple
WorkingDirectory=$AGENTE_DIR
ExecStart=$PYTHON_BIN $AGENTE_DIR/agente.py
Restart=always
RestartSec=5s
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target
EOF

if command -v systemctl >/dev/null 2>&1; then
    systemctl --user daemon-reload
    systemctl --user enable cirqueirax-agente.service
    systemctl --user restart cirqueirax-agente.service
    echo ""
    echo "✔ Serviço cirqueirax-agente instalado e iniciado no systemd com sucesso!"
    echo "• Status no systemd: systemctl --user status cirqueirax-agente.service"
    echo "• Logs do serviço:   journalctl --user -u cirqueirax-agente.service -f"
    echo ""
    "$PYTHON_BIN" "$AGENTE_DIR/agente.py" status
else
    echo "▲ systemctl não disponível neste ambiente."
    echo "Para rodar em segundo plano, utilize:"
    echo "nohup $PYTHON_BIN $AGENTE_DIR/agente.py start > /dev/null 2>&1 &"
fi
