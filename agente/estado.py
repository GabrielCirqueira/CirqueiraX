import hashlib
import json
import logging
from pathlib import Path
from threading import Lock

import config

_lock = Lock()

def calcular_hash(caminho_arquivo: Path) -> str:
    hasher = hashlib.sha256()
    with open(caminho_arquivo, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def _carregar_estado() -> dict:
    arquivo_estado = Path(config.STATE_FILE)
    if not arquivo_estado.exists():
        return {"enviados": {}}
    try:
        with open(arquivo_estado, "r", encoding="utf-8") as f:
            dados = json.load(f)
            if isinstance(dados, dict) and "enviados" in dados:
                return dados
    except Exception as e:
        logging.warning(f"Erro ao ler arquivo de estado [{config.STATE_FILE}]: {e}")
    return {"enviados": {}}

def _salvar_estado(estado: dict) -> None:
    arquivo_estado = Path(config.STATE_FILE)
    try:
        arquivo_estado.parent.mkdir(parents=True, exist_ok=True)
        with open(arquivo_estado, "w", encoding="utf-8") as f:
            json.dump(estado, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logging.error(f"Erro ao salvar arquivo de estado [{config.STATE_FILE}]: {e}")

def ja_enviado(caminho_arquivo: Path) -> bool:
    if not caminho_arquivo.exists() or not caminho_arquivo.is_file():
        return False

    try:
        hash_arquivo = calcular_hash(caminho_arquivo)
    except Exception as e:
        logging.warning(f"Falha ao calcular hash do arquivo [{caminho_arquivo.name}]: {e}")
        return False

    with _lock:
        estado = _carregar_estado()
        return hash_arquivo in estado.get("enviados", {})

def marcar_enviado(caminho_arquivo: Path) -> None:
    if not caminho_arquivo.exists() or not caminho_arquivo.is_file():
        return

    try:
        hash_arquivo = calcular_hash(caminho_arquivo)
    except Exception as e:
        logging.error(f"Falha ao calcular hash ao marcar enviado [{caminho_arquivo.name}]: {e}")
        return

    with _lock:
        estado = _carregar_estado()
        estado.setdefault("enviados", {})[hash_arquivo] = {
            "nome": caminho_arquivo.name,
            "caminho": str(caminho_arquivo.resolve()),
            "tamanho": caminho_arquivo.stat().st_size,
        }
        _salvar_estado(estado)
        logging.debug(f"Arquivo marcado como enviado no estado local: {caminho_arquivo.name}")
