import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    from . import config
    from .cliente import testar_conexao_servidor
    from .estado import obter_estatisticas, obter_status_processo
except ImportError:
    from core import config
    from core.cliente import testar_conexao_servidor
    from core.estado import obter_estatisticas, obter_status_processo

if sys.platform == "win32":
    try:
        os.system("")
    except Exception:
        pass

class Cores:
    VERDE = "\033[92m"
    VERMELHO = "\033[91m"
    AMARELO = "\033[93m"
    AZUL = "\033[94m"
    CIANO = "\033[96m"
    CINZA = "\033[90m"
    BRANCO_NEGRITO = "\033[1;97m"
    NEGRITO = "\033[1m"
    RESET = "\033[0m"

def formatar_bytes(tamanho_bytes: int) -> str:
    if tamanho_bytes <= 0:
        return "0 B"
    unidades = ["B", "KB", "MB", "GB", "TB"]
    tamanho = float(tamanho_bytes)
    idx = 0
    while tamanho >= 1024.0 and idx < len(unidades) - 1:
        tamanho /= 1024.0
        idx += 1
    return f"{tamanho:.1f} {unidades[idx]}" if idx > 0 else f"{int(tamanho)} B"

def formatar_tempo_relativo(timestamp_iso: str | None) -> str:
    if not timestamp_iso:
        return "Nunca"
    try:
        dt = datetime.fromisoformat(timestamp_iso)
        agora = datetime.now(timezone.utc)
        delta = max(0, int((agora - dt).total_seconds()))

        if delta < 60:
            relativo = f"há {delta}s"
        elif delta < 3600:
            relativo = f"há {delta // 60}m"
        elif delta < 86400:
            relativo = f"há {delta // 3600}h"
        else:
            relativo = f"há {delta // 86400}d"

        local_dt = dt.astimezone()
        return f"{local_dt.strftime('%H:%M:%S')} ({relativo})"
    except Exception:
        return timestamp_iso or "Desconhecido"

def formatar_duracao(segundos: float) -> str:
    total = int(segundos)
    dias = total // 86400
    horas = (total % 86400) // 3600
    minutos = (total % 3600) // 60
    segs = total % 60

    partes = []
    if dias > 0:
        partes.append(f"{dias}d")
    if horas > 0:
        partes.append(f"{horas}h")
    if minutos > 0:
        partes.append(f"{minutos}m")
    if segs > 0 or not partes:
        partes.append(f"{segs}s")
    return " ".join(partes)

def mascarar_token(token: str) -> str:
    if not token:
        return f"{Cores.VERMELHO}Não configurado{Cores.RESET}"
    if len(token) <= 12:
        return f"{token[:4]}...{token[-2:]}"
    return f"{token[:8]}...{token[-4:]}"

def obter_painel_status(testar_rede: bool = True) -> str:
    status_proc = obter_status_processo()
    stats = obter_estatisticas()

    ativo = status_proc.get("ativo", False)
    pid = status_proc.get("pid")
    uptime = status_proc.get("uptime_segundos", 0.0)
    motivo_inativo = status_proc.get("motivo", "")

    hoje_chave = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    diario = stats.get("diario", {}).get(
        hoje_chave, {"enviados": 0, "bytes": 0, "falhas": 0}
    )
    enviados_hoje = diario.get("enviados", 0)
    bytes_hoje = diario.get("bytes", 0)
    falhas_hoje = diario.get("falhas", 0)

    total_enviados = stats.get("total_enviados", 0)
    total_bytes = stats.get("total_bytes", 0)
    total_falhas = stats.get("total_falhas", 0)

    total_tentativas_hoje = enviados_hoje + falhas_hoje
    taxa_sucesso_hoje = (
        (enviados_hoje / total_tentativas_hoje * 100.0)
        if total_tentativas_hoje > 0
        else 100.0
    )

    pasta_obj = Path(config.WATCH_DIR)
    pasta_existe = pasta_obj.exists() and pasta_obj.is_dir()

    status_conexao = ""
    if testar_rede:
        online, codigo, detalhe = testar_conexao_servidor()
        if online:
            status_conexao = f"{Cores.VERDE}● Online (HTTP {codigo}){Cores.RESET}"
        else:
            resumo_erro = (
                "Conexão recusada"
                if "Connection refused" in detalhe
                else ("Timeout" if "timed out" in detalhe.lower() else detalhe[:40])
            )
            status_conexao = (
                f"{Cores.VERMELHO}▲ Inacessível ({resumo_erro}){Cores.RESET}"
            )

    linhas = []

    if ativo:
        simbolo = f"{Cores.VERDE}●{Cores.RESET}"
        rotulo_status = f"{Cores.VERDE}{Cores.NEGRITO}Ativo (em execução){Cores.RESET}"
        detalhes_status = f"(PID {pid}, rodando há {formatar_duracao(uptime)})"
    else:
        simbolo = f"{Cores.VERMELHO}○{Cores.RESET}"
        rotulo_status = f"{Cores.VERMELHO}{Cores.NEGRITO}Inativo (parado){Cores.RESET}"
        detalhes_status = f"({motivo_inativo})" if motivo_inativo else ""

    status_pasta = (
        f"[{Cores.VERDE}OK{Cores.RESET}]"
        if pasta_existe
        else f"[{Cores.VERMELHO}Não encontrada{Cores.RESET}]"
    )

    linhas.append(
        f"{simbolo} {Cores.BRANCO_NEGRITO}CirqueiraX Agente — Ingestão de Prints{Cores.RESET}"
    )
    linhas.append(f"{Cores.CINZA}{'─' * 62}{Cores.RESET}")
    linhas.append(
        f"  {Cores.NEGRITO}Status:{Cores.RESET}            {rotulo_status} {Cores.CINZA}{detalhes_status}{Cores.RESET}"
    )
    linhas.append(
        f"  {Cores.NEGRITO}Perfil/Máquina:{Cores.RESET}    {Cores.CIANO}{config.INSTANCE_NAME}{Cores.RESET}"
    )
    if getattr(config, "IS_WSL", False):
        origem = (
            "Montagem Windows DrvFs"
            if config.WATCH_DIR.startswith("/mnt/")
            else "WSL Local"
        )
        linhas.append(
            f"  {Cores.NEGRITO}Ambiente SO:{Cores.RESET}       {Cores.VERDE}WSL2 (Linux){Cores.RESET} ──► {Cores.CINZA}{origem}{Cores.RESET}"
        )
    modo_obs = (
        f"PollingObserver ({getattr(config, 'POLLING_INTERVAL', 1.5)}s)"
        if getattr(config, "USE_POLLING", False)
        else "InotifyObserver (nativo)"
    )
    linhas.append(
        f"  {Cores.NEGRITO}Pasta Vigiada:{Cores.RESET}     {config.WATCH_DIR} {status_pasta}"
    )
    linhas.append(
        f"  {Cores.NEGRITO}Modo Observer:{Cores.RESET}     {Cores.CIANO}{modo_obs}{Cores.RESET}"
    )
    linhas.append(
        f"  {Cores.NEGRITO}Servidor:{Cores.RESET}          {config.SERVER_URL}"
    )
    if status_conexao:
        linhas.append(
            f"  {Cores.NEGRITO}Conexão API:{Cores.RESET}       {status_conexao}"
        )
    linhas.append(
        f"  {Cores.NEGRITO}Token de Acesso:{Cores.RESET}   {mascarar_token(config.AGENT_TOKEN)}"
    )

    linhas.append("")
    linhas.append(
        f"  {Cores.BRANCO_NEGRITO}Estatísticas de Hoje ({datetime.now().strftime('%d/%m/%Y')}):{Cores.RESET}"
    )
    linhas.append(
        f"  ├─ Enviados hoje:       {Cores.VERDE}{Cores.NEGRITO}{enviados_hoje}{Cores.RESET} prints ({formatar_bytes(bytes_hoje)})"
    )
    linhas.append(
        f"  ├─ Falhas hoje:         {Cores.VERMELHO if falhas_hoje > 0 else Cores.CINZA}{falhas_hoje}{Cores.RESET}"
    )
    linhas.append(
        f"  └─ Taxa de sucesso:     {Cores.VERDE if taxa_sucesso_hoje >= 95 else Cores.AMARELO}{taxa_sucesso_hoje:.1f}%{Cores.RESET}"
    )

    linhas.append("")
    linhas.append(
        f"  {Cores.BRANCO_NEGRITO}Métricas Acumuladas (Histórico Geral):{Cores.RESET}"
    )
    linhas.append(
        f"  ├─ Total de envios:     {Cores.CIANO}{total_enviados}{Cores.RESET} arquivos ({formatar_bytes(total_bytes)})"
    )
    linhas.append(
        f"  └─ Total de falhas:     {Cores.VERMELHO if total_falhas > 0 else Cores.CINZA}{total_falhas}{Cores.RESET}"
    )

    ultimo_sucesso = stats.get("ultimo_sucesso")
    linhas.append("")
    linhas.append(f"  {Cores.BRANCO_NEGRITO}Último Envio Concluído:{Cores.RESET}")
    if ultimo_sucesso:
        linhas.append(
            f"  └─ {Cores.VERDE}✔{Cores.RESET} {ultimo_sucesso.get('arquivo')} "
            f"({formatar_bytes(ultimo_sucesso.get('tamanho', 0))}) — {formatar_tempo_relativo(ultimo_sucesso.get('timestamp'))}"
        )
    else:
        linhas.append(
            f"  └─ {Cores.CINZA}Nenhum envio registrado até o momento{Cores.RESET}"
        )

    ultima_falha = stats.get("ultima_falha")
    if ultima_falha:
        linhas.append("")
        linhas.append(
            f"  {Cores.VERMELHO}{Cores.NEGRITO}Última Falha Registrada:{Cores.RESET}"
        )
        linhas.append(
            f"  └─ {Cores.VERMELHO}✖{Cores.RESET} {ultima_falha.get('arquivo')} — "
            f"{formatar_tempo_relativo(ultima_falha.get('timestamp'))}\n"
            f"     {Cores.CINZA}Motivo: {ultima_falha.get('motivo')}{Cores.RESET}"
        )

    historico = stats.get("historico_recente", [])
    if historico:
        linhas.append("")
        linhas.append(
            f"  {Cores.BRANCO_NEGRITO}Atividades Recentes (Últimos Eventos):{Cores.RESET}"
        )
        for ev in historico[:6]:
            tipo = ev.get("tipo", "sucesso")
            arq = ev.get("arquivo", "desconhecido")
            tam = formatar_bytes(ev.get("tamanho", 0))
            ts = formatar_tempo_relativo(ev.get("timestamp"))
            if tipo == "sucesso":
                linhas.append(
                    f"  • {Cores.VERDE}✔ Sucesso{Cores.RESET}: {arq} ({tam}) — {Cores.CINZA}{ts}{Cores.RESET}"
                )
            else:
                linhas.append(
                    f"  • {Cores.VERMELHO}✖ Falha{Cores.RESET}:   {arq} — {Cores.CINZA}{ts}{Cores.RESET}"
                )

    linhas.append(f"{Cores.CINZA}{'─' * 62}{Cores.RESET}")
    return "\n".join(linhas)

def exibir_status(modo_watch: bool = False, intervalo: float = 2.0) -> None:
    if not modo_watch:
        print(obter_painel_status(testar_rede=True))
        return

    try:
        while True:
            if sys.platform == "win32":
                os.system("cls")
            else:
                sys.stdout.write("\033[H\033[J")
                sys.stdout.flush()

            painel = obter_painel_status(testar_rede=False)
            print(painel)
            print(
                f" {Cores.CINZA}[Atualizando a cada {intervalo:.0f}s — Pressione Ctrl+C para sair]{Cores.RESET}"
            )
            time.sleep(intervalo)
    except KeyboardInterrupt:
        print(f"\n{Cores.CINZA}Monitoramento encerrado.{Cores.RESET}")

if __name__ == "__main__":
    is_watch = "--watch" in sys.argv or "-w" in sys.argv
    exibir_status(modo_watch=is_watch)
