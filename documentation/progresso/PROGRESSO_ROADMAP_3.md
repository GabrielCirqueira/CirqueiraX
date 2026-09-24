# Progresso do Roadmap — Feature 3 (Feature 2: Motor de Classificação e Roteamento)

> Detalhamento dos tópicos 41 ao 60.

---

### ✅ Tópico 41 — CRUD completo de Categoria (Service, Controller, Serializer)
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Atualização**: Criado [`src/DataObject/AtualizarCategoriaDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/AtualizarCategoriaDTO.php) (`final readonly class`) para capturar alterações parciais em `nome`, `pastaLocal` e `googlePhotosAlbumId` com validações Symfony.
  - **Camada de Serialização**: Implementado [`src/Serializer/CategoriaSerializer.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Serializer/CategoriaSerializer.php) com métodos `normalizar()` e `normalizarLista()`, garantindo formato ISO-8601 em `criadoEm`/`atualizadoEm` e ocultando detalhes internos do banco.
  - **Serviço de Domínio (`CategoriaService`)**: Criado [`src/Service/CategoriaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/CategoriaService.php) concentrando as ações de negócio (`criar`, `atualizar`, `remover`, `buscarPorUuid`, `listarPaginado`), com validação de unicidade de nome (`categoria_nome_duplicado`, 409) e tratamento de entidade não encontrada (`categoria_nao_encontrada`, 404).
  - **Consulta Paginada no Repository**: Adicionado método `listarPaginado()` em [`src/Repository/CategoriaRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/CategoriaRepository.php) ordenando categorias por data de criação (`DESC`) e retornando total scalar + itens.
- **Arquivos envolvidos**:
  - [`src/DataObject/AtualizarCategoriaDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/AtualizarCategoriaDTO.php)
  - [`src/Serializer/CategoriaSerializer.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Serializer/CategoriaSerializer.php)
  - [`src/Service/CategoriaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/CategoriaService.php)
  - [`src/Repository/CategoriaRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/CategoriaRepository.php)

### ✅ Tópico 42 — Endpoints REST de Categoria (`/api/v1/categorias`)
- **Status**: Concluído
- **O que foi feito**:
  - **Controller REST**: Criado [`src/Controller/CategoriaController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/CategoriaController.php) estendendo `DefaultController` sob o prefixo `/api/v1/categorias`.
  - **Mapeamento de Rotas HTTP**:
    - `GET /api/v1/categorias`: Lista paginada via `CategoriaService::listarPaginado()` e envelope `$this->paginated()`.
    - `GET /api/v1/categorias/{uuid}`: Detalhes de categoria por UUID via `$this->success()`.
    - `POST /api/v1/categorias`: Criação com `#[MapRequestPayload] CriarCategoriaDTO` e envelope `$this->created()`.
    - `PATCH /api/v1/categorias/{uuid}`: Atualização parcial com `#[MapRequestPayload] AtualizarCategoriaDTO`.
    - `DELETE /api/v1/categorias/{uuid}`: Remoção com resposta HTTP 204 via `$this->noContent()`.
- **Arquivos envolvidos**:
  - [`src/Controller/CategoriaController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/CategoriaController.php)

### ✅ Tópico 43 — CRUD completo de OrigemRegra (Service, Controller, Serializer)
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Atualização**: Criado [`src/DataObject/AtualizarOrigemRegraDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/AtualizarOrigemRegraDTO.php) (`final readonly class`) para atualização de `origem` e `categoriaId`.
  - **Serialização de Regras de Origem**: Implementado [`src/Serializer/OrigemRegraSerializer.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Serializer/OrigemRegraSerializer.php) para normalização com vínculo resolvido de categoria.
  - **Serviço de Domínio (`OrigemRegraService`)**: Implementado [`src/Service/OrigemRegraService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/OrigemRegraService.php) garantindo unicidade de origem (`origem_regra_duplicada`, 409) e validação de existência da categoria vinculada.
  - **Controller REST**: Criado [`src/Controller/OrigemRegraController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/OrigemRegraController.php) exposto em `/api/v1/origem-regras` com suporte completo a `GET`, `POST`, `PATCH` e `DELETE`.
  - **Repositório**: Atualizado [`src/Repository/OrigemRegraRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/OrigemRegraRepository.php) com busca por `OrigemMedia` e método `listarPaginado()`.
- **Arquivos envolvidos**:
  - [`src/DataObject/AtualizarOrigemRegraDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/AtualizarOrigemRegraDTO.php)
  - [`src/Serializer/OrigemRegraSerializer.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Serializer/OrigemRegraSerializer.php)
  - [`src/Service/OrigemRegraService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/OrigemRegraService.php)
  - [`src/Controller/OrigemRegraController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/OrigemRegraController.php)
  - [`src/Repository/OrigemRegraRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/OrigemRegraRepository.php)

### ✅ Tópico 44 — DTO de ingestão e cálculo de hash do arquivo
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Ingestão**: Criado [`src/DataObject/IngestarMediaDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/IngestarMediaDTO.php) (`final readonly class`) encapsulando `caminhoArquivo`, `origem` (`OrigemMedia`) e array de `metadata`.
  - **Cálculo de Hash SHA-256**: Implementado método `calcularHash()` diretamente no DTO utilizando `hash_file('sha256')`, com validação de leitura física do arquivo e exceções de domínio tratadas (`arquivo_nao_encontrado`, 404).
- **Arquivos envolvidos**:
  - [`src/DataObject/IngestarMediaDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/IngestarMediaDTO.php)

### ✅ Tópico 45 — IngestarMediaService — deduplicação e criação do MediaItem
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço Único de Ingestão**: Criado [`src/Service/IngestarMediaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/IngestarMediaService.php) como porta de entrada comum para todos os módulos (downloads, prints e uploads).
  - **Deduplicação de Mídia**: O serviço consulta `MediaItemRepository::buscarPorHash()` usando o hash SHA-256 do arquivo; se a mídia já existir, realiza *early return* retornando o `MediaItem` existente sem duplicar registros no banco.
  - **Criação de Entidade**: Caso seja um novo arquivo, instancia `MediaItem` com status `RECEBIDO`, grava `caminhoLocal`, vincula `metadata` e persiste via `MediaItemRepository::salvar()`.
- **Arquivos envolvidos**:
  - [`src/Service/IngestarMediaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/IngestarMediaService.php)

### ✅ Tópico 46 — Mensagem ClassificarMediaMessage e dispatch da ingestão
- **Status**: Concluído
- **O que foi feito**:
  - **Mensagem do Barramento de Mensagens**: Criada a classe de mensagem [`src/Message/ClassificarMediaMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/ClassificarMediaMessage.php) (`final readonly class`) com o UUID da mídia persistida.
  - **Roteamento no Messenger**: Adicionado o mapeamento `'App\Message\*': async` em [`config/packages/messenger.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/messenger.yaml) direcionando todas as mensagens de domínio para o transport assíncrono.
  - **Dispatch na Ingestão**: Atualizado [`src/Service/IngestarMediaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/IngestarMediaService.php) injetando `MessageBusInterface` para disparar a mensagem `ClassificarMediaMessage` ao persistir novos itens de mídia.
- **Arquivos envolvidos**:
  - [`src/Message/ClassificarMediaMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/ClassificarMediaMessage.php)
  - [`config/packages/messenger.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/messenger.yaml)
  - [`src/Service/IngestarMediaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/IngestarMediaService.php)

### ✅ Tópico 47 — Máquina de estados — método transicionarPara() no MediaItem
- **Status**: Concluído
- **O que foi feito**:
  - **Validação de Transições no Enum**: Adicionado o método `podeTransicionarPara()` em [`src/Enum/StatusMediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/StatusMediaItem.php) mapeando as transições de estado permitidas durante todo o ciclo de vida.
  - **Validação na Entidade (`transicionarPara`)**: Implementado o método `transicionarPara()` em [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php) para validar transições de estado via máquina de estados, lançando `DomainException` (422) em caso de salto de estado inválido.
  - **Proteção do `setStatus`**: O método `setStatus()` foi refatorado para delegar diretamente para `transicionarPara()`, garantindo que toda alteração de status passe obrigatoriamente pela máquina de estados.
- **Arquivos envolvidos**:
  - [`src/Enum/StatusMediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/StatusMediaItem.php)
  - [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php)

### ✅ Tópico 48 — Histórico de transições de status (auditoria)
- **Status**: Concluído
- **O que foi feito**:
  - **Trilha de Auditoria em JSON**: Adicionado o campo `historicoStatus` (`json`) na entidade [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php) para registro cronológico de cada mudança de estado (`de`, `para`, `em` formato ISO-8601).
  - **Gravação Automática na Transição**: O construtor e o método `transicionarPara()` gravam automaticamente o snapshot de cada transição de status realizada.
  - **Migration do Banco de Dados**: Gerada a migration [`migrations/Version20260924134114.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924134114.php) e executada via `make migrate`, mantendo 100% de sincronismo no `doctrine:schema:validate`.
- **Arquivos envolvidos**:
  - [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php)
  - [`migrations/Version20260924134114.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924134114.php)

### ✅ Tópico 49 — ClassificarMediaMessageHandler — aplicação de OrigemRegra automática
- **Status**: Concluído
- **O que foi feito**:
  - **Handler do Messenger**: Criado o handler [`src/MessageHandler/ClassificarMediaMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/ClassificarMediaMessageHandler.php) com atributo `#[AsMessageHandler]` processando mensagens `ClassificarMediaMessage`.
  - **Classificação Automática**: O handler busca a `OrigemRegra` associada à `OrigemMedia` da mídia. Caso encontrada, aplica `categoriaId`, transiciona a mídia para o status `CLASSIFICADO` e persiste o registro.
  - **Tratamento de Categoria Pendente**: Se não houver regra pré-configurada para a origem, transiciona a mídia para o status `EM_FILA` aguardando classificação manual.
- **Arquivos envolvidos**:
  - [`src/MessageHandler/ClassificarMediaMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/ClassificarMediaMessageHandler.php)

### ✅ Tópico 50 — Fluxo de classificação manual (categoria pendente)
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Classificação Manual**: Criado [`src/DataObject/ClassificarManualDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/ClassificarManualDTO.php) (`final readonly class`) capturando `categoriaId` validada.
  - **Serviço de Negócio (`MediaItemService`)**: Criado [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php) com o método `classificarManualmente()` validando existência da mídia e da categoria, atribuindo o `categoriaId` e efetuando a transição de estado para `CLASSIFICADO`.
  - **Endpoint REST Dedicado**: Criado [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php) exposto em `PATCH /api/v1/media-itens/{uuid}/categoria` com suporte a `#[MapRequestPayload] ClassificarManualDTO`.
  - **Serializador de Mídia**: Criado [`src/Serializer/MediaItemSerializer.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Serializer/MediaItemSerializer.php) para normalizar propriedades de `MediaItem` incluindo vínculo resolvido de categoria e histórico de auditoria.
- **Arquivos envolvidos**:
  - [`src/DataObject/ClassificarManualDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/ClassificarManualDTO.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)
  - [`src/Controller/MediaItemController.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Controller/MediaItemController.php)
  - [`src/Serializer/MediaItemSerializer.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Serializer/MediaItemSerializer.php)

### ✅ Tópico 51 — Dispatch paralelo — DistribuirLocalMessage e EnviarGoogleFotosMessage
- **Status**: Concluído
- **O que foi feito**:
  - **Mensagens de Distribuição**: Criadas as mensagens do Messenger [`src/Message/DistribuirLocalMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/DistribuirLocalMessage.php) e [`src/Message/EnviarGoogleFotosMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/EnviarGoogleFotosMessage.php).
  - **Despacho em Paralelo na Classificação Automática**: Atualizado [`src/MessageHandler/ClassificarMediaMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/ClassificarMediaMessageHandler.php) para disparar ambas as mensagens assim que uma mídia é marcada como `CLASSIFICADO`.
  - **Despacho em Paralelo na Classificação Manual**: [`MediaItemService::classificarManualmente()`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php) também dispara os dois dispatches paralelos imediatamente após a atribuição manual da categoria.
- **Arquivos envolvidos**:
  - [`src/Message/DistribuirLocalMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/DistribuirLocalMessage.php)
  - [`src/Message/EnviarGoogleFotosMessage.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Message/EnviarGoogleFotosMessage.php)
  - [`src/MessageHandler/ClassificarMediaMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/ClassificarMediaMessageHandler.php)
  - [`src/Service/MediaItemService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/MediaItemService.php)

### ✅ Tópico 52 — DistribuirLocalMessageHandler e DistribuirLocalService
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço de Distribuição Local**: Criado [`src/Service/DistribuirLocalService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/DistribuirLocalService.php) que resolve a pasta local da categoria dentro de `MEDIA_STORAGE_PATH`, efetua a cópia física do arquivo, atualiza a propriedade `caminhoLocal`, realiza a transição de estado para `DISTRIBUIDO_LOCAL` e persiste o item.
  - **Handler Assíncrono Desacoplado**: Criado [`src/MessageHandler/DistribuirLocalMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/DistribuirLocalMessageHandler.php) com `#[AsMessageHandler]`, com zero regra de negócio, consumindo `DistribuirLocalMessage` e delegando a execução para `DistribuirLocalService`.
- **Arquivos envolvidos**:
  - [`src/Service/DistribuirLocalService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/DistribuirLocalService.php)
  - [`src/MessageHandler/DistribuirLocalMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/DistribuirLocalMessageHandler.php)

### ✅ Tópico 53 — GoogleFotosOAuthService — renovação automática de access token
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço de Gestão OAuth**: Criado [`src/Service/GoogleFotosOAuthService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/GoogleFotosOAuthService.php) com o método `obterAccessTokenValido(ContaGoogleFotos $conta)`.
  - **Reutilização de Cache e Refresh Automático**: O método verifica se o token em cache ainda está válido (`accessTokenEstaValido()`); se expirado ou ausente, descriptografa o `refreshTokenCriptografado` via `CriptografiaInterface`, realiza requisição POST para a API do Google (`https://oauth2.googleapis.com/token`) solicitando novo token de acesso, atualiza o cache e data de expiração na entidade `ContaGoogleFotos` e persiste as alterações.
- **Arquivos envolvidos**:
  - [`src/Service/GoogleFotosOAuthService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/GoogleFotosOAuthService.php)

### ✅ Tópico 54 — GoogleFotosAlbumService — criarOuObter() via albums.create
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço de Gestão de Álbuns**: Criado [`src/Service/GoogleFotosAlbumService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/GoogleFotosAlbumService.php) com o método `criarOuObter(Categoria $categoria, ?ContaGoogleFotos $conta = null)`.
  - **Criação sob Demanda no Google Fotos**: Se a `Categoria` já possui um `googlePhotosAlbumId`, retorna o ID existente imediatamente; caso contrário, obtém um token OAuth válido, invoca a API `POST https://photoslibrary.googleapis.com/v1/albums` enviando o nome da categoria como título do álbum, associa o `googlePhotosAlbumId` retornado à entidade `Categoria` e persiste no banco.
- **Arquivos envolvidos**:
  - [`src/Service/GoogleFotosAlbumService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/GoogleFotosAlbumService.php)
  - [`src/Repository/ContaGoogleFotosRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/ContaGoogleFotosRepository.php)

### ✅ Tópico 55 — EnviarGoogleFotosMessageHandler e EnviarGoogleFotosService
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço de Upload de Mídia**: Criado [`src/Service/EnviarGoogleFotosService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/EnviarGoogleFotosService.php) realizando o pipeline completo de envio de mídia para o Google Fotos.
  - **Upload em 2 Etapas e Gravação de ID**: Transiciona o status para `ENVIANDO_GOOGLE_FOTOS`, faz o envio de bytes via `POST https://photoslibrary.googleapis.com/v1/uploads` com `Content-Type: application/octet-stream`, efetua a chamada `POST https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate` vinculando a mídia ao álbum da categoria, grava o `googlePhotosMediaId` retornado na entidade `MediaItem`, transiciona o status para `CONCLUIDO` e persiste as alterações.
  - **Handler Assíncrono Desacoplado**: Criado [`src/MessageHandler/EnviarGoogleFotosMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/EnviarGoogleFotosMessageHandler.php) anotado com `#[AsMessageHandler]` para consumir `EnviarGoogleFotosMessage` delegando a execução para `EnviarGoogleFotosService`.
- **Arquivos envolvidos**:
  - [`src/Service/EnviarGoogleFotosService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/EnviarGoogleFotosService.php)
  - [`src/MessageHandler/EnviarGoogleFotosMessageHandler.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/MessageHandler/EnviarGoogleFotosMessageHandler.php)

### ⏳ Tópico 56 — Gravação do google_photos_media_id após upload
- **Status**: Pendente

### ⏳ Tópico 57 — Captura de exceção nos handlers — erro_motivo e status erro
- **Status**: Pendente

### ⏳ Tópico 58 — Comando CLI app:media:retentar
- **Status**: Pendente

### ⏳ Tópico 59 — Endpoint de retry — individual e em lote
- **Status**: Pendente

### ⏳ Tópico 60 — Teste end-to-end do motor completo e documentação atualizada
- **Status**: Pendente
