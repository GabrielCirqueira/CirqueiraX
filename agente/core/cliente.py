import logging
from datetime import datetime, timezone
from pathlib import Path
import time
import requests

try:
    from . import config
    from .estado import ja_enviado, marcar_enviado, registrar_falha, registrar_sucesso
except ImportError:
    from core import config
    from core.estado import (
        ja_enviado,
        marcar_enviado,
        registrar_falha,
        registrar_sucesso,
    )

EXTENSOES_PERMITIDAS = {".png", ".jpg", ".jpeg", ".webp"}

def testar_conexao_servidor(
    url_custom: str | None = None, token_custom: str | None = None
) -> tuple[bool, int, str]:
    alvo = url_custom or config.SERVER_URL
    token = token_custom if token_custom is not None else config.AGENT_TOKEN
    headers = {
        "X-Agent-Token": token,
    }
    url_base = (
        alvo.split("/api/v1/")[0] + "/api/v1/health" if "/api/v1/" in alvo else alvo
    )
    try:
        res = requests.get(url_base, headers=headers, timeout=5.0)
        return True, res.status_code, "Online"
    except requests.RequestException as e:
        return False, 0, str(e)

def enviar_print(
    caminho_arquivo: Path,
    max_tentativas: int = 3,
    forcar_reenvio: bool = False,
    url_override: str | None = None,
    token_override: str | None = None,
) -> bool:
    sucesso, _, _, _ = enviar_print_manual(
        caminho_arquivo=caminho_arquivo,
        max_tentativas=max_tentativas,
        forcar_reenvio=forcar_reenvio,
        url_override=url_override,
        token_override=token_override,
    )
    return sucesso

def enviar_print_manual(
    caminho_arquivo: Path,
    max_tentativas: int = 3,
    forcar_reenvio: bool = False,
    url_override: str | None = None,
    token_override: str | None = None,
) -> tuple[bool, int, str, dict]:
    """
    Executa o upload do print retornando relatório detalhado:
    (sucesso: bool, codigo_http: int, mensagem: str, dados_resposta: dict)
    """
    url_alvo = url_override or config.SERVER_URL
    token_alvo = token_override if token_override is not None else config.AGENT_TOKEN

    if not caminho_arquivo.exists() or not caminho_arquivo.is_file():
        msg = f"Arquivo não existe: {caminho_arquivo}"
        logging.warning(msg)
        return False, 0, msg, {}

    if caminho_arquivo.suffix.lower() not in EXTENSOES_PERMITIDAS:
        msg = f"Extensão não suportada ({caminho_arquivo.suffix}): permitidas {', '.join(sorted(EXTENSOES_PERMITIDAS))}"
        logging.debug(msg)
        return False, 0, msg, {}

    if not forcar_reenvio and ja_enviado(caminho_arquivo):
        msg = f"Arquivo já enviado anteriormente (ignorado por hash duplicado): {caminho_arquivo.name}"
        logging.info(msg)
        return True, 200, msg, {"ignorado_duplicado": True}

    headers = {
        "X-Agent-Token": token_alvo,
    }

    timestamp_captura = datetime.fromtimestamp(
        caminho_arquivo.stat().st_mtime, tz=timezone.utc
    ).isoformat()

    dados_formulario = {
        "nomeOriginal": caminho_arquivo.name,
        "timestampCaptura": timestamp_captura,
    }

    ultimo_motivo = ""
    ultimo_status = 0
    dados_resposta: dict = {}

    for tentativa in range(1, max_tentativas + 1):
        try:
            with open(caminho_arquivo, "rb") as f:
                arquivos = {
                    "arquivo": (
                        caminho_arquivo.name,
                        f,
                        f"image/{caminho_arquivo.suffix.lstrip('.')}",
                    )
                }
                response = requests.post(
                    url_alvo,
                    headers=headers,
                    data=dados_formulario,
                    files=arquivos,
                    timeout=30.0,
                )

            ultimo_status = response.status_code
            try:
                dados_resposta = response.json()
            except Exception:
                dados_resposta = {"raw": response.text[:200]}

            if response.status_code in (200, 201):
                tamanho = caminho_arquivo.stat().st_size
                logging.info(
                    f"Print enviado com sucesso! [{caminho_arquivo.name}] (Status HTTP {response.status_code})"
                )
                marcar_enviado(caminho_arquivo)
                registrar_sucesso(caminho_arquivo, tamanho)
                return (
                    True,
                    response.status_code,
                    "Upload realizado com sucesso",
                    dados_resposta,
                )
            elif 400 <= response.status_code < 500:
                ultimo_motivo = (
                    f"Erro cliente HTTP {response.status_code}: {response.text[:140]}"
                )
                logging.error(
                    f"Erro cliente ao enviar print [{caminho_arquivo.name}]: {ultimo_motivo}"
                )
                registrar_falha(caminho_arquivo, ultimo_motivo)
                return False, response.status_code, ultimo_motivo, dados_resposta
            else:
                ultimo_motivo = f"Erro servidor HTTP {response.status_code}"
                logging.warning(
                    f"{ultimo_motivo} [{caminho_arquivo.name}]. Tentativa {tentativa}/{max_tentativas}..."
                )

        except requests.RequestException as exc:
            ultimo_motivo = f"Erro de conexão: {exc}"
            logging.warning(
                f"Erro de conexão ao enviar [{caminho_arquivo.name}]: {exc}. Tentativa {tentativa}/{max_tentativas}..."
            )

        if tentativa < max_tentativas:
            tempo_espera = 2**tentativa
            time.sleep(tempo_espera)

    motivo_final = f"Falha após {max_tentativas} tentativas ({ultimo_motivo})"
    logging.error(f"Falha ao enviar [{caminho_arquivo.name}]: {motivo_final}")
    registrar_falha(caminho_arquivo, motivo_final)
    return False, ultimo_status, motivo_final, dados_resposta
