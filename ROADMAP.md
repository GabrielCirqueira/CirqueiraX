# Roadmap — Feature 2: Motor de Classificação e Roteamento

> Backlog e planejamento do projeto. Cada tópico descreve o que existe (ou faltava), por que importa e o que precisa acontecer. Marque `[x]` no checklist ao concluir.

**Numeração:** tópicos 41–60.

**Índice visual:** [PROGRESSO_ROADMAP.md](documentation/progresso/PROGRESSO_ROADMAP.md) · **Detalhamento:** [PROGRESSO_ROADMAP_3.md](documentation/progresso/PROGRESSO_ROADMAP_3.md)

---

## Índice

| # | Tópico |
|---|---|
| 41 | CRUD completo de Categoria (Service, Controller, Serializer) |
| 42 | Endpoints REST de Categoria (`/api/v1/categorias`) |
| 43 | CRUD completo de OrigemRegra (Service, Controller, Serializer) |
| 44 | DTO de ingestão e cálculo de hash do arquivo |
| 45 | IngestarMediaService — deduplicação e criação do MediaItem |
| 46 | Mensagem ClassificarMediaMessage e dispatch da ingestão |
| 47 | Máquina de estados — método transicionarPara() no MediaItem |
| 48 | Histórico de transições de status (auditoria) |
| 49 | ClassificarMediaMessageHandler — aplicação de OrigemRegra automática |
| 50 | Fluxo de classificação manual (categoria pendente) |
| 51 | Dispatch paralelo — DistribuirLocalMessage e EnviarGoogleFotosMessage |
| 52 | DistribuirLocalMessageHandler e DistribuirLocalService |
| 53 | GoogleFotosOAuthService — renovação automática de access token |
| 54 | GoogleFotosAlbumService — criarOuObter() via albums.create |
| 55 | EnviarGoogleFotosMessageHandler e EnviarGoogleFotosService |
| 56 | Gravação do google_photos_media_id após upload |
| 57 | Captura de exceção nos handlers — erro_motivo e status erro |
| 58 | Comando CLI app:media:retentar |
| 59 | Endpoint de retry — individual e em lote |
| 60 | Teste end-to-end do motor completo e documentação atualizada |

---

## Checklist

- [x] **41. CRUD completo de Categoria (Service, Controller, Serializer)**
- [x] **42. Endpoints REST de Categoria (`/api/v1/categorias`)**
- [x] **43. CRUD completo de OrigemRegra (Service, Controller, Serializer)**
- [x] **44. DTO de ingestão e cálculo de hash do arquivo**
- [x] **45. IngestarMediaService — deduplicação e criação do MediaItem**
- [x] **46. Mensagem ClassificarMediaMessage e dispatch da ingestão**
- [x] **47. Máquina de estados — método transicionarPara() no MediaItem**
- [x] **48. Histórico de transições de status (auditoria)**
- [x] **49. ClassificarMediaMessageHandler — aplicação de OrigemRegra automática**
- [x] **50. Fluxo de classificação manual (categoria pendente)**
- [x] **51. Dispatch paralelo — DistribuirLocalMessage e EnviarGoogleFotosMessage**
- [ ] **52. DistribuirLocalMessageHandler e DistribuirLocalService**
- [ ] **53. GoogleFotosOAuthService — renovação automática de access token**
- [ ] **54. GoogleFotosAlbumService — criarOuObter() via albums.create**
- [ ] **55. EnviarGoogleFotosMessageHandler e EnviarGoogleFotosService**
- [ ] **56. Gravação do google_photos_media_id após upload**
- [ ] **57. Captura de exceção nos handlers — erro_motivo e status erro**
- [ ] **58. Comando CLI app:media:retentar**
- [ ] **59. Endpoint de retry — individual e em lote**
- [ ] **60. Teste end-to-end do motor completo e documentação atualizada**

---

## Detalhamento

### Tópico 41 — CRUD completo de Categoria (Service, Controller, Serializer)

**O que existe hoje:** entidade `Categoria`, `CriarCategoriaDTO` e `CategoriaRepository` já criados na Feature 1 (tópico 35), mas sem camada de aplicação nem exposição via API.

**Por que importa:** o motor de roteamento não tem como funcionar sem categorias cadastráveis — é o registro que liga origem → pasta local → álbum Google Fotos.

**O que precisa acontecer:** `AtualizarCategoriaDTO`, `CategoriaService` (`criar`, `atualizar`, `remover`, seguindo `executar()`), `CategoriaSerializer` com `normalizar()`/`normalizarLista()`.

---

### Tópico 42 — Endpoints REST de Categoria (`/api/v1/categorias`)

**O que existe hoje:** nenhum controller de categoria — só a camada de serviço do tópico anterior.

**Por que importa:** o dashboard (Feature 5) e o cadastro inicial de categorias (X, Y, Z) precisam de uma API pra existir de fato.

**O que precisa acontecer:** `CategoriaController extends DefaultController` com `GET /api/v1/categorias` (paginado), `POST`, `PATCH /{id}`, `DELETE /{id}`, respeitando o envelope `{success, data}`.

---

### Tópico 43 — CRUD completo de OrigemRegra (Service, Controller, Serializer)

**O que existe hoje:** entidade `OrigemRegra`, `CriarOrigemRegraDTO` e `OrigemRegraRepository` já criados na Feature 1 (tópico 36), sem camada de aplicação.

**Por que importa:** é o que os agentes de print (Feature 4) vão consultar pra saber a categoria automática de cada origem — precisa estar gerenciável antes dos agentes existirem.

**O que precisa acontecer:** `OrigemRegraService`, `OrigemRegraController`, `OrigemRegraSerializer`, seguindo o mesmo padrão do tópico 41.

---

### Tópico 44 — DTO de ingestão e cálculo de hash do arquivo

**O que existe hoje:** `CriarMediaItemDTO` existe (Feature 1, tópico 34), mas nenhum serviço calcula hash de arquivo real nem valida duplicidade.

**Por que importa:** o hash é a chave de deduplicação de todo o pipeline — sem ele, o mesmo vídeo/print pode ser processado duas vezes.

**O que precisa acontecer:** `IngestarMediaDTO` (caminho do arquivo temporário, origem, metadata), função de hash (sha256) aplicada ao conteúdo do arquivo antes de qualquer persistência.

---

### Tópico 45 — IngestarMediaService — deduplicação e criação do MediaItem

**O que existe hoje:** `MediaItemRepository::buscarPorHash()` já existe (Feature 1, tópico 34), mas nenhum service o usa.

**Por que importa:** é o ponto de entrada único de qualquer mídia no sistema, chamado pelos três módulos de origem (download, print, upload manual).

**O que precisa acontecer:** `IngestarMediaService::executar()` — early return se hash já existir, senão cria `MediaItem` com status `RECEBIDO` e despacha `ClassificarMediaMessage`.

---

### Tópico 46 — Mensagem ClassificarMediaMessage e dispatch da ingestão

**O que existe hoje:** infraestrutura do Messenger pronta (Feature 1, tópicos 21–23), mas nenhuma mensagem de domínio criada ainda.

**Por que importa:** é o que desacopla a ingestão (rápida, síncrona) da classificação (pode envolver regra de negócio mais pesada), sem travar quem está enviando o arquivo.

**O que precisa acontecer:** classe `ClassificarMediaMessage` (payload: UUID do `MediaItem`) em `src/Message/`, dispatch no fim do `IngestarMediaService`.

---

### Tópico 47 — Máquina de estados — método transicionarPara() no MediaItem

**O que existe hoje:** enum `StatusMediaItem` já existe (Feature 1, tópico 37) com `isFinal()`, mas a entidade `MediaItem` ainda troca de status livremente via setter, sem validação de transição.

**Por que importa:** evita bug de concorrência entre workers (ex: um worker marcar `concluido` enquanto outro ainda está processando `distribuindo`).

**O que precisa acontecer:** método `transicionarPara(StatusMediaItem $novoStatus)` na entidade, com mapa de transições permitidas e exceção de domínio se a transição for inválida.

---

### Tópico 48 — Histórico de transições de status (auditoria)

**O que existe hoje:** nenhuma trilha de auditoria — só o `status` atual é guardado.

**Por que importa:** quando algo dá errado no meio do pipeline, saber quando cada etapa aconteceu é essencial pra depurar (e pro dashboard mostrar "quanto tempo demorou até o Google Fotos").

**O que precisa acontecer:** campo `historico_status` em JSON no `MediaItem` (ou tabela `media_item_transicao` separada, se o volume justificar), populado dentro de `transicionarPara()`.

---

### Tópico 49 — ClassificarMediaMessageHandler — aplicação de OrigemRegra automática

**O que existe hoje:** `OrigemRegra` cadastrável (tópico 43), mas nada consome essa regra ainda.

**Por que importa:** é o que permite prints do PC empresa/pessoal caírem na categoria certa sem decisão manual, como definido no design do sistema.

**O que precisa acontecer:** handler consome `ClassificarMediaMessage`, busca `OrigemRegra` pela origem do `MediaItem`; se existir, aplica a categoria automaticamente e transiciona pra `CLASSIFICADO`.

---

### Tópico 50 — Fluxo de classificação manual (categoria pendente)

**O que existe hoje:** nenhum tratamento para quando não existe `OrigemRegra` pra aquela origem (caso do bot de download e do upload manual).

**Por que importa:** vídeo baixado e upload manual não têm categoria automática — precisam ficar visíveis no dashboard aguardando decisão do usuário, sem travar o restante do pipeline.

**O que precisa acontecer:** quando não há `OrigemRegra`, o `MediaItem` permanece com `categoria_id` nulo e status `EM_FILA`; endpoint `PATCH /api/v1/media-itens/{id}/categoria` (usado manualmente) dispara a transição pra `CLASSIFICADO` e o restante do fluxo.

---

### Tópico 51 — Dispatch paralelo — DistribuirLocalMessage e EnviarGoogleFotosMessage

**O que existe hoje:** classificação funcional (tópicos 49–50), mas nenhuma mensagem de distribuição criada.

**Por que importa:** distribuição local (Syncthing) e upload (Google Fotos) são independentes entre si — uma não deve esperar a outra pra começar.

**O que precisa acontecer:** ao transicionar pra `CLASSIFICADO`, despachar as duas mensagens em paralelo (`DistribuirLocalMessage` e `EnviarGoogleFotosMessage`), cada uma com seu próprio ciclo de retry do Messenger.

---

### Tópico 52 — DistribuirLocalMessageHandler e DistribuirLocalService

**O que existe hoje:** volume Docker compartilhado com o Syncthing já configurado (Feature 1, tópico 27), mas nenhum código escreve nele ainda.

**Por que importa:** é a metade do pipeline que faz o arquivo chegar no celular via Syncthing.

**O que precisa acontecer:** `DistribuirLocalService` copia/move o arquivo pra `categoria.pastaLocal` (dentro de `MEDIA_STORAGE_PATH`), atualiza status pra `DISTRIBUIDO_LOCAL`; handler cuida só de extrair dados da mensagem e delegar ao service (lógica zero no handler).

---

### Tópico 53 — GoogleFotosOAuthService — renovação automática de access token

**O que existe hoje:** `ContaGoogleFotos` com `refresh_token` criptografado e cache de `access_token` (Feature 1, tópicos 31–33), mas nenhum serviço usa esse cache pra renovar automaticamente.

**Por que importa:** o access token do Google expira em ~1h — sem renovação automática, todo upload feito fora dessa janela falharia.

**O que precisa acontecer:** `GoogleFotosOAuthService::obterAccessTokenValido(ContaGoogleFotos $conta)` — retorna o cache se ainda válido (`accessTokenEstaValido()`), senão troca o `refresh_token` por um novo `access_token` via API do Google e atualiza o cache.

---

### Tópico 54 — GoogleFotosAlbumService — criarOuObter() via albums.create

**O que existe hoje:** `Categoria.googlePhotosAlbumId` existe como campo, mas nada preenche esse valor automaticamente.

**Por que importa:** cada categoria precisa de um álbum real no Google Fotos antes do primeiro upload — criar manualmente não escala pra novas categorias.

**O que precisa acontecer:** `GoogleFotosAlbumService::criarOuObter(Categoria $categoria)` — se `googlePhotosAlbumId` já existe, retorna; senão chama `albums.create` e persiste o id retornado na `Categoria`.

---

### Tópico 55 — EnviarGoogleFotosMessageHandler e EnviarGoogleFotosService

**O que existe hoje:** OAuth (tópico 53) e criação de álbum (tópico 54) prontos, mas nenhum upload de mídia implementado ainda.

**Por que importa:** é a outra metade do pipeline — o que efetivamente coloca a mídia no Google Fotos.

**O que precisa acontecer:** `EnviarGoogleFotosService` faz upload de bytes (`photoslibrary.appendonly`), `mediaItems.batchCreate` associando ao álbum da categoria, atualiza status pra `ENVIANDO_GOOGLE_FOTOS` durante o processo e `CONCLUIDO` ao final.

---

### Tópico 56 — Gravação do google_photos_media_id após upload

**O que existe hoje:** campo `googlePhotosMediaId` existe no `MediaItem` (Feature 1, tópico 34), mas nunca é preenchido.

**Por que importa:** sem esse id salvo, a reclassificação manual da Feature 5 (`batchAddMediaItems`/`batchRemoveMediaItems`) é impossível — a API só deixa mover itens que o próprio app enviou.

**O que precisa acontecer:** `EnviarGoogleFotosService` grava o `media_id` retornado pelo `batchCreate` no `MediaItem` antes de marcar como `CONCLUIDO`.

---

### Tópico 57 — Captura de exceção nos handlers — erro_motivo e status erro

**O que existe hoje:** nenhum tratamento de falha nos handlers de distribuição/upload — uma exceção hoje só cairia no retry padrão do Messenger sem registro legível.

**Por que importa:** sem motivo registrado, a fila de erros do dashboard (Feature 5) fica sem informação útil pra você decidir o que fazer.

**O que precisa acontecer:** try/catch nos handlers de distribuição e upload, gravando `erro_motivo` (mensagem da exceção) e transicionando pra `ERRO`; log correspondente no canal certo (`google_fotos` ou `syncthing`, do tópico 26).

---

### Tópico 58 — Comando CLI app:media:retentar

**O que existe hoje:** nenhuma forma de reprocessar um `MediaItem` que ficou em `ERRO`.

**Por que importa:** falhas transitórias (rede, rate limit do Google) não devem exigir reingestão manual do zero.

**O que precisa acontecer:** comando `app:media:retentar {uuid}` que volta o status pra `CLASSIFICADO` e redespacha as mensagens de distribuição/upload pendentes.

---

### Tópico 59 — Endpoint de retry — individual e em lote

**O que existe hoje:** só o comando CLI do tópico anterior — nada acessível pelo dashboard.

**Por que importa:** a fila de erros da Feature 5 precisa de um botão "tentar de novo" funcional, sem precisar entrar no servidor.

**O que precisa acontecer:** `POST /api/v1/media-itens/{id}/retentar` e `POST /api/v1/media-itens/lote/retentar` reaproveitando a lógica do comando CLI (tópico 58) através do mesmo service.

---

### Tópico 60 — Teste end-to-end do motor completo e documentação atualizada

**O que existe hoje:** peças individuais testáveis isoladamente, mas nenhuma validação do fluxo completo (ingestão → classificação → distribuição local → upload Google Fotos → concluído).

**Por que importa:** é o motor que toda Feature seguinte (3, 4 e 5) vai depender — um bug de integração aqui se propaga pra todo o resto do sistema.

**O que precisa acontecer:** teste manual (ou automatizado, se PHPUnit for reativado) simulando um `MediaItem` do início ao fim; `CIRQUEIRAX.md` e `DOCUMENTACAO_TECNICA.md` atualizados com os nomes reais das classes implementadas nesta feature.
