"""Núcleo do Agente de Ingestão de Prints CirqueiraX."""

from core import config
from core.cliente import enviar_print, enviar_print_manual, testar_conexao_servidor
from core.comandos import (
    executar_comando_config,
    executar_comando_env,
    executar_comando_reset,
    executar_comando_send,
    executar_comando_test,
    executar_comando_url,
)
from core.estado import (
    ja_enviado,
    limpar_estatisticas,
    limpar_historico_enviados,
    limpar_tudo,
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
    "enviar_print_manual",
    "testar_conexao_servidor",
    "ja_enviado",
    "marcar_enviado",
    "obter_estatisticas",
    "obter_status_processo",
    "registrar_sucesso",
    "registrar_falha",
    "limpar_historico_enviados",
    "limpar_estatisticas",
    "limpar_tudo",
    "exibir_status",
    "iniciar_watcher",
    "executar_comando_url",
    "executar_comando_env",
    "executar_comando_config",
    "executar_comando_test",
    "executar_comando_send",
    "executar_comando_reset",
]
