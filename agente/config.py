import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8080/api/v1/ingestao/print")
AGENT_TOKEN = os.getenv("AGENT_TOKEN", "")
WATCH_DIR = str(Path(os.getenv("WATCH_DIR", "~/Pictures/Screenshots")).expanduser().resolve())
DEBOUNCE_SECONDS = float(os.getenv("DEBOUNCE_SECONDS", "3.0"))
STATE_FILE = str(Path(os.getenv("STATE_FILE", "~/.cirqueirax_enviados.json")).expanduser().resolve())
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
