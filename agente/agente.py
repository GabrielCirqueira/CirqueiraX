import logging
import sys
import time
from pathlib import Path
import config

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s",
)

def validar_configuracao():
    if not config.AGENT_TOKEN:
        logging.error("ERRO: AGENT_TOKEN não configurado no arquivo .env")
        sys.exit(1)

    pasta = Path(config.WATCH_DIR)
    if not pasta.exists():
        logging.info(f"Criando diretório monitorado: {pasta}")
        pasta.mkdir(parents=True, exist_ok=True)

    logging.info("Agente CirqueiraX iniciado!")
    logging.info(f"Servidor: {config.SERVER_URL}")
    logging.info(f"Pasta monitorada: {config.WATCH_DIR}")

def main():
    validar_configuracao()
    logging.info("Aguardando novas imagens capturadas...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logging.info("Agente encerrado pelo usuário.")

if __name__ == "__main__":
    main()
