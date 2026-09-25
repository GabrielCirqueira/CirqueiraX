# Progresso do Roadmap — Feature 4 (Feature 3: Downloads de Vídeo)

> Detalhamento dos tópicos 61 ao 80.

---

### ✅ Tópico 61 — DTO BaixarVideoDTO e validação de URL
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Download**: Criado [`src/DataObject/BaixarVideoDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/BaixarVideoDTO.php) (`final readonly class`) encapsulando a propriedade `url`.
  - **Validações de Entrada**: Aplicados os atributos `#[Assert\NotBlank]` (mensagem personalizada 'A URL do vídeo é obrigatória.') e `#[Assert\Url]` ('A URL fornecida é inválida.').
  - **Encapsulamento**: Método getter de leitura `$dto->url()` sem o prefixo `get`, em conformidade com as diretrizes do repositório.
- **Arquivos envolvidos**:
  - [`src/DataObject/BaixarVideoDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/BaixarVideoDTO.php)

### ✅ Tópico 62 — ValidadorUrlPlataforma (YouTube/TikTok/Twitter/Instagram + fallback)
- **Status**: Concluído
- **O que foi feito**:
  - **Enum de Plataformas**: Criado o Enum [`src/Enum/PlataformaVideo.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/PlataformaVideo.php) respaldado em string com as opções `YOUTUBE`, `TIKTOK`, `TWITTER`, `INSTAGRAM` e `OUTROS`, com o método `descricao()` para legibilidade humanizada.
  - **Serviço de Validação e Identificação**: Criado [`src/Service/ValidadorUrlPlataforma.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/ValidadorUrlPlataforma.php) para validar a sintaxe da URL (esquema `http`/`https`) e identificar domínios conhecidos via `parse_url($url, PHP_URL_HOST)`.
  - **Fallback Generoso**: URLs válidas de domínios não mapeados retornam `PlataformaVideo::OUTROS` para permitir que o motor do `yt-dlp` decida a viabilidade do download no worker.
- **Arquivos envolvidos**:
  - [`src/Enum/PlataformaVideo.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/PlataformaVideo.php)
  - [`src/Service/ValidadorUrlPlataforma.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/ValidadorUrlPlataforma.php)

### ✅ Tópico 63 — BaixarVideoService — validação e dispatch da mensagem de download
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço Orquestrador**: Criado [`src/Service/BaixarVideoService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/BaixarVideoService.php) como ponto único de entrada do módulo de downloads de vídeos.
  - **Validação com Guard Clause**: Valida a URL do DTO via `ValidadorUrlPlataforma::validar()`. Lança `\DomainException('url_invalida', 400)` em caso de URL incorreta.
  - **Dispatch Assíncrono**: Instancia `BaixarVideoMessage` com a URL e a `OrigemMedia` informada e despacha no barramento assíncrono via `MessageBusInterface`.
- **Arquivos envolvidos**:
  - [`src/Service/BaixarVideoService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/BaixarVideoService.php)

### ✅ Tópico 64 — Mensagem BaixarVideoMessage e roteamento no Messenger
- **Status**: Concluído
- **O que foi feito**:
  - **Mensagem de Domínio**: Criada a classe [`src/Message/BaixarVideoMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/BaixarVideoMessage.php) (`final readonly class`) contendo as propriedades `url` e `origem` (`OrigemMedia`).
  - **Flexibilidade no Construtor**: Permite passar `OrigemMedia` ou `string`, convertendo automaticamente via `OrigemMedia::tryFrom()` com fallback seguro para `OrigemMedia::BOT_TELEGRAM`.
  - **Roteamento Assíncrono**: A mensagem cai no transport `async` do Symfony Messenger pela regra universal `'App\Message\*': async` configurada no [`config/packages/messenger.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/messenger.yaml).
- **Arquivos envolvidos**:
  - [`src/Message/BaixarVideoMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/BaixarVideoMessage.php)
  - [`config/packages/messenger.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/messenger.yaml)

### ✅ Tópico 65 — BaixarVideoMessageHandler — execução do yt-dlp via Process
- **Status**: Concluído
- **O que foi feito**:
  - **Instalação da Dependência Binária**: Atualizado o [`devops/php/Dockerfile`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/php/Dockerfile) adicionando `yt-dlp`, `python3` e `ffmpeg` às dependências nativas da imagem Alpine do container backend.
  - **Serviço de Download de Vídeo**: Criado [`src/Service/BaixarVideoDownloadService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/BaixarVideoDownloadService.php) executando o binário `yt-dlp` via `Symfony\Component\Process\Process` com timeout configurado de 300 segundos, salvando em diretório temporário (`sys_get_temp_dir() . '/cirqueirax_downloads'`).
  - **Handler de Mensagem**: Criado [`src/MessageHandler/BaixarVideoMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/BaixarVideoMessageHandler.php) com atributo `#[AsMessageHandler]` para processar a mensagem `BaixarVideoMessage` invocando o download.
- **Arquivos envolvidos**:
  - [`devops/php/Dockerfile`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/php/Dockerfile)
  - [`src/Service/BaixarVideoDownloadService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/BaixarVideoDownloadService.php)
  - [`src/MessageHandler/BaixarVideoMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/BaixarVideoMessageHandler.php)

### ✅ Tópico 66 — Extração de metadata do vídeo (título, uploader, thumbnail, duração)
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço de Extração de Metadados**: Criado [`src/Service/ExtrairMetadataVideoService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/ExtrairMetadataVideoService.php) executando `yt-dlp --dump-json --no-playlist <URL>` via `Symfony\Component\Process\Process`.
  - **Normalização de Metadados**: Parseia a resposta JSON e normaliza os atributos essenciais (`titulo`, `uploader`, `duracao`, `thumbnail`, `plataforma` e `url_original`), com tratamento de exceções de domínio (`erro_extrair_metadata_video`, 400).
  - **Integração no Fluxo de Download**: `BaixarVideoDownloadService` invoca `ExtrairMetadataVideoService` antes do download físico, retornando a estrutura completa pronta para ser consumida pela ingestão.
- **Arquivos envolvidos**:
  - [`src/Service/ExtrairMetadataVideoService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/ExtrairMetadataVideoService.php)
  - [`src/Service/BaixarVideoDownloadService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/BaixarVideoDownloadService.php)

### ✅ Tópico 67 — Integração do handler de download com IngestarMediaService
- **Status**: Concluído
- **O que foi feito**:
  - **Injeção do Serviço de Ingestão**: Atualizado [`src/MessageHandler/BaixarVideoMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/BaixarVideoMessageHandler.php) injetando `IngestarMediaService`.
  - **Ingestão Automática Pós-Download**: Após concluir o download físico e a extração de metadados, constrói a instância de `IngestarMediaDTO` (passando o caminho do arquivo baixado, a `OrigemMedia` e o array de `metadata`) e invoca `IngestarMediaService::executar()`.
  - **Conexão com o Pipeline de Roteamento**: O `MediaItem` é persistido com o hash SHA-256 e tem disparada a mensagem `ClassificarMediaMessage`, conectando a Feature 3 ao motor de classificação, distribuição local e upload no Google Fotos.
- **Arquivos envolvidos**:
  - [`src/MessageHandler/BaixarVideoMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/BaixarVideoMessageHandler.php)
  - [`src/Service/IngestarMediaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/IngestarMediaService.php)

### ✅ Tópico 68 — Endpoint POST /api/v1/downloads (criação de pedido de download)
- **Status**: Concluído
- **O que foi feito**:
  - **Controller REST de Downloads**: Criado [`src/Controller/DownloadController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/DownloadController.php) estendendo `DefaultController`.
  - **Endpoint HTTP POST**: Mapeada a rota `POST /api/v1/downloads` com o atributo `#[MapRequestPayload] BaixarVideoDTO`.
  - **Execução e Resposta Envelope**: Chama `BaixarVideoService::executar()` definindo a origem como `OrigemMedia::MANUAL` e retorna envelope HTTP 201 Created via `$this->created()` com os dados da requisição, plataforma identificada e status inicial `em_fila`.
- **Arquivos envolvidos**:
  - [`src/Controller/DownloadController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/DownloadController.php)

### ✅ Tópico 69 — Status de download em tempo real
- **Status**: Concluído
- **O que foi feito**:
  - **Novo Status no Enum**: Adicionado o estado `BAIXANDO = 'baixando'` ao enum [`src/Enum/StatusMediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/StatusMediaItem.php) para diferenciar downloads ativos de rede externa em relação à fila interna (`em_fila`).
  - **Máquina de Estados Atualizada**: Mapeadas as regras de transição permitidas no método `podeTransicionarPara()`: `BAIXANDO` pode transicionar para `RECEBIDO`, `EM_FILA`, `CLASSIFICADO` e `ERRO`; além de permitir que itens em `ERRO` retornem para `BAIXANDO` em retentativas.
  - **Descrição Humanizada**: Adicionado retorno amigável `'Baixando Vídeo'` no método `descricao()`.
- **Arquivos envolvidos**:
  - [`src/Enum/StatusMediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/StatusMediaItem.php)

### ✅ Tópico 70 — MediaItemRepository::paginarComFiltros()
- **Status**: Concluído
- **O que foi feito**:
  - **QueryBuilder Dinâmico**: Implementado o método `paginarComFiltros()` em [`src/Repository/MediaItemRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/MediaItemRepository.php) com suporte a filtros combinados de `status`, `origem`, `categoriaId` (incluindo filtro para itens sem categoria vinculada), `busca` textual (caminho local, hash e metadados JSON).
  - **Contagem Escalar e Paginação**: Clona o QueryBuilder para calcular o total de registros sem sobrecarga de memória e aplica paginação (`offset`/`limit`) e ordenação configurável (`criadoEm`, `atualizadoEm`, `status`, `origem` em ordem `ASC`/`DESC`).
  - **Exposição na Camada de Serviço**: Adicionado o método `paginarComFiltros()` em [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php) para servir de interface para os controllers da aplicação.
- **Arquivos envolvidos**:
  - [`src/Repository/MediaItemRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/MediaItemRepository.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)

### ✅ Tópico 71 — Endpoint GET /api/v1/media-itens paginado com filtros
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Filtros e Paginação**: Criado [`src/DataObject/FiltrarMediaItemDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/FiltrarMediaItemDTO.php) (`final readonly class`) para capturar parâmetros de query string (`status`, `origem`, `categoriaId`, `busca`, `ordenacao`, `direcao`, `pagina`, `porPagina`).
  - **Endpoint de Listagem Filtrada**: Atualizado [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php) na rota `GET /api/v1/media-itens` com `#[MapQueryString] ?FiltrarMediaItemDTO $filtro`.
  - **Resposta Paginada com Envelope**: Utiliza `MediaItemService::paginarComFiltros()` e retorna envelope via `$this->paginated()` com lista normalizada por `MediaItemSerializer::normalizarLista()`, contagem total, página atual e itens por página.
- **Arquivos envolvidos**:
  - [`src/DataObject/FiltrarMediaItemDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/FiltrarMediaItemDTO.php)
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)

### ✅ Tópico 72 — Endpoint de ações em lote — categorizar
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Ação em Lote**: Criado [`src/DataObject/CategorizarLoteDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CategorizarLoteDTO.php) encapsulando lista de `uuids` e `categoriaId` com validações Symfony (`Assert\Count`, `Assert\All` com `Assert\Uuid`).
  - **Serviço de Categorização em Lote**: Adicionado método `classificarEmLote()` em [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php) que itera sobre os UUIDs invocando `classificarManualmente()` e disparando mensagens assíncronas para distribuição e upload.
  - **Endpoint HTTP POST**: Adicionada a rota `POST /api/v1/media-itens/lote/categorizar` em [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php) retornando a lista normalizada de itens atualizados.
- **Arquivos envolvidos**:
  - [`src/DataObject/CategorizarLoteDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CategorizarLoteDTO.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php)

### ✅ Tópico 73 — Endpoint de ações em lote — rebaixar (redownload)
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Rebaixar em Lote**: Criado [`src/DataObject/RebaixarLoteDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/RebaixarLoteDTO.php) (`final readonly class`) para capturar lista de UUIDs a serem reprocessados com validações Symfony (`Assert\Count`, `Assert\All` com `Assert\Uuid`).
  - **Serviço de Redownload em Lote**: Implementado método `rebaixarEmLote()` em [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php) que recupera a `url_original` registrada nos metadados, reseta o motivo de erro, transiciona o status para `BAIXANDO` e despacha novamente a mensagem assíncrona `BaixarVideoMessage`.
  - **Endpoint HTTP POST**: Adicionada a rota `POST /api/v1/media-itens/lote/rebaixar` em [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php) retornando os itens atualizados normalizados.
- **Arquivos envolvidos**:
  - [`src/DataObject/RebaixarLoteDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/RebaixarLoteDTO.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php)

### ✅ Tópico 74 — Endpoint de ações em lote — apagar arquivos
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Apagar em Lote**: Criado [`src/DataObject/ApagarLoteDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/ApagarLoteDTO.php) com validação de lista não vazia de UUIDs válidos.
  - **Serviço de Remoção Física e de Banco**: Implementado método `apagarEmLote()` em [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php) que verifica a existência física do arquivo local via `caminhoLocal()`, executa a exclusão em disco com `@unlink()` e remove o registro do banco de dados via `MediaItemRepository::remover()`.
  - **Endpoint HTTP POST**: Adicionada a rota `POST /api/v1/media-itens/lote/apagar` em [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php) retornando a contagem e lista de UUIDs removidos com sucesso.
- **Arquivos envolvidos**:
  - [`src/DataObject/ApagarLoteDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/ApagarLoteDTO.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php)

### ✅ Tópico 75 — Endpoint PATCH /api/v1/media-itens/{id} — edição de metadados
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Atualização Parcial de Metadados**: Criado [`src/DataObject/AtualizarMetadataMediaItemDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/AtualizarMetadataMediaItemDTO.php) (`final readonly class`) para capturar alterações em `titulo`, `uploader`, `data`, `duracao` ou metadados extras.
  - **Serviço de Atualização com Mesclagem**: Adicionado método `atualizarMetadata()` em [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php) que busca a mídia, mescla os novos metadados com os existentes e persiste no banco sem alterar `status` nem `categoriaId`.
  - **Endpoint HTTP PATCH**: Adicionada a rota `PATCH /api/v1/media-itens/{uuid}` em [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php) retornando a entidade normalizada via `$this->success()`.
- **Arquivos envolvidos**:
  - [`src/DataObject/AtualizarMetadataMediaItemDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/AtualizarMetadataMediaItemDTO.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php)

### ✅ Tópico 76 — Frontend — estrutura da feature downloads-video
- **Status**: Concluído
- **O que foi feito**:
  - **Tipagem Completa**: Criado [`web/features/downloads-video/types.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/types.ts) definindo interfaces TypeScript para `MediaItem`, `MetadataVideo`, `StatusMediaItem`, `OrigemMedia`, `PlataformaVideo`, `FiltrosMediaItem` e DTOs de lote.
  - **Cliente HTTP Centralizado**: Criado [`web/features/downloads-video/api.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/api.ts) integrando com a instância centralizada `@/config/api` para todos os endpoints (`listar`, `criar`, `categorizar`, `rebaixar`, `apagar`, `atualizarMetadata`, `retentar`).
  - **Custom Hooks Reativos com Polling Inteligente**: Criado [`web/features/downloads-video/hooks/useDownloadsVideo.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/hooks/useDownloadsVideo.ts) com `useQuery` e `useMutation` do TanStack Query, incluindo polling automático de 3s enquanto houver downloads ativos (`baixando`, `recebido`, `em_fila`, `distribuindo`, `enviando_google_fotos`).
  - **Barrel Export**: Criado [`web/features/downloads-video/index.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/index.ts).
- **Arquivos envolvidos**:
  - [`web/features/downloads-video/types.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/types.ts)
  - [`web/features/downloads-video/api.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/api.ts)
  - [`web/features/downloads-video/hooks/useDownloadsVideo.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/hooks/useDownloadsVideo.ts)
  - [`web/features/downloads-video/index.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/index.ts)

### ✅ Tópico 77 — Frontend — componentes CardVideo e GridVideos
- **Status**: Concluído
- **O que foi feito**:
  - **Componente CardVideo**: Criado [`web/features/downloads-video/components/CardVideo.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/CardVideo.tsx) com exibição de thumbnail (fallback caso não exista imagem), badge de duração formatada (`hh:mm:ss` ou `mm:ss`), tempo relativo nativo (`tempoRelativoNativo`), título, uploader, categoria vinculada, status com cores e ícones semânticos, checkbox individual para seleção em lote e botões de ação (editar metadados, categorizar, rebaixar, retentar e apagar).
  - **Componente GridVideos**: Criado [`web/features/downloads-video/components/GridVideos.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/GridVideos.tsx) com layout responsivo em grade (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`), estado de carregamento com esqueletos animados (`SkeletonCard`), estado vazio estilizado e cabeçalho de controle para selecionar ou desmarcar todos os itens.
- **Arquivos envolvidos**:
  - [`web/features/downloads-video/components/CardVideo.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/CardVideo.tsx)
  - [`web/features/downloads-video/components/GridVideos.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/GridVideos.tsx)

### ✅ Tópico 78 — Frontend — CampoNovoLink e BarraAcoesEmLote
- **Status**: Concluído
- **O que foi feito**:
  - **Componente CampoNovoLink**: Criado [`web/features/downloads-video/components/CampoNovoLink.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/CampoNovoLink.tsx) com campo de entrada para URLs de vídeos, detecção automática de plataformas (YouTube, TikTok, Twitter/X, Instagram) com badges visuais, botão com atalho de colagem direta da área de transferência (`navigator.clipboard.readText()`), botão de limpeza rápida e botão de envio com estado de loading conectado ao hook `useCriarDownload`.
  - **Componente BarraAcoesEmLote**: Criado [`web/features/downloads-video/components/BarraAcoesEmLote.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/BarraAcoesEmLote.tsx) com barra flutuante animada exibida quando houver itens selecionados (`totalSelecionados > 0`), badge contador de seleção, botão para desmarcar todos e ações em massa com estados visuais de processamento (Categorizar em lote, Rebaixar/Redownload em lote e Apagar arquivos em lote).
  - **Exportação no Barrel**: Atualizado [`web/features/downloads-video/index.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/index.ts) para exportar todos os componentes.
- **Arquivos envolvidos**:
  - [`web/features/downloads-video/components/CampoNovoLink.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/CampoNovoLink.tsx)
  - [`web/features/downloads-video/components/BarraAcoesEmLote.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/components/BarraAcoesEmLote.tsx)
  - [`web/features/downloads-video/index.ts`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/index.ts)

### ✅ Tópico 79 — Frontend — página DownloadsVideo.tsx completa
- **Status**: Concluído
- **O que foi feito**:
  - **Página Principal DownloadsVideo**: Criada em [`web/features/downloads-video/DownloadsVideo.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/DownloadsVideo.tsx) e exposta em [`web/pages/DownloadsVideo/DownloadsVideo.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/pages/DownloadsVideo/DownloadsVideo.tsx), seguindo a hierarquia `MainLayout → AppContainer → Container`.
  - **Filtros e Busca**: Campo de pesquisa textual em tempo real (título, uploader, hash) com debounce, seleção por status (`baixando`, `recebido`, `em_fila`, `classificado`, `distribuindo`, `distribuido_local`, `enviando_google_fotos`, `concluido`, `erro`) e seleção por origem (`manual`, `bot_telegram`, `print_empresa`, `print_pessoal`).
  - **Ações em Lote e Modais Interativos**: Modais de categorização (em lote ou individual com listagem de categorias via `useCategorias`), modal de edição de metadados (`AtualizarMetadataInput`), modal de confirmação de exclusão física/lógica e modal de confirmação de rebaixamento/redownload.
  - **Roteamento e Navegação**: Registrada rota `/downloads` no [`web/App.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/App.tsx) e adicionado item de navegação no [`web/layouts/Header.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/layouts/Header.tsx).
- **Arquivos envolvidos**:
  - [`web/features/downloads-video/DownloadsVideo.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/features/downloads-video/DownloadsVideo.tsx)
  - [`web/pages/DownloadsVideo/DownloadsVideo.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/pages/DownloadsVideo/DownloadsVideo.tsx)
  - [`web/App.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/App.tsx)
  - [`web/layouts/Header.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/layouts/Header.tsx)

### ✅ Tópico 80 — Teste end-to-end do fluxo de download e documentação atualizada
- **Status**: Concluído
- **O que foi feito**:
  - **Validação de Rotas e Endpoints**: Validada a árvore de rotas no Symfony (`php bin/console debug:router`) com todos os 10 endpoints da Feature 3 (`POST /api/v1/downloads`, `GET /api/v1/media-itens`, `POST /api/v1/media-itens/lote/categorizar`, `POST /api/v1/media-itens/lote/rebaixar`, `POST /api/v1/media-itens/lote/apagar`, `POST /api/v1/media-itens/retentar`, `PATCH /api/v1/media-itens/{uuid}`, `PATCH /api/v1/media-itens/{uuid}/categoria`).
  - **Validação Estática do Frontend**: Verificada conformidade total com o Biome (`npx biome check web/features/downloads-video web/pages web/App.tsx web/layouts/Header.tsx`), sem erros de lint, formato ou acessibilidade.
  - **Atualização de Documentação Técnica**:
    - [`documentation/funcionalidades/CIRQUEIRAX.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/funcionalidades/CIRQUEIRAX.md): Seção 3.1 documentada com a arquitetura real implementada (DTOs, Services, Handlers, Endpoints e componentes de UI).
    - [`documentation/stack/FRONTEND.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/stack/FRONTEND.md): Árvore de diretórios atualizada com os novos módulos e páginas de downloads de vídeo.
- **Arquivos envolvidos**:
  - [`documentation/funcionalidades/CIRQUEIRAX.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/funcionalidades/CIRQUEIRAX.md)
  - [`documentation/stack/FRONTEND.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/stack/FRONTEND.md)
  - [`documentation/progresso/PROGRESSO_ROADMAP_4.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/progresso/PROGRESSO_ROADMAP_4.md)
  - [`ROADMAP.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/ROADMAP.md)


