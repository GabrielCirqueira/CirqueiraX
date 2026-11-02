# Agente de Prints (`agente/`)

O **Agente CirqueiraX** é um programa em Python que roda em segundo plano no computador. Ele observa a pasta de screenshots e envia cada print novo ao servidor, sem ação manual.

---

## 1. Fluxo

```
┌──────────────────────────────────────────────────────┐
│ COMPUTADOR                                           │
│                                                      │
│  Captura de tela salva na pasta observada            │
│              │                                       │
│              ▼                                       │
│  watcher.py: detecta e aguarda o arquivo estabilizar │
│              │                                       │
│              ▼                                       │
│  estado.py: calcula o SHA-256                        │
│              ├─ Já enviado ──► ignora                │
│              └─ Novo ────────► envia                 │
│              │                                       │
│              ▼                                       │
│  cliente.py: POST /api/v1/ingestao/print             │
│              Header X-Agent-Token: cx_ag_...         │
└──────────────┬───────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────┐
│ SERVIDOR                                             │
│  Autentica o token e identifica a origem             │
│  Ingere, classifica, distribui e envia ao Google     │
└──────────────────────────────────────────────────────┘
```

---

## 2. Estrutura

```text
agente/
├── agente.py                 CLI do agente
├── requirements.txt          watchdog, requests, python-dotenv
├── README.md
├── core/
│   ├── comandos.py           Implementação dos comandos da CLI
│   ├── config.py             Configurações e caminhos
│   ├── estado.py             Hashes enviados e estatísticas
│   ├── cliente.py            Envio HTTP com novas tentativas
│   ├── watcher.py            Observador, debounce e varredura de pendentes
│   └── status.py             Painel no terminal
├── env/                      Modelos de .env (padrão, empresa e pessoal)
├── scripts/                  status.sh e status.bat
└── servico/
    ├── instalar-servico-windows.ps1   Instalador atual do Windows
    ├── instalar-servico-windows.bat   Instalador antigo por tarefa agendada
    ├── instalar-servico-wsl.sh
    ├── instalar-servico-linux.sh
    ├── cirqueirax-agente.service      Serviço systemd de usuário
    └── com.cirqueirax.agente.plist    Launchd (macOS)
```

---

## 3. Configuração

```bash
# Endpoint de ingestão
SERVER_URL=https://x.cirqueira.com/api/v1/ingestao/print

# Token da máquina (obrigatório)
AGENT_TOKEN=cx_ag_seu_token_aqui

# Pasta observada
WATCH_DIR=~/Pictures/Screenshots

# Segundos de espera para o arquivo estabilizar
DEBOUNCE_SECONDS=3.0

# Hashes já enviados
STATE_FILE=~/.cirqueirax_enviados.json

# Nome da máquina
INSTANCE_NAME=PC-Principal

# Observação por varredura, necessária em /mnt/c no WSL
USE_POLLING=true
POLLING_INTERVAL=1.5

LOG_LEVEL=INFO
```

A origem (`print_empresa` ou `print_pessoal`) vem do token no servidor, não do `.env`.

---

## 4. Gerar o token

Cada máquina tem o próprio token:

```bash
make agente-token ARGS="\"PC Empresa\" print_empresa"
make agente-token ARGS="\"PC Pessoal\" print_pessoal"
```

O comando mostra a chave `cx_ag_...`. Copie para `AGENT_TOKEN`. No banco fica apenas o hash SHA-256 dela.

---

## 5. Instalação

### Windows (recomendado)

```powershell
python agente\agente.py install
# ou
powershell -ExecutionPolicy Bypass -File agente\servico\instalar-servico-windows.ps1
```

Comportamento atual (M79 e M81):

- Copia o agente para `%LOCALAPPDATA%\CirqueiraX\agente`.
- Procura a pasta `Pictures\Screenshots` ou `Pictures\Capturas de tela`.
- Usa `https://x.cirqueira.com/api/v1/ingestao/print` como `SERVER_URL` padrão.
- Inicia oculto no login, pela pasta **Inicializar** do Windows.
- Grava o log em `agente.log`, dentro da pasta de instalação.

O agente nativo substituiu o serviço do WSL nesse fluxo, portanto mantenha só um deles ativo por máquina.

### WSL2

```bash
python3 agente/agente.py install
```

O assistente configura o caminho em `/mnt/c/...` e ativa o polling, porque essa montagem não entrega eventos do sistema de arquivos.

### Linux

```bash
./agente/servico/instalar-servico-linux.sh
systemctl --user status cirqueirax-agente.service
journalctl --user -u cirqueirax-agente.service -f
```

### macOS

```bash
cp agente/servico/com.cirqueirax.agente.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.cirqueirax.agente.plist
```

### Desenvolvimento

```bash
cd agente
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 agente.py start
```

---

## 6. Comandos

| Comando | Função |
| :--- | :--- |
| `start` | Inicia o observador |
| `status` | Mostra o painel; `--watch` atualiza ao vivo |
| `url` | Mostra ou altera a URL do servidor |
| `env` | Alterna entre perfis `local`, `prod` e `vps` |
| `config` | Mostra ou altera configurações |
| `test` | Testa API e token |
| `send` | Envia uma imagem; `--force` ignora a dedupe local |
| `reset` | Limpa `--hashes`, `--stats` ou `--all` |
| `install` | Instala conforme o sistema |

```bash
python3 agente/agente.py url https://x.cirqueira.com
python3 agente/agente.py env local 4010
python3 agente/agente.py env prod https://seu-dominio.com
python3 agente/agente.py env vps <IP_DA_VPS>
python3 agente/agente.py config --token cx_ag_...
python3 agente/agente.py config --watch-dir ~/Pictures/Screenshots
python3 agente/agente.py config --name "Notebook Pessoal"
python3 agente/agente.py config set LOG_LEVEL DEBUG
python3 agente/agente.py config get SERVER_URL
python3 agente/agente.py send /caminho/imagem.png --force
```

Ao informar apenas o domínio, o agente completa o caminho `/api/v1/ingestao/print`.

---

## 7. Resiliência

1. **Arquivo incompleto:** o envio espera `DEBOUNCE_SECONDS` com o tamanho estável.
2. **Queda de conexão:** até 3 tentativas com espera crescente.
3. **Sem duplicação local:** o SHA-256 em `STATE_FILE` impede novo envio do mesmo arquivo.
4. **Sem duplicação no servidor:** a ingestão também faz dedupe.
5. **Prints perdidos (M80):** `varrer_pendentes` envia ao iniciar o que chegou com o agente desligado.
6. **Envio múltiplo (M82):** o `_lock_andamento` impede que eventos repetidos enviem o mesmo arquivo em paralelo.
7. **Limite do servidor:** 300 requisições por minuto, por token.
