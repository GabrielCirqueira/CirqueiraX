import argparse
import logging
import os
import sys
import time
from pathlib import Path

DIRETORIO_RAIZ = Path(__file__).resolve().parent
if str(DIRETORIO_RAIZ) not in sys.path:
    sys.path.insert(0, str(DIRETORIO_RAIZ))

from core import config
from core.comandos import (
    executar_comando_config,
    executar_comando_env,
    executar_comando_install,
    executar_comando_reset,
    executar_comando_send,
    executar_comando_test,
    executar_comando_url,
)
from core.estado import (
    atualizar_heartbeat,
    registrar_encerramento_processo,
    registrar_inicio_processo,
)

from core.status import exibir_status

def _configurar_log() -> None:
    handlers: list[logging.Handler] = []
    if sys.stdout is not None:
        handlers.append(logging.StreamHandler(sys.stdout))
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or str(Path.home())
        pasta_log = Path(base) / "CirqueiraX"
        pasta_log.mkdir(parents=True, exist_ok=True)
        handlers.append(
            logging.FileHandler(pasta_log / "agente.log", encoding="utf-8")
        )
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=handlers or None,
    )


_configurar_log()

def validar_configuracao():
    if not config.AGENT_TOKEN:
        logging.error("ERRO: AGENT_TOKEN não configurado no arquivo .env")
        logging.error(
            'Gere um token no backend via: make agente-token ARGS="nome origem"'
        )
        logging.error("E configure com: python3 agente.py config --token cx_ag_...")
        sys.exit(1)

    pasta = Path(config.WATCH_DIR)
    if not pasta.exists():
        logging.info(f"Criando diretório monitorado: {pasta}")
        pasta.mkdir(parents=True, exist_ok=True)

    logging.info("Agente CirqueiraX iniciado com sucesso!")
    logging.info(f"Perfil / Máquina: {config.INSTANCE_NAME}")
    logging.info(f"Ambiente: {config.identificar_ambiente(config.SERVER_URL)}")
    logging.info(f"Servidor: {config.SERVER_URL}")
    logging.info(f"Pasta monitorada: {config.WATCH_DIR}")

def executar_daemon(args: argparse.Namespace = None):
    if args:
        if getattr(args, "url", None):
            config.SERVER_URL = config.normalizar_url_ingestao(args.url)
        if getattr(args, "token", None):
            config.AGENT_TOKEN = args.token
        if getattr(args, "watch_dir", None):
            config.WATCH_DIR = str(Path(args.watch_dir).expanduser().resolve())

    validar_configuracao()
    from core.watcher import iniciar_watcher

    registrar_inicio_processo()
    observer = iniciar_watcher()
    logging.info("Agente operando em segundo plano. Pressione Ctrl+C para encerrar.")

    try:
        contador_hb = 0
        while True:
            time.sleep(1)
            contador_hb += 1
            if contador_hb >= 3:
                atualizar_heartbeat()
                contador_hb = 0
    except KeyboardInterrupt:
        logging.info("Encerrando watcher do agente...")
    finally:
        try:
            observer.stop()
            observer.join(timeout=3.0)
        except Exception:
            pass
        registrar_encerramento_processo()
        logging.info("Agente encerrado com sucesso.")

def main():
    parser = argparse.ArgumentParser(
        description="Agente CirqueiraX — Captura, Monitoramento e Utilitários de Ingestão de Prints",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="comando", help="Comandos disponíveis:")

    parser_start = subparsers.add_parser(
        "start", help="Inicia o observador de prints em segundo plano"
    )
    parser_start.add_argument(
        "--url", help="Override temporário da URL do servidor para este start"
    )
    parser_start.add_argument("--token", help="Override temporário do AGENT_TOKEN")
    parser_start.add_argument(
        "--watch-dir", help="Override temporário da pasta monitorada"
    )

    parser_status = subparsers.add_parser(
        "status", help="Exibe o painel de status do processo e métricas de envio"
    )
    parser_status.add_argument(
        "-w",
        "--watch",
        action="store_true",
        help="Atualiza continuamente o status em tempo real (modo live monitor)",
    )

    parser_url = subparsers.add_parser(
        "url", help="Exibe ou atualiza a URL do servidor no arquivo .env"
    )
    parser_url.add_argument(
        "nova_url",
        nargs="?",
        help="Nova URL do servidor (ex: http://localhost:8080 ou https://exemplo.com)",
    )
    parser_url.add_argument(
        "--no-test",
        action="store_true",
        help="Não executa teste de ping após configurar",
    )

    parser_env = subparsers.add_parser(
        "env", help="Alterna rapidamente entre ambientes (local, prod, vps)"
    )
    parser_env.add_argument(
        "tipo",
        nargs="?",
        choices=["local", "prod", "vps", "custom", "show"],
        help="Ambiente alvo",
    )
    parser_env.add_argument(
        "alvo",
        nargs="?",
        help="URL, IP da VPS ou porta local (ex: 8080 ou https://meudominio.com)",
    )

    parser_config = subparsers.add_parser(
        "config", help="Gerencia as variáveis de configuração no .env"
    )
    parser_config.add_argument(
        "subacao",
        nargs="?",
        default="show",
        choices=["show", "set", "get"],
        help="Ação de configuração",
    )
    parser_config.add_argument(
        "chave", nargs="?", help="Nome da variável para 'set' ou 'get'"
    )
    parser_config.add_argument("valor", nargs="?", help="Valor da variável para 'set'")
    parser_config.add_argument("--url", help="Atalho para alterar SERVER_URL")
    parser_config.add_argument("--token", help="Atalho para alterar AGENT_TOKEN")
    parser_config.add_argument("--watch-dir", help="Atalho para alterar WATCH_DIR")
    parser_config.add_argument("--name", help="Atalho para alterar INSTANCE_NAME")

    parser_test = subparsers.add_parser(
        "test", help="Testa conectividade e resposta do servidor"
    )
    parser_test.add_argument(
        "--url", help="URL alternativa para testar antes de salvar no .env"
    )
    parser_test.add_argument("--token", help="Token alternativo para teste")

    parser_send = subparsers.add_parser(
        "send", help="Envia manualmente um print ou imagem para validação da API"
    )
    parser_send.add_argument("arquivo", help="Caminho do arquivo de imagem a enviar")
    parser_send.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Força envio mesmo se o hash já foi enviado",
    )
    parser_send.add_argument("--url", help="URL alternativa de destino para o teste")

    parser_reset = subparsers.add_parser(
        "reset", help="Limpa o histórico de arquivos enviados ou estatísticas locais"
    )
    parser_reset.add_argument(
        "--hashes",
        action="store_true",
        help="Limpa apenas o histórico de hashes enviados",
    )
    parser_reset.add_argument(
        "--stats", action="store_true", help="Zera apenas as estatísticas acumuladas"
    )
    parser_reset.add_argument(
        "--all",
        action="store_true",
        help="Limpa tanto os hashes quanto as estatísticas",
    )

    parser_install = subparsers.add_parser(
        "install", help="Configura e instala o agente (detecta WSL/Windows e Linux)"
    )
    parser_install.add_argument(
        "--watch-dir", help="Pasta a monitorar (no WSL pode ser C:\\... ou /mnt/c/...)"
    )
    parser_install.add_argument("--token", help="Token do agente (AGENT_TOKEN)")
    parser_install.add_argument("--url", help="URL do servidor (SERVER_URL)")
    parser_install.add_argument(
        "--no-service",
        action="store_true",
        help="Não registrar serviço systemd de segundo plano",
    )

    args = parser.parse_args()

    if args.comando == "status":
        exibir_status(modo_watch=args.watch)
    elif args.comando == "url":
        executar_comando_url(args)
    elif args.comando == "env":
        executar_comando_env(args)
    elif args.comando == "config":
        executar_comando_config(args)
    elif args.comando == "test":
        executar_comando_test(args)
    elif args.comando == "send":
        executar_comando_send(args)
    elif args.comando == "reset":
        executar_comando_reset(args)
    elif args.comando == "install":
        executar_comando_install(args)
    else:
        executar_daemon(args)

if __name__ == "__main__":
    main()
