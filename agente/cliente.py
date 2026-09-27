import logging
from datetime import datetime, timezone
from pathlib import Path
import time
import requests
import config

from estado import ja_enviado, marcar_enviado

EXTENSOES_PERMITIDAS = {".png", ".jpg", ".jpeg", ".webp"}

def enviar_print(caminho_arquivo: Path, max_tentativas: int = 3) -> bool:
    if not caminho_arquivo.exists() or not caminho_arquivo.is_file():
        logging.warning(f"Arquivo não existe para envio: {caminho_arquivo}")
        return False

    if caminho_arquivo.suffix.lower() not in EXTENSOES_PERMITIDAS:
        logging.debug(f"Ignorando arquivo por extensão não permitida: {caminho_arquivo}")
        return False

    if ja_enviado(caminho_arquivo):
        logging.info(f"Arquivo já enviado anteriormente (ignorado): {caminho_arquivo.name}")
        return True

    headers = {
        "X-Agent-Token": config.AGENT_TOKEN,
    }

    timestamp_captura = datetime.fromtimestamp(
        caminho_arquivo.stat().st_mtime, tz=timezone.utc
    ).isoformat()

    dados_formulario = {
        "nomeOriginal": caminho_arquivo.name,
        "timestampCaptura": timestamp_captura,
    }

    for tentativa in range(1, max_tentativas + 1):
        try:
            with open(caminho_arquivo, "rb") as f:
                arquivos = {
                    "arquivo": (caminho_arquivo.name, f, f"image/{caminho_arquivo.suffix.lstrip('.')}")
                }
                response = requests.post(
                    config.SERVER_URL,
                    headers=headers,
                    data=dados_formulario,
                    files=arquivos,
                    timeout=30.0,
                )

            if response.status_code in (200, 201):
                logging.info(f"Print enviado com sucesso! [{caminho_arquivo.name}] (Status HTTP {response.status_code})")
                marcar_enviado(caminho_arquivo)
                return True
            elif 400 <= response.status_code < 500:
                logging.error(f"Erro cliente ao enviar print [{caminho_arquivo.name}]: Status HTTP {response.status_code} - {response.text}")
                return False
            else:
                logging.warning(f"Erro servidor [{caminho_arquivo.name}] Status HTTP {response.status_code}. Tentativa {tentativa}/{max_tentativas}...")

        except requests.RequestException as exc:
            logging.warning(f"Erro de conexão ao enviar [{caminho_arquivo.name}]: {exc}. Tentativa {tentativa}/{max_tentativas}...")

        if tentativa < max_tentativas:
            tempo_espera = 2 ** tentativa
            time.sleep(tempo_espera)

    logging.error(f"Falha ao enviar [{caminho_arquivo.name}] após {max_tentativas} tentativas.")
    return False
