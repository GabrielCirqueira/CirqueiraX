# Progresso do Roadmap — Feature 5 (Feature 4: Prints Automáticos e Upload Manual)

> Detalhamento dos tópicos 81 ao 100.

---

### ✅ Tópico 81 — Endpoint de ingestão via agente — POST /api/v1/ingestao/print
- **Status**: Concluído
- **O que foi feito**:
  - **Controller REST de Ingestão**: Criado [`src/Controller/IngestaoController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/IngestaoController.php) estendendo `DefaultController`.
  - **Endpoint HTTP POST**: Mapeada a rota `POST /api/v1/ingestao/print` protegida por `#[IsGranted('ROLE_AGENTE')]`.
  - **Autenticação via Agente**: Injeta a instância `AgenteUser` via `#[CurrentUser]` e extrai as credenciais e a origem vinculadas ao `TokenAgente` autenticado pelo header `X-Agent-Token`.
- **Arquivos envolvidos**:
  - [`src/Controller/IngestaoController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/IngestaoController.php)

### ✅ Tópico 82 — DTO IngestarPrintDTO e upload multipart do agente
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Upload Multipart**: Criado [`src/DataObject/IngestarPrintDTO.php`](file:///home/gabriel/dev/CirqueiraX/src/DataObject/IngestarPrintDTO.php) (`final readonly class`) para capturar requisições `multipart/form-data`.
  - **Validações Symfony**: Aplicadas as restrições `#[Assert\NotNull]` para a imagem e `#[Assert\File(maxSize: '20M', mimeTypes: ['image/png', 'image/jpeg', 'image/webp'])]`.
  - **Método de Construção `fromRequest()`**: Extrai de forma inteligente o arquivo enviado via `$request->files`, nome original, timestamp de captura e decodificação do campo `metadata` em JSON ou array.
- **Arquivos envolvidos**:
  - [`src/DataObject/IngestarPrintDTO.php`](file:///home/gabriel/dev/CirqueiraX/src/DataObject/IngestarPrintDTO.php)

### ✅ Tópico 83 — IngestarPrintService — aplica OrigemRegra e delega ao motor
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço de Ingestão de Prints**: Criado [`src/Service/IngestarPrintService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/IngestarPrintService.php) para gerenciar o salvamento temporário do arquivo em disco (`sys_get_temp_dir() . '/cirqueirax_prints'`).
  - **Enriquecimento de Metadados**: Mescla a origem do token (`TokenAgente`), nome original e timestamp de captura aos metadados antes da ingestão.
  - **Delegação ao Motor**: Constrói `IngestarMediaDTO` e invoca `IngestarMediaService::executar()`, acionando a máquina de estados, deduplicação por hash e mensagens assíncronas.
  - **Integração no Controller**: Atualizado [`src/Controller/IngestaoController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/IngestaoController.php) para injetar `IngestarPrintService` e retornar a entidade serializada via `MediaItemSerializer`.
- **Arquivos envolvidos**:
  - [`src/Service/IngestarPrintService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/IngestarPrintService.php)
  - [`src/Controller/IngestaoController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/IngestaoController.php)

### ✅ Tópico 84 — Script agente — estrutura base
- **Status**: Concluído
- **O que foi feito**:
  - **Estrutura Standalone do Agente**: Criado o diretório `agente/` na raiz do projeto com o script principal [`agente/agente.py`](file:///home/gabriel/dev/CirqueiraX/agente/agente.py).
  - **Módulo de Configuração**: Criado [`agente/config.py`](file:///home/gabriel/dev/CirqueiraX/agente/config.py) utilizando `python-dotenv` para carregar `SERVER_URL`, `AGENT_TOKEN`, `WATCH_DIR`, `DEBOUNCE_SECONDS` e `LOG_LEVEL`.
  - **Template de Ambiente e Dependências**: Criados [`agente/.env.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.example) e [`agente/requirements.txt`](file:///home/gabriel/dev/CirqueiraX/agente/requirements.txt) (`requests`, `watchdog`, `python-dotenv`).
- **Arquivos envolvidos**:
  - [`agente/agente.py`](file:///home/gabriel/dev/CirqueiraX/agente/agente.py)
  - [`agente/config.py`](file:///home/gabriel/dev/CirqueiraX/agente/config.py)
  - [`agente/.env.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.example)
  - [`agente/requirements.txt`](file:///home/gabriel/dev/CirqueiraX/agente/requirements.txt)

### ✅ Tópico 85 — Watcher de pasta com debounce (agente)
- **Status**: Concluído
- **O que foi feito**:
  - **Monitoramento do Sistema de Arquivos**: Criado o módulo [`agente/watcher.py`](file:///home/gabriel/dev/CirqueiraX/agente/watcher.py) utilizando `watchdog.observers.Observer` e `FileSystemEventHandler`.
  - **Filtro por Extensão**: Suporte automático para extensões de imagens de print (`.png`, `.jpg`, `.jpeg`, `.webp`).
  - **Mecanismo de Debounce por Thread**: Aguarda a estabilização do tamanho do arquivo durante o período configurado (`DEBOUNCE_SECONDS`, padrão 3s) antes de autorizar o envio, garantindo que capturas em escrita não sejam enviadas truncadas.
- **Arquivos envolvidos**:
  - [`agente/watcher.py`](file:///home/gabriel/dev/CirqueiraX/agente/watcher.py)

### ✅ Tópico 86 — Cliente HTTP do agente — envio autenticado e retry
- **Status**: Concluído
- **O que foi feito**:
  - **Cliente HTTP Dedicado**: Criado o módulo [`agente/cliente.py`](file:///home/gabriel/dev/CirqueiraX/agente/cliente.py) utilizando a biblioteca `requests`.
  - **Autenticação e Multipart**: Insere o header `X-Agent-Token` com o token configurado e envia a imagem em `multipart/form-data` com os campos `nomeOriginal` e `timestampCaptura`.
  - **Estratégia de Retry com Backoff**: Implementado loop de até 3 tentativas com *exponential backoff* (`2^tentativa` segundos) em caso de falhas de conexão ou erros de servidor (HTTP 5xx), descartando retentativas infinitas em erros de validação (HTTP 4xx).
- **Arquivos envolvidos**:
  - [`agente/cliente.py`](file:///home/gabriel/dev/CirqueiraX/agente/cliente.py)

### ✅ Tópico 87 — Configuração do agente PC empresa
- **Status**: Concluído
- **O que foi feito**:
  - **Geração do Token de Serviço**: Gerado token de agente via comando Symfony `app:agente:gerar-token "Agente PC Empresa" print_empresa` com UUID `01a0dfe1-5320-7fcb-8c9e-1ed1c99b9b17` e origem `print_empresa`.
  - **Template de Configuração Específico**: Criado o arquivo [`agente/.env.empresa.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.empresa.example) pré-configurado com a origem `print_empresa` e chave de acesso dedicada para a máquina de trabalho da empresa.
- **Arquivos envolvidos**:
  - [`agente/.env.empresa.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.empresa.example)

### ✅ Tópico 88 — Configuração do agente PC pessoal
- **Status**: Concluído
- **O que foi feito**:
  - **Geração do Token de Serviço**: Gerado token de agente via comando Symfony `app:agente:gerar-token "Agente PC Pessoal" print_pessoal` com UUID `01a0dfe1-71da-7336-a4b5-b577aeb8741f` e origem `print_pessoal`.
  - **Template de Configuração Específico**: Criado o arquivo [`agente/.env.pessoal.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.pessoal.example) pré-configurado com a origem `print_pessoal` e chave de acesso dedicada para a máquina de uso pessoal.
- **Arquivos envolvidos**:
  - [`agente/.env.pessoal.example`](file:///home/gabriel/dev/CirqueiraX/agente/.env.pessoal.example)

### ✅ Tópico 89 — Persistência local do agente — evitar reenvio
- **Status**: Concluído
- **O que foi feito**:
  - **Módulo de Estado Local**: Criado [`agente/estado.py`](file:///home/gabriel/dev/CirqueiraX/agente/estado.py) para cálculo do hash SHA-256 e persistência thread-safe dos arquivos enviados em arquivo JSON (`STATE_FILE`).
  - **Deduplicação de Envio**: Atualizado [`agente/cliente.py`](file:///home/gabriel/dev/CirqueiraX/agente/cliente.py) para consultar `ja_enviado()` antes de iniciar o envio HTTP e registrar `marcar_enviado()` no sucesso (HTTP 200/201), evitando redundância e consumo desnecessário de rede.
- **Arquivos envolvidos**:
  - [`agente/estado.py`](file:///home/gabriel/dev/CirqueiraX/agente/estado.py)
  - [`agente/cliente.py`](file:///home/gabriel/dev/CirqueiraX/agente/cliente.py)

### ✅ Tópico 90 — Execução do agente como serviço do SO
- **Status**: Concluído
- **O que foi feito**:
  - **Modelos de Serviço Nativo**: Criados os arquivos de configuração de serviço em `agente/servico/`:
    - [`agente/servico/cirqueirax-agente.service`](file:///home/gabriel/dev/CirqueiraX/agente/servico/cirqueirax-agente.service) (Systemd unit file para Linux)
    - [`agente/servico/com.cirqueirax.agente.plist`](file:///home/gabriel/dev/CirqueiraX/agente/servico/com.cirqueirax.agente.plist) (Launchd plist para macOS)
  - **Scripts de Instalação Automatizada**:
    - [`agente/servico/instalar-servico-linux.sh`](file:///home/gabriel/dev/CirqueiraX/agente/servico/instalar-servico-linux.sh) (instalação e inicialização de serviço systemd no modo user)
    - [`agente/servico/instalar-servico-windows.bat`](file:///home/gabriel/dev/CirqueiraX/agente/servico/instalar-servico-windows.bat) (registro de tarefa de inicialização automática no Agendador de Tarefas do Windows)
- **Arquivos envolvidos**:
  - [`agente/servico/cirqueirax-agente.service`](file:///home/gabriel/dev/CirqueiraX/agente/servico/cirqueirax-agente.service)
  - [`agente/servico/com.cirqueirax.agente.plist`](file:///home/gabriel/dev/CirqueiraX/agente/servico/com.cirqueirax.agente.plist)
  - [`agente/servico/instalar-servico-linux.sh`](file:///home/gabriel/dev/CirqueiraX/agente/servico/instalar-servico-linux.sh)
  - [`agente/servico/instalar-servico-windows.bat`](file:///home/gabriel/dev/CirqueiraX/agente/servico/instalar-servico-windows.bat)

### ✅ Tópico 91 — Cadastro das OrigemRegra para print_empresa e print_pessoal
- **Status**: Concluído
- **O que foi feito**:
  - **Command de Seeding**: Criado o comando Symfony [`src/Command/SeedOrigemRegrasCommand.php`](file:///home/gabriel/dev/CirqueiraX/src/Command/SeedOrigemRegrasCommand.php) (`app:seed:origem-regras`).
  - **Categorias Automáticas**: Garante a existência das categorias `Print Empresa` (pasta `prints/empresa`) e `Print Pessoal` (pasta `prints/pessoal`).
  - **Mapeamento de Regras de Origem**: Cadastra e vincula as instâncias de `OrigemRegra` no banco de dados para `print_empresa` e `print_pessoal`, garantindo que os prints ingeridos pelos agentes sejam classificados e distribuídos automaticamente sem necessidade de triagem manual.
- **Arquivos envolvidos**:
  - [`src/Command/SeedOrigemRegrasCommand.php`](file:///home/gabriel/dev/CirqueiraX/src/Command/SeedOrigemRegrasCommand.php)

### ✅ Tópico 92 — Endpoint POST /api/v1/media-itens/upload (upload manual)
- **Status**: Concluído
- **O que foi feito**:
  - **Endpoint HTTP POST**: Adicionada a rota `POST /api/v1/media-itens/upload` (`api_media_itens_upload_manual`) em [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/MediaItemController.php) para aceitar requisições de upload manual (`multipart/form-data`).
  - **Processamento de Ingestão**: Recebe a requisição, executa validações de DTO, salva o arquivo temporário, gera a metadata de envio e retorna envelope HTTP 201 Created via `$this->created()` com os dados serializados da nova mídia.
- **Arquivos envolvidos**:
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/MediaItemController.php)

### ✅ Tópico 93 — UploadManualDTO e validação de tipo de arquivo
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Upload Manual**: Criado [`src/DataObject/UploadManualDTO.php`](file:///home/gabriel/dev/CirqueiraX/src/DataObject/UploadManualDTO.php) (`final readonly class`) para capturar requisições de arquivos via formulário.
  - **Validação Estrita de Mídia**: Aplicadas as validações `#[Assert\NotNull]` para a presença do arquivo e `#[Assert\File(maxSize: '100M')]` com suporte completo para extensões de imagens (`PNG`, `JPEG`, `WebP`, `GIF`) e vídeos (`MP4`, `WebM`, `MOV`, `AVI`, `MKV`).
  - **Método de Extração `fromRequest()`**: Extrai de maneira limpa o arquivo, nome original, `categoriaId` desejada e metadados adicionais em formato array/JSON.
- **Arquivos envolvidos**:
  - [`src/DataObject/UploadManualDTO.php`](file:///home/gabriel/dev/CirqueiraX/src/DataObject/UploadManualDTO.php)

### ⏳ Tópico 94 — UploadManualService — checagem de duplicidade por hash
- **Status**: Pendente

### ⏳ Tópico 95 — Resposta de duplicidade (aviso, não bloqueio)
- **Status**: Pendente

### ⏳ Tópico 96 — Frontend — estrutura da feature upload-manual
- **Status**: Pendente

### ⏳ Tópico 97 — Frontend — componente de dropzone
- **Status**: Pendente

### ⏳ Tópico 98 — Frontend — fila de triagem pós-upload
- **Status**: Pendente

### ⏳ Tópico 99 — Frontend — página UploadManual.tsx completa
- **Status**: Pendente

### ⏳ Tópico 100 — Teste end-to-end de agentes e upload manual, documentação atualizada
- **Status**: Pendente
