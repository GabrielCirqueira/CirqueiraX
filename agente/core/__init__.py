"""Núcleo do Agente de Ingestão de Prints CirqueiraX."""

from core import config
from core.cliente import enviar_print, testar_conexao_servidor
from core.estado import (
    ja_enviado,
    marcar_enviado,
    obter_estatisticas,
    obter_status_processo,
    registrar_falha,
    registrar_sucesso,
)
from core.status import exibir_status


def iniciar_watcher(*args, **kwargs):
    from core.watcher import iniciar_watcher as _iniciar

    return _iniciar(*args, **kwargs)


__all__ = [
    "config",
    "enviar_print",
    "testar_conexao_servidor",
    "ja_enviado",
    "marcar_enviado",
    "obter_estatisticas",
    "obter_status_processo",
    "registrar_sucesso",
    "registrar_falha",
    "exibir_status",
    "iniciar_watcher",
]
