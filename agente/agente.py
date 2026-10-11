import argparse
import logging
import sys
import time
from pathlib import Path

# Garante que o diretório raiz do agente está no sys.path para importações do pacote core
DIRETORIO_RAIZ = Path(__file__).resolve().parent
if str(DIRETORIO_RAIZ) not in sys.path:
    sys.path.insert(0, str(DIRETORIO_RAIZ))

from core import config
from core.estado import (
    atualizar_heartbeat,
    registrar_encerramento_processo,
    registrar_inicio_processo,
)

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s",
)


def validar_configuracao():
    if not config.AGENT_TOKEN:
        logging.error("ERRO: AGENT_TOKEN não configurado no arquivo .env")
        logging.error("Gere um token no backend via: make agente-token ARGS=\"nome origem\"")
        sys.exit(1)

    pasta = Path(config.WATCH_DIR)
    if not pasta.exists():
        logging.info(f"Criando diretório monitorado: {pasta}")
        pasta.mkdir(parents=True, exist_ok=True)

    logging.info("Agente CirqueiraX iniciado com sucesso!")
    logging.info(f"Perfil / Máquina: {config.INSTANCE_NAME}")
    logging.info(f"Servidor: {config.SERVER_URL}")
    logging.info(f"Pasta monitorada: {config.WATCH_DIR}")


def executar_daemon():
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


def executar_teste_conexao():
    from core.cliente import testar_conexao_servidor

    print(f"Testando conectividade com o servidor: {config.SERVER_URL}...")
    sucesso, codigo, detalhe = testar_conexao_servidor()
    if sucesso:
        print(f"✔ Sucesso! Servidor online e respondendo (Código HTTP {codigo})")
    else:
        print(f"✖ Falha de conexão: {detalhe}")
        print("Verifique se o backend está em execução e acessível.")


def main():
    parser = argparse.ArgumentParser(
        description="Agente CirqueiraX — Captura e Ingestão Automática de Prints",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="comando", help="Comandos disponíveis:")

    # Comando 'start' (ou execução padrão sem argumentos)
    subparsers.add_parser("start", help="Inicia o agente e o monitoramento da pasta")

    # Comando 'status'
    parser_status = subparsers.add_parser("status", help="Exibe o painel de status e métricas")
    parser_status.add_argument(
        "-w",
        "--watch",
        action="store_true",
        help="Atualiza continuamente o status em tempo real (modo live monitor)",
    )

    # Comando 'test'
    subparsers.add_parser("test", help="Testa a conectividade com o servidor CirqueiraX")

    args = parser.parse_args()

    if args.comando == "status":
        from core.status import exibir_status

        exibir_status(modo_watch=args.watch)
    elif args.comando == "test":
        executar_teste_conexao()
    else:
        executar_daemon()


if __name__ == "__main__":
    main()
