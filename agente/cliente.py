import logging
from datetime import datetime, timezone
from pathlib import Path
import sys
import time
import requests

_agente_dir = str(Path(__file__).resolve().parent)
if _agente_dir not in sys.path:
    sys.path.insert(0, _agente_dir)

import config
from estado import ja_enviado, marcar_enviado, registrar_sucesso, registrar_falha

EXTENSOES_PERMITIDAS = {".png", ".jpg", ".jpeg", ".webp"}


def testar_conexao_servidor() -> tuple[bool, int, str]:
    headers = {
        "X-Agent-Token": config.AGENT_TOKEN,
    }
    url_base = config.SERVER_URL.split("/api/v1/")[0] + "/api/v1/health" if "/api/v1/" in config.SERVER_URL else config.SERVER_URL
    try:
        res = requests.get(url_base, headers=headers, timeout=5.0)
        return True, res.status_code, "Online"
    except requests.RequestException as e:
        return False, 0, str(e)


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

    ultimo_motivo = ""

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
                tamanho = caminho_arquivo.stat().st_size
                logging.info(f"Print enviado com sucesso! [{caminho_arquivo.name}] (Status HTTP {response.status_code})")
                marcar_enviado(caminho_arquivo)
                registrar_sucesso(caminho_arquivo, tamanho)
                return True
            elif 400 <= response.status_code < 500:
                ultimo_motivo = f"Erro cliente HTTP {response.status_code}: {response.text[:120]}"
                logging.error(f"Erro cliente ao enviar print [{caminho_arquivo.name}]: {ultimo_motivo}")
                registrar_falha(caminho_arquivo, ultimo_motivo)
                return False
            else:
                ultimo_motivo = f"Erro servidor HTTP {response.status_code}"
                logging.warning(f"{ultimo_motivo} [{caminho_arquivo.name}]. Tentativa {tentativa}/{max_tentativas}...")

        except requests.RequestException as exc:
            ultimo_motivo = f"Erro de conexão: {exc}"
            logging.warning(f"Erro de conexão ao enviar [{caminho_arquivo.name}]: {exc}. Tentativa {tentativa}/{max_tentativas}...")

        if tentativa < max_tentativas:
            tempo_espera = 2 ** tentativa
            time.sleep(tempo_espera)

    motivo_final = f"Falha após {max_tentativas} tentativas ({ultimo_motivo})"
    logging.error(f"Falha ao enviar [{caminho_arquivo.name}]: {motivo_final}")
    registrar_falha(caminho_arquivo, motivo_final)
    return False
