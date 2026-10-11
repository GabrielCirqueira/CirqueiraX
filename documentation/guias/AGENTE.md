# Guia Completo do Agente de Ingestão de Prints (`./agente/`)

O **Agente CirqueiraX** é o componente cliente multiplataforma desenvolvido em Python que roda em segundo plano nas máquinas do usuário (PCs de trabalho, estações pessoais, laptops) para capturar e enviar automaticamente capturas de tela (screenshots) para o servidor central do CirqueiraX.

---

## 1. Visão Geral e Filosofia de Design

No fluxo de trabalho tradicional, salvar um print de trabalho ou pessoal requer:
1. Tirar a captura de tela.
2. Localizar o arquivo salvo no sistema de arquivos.
3. Abrir o navegador ou aplicativo de armazenamento.
4. Fazer upload manual e escolher a pasta ou álbum correto.

Com o **Agente CirqueiraX**, esse atrito é **reduzido a zero**:
- Você tira o print (`PrintScreen`, atalho do sistema ou ferramenta de captura).
- O agente detecta o novo arquivo instantaneamente na pasta do SO.
- Após estabilização da escrita em disco, calcula a assinatura digital (hash SHA-256) para deduplicação.
- O agente despacha o arquivo via API (`POST /api/v1/ingestao/print`) autenticado por um token de serviço exclusivo daquela máquina (`X-Agent-Token`).
- O servidor CirqueiraX reconhece a origem (ex: `print_empresa` ou `print_pessoal`) e classifica automaticamente na pasta e álbum configurados, sem nenhuma ação manual do usuário.

---

## 2. Diagrama de Fluxo e Arquitetura

```
┌────────────────────────────────────────────────────────┐
│ MÁQUINA CLIENTE (PC Empresa / PC Pessoal)              │
│                                                        │
│  [ Captura de Tela ] ──► Salva em ~/Pictures/Screenshots
│                                │
│                                ▼
│  [ watcher.py ] ───────► Evento de criação/modificação
│                                │
│                                ▼
│  [ watcher.py ] ───────► Aguarda estabilização (Debounce 3s)
│                                │
│                                ▼
│  [ estado.py ] ────────► Calcula SHA-256 e confere estado local
│                                │
│                                ├─ Já enviado? ──► Ignora
│                                └─ Novo? ───────► Prossegue
│                                                        │
│                                                        ▼
│  [ cliente.py ] ───────► POST multipart /api/v1/ingestao/print
│                          Header: X-Agent-Token: cx_ag_...
└────────────────────────────────┬───────────────────────┘
                                 │ HTTPS / HTTP
                                 ▼
┌────────────────────────────────────────────────────────┐
│ SERVIDOR CIRQUEIRAX (VPS / Backend Symfony)            │
│                                                        │
│  1. TokenAgenteAuthenticator valida o cabeçalho        │
│  2. IngestarPrintService recebe o arquivo              │
│  3. OrigemRegra mapeia token.origem ──► Categoria      │
│  4. Arquivo distribuído localmente e sincronizado      │
│     via Syncthing e Google Fotos (se configurado)      │
└────────────────────────────────────────────────────────┘
```

---

## 3. Estrutura do Diretório `./agente/`

| Arquivo | Responsabilidade |
| :--- | :--- |
| [`agente.py`](file:///home/gabriel/dev/CirqueiraX/agente/agente.py) | Ponto de entrada: valida variáveis de ambiente, inicializa o watcher e gerencia o ciclo de vida. |
| [`watcher.py`](file:///home/gabriel/dev/CirqueiraX/agente/watcher.py) | Observador do sistema de arquivos (`watchdog`): captura eventos, filtra extensões e aguarda estabilização. |
| [`estado.py`](file:///home/gabriel/dev/CirqueiraX/agente/estado.py) | Gerenciador de estado local e deduplicação: cálculo de hash SHA-256 e persistência em arquivo JSON com thread locking. |
| [`cliente.py`](file:///home/gabriel/dev/CirqueiraX/agente/cliente.py) | Cliente HTTP (`requests`): envio multipart/form-data com retry e backoff exponencial para falhas de rede. |
| [`config.py`](file:///home/gabriel/dev/CirqueiraX/agente/config.py) | Configurações dinâmicas carregadas a partir de variáveis de ambiente e `.env`. |
| [`requirements.txt`](file:///home/gabriel/dev/CirqueiraX/agente/requirements.txt) | Especificação das dependências Python (`requests`, `watchdog`, `python-dotenv`). |
| [`.env.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.example) | Modelo base de configuração de ambiente. |
| [`.env.empresa.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.empresa.example) | Exemplo pronto para a máquina de trabalho (`print_empresa`). |
| [`.env.pessoal.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.pessoal.example) | Exemplo pronto para a máquina pessoal (`print_pessoal`). |
| [`servico/`](file:///home/gabriel/dev/CirqueiraX/agente/servico/) | Scripts e definições de serviço para execução persistente em Linux, Windows e macOS. |

---

## 4. Variáveis de Ambiente e Configuração

O arquivo `config.py` carrega o `.env` do diretório do agente:

```bash
# URL do endpoint de ingestão de prints no backend
SERVER_URL=http://localhost:8080/api/v1/ingestao/print

# Token de serviço emitido no backend (obrigatório)
AGENT_TOKEN=cx_ag_a837a4f7d64170c2c2f9778522d32658250d5289b0945fb8

# Diretório a ser monitorado onde o SO salva screenshots
WATCH_DIR=~/Pictures/Screenshots

# Segundos que o tamanho do arquivo deve permanecer fixo antes do envio
DEBOUNCE_SECONDS=3.0

# Arquivo JSON local para rastreamento de hashes já enviados
STATE_FILE=~/.cirqueirax_enviados.json

# Nível de verbosidade do log (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
```

---

## 5. Como Emitir Tokens no Backend

Cada máquina cliente deve possuir seu próprio token. No backend do CirqueiraX, utilize o comando:

```bash
# Token para a máquina corporativa
make agente-token ARGS="\"Agente PC Empresa\" print_empresa"

# Token para a máquina pessoal
make agente-token ARGS="\"Agente PC Pessoal\" print_pessoal"
```

O comando exibirá a chave gerada (prefixada por `cx_ag_...`). Copie essa chave para o `AGENT_TOKEN` no `.env` da respectiva máquina.

---

## 6. Instalação e Execução

### 6.1. Em Desenvolvimento / Testes Manuais

```bash
cd agente
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configure os valores no .env
python3 agente.py
```

### 6.2. Em Produção como Serviço de Sistema Operacional

#### Linux (Systemd User Service)
O script configura o serviço no systemd do próprio usuário (sem necessidade de privilégios de root):
```bash
chmod +x agente/servico/instalar-servico-linux.sh
./agente/servico/instalar-servico-linux.sh
```
- Status: `systemctl --user status cirqueirax-agente.service`
- Logs: `journalctl --user -u cirqueirax-agente.service -f`

#### Windows (Agendador de Tarefas)
Execute o script em lote na pasta `servico`:
```cmd
agente\servico\instalar-servico-windows.bat
```
Ele cria a tarefa `CirqueiraX_Agente` para rodar automaticamente ao efetuar login.

#### macOS (Launchd)
```bash
mkdir -p ~/Library/LaunchAgents
cp agente/servico/com.cirqueirax.agente.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.cirqueirax.agente.plist
```

---

## 7. Monitoramento, Métricas e Status do Agente

O agente fornece um comando de status visual no terminal (semelhante ao `systemctl status`), funcionando de maneira idêntica no **Linux**, **Windows** e **macOS**, sem depender exclusivamente das ferramentas do SO para saber sobre métricas da aplicação.

### 7.1. Comandos de Visualização de Status

```bash
# Via script do agente
python3 agente/agente.py status

# Ou diretamente pelo script status.py / status.sh / status.bat
./agente/status.sh          # No Linux / macOS
agente\status.bat           # No Windows
python agente/status.py     # Em qualquer sistema operacional
```

### 7.2. Modo Live Monitor (`--watch` / `-w`)

Para acompanhar os envios e o status em tempo real (atualizado a cada 2 segundos):

```bash
python3 agente/agente.py status --watch
# Ou de forma abreviada:
./agente/status.sh -w
agente\status.bat -w
```

### 7.3. Exemplo de Saída do Terminal

```text
● CirqueiraX Agente — Ingestão de Prints
──────────────────────────────────────────────────────────────
  Status:            ● Ativo (em execução) (PID 28419, rodando há 2h 15m)
  Perfil/Máquina:    PC Empresa
  Pasta Vigiada:     /home/usuario/Pictures/Screenshots [OK]
  Servidor:          https://cirqueirax.com/api/v1/ingestao/print
  Conexão API:       ● Online (HTTP 200)
  Token de Acesso:   cx_ag_a8...5fb8

  Estatísticas de Hoje (11/10/2026):
  ├─ Enviados hoje:       14 prints (32.4 MB)
  ├─ Falhas hoje:         0
  └─ Taxa de sucesso:     100.0%

  Métricas Acumuladas (Histórico Geral):
  ├─ Total de envios:     342 arquivos (891.2 MB)
  └─ Total de falhas:     1

  Último Envio Concluído:
  └─ ✔ Screenshot_20261011_183005.png (2.1 MB) — 18:30:05 (há 2m)

  Última Falha Registrada:
  └─ ✖ Screenshot_20261011_152010.png — 15:20:10 (há 3h 12m)
     Motivo: Falha após 3 tentativas (Timeout de rede)

  Atividades Recentes (Últimos Eventos):
  • ✔ Sucesso: Screenshot_20261011_183005.png (2.1 MB) — 18:30:05 (há 2m)
  • ✔ Sucesso: Screenshot_20261011_181512.png (1.8 MB) — 18:15:12 (há 17m)
  • ✖ Falha:   Screenshot_20261011_152010.png — 15:20:10 (há 3h 12m)
──────────────────────────────────────────────────────────────
```

### 7.4. Teste de Conexão Rápido

```bash
python3 agente/agente.py test
```

---

## 8. Tolerância a Falhas e Resiliência

1. **Escrita Incompleta do Arquivo (Debounce)**:
   Aguardar `DEBOUNCE_SECONDS` com comparação contínua de tamanho em bytes (`st_size`) previne uploads de imagens cortadas ou corrompidas.
2. **Quedas Temporárias de Conexão**:
   Caso o servidor esteja reiniciando ou sem conexão temporária, o agente executa até 3 tentativas com pausa exponencial (`2s`, `4s`, `8s`).
3. **Idempotência Garantida**:
   Se o agente reiniciar ou o sistema operacional disparar múltiplos eventos para o mesmo arquivo, o hash SHA-256 gravado no `STATE_FILE` garante que a imagem não será duplicada no banco nem consumirá banda desnecessária.
4. **Desacoplamento Assíncrono**:
   O processamento pesado (geração de thumbnails, categorização, cópia para o Syncthing e upload para o Google Fotos) ocorre via Symfony Messenger no servidor; a resposta HTTP para o agente é rápida e assíncrona.

