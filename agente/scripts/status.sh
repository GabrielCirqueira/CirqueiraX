#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
python3 "$AGENTE_DIR/agente.py" status "$@"
