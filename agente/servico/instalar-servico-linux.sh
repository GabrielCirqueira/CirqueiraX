#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
USER_SYSTEMD_DIR="$HOME/.config/systemd/user"

mkdir -p "$USER_SYSTEMD_DIR"

cat <<EOF > "$USER_SYSTEMD_DIR/cirqueirax-agente.service"
[Unit]
Description=Agente de Ingestao de Prints CirqueiraX
After=network.target network-online.target

[Service]
Type=simple
WorkingDirectory=$AGENTE_DIR
ExecStart=/usr/bin/env python3 $AGENTE_DIR/agente.py
Restart=always
RestartSec=5s
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable cirqueirax-agente.service
systemctl --user start cirqueirax-agente.service

echo "Serviço cirqueirax-agente instalado e iniciado com sucesso!"
echo "Verificar status: systemctl --user status cirqueirax-agente.service"
