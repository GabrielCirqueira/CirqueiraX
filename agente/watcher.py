import logging
from pathlib import Path
import time
from threading import Thread
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

import config
from cliente import enviar_print, EXTENSOES_PERMITIDAS

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
        Thread(target=self._estabilizar_e_enviar, args=(caminho,), daemon=True).start()

    def _estabilizar_e_enviar(self, caminho: Path):
        logging.info(f"Detectado novo arquivo de print: {caminho.name}. Aguardando estabilização ({config.DEBOUNCE_SECONDS}s)...")
        if self._aguardar_estabilizacao(caminho):
            self.callback_envio(caminho)

    def _aguardar_estabilizacao(self, caminho: Path) -> bool:
        tempo_inicio = time.time()
        ultimo_tamanho = -1

        while time.time() - tempo_inicio < 60:
            if not caminho.exists():
                logging.warning(f"Arquivo removido durante estabilização: {caminho.name}")
                return False

            try:
                tamanho_atual = caminho.stat().st_size
                if tamanho_atual > 0 and tamanho_atual == ultimo_tamanho:
                    time.sleep(config.DEBOUNCE_SECONDS)
                    if caminho.exists() and caminho.stat().st_size == tamanho_atual:
                        logging.debug(f"Arquivo estabilizado: {caminho.name} ({tamanho_atual} bytes)")
                        return True
                ultimo_tamanho = tamanho_atual
            except OSError:
                pass

            time.sleep(1.0)

        logging.error(f"Timeout ao aguardar estabilização do arquivo: {caminho.name}")
        return False

def iniciar_watcher(callback_envio=enviar_print):
    pasta = Path(config.WATCH_DIR)
    handler = ScreenshotEventHandler(callback_envio=callback_envio)
    observer = Observer()
    observer.schedule(handler, str(pasta), recursive=False)
    observer.start()
    logging.info(f"Watcher ativo e monitorando a pasta: {pasta}")
    return observer
