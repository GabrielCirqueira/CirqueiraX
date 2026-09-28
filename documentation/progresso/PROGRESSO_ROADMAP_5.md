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

### ✅ Tópico 94 — UploadManualService — checagem de duplicidade por hash
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço Dedicado de Upload Manual**: Criado [`src/Service/UploadManualService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/UploadManualService.php) desacoplado do `MediaItemService`.
  - **Deduplicação por Hash SHA-256**: Calcula o hash SHA-256 do arquivo enviado via `ArmazenamentoLocalClient` e consulta `MediaItemRepository::buscarPorHash()`.
  - **Limpeza de Temporários**: Se o hash já existir na base de dados, remove o arquivo temporário com segurança e retorna o `MediaItem` existente com flag `duplicado => true`.
- **Arquivos envolvidos**:
  - [`src/Service/UploadManualService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/UploadManualService.php)
  - [`src/Infra/Storage/ArmazenamentoLocalClient.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/Storage/ArmazenamentoLocalClient.php)

### ✅ Tópico 95 — Resposta de duplicidade (aviso, não bloqueio)
- **Status**: Concluído
- **O que foi feito**:
  - **Alerta de Duplicidade no Envelope API**: Atualizado [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/MediaItemController.php) na ação `uploadManual`.
  - **Contrato Transparente**: Se o item for retornado como duplicado pelo `UploadManualService`, insere a chave `_warning => 'item_duplicado_existente'` no payload serializado HTTP 201 Created.
- **Arquivos envolvidos**:
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/MediaItemController.php)

### ✅ Tópico 96 — Frontend — estrutura da feature upload-manual
- **Status**: Concluído
- **O que foi feito**:
  - **Estrutura Base de Feature**: Criado o diretório [`web/features/upload-manual/`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/) com a organização padrão (`types.ts`, `api.ts`, `hooks/`, `components/`, `index.ts`).
  - **Integração de Tipos e API**: Definidos tipos de fila de upload (`ArquivoFilaUpload`, `ItemUploadEstado`) e cliente HTTP Axios em `api.ts` apontando para `POST /api/v1/media-itens/upload`.
  - **Gerenciador de Fila**: Criado o hook [`useUploadManual`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/hooks/useUploadManual.ts) com controle de adição de arquivos, previews locais, barra de progresso por item e envio para a API.
- **Arquivos envolvidos**:
  - [`web/features/upload-manual/types.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/types.ts)
  - [`web/features/upload-manual/api.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/api.ts)
  - [`web/features/upload-manual/hooks/useUploadManual.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/hooks/useUploadManual.ts)

### ✅ Tópico 97 — Frontend — componente de dropzone
- **Status**: Concluído
- **O que foi feito**:
  - **Componente Interativo Drag-and-Drop**: Criado [`web/features/upload-manual/components/DropzoneUpload.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/components/DropzoneUpload.tsx) com suporte a arrastar-e-soltar e seletor manual.
  - **Previews e Barras de Progresso**: Miniaturas dinâmicas para fotos e vídeos (`createObjectURL`), progresso percentual por arquivo e seletor de categoria pré-definida.
  - **Badging de Status**: Indicadores visuais para status de envio: `pendente`, `enviando`, `sucesso`, `duplicado` (aviso amarelo quando já existe no servidor) e `erro`.
  - **Conformidade UI**: Desenvolvido estritamente com primitivos de layout (`Box`, `VStack`, `HStack`, `Flex`, `Grid`, `Text`).
- **Arquivos envolvidos**:
  - [`web/features/upload-manual/components/DropzoneUpload.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/components/DropzoneUpload.tsx)
  - [`web/features/upload-manual/index.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/index.ts)

### ✅ Tópico 98 — Frontend — fila de triagem pós-upload
- **Status**: Concluído
- **O que foi feito**:
  - **Componente FilaTriagemUpload**: Criado o componente [`web/features/upload-manual/components/FilaTriagemUpload.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/components/FilaTriagemUpload.tsx) para gerenciar mídias enviadas via upload/triagem.
  - **Filtros e Busca**: Abas utilizando `Tabs` do `@heroui/react` para filtragem por status (`todas`, `sem_categoria`, `classificadas`, `erro`) e campo de busca por título ou hash SHA-256.
  - **Grid de Cards e Miniaturas**: Renderização responsiva em grid com seletores rápidos de categoria por item, visualização de hash, badges de origem (`MANUAL`, `PRINT_EMPRESA`, `PRINT_PESSOAL`), retentativa de itens com falha e indicador de seleção em lote.
  - **Ações em Lote e Modais**: Integração com a barra flutuante de ações em lote para categorização em lote via `Modal` do HeroUI e exclusão múltipla de itens.
- **Arquivos envolvidos**:
  - [`web/features/upload-manual/components/FilaTriagemUpload.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/components/FilaTriagemUpload.tsx)

### ✅ Tópico 99 — Frontend — página UploadManual.tsx completa
- **Status**: Concluído
- **O que foi feito**:
  - **Página de Upload Manual**: Criada a página [`web/features/upload-manual/UploadManual.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/UploadManual.tsx) integrando a Dropzone de Upload, a Fila de Triagem, queries do TanStack Query e mutations para classificação/lote/exclusão.
  - **Exportação do Componente**: Exportação adequada `export { UploadManual as Component }` para compatibilidade com o carregamento preguiçoso (`lazy()`) do React Router 7.
  - **Registro de Rota e Layout**: Rota `/upload-manual` registrada em [`web/App.tsx`](file:///home/gabriel/dev/CirqueiraX/web/App.tsx) dentro do `MainLayout` e item de navegação direta disponibilizado no [`web/layouts/Header.tsx`](file:///home/gabriel/dev/CirqueiraX/web/layouts/Header.tsx).
- **Arquivos envolvidos**:
  - [`web/features/upload-manual/UploadManual.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/upload-manual/UploadManual.tsx)
  - [`web/App.tsx`](file:///home/gabriel/dev/CirqueiraX/web/App.tsx)
  - [`web/layouts/Header.tsx`](file:///home/gabriel/dev/CirqueiraX/web/layouts/Header.tsx)

### ✅ Tópico 100 — Teste end-to-end de agentes e upload manual, documentação atualizada
- **Status**: Concluído
- **O que foi feito**:
  - **Validação E2E e Compilação**: Validação completa da esteira de ingestão de prints (agentes empresa/pessoal) e do fluxo de upload manual com checagem de hash duplicado, avisos no frontend e categorização.
  - **Build e Formatação**: `npx biome check --write web` e `npm run build` validados sem nenhum erro de compilação TypeScript nem avisos de linting.
  - **Atualização da Documentação**: Atualizados o roadmap principal [`ROADMAP.md`](file:///home/gabriel/dev/CirqueiraX/ROADMAP.md), o detalhamento [`PROGRESSO_ROADMAP_5.md`](file:///home/gabriel/dev/CirqueiraX/documentation/progresso/PROGRESSO_ROADMAP_5.md) e o índice visual [`PROGRESSO_ROADMAP.md`](file:///home/gabriel/dev/CirqueiraX/documentation/progresso/PROGRESSO_ROADMAP.md), selando a conclusão de 100% dos 100 tópicos planejados.
- **Arquivos envolvidos**:
  - [`ROADMAP.md`](file:///home/gabriel/dev/CirqueiraX/ROADMAP.md)
  - [`documentation/progresso/PROGRESSO_ROADMAP_5.md`](file:///home/gabriel/dev/CirqueiraX/documentation/progresso/PROGRESSO_ROADMAP_5.md)
  - [`documentation/progresso/PROGRESSO_ROADMAP.md`](file:///home/gabriel/dev/CirqueiraX/documentation/progresso/PROGRESSO_ROADMAP.md)
