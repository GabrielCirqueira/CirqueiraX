import argparse
import os
import sys
import time
from pathlib import Path

try:
    from . import config
    from .cliente import enviar_print_manual, testar_conexao_servidor
    from .estado import (
        calcular_hash,
        limpar_estatisticas,
        limpar_historico_enviados,
        limpar_tudo,
    )
except ImportError:
    from core import config
    from core.cliente import enviar_print_manual, testar_conexao_servidor
    from core.estado import (
        calcular_hash,
        limpar_estatisticas,
        limpar_historico_enviados,
        limpar_tudo,
    )

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

def mascarar_token(token: str) -> str:
    if not token or token == "seu_token_aqui":
        return f"{Cores.AMARELO}Não configurado{Cores.RESET}"
    if len(token) <= 12:
        return f"{token[:3]}***{token[-2:]}"
    return f"{token[:8]}...{token[-4:]}"

def executar_comando_url(args: argparse.Namespace) -> None:
    """Gerencia a URL do servidor: exibe ou atualiza e testa no .env."""
    nova_url = getattr(args, "nova_url", None)

    if not nova_url:
        url_atual = config.SERVER_URL
        ambiente = config.identificar_ambiente(url_atual)
        caminho_env = config.obter_caminho_env()

        print(f"\n{Cores.BRANCO_NEGRITO}● Configuração de URL do Servidor{Cores.RESET}")
        print(
            f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
        )
        print(
            f"  {Cores.NEGRITO}URL Atual:{Cores.RESET}       {Cores.CIANO}{url_atual}{Cores.RESET}"
        )
        print(
            f"  {Cores.NEGRITO}Ambiente:{Cores.RESET}        {Cores.VERDE}{ambiente}{Cores.RESET}"
        )
        print(
            f"  {Cores.NEGRITO}Arquivo .env:{Cores.RESET}    {Cores.CINZA}{caminho_env}{Cores.RESET}"
        )

        if not getattr(args, "no_test", False):
            print(f"\n  Testando conectividade...")
            sucesso, codigo, detalhe = testar_conexao_servidor()
            if sucesso:
                print(
                    f"  {Cores.VERDE}✔ Servidor online e respondendo (Código HTTP {codigo}){Cores.RESET}"
                )
            else:
                print(
                    f"  {Cores.VERMELHO}✖ Servidor inacessível: {detalhe}{Cores.RESET}"
                )
        print(
            f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
        )
        print(
            f"{Cores.CINZA}Dica: Para alterar, use: python3 agente.py url <NOVA_URL>{Cores.RESET}\n"
        )
        return

    url_normalizada = config.normalizar_url_ingestao(nova_url)
    ambiente = config.identificar_ambiente(url_normalizada)

    sucesso, caminho_env, _ = config.gravar_variavel_env("SERVER_URL", url_normalizada)

    print(f"\n{Cores.VERDE}✔ URL do servidor configurada com sucesso!{Cores.RESET}")
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Nova URL:{Cores.RESET}        {Cores.CIANO}{url_normalizada}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Ambiente:{Cores.RESET}        {Cores.VERDE}{ambiente}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Salvo em:{Cores.RESET}        {Cores.CINZA}{caminho_env}{Cores.RESET}"
    )

    if not getattr(args, "no_test", False):
        print(f"\n  Verificando conexão com o novo endpoint...")
        ok, codigo, detalhe = testar_conexao_servidor(url_custom=url_normalizada)
        if ok:
            print(
                f"  {Cores.VERDE}✔ Conexão confirmada com sucesso (Código HTTP {codigo}){Cores.RESET}"
            )
        else:
            print(
                f"  {Cores.AMARELO}▲ Aviso: O servidor ainda não está respondendo ({detalhe}){Cores.RESET}"
            )
            print(
                f"  {Cores.CINZA}Certifique-se de que o backend está iniciado nessa URL.{Cores.RESET}"
            )
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}\n"
    )

def executar_comando_env(args: argparse.Namespace) -> None:
    """Alternador rápido de ambientes pré-definidos (local, prod, vps, custom)."""
    tipo = getattr(args, "tipo", None)
    alvo = getattr(args, "alvo", None)

    if not tipo or tipo == "show":
        executar_comando_url(args)
        return

    tipo = tipo.lower()
    url_final = ""

    if tipo in ("local", "dev", "desenvolvimento"):
        porta = alvo if alvo and alvo.isdigit() else "8080"
        url_final = f"http://localhost:{porta}/api/v1/ingestao/print"

    elif tipo in ("prod", "producao", "production"):
        if not alvo:
            print(
                f"{Cores.VERMELHO}✖ Erro: Informe a URL ou domínio de produção.{Cores.RESET}"
            )
            print(
                f"{Cores.CINZA}Exemplo: python3 agente.py env prod https://cirqueirax.com{Cores.RESET}"
            )
            return
        url_final = config.normalizar_url_ingestao(alvo)

    elif tipo in ("vps", "remoto", "server"):
        if not alvo:
            print(
                f"{Cores.VERMELHO}✖ Erro: Informe o IP ou hostname da VPS.{Cores.RESET}"
            )
            print(
                f"{Cores.CINZA}Exemplo: python3 agente.py env vps 72.60.14.61{Cores.RESET}"
            )
            return
        if not alvo.startswith(("http://", "https://")):
            alvo = f"http://{alvo}:8080"
        url_final = config.normalizar_url_ingestao(alvo)

    elif tipo == "custom":
        if not alvo:
            print(f"{Cores.VERMELHO}✖ Erro: Informe a URL personalizada.{Cores.RESET}")
            return
        url_final = config.normalizar_url_ingestao(alvo)

    else:
        print(f"{Cores.VERMELHO}✖ Ambiente desconhecido: '{tipo}'{Cores.RESET}")
        print(f"Opções disponíveis: local, prod, vps, custom")
        return

    config.gravar_variavel_env("SERVER_URL", url_final)
    ambiente_nome = config.identificar_ambiente(url_final)

    print(
        f"\n{Cores.VERDE}✔ Ambiente alterado para: {Cores.BRANCO_NEGRITO}{tipo.upper()}{Cores.RESET}"
    )
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}URL Ingestão:{Cores.RESET}    {Cores.CIANO}{url_final}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Ambiente:{Cores.RESET}        {Cores.VERDE}{ambiente_nome}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Arquivo .env:{Cores.RESET}    {Cores.CINZA}{config.obter_caminho_env()}{Cores.RESET}"
    )

    ok, codigo, detalhe = testar_conexao_servidor()
    if ok:
        print(
            f"  {Cores.VERDE}✔ Conexão ativa com o ambiente (HTTP {codigo}){Cores.RESET}"
        )
    else:
        print(f"  {Cores.AMARELO}▲ Conexão pendente: {detalhe}{Cores.RESET}")
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}\n"
    )

def executar_comando_config(args: argparse.Namespace) -> None:
    """Exibe ou altera variáveis de configuração do agente."""
    subacao = getattr(args, "subacao", "show")

    alteracoes = {}
    if getattr(args, "url", None):
        alteracoes["SERVER_URL"] = config.normalizar_url_ingestao(args.url)
    if getattr(args, "token", None):
        alteracoes["AGENT_TOKEN"] = args.token
    if getattr(args, "watch_dir", None):
        alteracoes["WATCH_DIR"] = str(Path(args.watch_dir).expanduser().resolve())
    if getattr(args, "name", None):
        alteracoes["INSTANCE_NAME"] = args.name

    if alteracoes:
        for k, v in alteracoes.items():
            config.gravar_variavel_env(k, v)
        print(f"\n{Cores.VERDE}✔ Configurações atualizadas no .env:{Cores.RESET}")
        for k, v in alteracoes.items():
            print(f"  • {Cores.NEGRITO}{k}:{Cores.RESET} {v}")
        print()
        return

    if subacao == "set":
        chave = getattr(args, "chave", None)
        valor = getattr(args, "valor", None)
        if not chave or valor is None:
            print(
                f"{Cores.VERMELHO}✖ Uso: python3 agente.py config set <CHAVE> <VALOR>{Cores.RESET}"
            )
            return
        if chave == "SERVER_URL":
            valor = config.normalizar_url_ingestao(valor)
        config.gravar_variavel_env(chave, valor)
        print(
            f"{Cores.VERDE}✔ {chave} configurada com sucesso para: {valor}{Cores.RESET}"
        )
        return

    if subacao == "get":
        chave = getattr(args, "chave", None)
        if not chave:
            print(f"{Cores.VERMELHO}✖ Informe a chave desejada.{Cores.RESET}")
            return
        dados = config.obter_todas_configs()
        val = dados.get(
            chave, os.getenv(chave, f"{Cores.CINZA}(não definida){Cores.RESET}")
        )
        print(f"{chave}={val}")
        return

    dados = config.obter_todas_configs()
    caminho_env = dados["env_path"]
    existe_env = dados["env_existe"]

    print(
        f"\n{Cores.BRANCO_NEGRITO}⚙ Configurações Ativas do Agente CirqueiraX{Cores.RESET}"
    )
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    status_env = (
        f"{Cores.VERDE}Carregado{Cores.RESET}"
        if existe_env
        else f"{Cores.AMARELO}Padrão (Arquivo .env ausente){Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Arquivo .env:{Cores.RESET}        {caminho_env} [{status_env}]"
    )
    print(
        f"  {Cores.NEGRITO}Perfil/Máquina:{Cores.RESET}      {Cores.CIANO}{dados['INSTANCE_NAME']}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Ambiente Atual:{Cores.RESET}      {Cores.VERDE}{dados['ambiente']}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}SERVER_URL:{Cores.RESET}          {Cores.CIANO}{dados['SERVER_URL']}{Cores.RESET}"
    )

    token_str = mascarar_token(dados["AGENT_TOKEN"])
    print(f"  {Cores.NEGRITO}AGENT_TOKEN:{Cores.RESET}         {token_str}")

    watch_dir_status = (
        f"{Cores.VERDE}[OK]{Cores.RESET}"
        if dados["watch_dir_existe"]
        else f"{Cores.AMARELO}[Não existe]{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}WATCH_DIR:{Cores.RESET}           {dados['WATCH_DIR']} {watch_dir_status}"
    )
    print(
        f"  {Cores.NEGRITO}DEBOUNCE_SECONDS:{Cores.RESET}    {dados['DEBOUNCE_SECONDS']}s"
    )
    print(f"  {Cores.NEGRITO}LOG_LEVEL:{Cores.RESET}           {dados['LOG_LEVEL']}")
    print(f"  {Cores.NEGRITO}STATE_FILE:{Cores.RESET}          {dados['STATE_FILE']}")
    print(f"  {Cores.NEGRITO}STATS_FILE:{Cores.RESET}          {dados['STATS_FILE']}")
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    print(f"{Cores.CINZA}Comandos úteis:")
    print(f"  • Alterar URL:      python3 agente.py url <NOVA_URL>")
    print(f"  • Mudar ambiente:   python3 agente.py env [local|prod|vps]")
    print(f"  • Definir token:    python3 agente.py config --token <TOKEN>")
    print(
        f"  • Definir pasta:    python3 agente.py config --watch-dir <PASTA>{Cores.RESET}\n"
    )

def executar_comando_test(args: argparse.Namespace) -> None:
    """Testa a conectividade com o servidor CirqueiraX."""
    url_custom = getattr(args, "url", None)
    if url_custom:
        url_custom = config.normalizar_url_ingestao(url_custom)

    alvo = url_custom or config.SERVER_URL
    token = getattr(args, "token", None) or config.AGENT_TOKEN
    ambiente = config.identificar_ambiente(alvo)

    print(
        f"\n{Cores.BRANCO_NEGRITO}● Teste de Conectividade com o Backend{Cores.RESET}"
    )
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Alvo:{Cores.RESET}              {Cores.CIANO}{alvo}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Ambiente:{Cores.RESET}          {Cores.VERDE}{ambiente}{Cores.RESET}"
    )
    print(f"  {Cores.NEGRITO}Token de Serviço:{Cores.RESET}  {mascarar_token(token)}")
    print(f"  Testando resposta HTTP...")

    inicio = time.time()
    sucesso, codigo, detalhe = testar_conexao_servidor(
        url_custom=alvo, token_custom=token
    )
    tempo_ms = int((time.time() - inicio) * 1000)

    if sucesso:
        print(f"  {Cores.VERDE}✔ Servidor Online e Respondendo!{Cores.RESET}")
        print(f"  Código HTTP: {codigo} | Latência: {tempo_ms}ms")
    else:
        print(
            f"  {Cores.VERMELHO}✖ Falha ao conectar ao servidor:{Cores.RESET} {detalhe}"
        )
        print(f"  {Cores.AMARELO}Sugestões:{Cores.RESET}")
        print(f"  1. Verifique se o servidor/backend está rodando na URL {alvo}")
        print(f"  2. Se estiver testando localmente, use: python3 agente.py env local")
        print(f"  3. Se for remoto/produção, verifique firewall e túneis SSH.")
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}\n"
    )

def executar_comando_send(args: argparse.Namespace) -> None:
    """Envia uma imagem pontual para teste de upload no terminal."""
    caminho = Path(args.arquivo).expanduser().resolve()
    if not caminho.exists() or not caminho.is_file():
        print(f"{Cores.VERMELHO}✖ Erro: O arquivo não existe: {caminho}{Cores.RESET}")
        return

    url_override = getattr(args, "url", None)
    if url_override:
        url_override = config.normalizar_url_ingestao(url_override)

    forcar = getattr(args, "force", False)
    tamanho = caminho.stat().st_size
    tamanho_formatado = formatar_bytes(tamanho)

    try:
        hash_sha256 = calcular_hash(caminho)
    except Exception as e:
        hash_sha256 = f"erro ao calcular ({e})"

    url_destino = url_override or config.SERVER_URL
    ambiente = config.identificar_ambiente(url_destino)

    print(f"\n{Cores.BRANCO_NEGRITO}▲ Teste de Envio Avulso de Print{Cores.RESET}")
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Arquivo:{Cores.RESET}           {caminho.name} ({tamanho_formatado})"
    )
    print(f"  {Cores.NEGRITO}Caminho Completo:{Cores.RESET}  {caminho}")
    print(
        f"  {Cores.NEGRITO}Hash SHA-256:{Cores.RESET}      {Cores.CINZA}{hash_sha256[:16]}...{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Destino:{Cores.RESET}           {Cores.CIANO}{url_destino}{Cores.RESET} ({ambiente})"
    )
    print(
        f"  {Cores.NEGRITO}Modo Forçado:{Cores.RESET}      {'Sim (--force)' if forcar else 'Não (deduplica por SHA-256)'}"
    )
    print(f"\n  Despachando imagem para a API...")

    inicio = time.time()
    sucesso, status, msg, resposta = enviar_print_manual(
        caminho_arquivo=caminho,
        forcar_reenvio=forcar,
        url_override=url_destino,
    )
    tempo_ms = int((time.time() - inicio) * 1000)

    if sucesso:
        if resposta.get("ignorado_duplicado"):
            print(
                f"  {Cores.AMARELO}▲ Arquivo já havia sido enviado anteriormente!{Cores.RESET}"
            )
            print(
                f"  (Ignorado pela verificação de hash SHA-256 local. Use --force para reenviar)"
            )
        else:
            print(
                f"  {Cores.VERDE}✔ Print ingerido com sucesso pelo servidor!{Cores.RESET}"
            )
            print(f"  Status HTTP: {status} | Tempo: {tempo_ms}ms")
            if "uuid" in resposta:
                print(
                    f"  UUID da Mídia Criada: {Cores.CIANO}{resposta['uuid']}{Cores.RESET}"
                )
    else:
        print(f"  {Cores.VERMELHO}✖ Falha no envio:{Cores.RESET} {msg} (HTTP {status})")
        print(f"  Tempo: {tempo_ms}ms")

    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}\n"
    )

def executar_comando_reset(args: argparse.Namespace) -> None:
    """Limpa histórico de hashes ou estatísticas para novos testes."""
    limpar_todos = getattr(args, "all", False)
    limpar_h = getattr(args, "hashes", False) or limpar_todos
    limpar_s = getattr(args, "stats", False) or limpar_todos

    if not limpar_h and not limpar_s:
        limpar_h = True

    print(
        f"\n{Cores.BRANCO_NEGRITO}● Limpeza de Histórico e Estado do Agente{Cores.RESET}"
    )
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )

    if limpar_h:
        qtd = limpar_historico_enviados()
        print(
            f"  {Cores.VERDE}✔ {qtd} registros de hashes enviados foram limpos.{Cores.RESET}"
        )
        print(f"  Arquivo: {config.STATE_FILE}")

    if limpar_s:
        limpar_estatisticas()
        print(
            f"  {Cores.VERDE}✔ Contadores diários e acumulados de estatísticas foram zerados.{Cores.RESET}"
        )
        print(f"  Arquivo: {config.STATS_FILE}")

    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    print(
        f"{Cores.CINZA}Agora todos os prints locais poderão ser reenviados como novos.{Cores.RESET}\n"
    )

def executar_comando_install(args: argparse.Namespace) -> None:
    """Assistente de instalação e configuração do agente (com suporte nativo a WSL e Linux)."""
    import subprocess
    import shutil

    is_wsl = config.esta_no_wsl()
    diretorio_raiz = config.DIRETORIO_RAIZ

    print(f"\n{Cores.BRANCO_NEGRITO}🚀 Instalador do Agente CirqueiraX{Cores.RESET}")
    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    if is_wsl:
        print(
            f"  {Cores.NEGRITO}Ambiente Detectado:{Cores.RESET} {Cores.VERDE}WSL2 (Windows Subsystem for Linux){Cores.RESET}"
        )
        print(
            f"  {Cores.CINZA}Detecção de prints do Windows montados via DrvFs (/mnt/c/...){Cores.RESET}"
        )
    else:
        print(
            f"  {Cores.NEGRITO}Ambiente Detectado:{Cores.RESET} {Cores.CIANO}Linux Nativo / POSIX{Cores.RESET}"
        )

    watch_dir_escolhido = getattr(args, "watch_dir", None)
    candidatos = config.detectar_pastas_screenshots_candidatas()

    if not watch_dir_escolhido:
        pasta_atual = Path(config.WATCH_DIR)
        if pasta_atual.exists() and pasta_atual.is_dir():
            watch_dir_escolhido = str(pasta_atual)
        elif candidatos:
            watch_dir_escolhido = candidatos[0]["caminho"]
        else:
            watch_dir_escolhido = str(Path.home() / "Pictures" / "Screenshots")

    if is_wsl:
        watch_dir_escolhido = config.converter_caminho_windows_para_wsl(
            watch_dir_escolhido
        )

    pasta_obj = Path(watch_dir_escolhido)
    if not pasta_obj.exists():
        try:
            pasta_obj.mkdir(parents=True, exist_ok=True)
            print(f"  {Cores.VERDE}✔ Pasta monitorada criada:{Cores.RESET} {pasta_obj}")
        except Exception as e:
            print(
                f"  {Cores.AMARELO}▲ Não foi possível criar pasta automaticamente: {e}{Cores.RESET}"
            )

    config.gravar_variavel_env("WATCH_DIR", watch_dir_escolhido)

    usar_polling = watch_dir_escolhido.startswith("/mnt/") or is_wsl
    config.gravar_variavel_env("USE_POLLING", "true" if usar_polling else "false")
    config.gravar_variavel_env("POLLING_INTERVAL", "1.5")

    if getattr(args, "url", None):
        config.gravar_variavel_env(
            "SERVER_URL", config.normalizar_url_ingestao(args.url)
        )
    if getattr(args, "token", None):
        config.gravar_variavel_env("AGENT_TOKEN", args.token)

    print(
        f"  {Cores.NEGRITO}Pasta Vigiada:{Cores.RESET}      {Cores.CIANO}{watch_dir_escolhido}{Cores.RESET}"
    )
    print(
        f"  {Cores.NEGRITO}Modo Observer:{Cores.RESET}      {'PollingObserver (compatível com DrvFs/WSL)' if usar_polling else 'InotifyObserver (nativo)'}"
    )
    print(
        f"  {Cores.NEGRITO}Arquivo .env:{Cores.RESET}       {config.obter_caminho_env()}"
    )

    venv_dir = diretorio_raiz / ".venv"
    python_bin = venv_dir / "bin" / "python3"
    pip_bin = venv_dir / "bin" / "pip"

    print(
        f"\n  {Cores.NEGRITO}Configurando ambiente virtual Python (.venv)...{Cores.RESET}"
    )
    if not venv_dir.exists() or not python_bin.exists():
        try:
            subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
            print(
                f"  {Cores.VERDE}✔ Ambiente virtual criado em:{Cores.RESET} {venv_dir}"
            )
        except Exception as e:
            print(f"  {Cores.VERMELHO}✖ Falha ao criar virtualenv: {e}{Cores.RESET}")
            python_bin = Path(sys.executable)

    req_file = diretorio_raiz / "requirements.txt"
    if req_file.exists() and pip_bin.exists():
        try:
            print(f"  Instalando dependências (watchdog, requests, python-dotenv)...")
            subprocess.run(
                [str(pip_bin), "install", "-q", "-r", str(req_file)], check=True
            )
            print(f"  {Cores.VERDE}✔ Dependências instaladas com sucesso!{Cores.RESET}")
        except Exception as e:
            print(
                f"  {Cores.AMARELO}▲ Aviso ao instalar dependências: {e}{Cores.RESET}"
            )

    no_service = getattr(args, "no_service", False)
    systemctl_path = shutil.which("systemctl")

    if not no_service and systemctl_path:
        systemd_dir = Path.home() / ".config" / "systemd" / "user"
        systemd_dir.mkdir(parents=True, exist_ok=True)
        service_file = systemd_dir / "cirqueirax-agente.service"

        conteudo_service = f"""[Unit]
Description=Agente de Ingestao de Prints CirqueiraX
After=network.target network-online.target

[Service]
Type=simple
WorkingDirectory={diretorio_raiz}
ExecStart={python_bin} {diretorio_raiz}/agente.py
Restart=always
RestartSec=5s
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target
"""
        try:
            with open(service_file, "w", encoding="utf-8") as f:
                f.write(conteudo_service)

            subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
            subprocess.run(
                ["systemctl", "--user", "enable", "cirqueirax-agente.service"],
                check=True,
            )
            subprocess.run(
                ["systemctl", "--user", "restart", "cirqueirax-agente.service"],
                check=True,
            )
            print(
                f"  {Cores.VERDE}✔ Serviço systemd registrado e iniciado:{Cores.RESET} cirqueirax-agente.service"
            )
        except Exception as e:
            print(f"  {Cores.AMARELO}▲ Aviso ao registrar systemd: {e}{Cores.RESET}")
            print(f"  Você pode rodar manualmente via: python3 agente.py start")

    print(
        f"{Cores.CINZA}──────────────────────────────────────────────────────────────{Cores.RESET}"
    )
    print(
        f"{Cores.VERDE}✔ Instalação e configuração concluídas com sucesso!{Cores.RESET}"
    )
    print(f"\n{Cores.BRANCO_NEGRITO}Próximos passos:{Cores.RESET}")
    print(f"  1. Verifique o status:")
    print(f"     {Cores.CIANO}python3 agente.py status{Cores.RESET}")
    if not config.AGENT_TOKEN or config.AGENT_TOKEN == "seu_token_aqui":
        print(f"  2. Se ainda não gerou o token, emita no backend via:")
        print(
            f'     {Cores.AMARELO}make agente-token ARGS="\\"Meu PC\\" print_pessoal"{Cores.RESET}'
        )
        print(
            f"     E configure com: {Cores.CIANO}python3 agente.py config --token <TOKEN>{Cores.RESET}"
        )
    print()
