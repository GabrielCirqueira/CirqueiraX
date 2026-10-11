# Agente de Ingestão de Prints — CirqueiraX

O **Agente CirqueiraX** (`./agente/`) é um serviço leve em Python projetado para ser executado como processo em segundo plano (daemon/serviço) nas máquinas do usuário (por exemplo, computador do trabalho e computador pessoal).

Sua função primária é **eliminar o atrito de ingestão manual de capturas de tela (screenshots)**: sempre que você tira um print, o agente detecta o novo arquivo na pasta do sistema operacional, aguarda a finalização da escrita no disco, calcula sua assinatura SHA-256 e envia a imagem automaticamente via API para o servidor **CirqueiraX**, onde ela é categorizada e distribuída de acordo com a origem configurada.

---

## 1. Visão Geral da Arquitetura

O agente funciona desacoplado do servidor e opera no modelo *fire-and-forget* com confirmação de entrega e deduplicação local:

```
[ Usuário tira Screenshot ]
           │
           ▼
[ Pasta do SO (ex: ~/Pictures/Screenshots) ]
           │
           ▼
[ Watcher (watchdog: on_created / on_modified) ]
           │
           ▼
[ Estabilização & Debounce (3.0s em background thread) ]
           │
           ▼
[ Verificação de Hash SHA-256 (estado.py) ]
    ├─ Já enviado? ──► Ignora silenciosamente
    └─ Novo print ───► Continua
           │
           ▼
[ Cliente HTTP (cliente.py) ]
    POST /api/v1/ingestao/print
    Headers: X-Agent-Token: <cx_ag_...>
    Body: multipart/form-data (arquivo, nomeOriginal, timestampCaptura)
           │
           ├─ Sucesso (200/201) ──► Marca no ~/.cirqueirax_enviados.json
           └─ Falha de Rede/Servidor ──► Retry Exponencial (até 3 tentativas: 2s, 4s, 8s)
```

---

## 2. Estrutura de Arquivos

```
agente/
├── agente.py                     # Entrypoint CLI unificado (start, status, test)
├── requirements.txt              # Dependências Python (requests, watchdog, python-dotenv)
├── README.md                     # Documentação completa do agente
├── .env.example                  # Template base de configuração de ambiente
├── core/                         # Pacote Python interno modular
│   ├── __init__.py               # Exports limpos e lazy loading do pacote
│   ├── config.py                 # Descoberta de .env, caminhos isolados e sanitização
│   ├── watcher.py                # Monitoramento de filesystem com watchdog e debounce
│   ├── cliente.py                # Envio HTTP multipart com retry e backoff
│   ├── estado.py                 # Persistência de hash, deduplicação e métricas
│   └── status.py                 # Renderizador de status/dashboard ANSI multiplataforma
├── env/                          # Templates de configuração organizados
│   ├── .env.example              # Exemplo padrão
│   ├── .env.empresa.example      # Perfil PC Empresa (origem: print_empresa)
│   └── .env.pessoal.example      # Perfil PC Pessoal (origem: print_pessoal)
├── scripts/                      # Scripts de terminal para acesso rápido
│   ├── status.sh                 # Atalho de status para Linux e macOS
│   └── status.bat                # Atalho de status para Windows
└── servico/                      # Integrações com gerenciadores de serviço do SO
    ├── cirqueirax-agente.service # Unidade Systemd para Linux
    ├── instalar-servico-linux.sh # Instalador automático para Systemd do usuário
    ├── com.cirqueirax.agente.plist # Configuração Launchd para macOS
    └── instalar-servico-windows.bat # Instalador para Agendador de Tarefas do Windows
```

---

## 3. Detalhamento dos Componentes

### 3.1. `agente.py` (Ponto de Entrada e Ciclo de Vida)
- **Função**: Inicializa o sistema de logging, valida se o `AGENT_TOKEN` está configurado e se o diretório `WATCH_DIR` existe (criando-o caso não exista).
- **Execução**: Inicializa o `Observer` do watchdog e mantém o processo vivo em loop `while True: time.sleep(1)`.
- **Encerramento Limpo**: Intercepta `KeyboardInterrupt` (`Ctrl+C`) ou sinais de terminação, interrompendo o observer (`observer.stop()`, `observer.join()`).

### 3.2. `watcher.py` (Monitoramento e Estabilização de Arquivos)
- **Biblioteca**: `watchdog` (`FileSystemEventHandler`, `Observer`).
- **Eventos Capturados**: `on_created` e `on_modified`.
- **Filtro de Extensões**: Aceita apenas extensões de imagem permitidas: `.png`, `.jpg`, `.jpeg`, `.webp`.
- **Thread Assíncrona**: Cada evento válido dispara uma thread em background (`Thread(..., daemon=True)`), evitando travar o loop de eventos do watchdog.
- **Mecanismo de Estabilização e Debounce**:
  - Quando um screenshot é salvo pelo sistema operacional, a escrita pode levar alguns milissegundos. Se o arquivo for lido no instante do evento `on_created`, o arquivo pode estar truncado (0 bytes ou incompleto).
  - O método `_aguardar_estabilizacao` monitora o tamanho em bytes do arquivo (`caminho.stat().st_size`). Quando o tamanho para de variar e se mantém constante durante o intervalo `DEBOUNCE_SECONDS` (padrão `3.0s`), o arquivo é considerado pronto para envio.
  - Possui timeout de segurança de 60 segundos.

### 3.3. `estado.py` (Deduplicação e Idempotência Local)
- **Objetivo**: Evitar que a mesma imagem seja enviada múltiplas vezes (por exemplo, após reinicialização do agente ou eventos duplicados do SO).
- **Assinatura Digital**: Calcula o hash `SHA-256` do conteúdo do arquivo em blocos de 64 KB (`hashlib.sha256()`).
- **Persistência**: Armazena os hashes no arquivo configurado em `STATE_FILE` (ex: `~/.cirqueirax_enviados.json`).
- **Concorrência Segura**: Todas as operações de leitura e gravação no arquivo de estado utilizam um `threading.Lock()` para garantir consistência entre múltiplas threads.
- **Estrutura do JSON de Estado**:
  ```json
  {
    "enviados": {
      "a1b2c3d4e5f6...": {
        "nome": "Screenshot_2026-10-10_18-00.png",
        "caminho": "/home/usuario/Pictures/Screenshots/Screenshot_2026-10-10_18-00.png",
        "tamanho": 1048576
      }
    }
  }
  ```

### 3.4. `cliente.py` (Comunicação HTTP e Tolerância a Falhas)
- **Endpoint**: Envia uma requisição `POST` para a URL configurada em `SERVER_URL` (geralmente `.../api/v1/ingestao/print`).
- **Autenticação**: Envia o token estático no cabeçalho HTTP:
  ```http
  X-Agent-Token: cx_ag_a837a4f7d64170c2c2f9778522d32658250d5289b0945fb8
  ```
- **Payload (`multipart/form-data`)**:
  - `arquivo`: Stream binário da imagem com MIME type inferido da extensão.
  - `nomeOriginal`: Nome do arquivo no disco.
  - `timestampCaptura`: Data/hora da última modificação do arquivo no disco em formato ISO-8601 UTC.
- **Estratégia de Retry com Backoff Exponencial**:
  - Executa até 3 tentativas (`max_tentativas = 3`).
  - Códigos HTTP 200 e 201: Marca o arquivo como enviado no estado local e encerra com sucesso.
  - Códigos 4xx (erro de validação do cliente ou token inválido): Interrompe imediatamente sem retry, pois o erro é definitivo.
  - Códigos 5xx ou falha de conexão (`requests.RequestException`): Aplica espera exponencial calculada por `2 ** tentativa` (2s na tentativa 1, 4s na tentativa 2) antes de tentar novamente.

### 3.5. `config.py` (Variáveis de Configuração)
Lê o arquivo `.env` localizado no próprio diretório `agente/` usando `python-dotenv`:

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `SERVER_URL` | `http://localhost:8080/api/v1/ingestao/print` | URL completa da rota de ingestão de prints no backend. |
| `AGENT_TOKEN` | *(obrigatório)* | Chave de serviço (`cx_ag_...`) emitida pelo backend Symfony. |
| `WATCH_DIR` | `~/Pictures/Screenshots` | Pasta de capturas de tela a ser monitorada no computador. |
| `DEBOUNCE_SECONDS`| `3.0` | Segundos de estabilidade de tamanho do arquivo antes do envio. |
| `STATE_FILE` | `~/.cirqueirax_enviados.json` | Caminho do arquivo JSON que guarda o histórico de hashes enviados. |
| `LOG_LEVEL` | `INFO` | Nível de log (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

---

## 4. Integração com o Backend CirqueiraX

### Como o Backend Processa a Ingestão

1. **Geração do Token no Servidor**:
   No servidor (ou ambiente dev), um token de agente é criado pelo comando do Symfony:
   ```bash
   make agente-token ARGS="\"Agente PC Empresa\" print_empresa"
   # Ou para computador pessoal:
   make agente-token ARGS="\"Agente PC Pessoal\" print_pessoal"
   ```
   O comando persiste um registro na tabela `token_agente` com o hash SHA-256 do token e a `origem` configurada (`print_empresa` ou `print_pessoal`).

2. **Autenticação no Backend**:
   - Quando o agente faz a chamada com `X-Agent-Token`, o `TokenAgenteAuthenticator` intercepta a requisição.
   - O backend valida a existência e validade do token (conferindo se não foi revogado) e atribui ao agente a permissão `ROLE_AGENTE`.

3. **Classificação e Distribuição Automática**:
   - O `IngestarPrintService` consulta a tabela `origem_regra` para descobrir qual categoria está associada à origem do token.
   - Para `print_empresa`, mapeia para a categoria `Print Empresa` (pasta `prints/empresa`).
   - Para `print_pessoal`, mapeia para a categoria `Print Pessoal` (pasta `prints/pessoal`).
   - A mídia é salva no disco local e o processamento em lote/background é disparado (incluindo upload para o álbum correspondente no Google Fotos, se vinculado).

---

## 5. Como Instalar e Rodar o Agente

### Pré-requisitos
- Python 3.10 ou superior instalado no computador.
- `pip` e `venv` disponíveis.

### Passo 1: Clonar ou Copiar a Pasta do Agente
Você pode rodar o agente direto do repositório local ou copiar apenas a pasta `agente/` para o computador onde você quer monitorar os prints.

### Passo 2: Criar Ambiente Virtual e Instalar Dependências
```bash
cd agente
python3 -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Passo 3: Configurar o Arquivo `.env`
Copie um dos arquivos de exemplo para `.env`:
```bash
# Para máquina de trabalho:
cp .env.empresa.example .env

# Ou para máquina pessoal:
cp .env.pessoal.example .env
```
Edite o arquivo `.env` e preencha:
- `SERVER_URL`: A URL do seu servidor CirqueiraX (ex: `https://seu-dominio.com/api/v1/ingestao/print` ou `http://IP-DA-VPS:8080/api/v1/ingestao/print`).
- `AGENT_TOKEN`: O token que você gerou com `make agente-token`.
- `WATCH_DIR`: O caminho da pasta onde seu sistema operacional salva prints automaticamente (ex: `/home/usuario/Imagens/Capturas de tela` ou `C:\Users\Usuario\Pictures\Screenshots`).

### Passo 4: Teste Manual
Execute em primeiro plano para validar se a conexão e o monitoramento estão funcionando:
```bash
python3 agente.py
```
Tire um screenshot na sua máquina e observe os logs:
```
2026-10-10 18:30:00 [INFO] Agente CirqueiraX iniciado!
2026-10-10 18:30:00 [INFO] Watcher ativo e monitorando a pasta: /home/usuario/Pictures/Screenshots
2026-10-10 18:30:05 [INFO] Detectado novo arquivo de print: Screenshot_20261010_183005.png. Aguardando estabilização (3.0s)...
2026-10-10 18:30:08 [INFO] Print enviado com sucesso! [Screenshot_20261010_183005.png] (Status HTTP 201)
```

---

## 6. Execução em Segundo Plano (Como Serviço do Sistema)

Na pasta `agente/servico/`, há configurações prontas para transformar o agente em um serviço que inicia automaticamente com o sistema operacional.

### 6.1. No Linux (Systemd de Usuário)
Não requer privilégios de `root` (executa na sessão do seu usuário):

```bash
chmod +x servico/instalar-servico-linux.sh
./servico/instalar-servico-linux.sh
```

Comandos úteis:
```bash
# Ver status do serviço
systemctl --user status cirqueirax-agente.service

# Acompanhar logs em tempo real
journalctl --user -u cirqueirax-agente.service -f

# Reiniciar serviço após alterar o .env
systemctl --user restart cirqueirax-agente.service
```

### 6.2. No Windows (Agendador de Tarefas)
Execute o arquivo batch como Administrador ou abra o Prompt de Comando na pasta `servico`:
```cmd
servico\instalar-servico-windows.bat
```
Isso criará uma tarefa agendada chamada `CirqueiraX_Agente` configurada para iniciar sempre que você fizer login (`ONLOGON`).

### 6.3. No macOS (Launchd)
Copie o arquivo plist para sua pasta de agentes do usuário:
```bash
mkdir -p ~/Library/LaunchAgents
cp servico/com.cirqueirax.agente.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.cirqueirax.agente.plist
```

---

## 7. Monitoramento, Métricas e Status do Agente

O agente conta com um sistema de métricas da aplicação e um comando de status visual no terminal (semelhante ao `systemctl status`), funcionando de maneira idêntica no **Linux**, **Windows** e **macOS**.

### 7.1. Comandos de Visualização de Status

```bash
# Via script do agente
python3 agente.py status

# Ou diretamente pelo script status.py / status.sh / status.bat
./status.sh          # No Linux / macOS
status.bat           # No Windows
python status.py     # Em qualquer sistema operacional
```

### 7.2. Modo Live Monitor (`--watch` / `-w`)

Para acompanhar os envios e o status em tempo real (atualizado a cada 2 segundos):

```bash
python3 agente.py status --watch
# Ou de forma abreviada:
./status.sh -w
status.bat -w
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

### 7.4. Teste Rápido de Conectividade

Para testar se o servidor CirqueiraX está online e respondendo sem precisar enviar nenhum arquivo:

```bash
python3 agente.py test
```

---

## 8. Diagnóstico e Resolução de Problemas

| Sintoma | Causa Mais Comum | Como Resolver |
| :--- | :--- | :--- |
| `ERRO: AGENT_TOKEN não configurado no arquivo .env` | Variável ausente ou vazia no `.env`. | Gere o token via `make agente-token` e cole no `.env`. |
| `Status HTTP 401 / 403` | Token inválido, revogado ou formato incorreto. | Verifique se o token gerado está registrado no banco e ativo na tabela `token_agente`. |
| `Erro de conexão ao enviar` | Servidor CirqueiraX offline ou porta bloqueada por firewall. | Teste a conexão via `python3 agente.py test` ou `curl -I <SERVER_URL>`. |
| O print é detectado mas não é enviado | Arquivo com extensão não suportada ou tamanho 0. | O agente só processa `.png`, `.jpg`, `.jpeg`, `.webp`. Verifique se o utilitário de screenshot salvou o arquivo completamente. |
| Print ignorado com mensagem "já enviado anteriormente" | Hash SHA-256 já existe no `STATE_FILE`. | Comportamento normal para evitar duplicatas. Para forçar o reenvio de testes, apague o arquivo de estado `~/.cirqueirax_enviados*.json`. |

