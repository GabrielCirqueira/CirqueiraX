import os
import shutil
import socket
from pathlib import Path
from dotenv import load_dotenv

DIRETORIO_RAIZ = Path(__file__).resolve().parent.parent

candidatos_env = [
    DIRETORIO_RAIZ / ".env",
    DIRETORIO_RAIZ / "env" / ".env",
]
if Path.cwd() == DIRETORIO_RAIZ or DIRETORIO_RAIZ in Path.cwd().parents:
    candidatos_env.append(Path.cwd() / ".env")

_env_ativo: Path | None = None
for candidato in candidatos_env:
    if candidato.exists() and candidato.is_file():
        _env_ativo = candidato
        load_dotenv(dotenv_path=candidato)
        break
else:
    _env_ativo = DIRETORIO_RAIZ / ".env"
    load_dotenv(dotenv_path=_env_ativo)

def obter_caminho_env() -> Path:
    """Retorna o caminho do arquivo .env ativo ou o caminho padrão onde será criado."""
    if _env_ativo and _env_ativo.exists():
        return _env_ativo
    return DIRETORIO_RAIZ / ".env"

def normalizar_url_ingestao(url: str) -> str:
    """
    Normaliza a URL informada pelo usuário, garantindo esquema HTTP/HTTPS
    e o endpoint final '/api/v1/ingestao/print'.
    """
    url_limpa = url.strip()
    if not url_limpa:
        return ""

    if not url_limpa.startswith(("http://", "https://")):
        if "localhost" in url_limpa or "127.0.0.1" in url_limpa:
            url_limpa = f"http://{url_limpa}"
        else:
            url_limpa = f"https://{url_limpa}"

    url_limpa = url_limpa.rstrip("/")

    if not url_limpa.endswith("/api/v1/ingestao/print"):
        if url_limpa.endswith("/api/v1"):
            url_limpa = f"{url_limpa}/ingestao/print"
        elif url_limpa.endswith("/ingestao/print"):
            pass
        else:
            url_limpa = f"{url_limpa}/api/v1/ingestao/print"

    return url_limpa

def identificar_ambiente(url: str | None = None) -> str:
    """Identifica o tipo de ambiente a partir da URL informada ou configurada."""
    alvo = (url or SERVER_URL).lower()
    if "localhost" in alvo or "127.0.0.1" in alvo or "::1" in alvo:
        return "Local / Desenvolvimento"
    if any(
        prefixo in alvo for prefixo in ("192.168.", "10.", "172.16.", ".local", ".test")
    ):
        return "Rede Local / Homologação"
    return "Produção / Remoto"

def esta_no_wsl() -> bool:
    """Verifica se o processo está em execução dentro do ambiente WSL (Windows Subsystem for Linux)."""
    if os.path.exists("/proc/sys/fs/binfmt_misc/WSLInterop"):
        return True
    try:
        with open("/proc/version", "r", encoding="utf-8") as f:
            if "microsoft" in f.read().lower():
                return True
    except Exception:
        pass
    return "WSL_DISTRO_NAME" in os.environ

def converter_caminho_windows_para_wsl(caminho: str) -> str:
    """
    Converte caminhos copiados do Windows (ex: C:\\Users\\... ou C:/Users/...)
    para a notação do WSL (/mnt/c/Users/...).
    """
    if not caminho:
        return caminho
    caminho_limpo = caminho.strip().strip('"').strip("'")
    if (
        len(caminho_limpo) >= 2
        and caminho_limpo[1] == ":"
        and caminho_limpo[0].isalpha()
    ):
        letra = caminho_limpo[0].lower()
        resto = caminho_limpo[2:].replace("\\", "/").lstrip("/")
        return f"/mnt/{letra}/{resto}"
    return caminho_limpo

def detectar_pastas_screenshots_candidatas() -> list[dict]:
    """
    Busca automaticamente diretórios candidatos onde capturas de tela costumam ser salvas.
    No WSL, busca nas pastas de usuários do Windows em /mnt/c/Users/.
    """
    candidatos = []
    vistos = set()

    def adicionar(p: Path, rotulo: str):
        try:
            c_str = str(p.expanduser().resolve())
            if c_str not in vistos and p.exists() and p.is_dir():
                vistos.add(c_str)
                candidatos.append(
                    {
                        "caminho": c_str,
                        "rotulo": rotulo,
                        "existe": True,
                        "origem_windows": c_str.startswith("/mnt/"),
                    }
                )
        except Exception:
            pass

    if esta_no_wsl():
        base_users = Path("/mnt/c/Users")
        if base_users.exists():
            ignorar = {
                "default",
                "public",
                "all users",
                "default user",
                "todos os usuários",
                "usuário padrão",
            }
            try:
                for user_dir in base_users.iterdir():
                    if user_dir.is_dir() and user_dir.name.lower() not in ignorar:
                        adicionar(
                            user_dir / "Pictures" / "Screenshots",
                            f"Windows ({user_dir.name}) — Screenshots",
                        )
                        adicionar(
                            user_dir / "Pictures" / "Capturas de tela",
                            f"Windows ({user_dir.name}) — Capturas de tela",
                        )
                        adicionar(
                            user_dir / "OneDrive" / "Pictures" / "Screenshots",
                            f"Windows ({user_dir.name}) — OneDrive Screenshots",
                        )
                        adicionar(
                            user_dir / "OneDrive" / "Imagens" / "Capturas de tela",
                            f"Windows ({user_dir.name}) — OneDrive Capturas",
                        )
                        adicionar(
                            user_dir / "Pictures",
                            f"Windows ({user_dir.name}) — Pictures",
                        )
                        adicionar(
                            user_dir / "Imagens", f"Windows ({user_dir.name}) — Imagens"
                        )
            except Exception:
                pass

    home = Path.home()
    adicionar(
        home / "Pictures" / "Screenshots", "Linux Padrão (~/Pictures/Screenshots)"
    )
    adicionar(
        home / "Imagens" / "Capturas de tela",
        "Linux Padrão (~/Imagens/Capturas de tela)",
    )
    adicionar(home / "Pictures", "Linux (~/Pictures)")
    adicionar(home / "Imagens", "Linux (~/Imagens)")

    return candidatos

def recarregar_configuracao():
    """Recarrega as variáveis de ambiente e recalcula as variáveis globais do módulo."""
    global SERVER_URL, AGENT_TOKEN, WATCH_DIR, DEBOUNCE_SECONDS
    global STATE_FILE, LOG_LEVEL, INSTANCE_NAME, STATS_FILE, RUNTIME_FILE
    global USE_POLLING, POLLING_INTERVAL, IS_WSL

    caminho = obter_caminho_env()
    if caminho.exists():
        load_dotenv(dotenv_path=caminho, override=True)

    IS_WSL = esta_no_wsl()

    SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8080/api/v1/ingestao/print")
    AGENT_TOKEN = os.getenv("AGENT_TOKEN", "")

    watch_raw = os.getenv("WATCH_DIR", "~/Pictures/Screenshots")
    if IS_WSL:
        watch_raw = converter_caminho_windows_para_wsl(watch_raw)
    WATCH_DIR = str(Path(watch_raw).expanduser().resolve())

    DEBOUNCE_SECONDS = float(os.getenv("DEBOUNCE_SECONDS", "3.0"))
    STATE_FILE = str(
        Path(os.getenv("STATE_FILE", "~/.cirqueirax_enviados.json"))
        .expanduser()
        .resolve()
    )
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    INSTANCE_NAME = os.getenv(
        "INSTANCE_NAME", os.getenv("NOME_AGENTE", socket.gethostname())
    )

    polling_env = os.getenv("USE_POLLING")
    if polling_env is not None:
        USE_POLLING = polling_env.lower() in ("true", "1", "yes", "on", "sim")
    else:
        USE_POLLING = WATCH_DIR.startswith("/mnt/")

    POLLING_INTERVAL = float(os.getenv("POLLING_INTERVAL", "1.5"))

    state_path = Path(STATE_FILE)
    nome_stats = (
        state_path.stem.replace("enviados", "stats")
        if "enviados" in state_path.stem
        else f"{state_path.stem}_stats"
    )
    nome_runtime = (
        state_path.stem.replace("enviados", "runtime")
        if "enviados" in state_path.stem
        else f"{state_path.stem}_runtime"
    )

    STATS_FILE = str(
        Path(os.getenv("STATS_FILE", str(state_path.with_name(f"{nome_stats}.json"))))
        .expanduser()
        .resolve()
    )
    RUNTIME_FILE = str(
        Path(
            os.getenv("RUNTIME_FILE", str(state_path.with_name(f"{nome_runtime}.json")))
        )
        .expanduser()
        .resolve()
    )

def gravar_variavel_env(chave: str, valor: str) -> tuple[bool, Path, str]:
    """
    Grava ou atualiza uma variável de ambiente no arquivo .env.
    Cria o arquivo caso ainda não exista, utilizando .env.example como modelo se disponível.
    """
    caminho_env = obter_caminho_env()

    if not caminho_env.exists():
        caminho_env.parent.mkdir(parents=True, exist_ok=True)
        template = DIRETORIO_RAIZ / ".env.example"
        if not template.exists():
            template = DIRETORIO_RAIZ / "env" / ".env.example"
        if template.exists():
            shutil.copy2(template, caminho_env)
        else:
            with open(caminho_env, "w", encoding="utf-8") as f:
                f.write("# Configurações do Agente CirqueiraX\n")

    linhas: list[str] = []
    chave_encontrada = False
    with open(caminho_env, "r", encoding="utf-8") as f:
        linhas = f.readlines()

    novas_linhas: list[str] = []
    for linha in linhas:
        stripped = linha.strip()
        if (
            stripped.startswith(f"{chave}=")
            or stripped.startswith(f"#{chave}=")
            or stripped.startswith(f"# {chave}=")
        ):
            novas_linhas.append(f"{chave}={valor}\n")
            chave_encontrada = True
        else:
            novas_linhas.append(linha)

    if not chave_encontrada:
        if novas_linhas and not novas_linhas[-1].endswith("\n"):
            novas_linhas[-1] = novas_linhas[-1] + "\n"
        novas_linhas.append(f"{chave}={valor}\n")

    with open(caminho_env, "w", encoding="utf-8") as f:
        f.writelines(novas_linhas)

    os.environ[chave] = valor
    recarregar_configuracao()
    return True, caminho_env, f"Variável {chave} definida com sucesso."

def gravar_multiplas_variaveis_env(dicionario: dict[str, str]) -> tuple[bool, Path]:
    """Grava múltiplas variáveis de ambiente no .env de uma vez só."""
    for k, v in dicionario.items():
        gravar_variavel_env(k, v)
    return True, obter_caminho_env()

def obter_todas_configs() -> dict:
    """Retorna um resumo de todas as variáveis configuradas com status de validação."""
    caminho_env = obter_caminho_env()
    return {
        "env_path": str(caminho_env),
        "env_existe": caminho_env.exists(),
        "SERVER_URL": SERVER_URL,
        "ambiente": identificar_ambiente(SERVER_URL),
        "AGENT_TOKEN": AGENT_TOKEN,
        "token_configurado": bool(AGENT_TOKEN and AGENT_TOKEN != "seu_token_aqui"),
        "WATCH_DIR": WATCH_DIR,
        "watch_dir_existe": Path(WATCH_DIR).exists(),
        "is_wsl": IS_WSL,
        "is_windows_mount": WATCH_DIR.startswith("/mnt/"),
        "use_polling": USE_POLLING,
        "polling_interval": POLLING_INTERVAL,
        "DEBOUNCE_SECONDS": DEBOUNCE_SECONDS,
        "STATE_FILE": STATE_FILE,
        "LOG_LEVEL": LOG_LEVEL,
        "INSTANCE_NAME": INSTANCE_NAME,
        "STATS_FILE": STATS_FILE,
        "RUNTIME_FILE": RUNTIME_FILE,
    }

recarregar_configuracao()
