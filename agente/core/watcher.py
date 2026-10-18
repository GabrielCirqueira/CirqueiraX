import logging
from pathlib import Path
import time
from threading import Lock, Thread
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

try:
    from . import config
    from .cliente import EXTENSOES_PERMITIDAS, enviar_print
    from .estado import ja_enviado
except ImportError:
    from core import config
    from core.cliente import EXTENSOES_PERMITIDAS, enviar_print
    from core.estado import ja_enviado

_em_andamento: set[str] = set()
_lock_andamento = Lock()


class ScreenshotEventHandler(FileSystemEventHandler):
    def __init__(self, callback_envio=enviar_print):
        super().__init__()
        self.callback_envio = callback_envio

    def on_created(self, event):
        if event.is_directory:
            return
        self._processar_evento(Path(event.src_path))

    def on_modified(self, event):
        if event.is_directory:
            return
        self._processar_evento(Path(event.src_path))

    def _processar_evento(self, caminho: Path):
        if caminho.suffix.lower() not in EXTENSOES_PERMITIDAS:
            return
        chave = str(caminho)
        with _lock_andamento:
            if chave in _em_andamento:
                return
            _em_andamento.add(chave)
        Thread(target=self._estabilizar_e_enviar, args=(caminho, chave), daemon=True).start()

    def _estabilizar_e_enviar(self, caminho: Path, chave: str):
        try:
            logging.info(
                f"Detectado novo arquivo de print: {caminho.name}. Aguardando estabilização ({config.DEBOUNCE_SECONDS}s)..."
            )
            if self._aguardar_estabilizacao(caminho):
                self.callback_envio(caminho)
        finally:
            with _lock_andamento:
                _em_andamento.discard(chave)

    def _aguardar_estabilizacao(self, caminho: Path) -> bool:
        tempo_inicio = time.time()
        ultimo_tamanho = -1

        while time.time() - tempo_inicio < 60:
            if not caminho.exists():
                logging.warning(
                    f"Arquivo removido durante estabilização: {caminho.name}"
                )
                return False

            try:
                tamanho_atual = caminho.stat().st_size
                if tamanho_atual > 0 and tamanho_atual == ultimo_tamanho:
                    time.sleep(config.DEBOUNCE_SECONDS)
                    if caminho.exists() and caminho.stat().st_size == tamanho_atual:
                        logging.debug(
                            f"Arquivo estabilizado: {caminho.name} ({tamanho_atual} bytes)"
                        )
                        return True
                ultimo_tamanho = tamanho_atual
            except OSError:
                pass

            time.sleep(1.0)

        logging.error(f"Timeout ao aguardar estabilização do arquivo: {caminho.name}")
        return False

def deve_usar_polling(pasta: Path) -> bool:
    """Verifica se deve utilizar PollingObserver em vez do InotifyObserver padrão."""
    if getattr(config, "USE_POLLING", False):
        return True
    caminho_str = str(pasta.resolve())
    return caminho_str.startswith("/mnt/")

def _enviar_pendentes(arquivos: list[Path], callback_envio) -> None:
    for caminho in arquivos:
        try:
            callback_envio(caminho)
        except Exception as exc:
            logging.error(f"Falha ao reenviar print pendente [{caminho.name}]: {exc}")


def varrer_pendentes(callback_envio=enviar_print) -> None:
    """Envia prints que surgiram enquanto o agente estava parado."""
    pasta = Path(config.WATCH_DIR)
    if not pasta.is_dir():
        return

    pendentes = sorted(
        (
            caminho
            for caminho in pasta.iterdir()
            if caminho.is_file()
            and caminho.suffix.lower() in EXTENSOES_PERMITIDAS
            and not ja_enviado(caminho)
        ),
        key=lambda caminho: caminho.stat().st_mtime,
    )
    if not pendentes:
        logging.info("Varredura inicial: nenhum print pendente.")
        return

    logging.info(f"Varredura inicial: {len(pendentes)} print(s) pendente(s).")
    Thread(
        target=_enviar_pendentes, args=(pendentes, callback_envio), daemon=True
    ).start()


def iniciar_watcher(callback_envio=enviar_print):
    pasta = Path(config.WATCH_DIR)
    handler = ScreenshotEventHandler(callback_envio=callback_envio)

    if deve_usar_polling(pasta):
        try:
            from watchdog.observers.polling import PollingObserver

            intervalo = getattr(config, "POLLING_INTERVAL", 1.5)
            observer = PollingObserver(timeout=intervalo)
            logging.info(
                f"Modo PollingObserver ATIVADO (intervalo: {intervalo}s) — "
                "compatível com WSL DrvFs e pastas montadas do Windows."
            )
        except ImportError:
            logging.warning(
                "PollingObserver não disponível; utilizando Observer padrão."
            )
            observer = Observer()
    else:
        observer = Observer()
        logging.info("Modo InotifyObserver padrão do sistema ativado.")

    observer.schedule(handler, str(pasta), recursive=False)
    observer.start()
    logging.info(f"Watcher ativo e monitorando a pasta: {pasta}")
    varrer_pendentes(callback_envio)
    return observer
