import hashlib
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

try:
    from . import config
except ImportError:
    from core import config

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
        logging.warning(
            f"Falha ao calcular hash do arquivo [{caminho_arquivo.name}]: {e}"
        )
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
        logging.error(
            f"Falha ao calcular hash ao marcar enviado [{caminho_arquivo.name}]: {e}"
        )
        return

    with _lock:
        estado = _carregar_estado()
        estado.setdefault("enviados", {})[hash_arquivo] = {
            "nome": caminho_arquivo.name,
            "caminho": str(caminho_arquivo.resolve()),
            "tamanho": caminho_arquivo.stat().st_size,
            "enviado_em": datetime.now(timezone.utc).isoformat(),
        }
        _salvar_estado(estado)
        logging.debug(
            f"Arquivo marcado como enviado no estado local: {caminho_arquivo.name}"
        )

def _estrutura_stats_vazia() -> dict:
    return {
        "total_enviados": 0,
        "total_bytes": 0,
        "total_falhas": 0,
        "ultimo_sucesso": None,
        "ultima_falha": None,
        "diario": {},
        "historico_recente": [],
    }

def _carregar_stats() -> dict:
    arquivo_stats = Path(config.STATS_FILE)
    if not arquivo_stats.exists():
        return _estrutura_stats_vazia()
    try:
        with open(arquivo_stats, "r", encoding="utf-8") as f:
            dados = json.load(f)
            if isinstance(dados, dict):
                return dados
    except Exception as e:
        logging.warning(
            f"Erro ao ler arquivo de estatísticas [{config.STATS_FILE}]: {e}"
        )
    return _estrutura_stats_vazia()

def _salvar_stats(stats: dict) -> None:
    arquivo_stats = Path(config.STATS_FILE)
    try:
        arquivo_stats.parent.mkdir(parents=True, exist_ok=True)
        with open(arquivo_stats, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logging.error(
            f"Erro ao salvar arquivo de estatísticas [{config.STATS_FILE}]: {e}"
        )

def registrar_sucesso(caminho_arquivo: Path, tamanho_bytes: int) -> None:
    agora = datetime.now(timezone.utc)
    agora_iso = agora.isoformat()
    chave_dia = agora.strftime("%Y-%m-%d")

    with _lock:
        stats = _carregar_stats()
        stats["total_enviados"] = stats.get("total_enviados", 0) + 1
        stats["total_bytes"] = stats.get("total_bytes", 0) + tamanho_bytes

        stats["ultimo_sucesso"] = {
            "arquivo": caminho_arquivo.name,
            "tamanho": tamanho_bytes,
            "timestamp": agora_iso,
        }

        diario = stats.setdefault("diario", {})
        dia_info = diario.setdefault(
            chave_dia, {"enviados": 0, "bytes": 0, "falhas": 0}
        )
        dia_info["enviados"] = dia_info.get("enviados", 0) + 1
        dia_info["bytes"] = dia_info.get("bytes", 0) + tamanho_bytes

        historico = stats.setdefault("historico_recente", [])
        historico.insert(
            0,
            {
                "tipo": "sucesso",
                "arquivo": caminho_arquivo.name,
                "tamanho": tamanho_bytes,
                "motivo": None,
                "timestamp": agora_iso,
            },
        )
        stats["historico_recente"] = historico[:20]

        _salvar_stats(stats)

def registrar_falha(caminho_arquivo: Path, motivo: str) -> None:
    agora = datetime.now(timezone.utc)
    agora_iso = agora.isoformat()
    chave_dia = agora.strftime("%Y-%m-%d")

    with _lock:
        stats = _carregar_stats()
        stats["total_falhas"] = stats.get("total_falhas", 0) + 1

        stats["ultima_falha"] = {
            "arquivo": caminho_arquivo.name,
            "motivo": motivo,
            "timestamp": agora_iso,
        }

        diario = stats.setdefault("diario", {})
        dia_info = diario.setdefault(
            chave_dia, {"enviados": 0, "bytes": 0, "falhas": 0}
        )
        dia_info["falhas"] = dia_info.get("falhas", 0) + 1

        historico = stats.setdefault("historico_recente", [])
        historico.insert(
            0,
            {
                "tipo": "falha",
                "arquivo": caminho_arquivo.name,
                "tamanho": caminho_arquivo.stat().st_size
                if caminho_arquivo.exists()
                else 0,
                "motivo": motivo,
                "timestamp": agora_iso,
            },
        )
        stats["historico_recente"] = historico[:20]

        _salvar_stats(stats)

def obter_estatisticas() -> dict:
    with _lock:
        return _carregar_stats()

def processo_esta_vivo(pid: int) -> bool:
    if pid <= 0:
        return False
    if sys.platform == "win32":
        try:
            import ctypes

            kernel32 = ctypes.windll.kernel32
            process_query = 0x1000
            synchronize = 0x00100000
            handle = kernel32.OpenProcess(process_query | synchronize, False, pid)
            if handle:
                kernel32.CloseHandle(handle)
                return True
            return False
        except Exception:
            return False
    else:
        try:
            os.kill(pid, 0)
            return True
        except ProcessLookupError:
            return False
        except PermissionError:
            return True
        except Exception:
            return False

def registrar_inicio_processo() -> None:
    arquivo_runtime = Path(config.RUNTIME_FILE)
    arquivo_runtime.parent.mkdir(parents=True, exist_ok=True)
    dados = {
        "pid": os.getpid(),
        "iniciado_em": datetime.now(timezone.utc).isoformat(),
        "ultimo_heartbeat": time.time(),
        "instancia": config.INSTANCE_NAME,
        "watch_dir": config.WATCH_DIR,
        "server_url": config.SERVER_URL,
        "ativo": True,
    }
    with _lock:
        with open(arquivo_runtime, "w", encoding="utf-8") as f:
            json.dump(dados, f, indent=2)

def atualizar_heartbeat() -> None:
    arquivo_runtime = Path(config.RUNTIME_FILE)
    if not arquivo_runtime.exists():
        registrar_inicio_processo()
        return

    try:
        with _lock:
            with open(arquivo_runtime, "r", encoding="utf-8") as f:
                dados = json.load(f)
            dados["ultimo_heartbeat"] = time.time()
            dados["ativo"] = True
            with open(arquivo_runtime, "w", encoding="utf-8") as f:
                json.dump(dados, f, indent=2)
    except Exception:
        pass

def registrar_encerramento_processo() -> None:
    arquivo_runtime = Path(config.RUNTIME_FILE)
    if not arquivo_runtime.exists():
        return
    try:
        with _lock:
            with open(arquivo_runtime, "r", encoding="utf-8") as f:
                dados = json.load(f)
            dados["ativo"] = False
            dados["encerrado_em"] = datetime.now(timezone.utc).isoformat()
            with open(arquivo_runtime, "w", encoding="utf-8") as f:
                json.dump(dados, f, indent=2)
    except Exception:
        pass

def obter_status_processo() -> dict:
    arquivo_runtime = Path(config.RUNTIME_FILE)
    if not arquivo_runtime.exists():
        return {
            "ativo": False,
            "motivo": "Nenhuma sessão ativa registrada",
            "pid": None,
            "uptime_segundos": 0,
        }

    try:
        with _lock:
            with open(arquivo_runtime, "r", encoding="utf-8") as f:
                dados = json.load(f)
    except Exception as e:
        return {
            "ativo": False,
            "motivo": f"Falha ao ler arquivo runtime: {e}",
            "pid": None,
            "uptime_segundos": 0,
        }

    pid = dados.get("pid")
    ultimo_hb = dados.get("ultimo_heartbeat", 0)
    iniciado_em = dados.get("iniciado_em")
    declarado_ativo = dados.get("ativo", False)

    if not pid:
        return {
            "ativo": False,
            "motivo": "PID não informado no runtime",
            "pid": None,
            "uptime_segundos": 0,
        }

    esta_vivo = processo_esta_vivo(pid)
    tempo_desde_hb = time.time() - ultimo_hb if ultimo_hb else 999999

    if declarado_ativo and esta_vivo and tempo_desde_hb < 15:
        uptime = 0.0
        if iniciado_em:
            try:
                dt_inicio = datetime.fromisoformat(iniciado_em)
                uptime = max(
                    0.0, (datetime.now(timezone.utc) - dt_inicio).total_seconds()
                )
            except Exception:
                pass
        return {
            "ativo": True,
            "pid": pid,
            "iniciado_em": iniciado_em,
            "uptime_segundos": uptime,
            "segundos_desde_heartbeat": tempo_desde_hb,
            "instancia": dados.get("instancia", config.INSTANCE_NAME),
            "watch_dir": dados.get("watch_dir", config.WATCH_DIR),
            "server_url": dados.get("server_url", config.SERVER_URL),
        }

    if not esta_vivo:
        motivo = f"Processo PID {pid} finalizado (não encontrado no SO)"
    else:
        motivo = f"Processo PID {pid} sem resposta (heartbeat parou há {int(tempo_desde_hb)}s)"

    return {
        "ativo": False,
        "pid": pid,
        "motivo": motivo,
        "iniciado_em": iniciado_em,
        "uptime_segundos": 0,
        "instancia": dados.get("instancia", config.INSTANCE_NAME),
    }

def limpar_historico_enviados() -> int:
    """Limpa a lista de hashes de arquivos já enviados no arquivo de estado."""
    with _lock:
        estado = _carregar_estado()
        qtd = len(estado.get("enviados", {}))
        _salvar_estado({"enviados": {}})
    return qtd

def limpar_estatisticas() -> bool:
    """Zera o arquivo de estatísticas locais."""
    with _lock:
        _salvar_stats(_estrutura_stats_vazia())
    return True

def limpar_tudo() -> tuple[int, bool]:
    """Limpa tanto os hashes de envio quanto as estatísticas acumuladas."""
    qtd_hashes = limpar_historico_enviados()
    stats_zeradas = limpar_estatisticas()
    return qtd_hashes, stats_zeradas
