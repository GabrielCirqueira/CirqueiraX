import os
import socket
from pathlib import Path
from dotenv import load_dotenv

# Diretório base do agente (pasta pai de core/)
DIRETORIO_RAIZ = Path(__file__).resolve().parent.parent

# Busca o arquivo .env na raiz do agente ou na pasta env/
candidatos_env = [
    DIRETORIO_RAIZ / ".env",
    DIRETORIO_RAIZ / "env" / ".env",
    Path.cwd() / ".env",
]

for candidato in candidatos_env:
    if candidato.exists() and candidato.is_file():
        load_dotenv(dotenv_path=candidato)
        break
else:
    # Fallback padrão
    load_dotenv(dotenv_path=DIRETORIO_RAIZ / ".env")

SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8080/api/v1/ingestao/print")
AGENT_TOKEN = os.getenv("AGENT_TOKEN", "")
WATCH_DIR = str(Path(os.getenv("WATCH_DIR", "~/Pictures/Screenshots")).expanduser().resolve())
DEBOUNCE_SECONDS = float(os.getenv("DEBOUNCE_SECONDS", "3.0"))
STATE_FILE = str(Path(os.getenv("STATE_FILE", "~/.cirqueirax_enviados.json")).expanduser().resolve())
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Identificador da máquina ou perfil (ex: PC Empresa, PC Pessoal)
INSTANCE_NAME = os.getenv("INSTANCE_NAME", os.getenv("NOME_AGENTE", socket.gethostname()))

# Arquivos de métricas e runtime derivados do STATE_FILE para permitir perfis isolados
_state_path = Path(STATE_FILE)
_nome_stats = _state_path.stem.replace("enviados", "stats") if "enviados" in _state_path.stem else f"{_state_path.stem}_stats"
_nome_runtime = _state_path.stem.replace("enviados", "runtime") if "enviados" in _state_path.stem else f"{_state_path.stem}_runtime"

STATS_FILE = str(Path(os.getenv("STATS_FILE", str(_state_path.with_name(f"{_nome_stats}.json")))).expanduser().resolve())
RUNTIME_FILE = str(Path(os.getenv("RUNTIME_FILE", str(_state_path.with_name(f"{_nome_runtime}.json")))).expanduser().resolve())
