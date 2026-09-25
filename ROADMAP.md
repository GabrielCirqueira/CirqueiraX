# Roadmap — Feature 3: Downloads de Vídeo

> Backlog e planejamento do projeto. Cada tópico descreve o que existe (ou faltava), por que importa e o que precisa acontecer. Marque `[x]` no checklist ao concluir.

**Numeração:** tópicos 61–80.

**Índice visual:** [PROGRESSO_ROADMAP.md](documentation/progresso/PROGRESSO_ROADMAP.md) · **Detalhamento:** [PROGRESSO_ROADMAP_4.md](documentation/progresso/PROGRESSO_ROADMAP_4.md)

---

## Índice

| # | Tópico |
|---|---|
| 61 | DTO BaixarVideoDTO e validação de URL |
| 62 | ValidadorUrlPlataforma (YouTube/TikTok/Twitter/Instagram + fallback) |
| 63 | BaixarVideoService — validação e dispatch da mensagem de download |
| 64 | Mensagem BaixarVideoMessage e roteamento no Messenger |
| 65 | BaixarVideoMessageHandler — execução do yt-dlp via Process |
| 66 | Extração de metadata do vídeo (título, uploader, thumbnail, duração) |
| 67 | Integração do handler de download com IngestarMediaService |
| 68 | Endpoint POST /api/v1/downloads (criação de pedido de download) |
| 69 | Status de download em tempo real |
| 70 | MediaItemRepository::paginarComFiltros() |
| 71 | Endpoint GET /api/v1/media-itens paginado com filtros |
| 72 | Endpoint de ações em lote — categorizar |
| 73 | Endpoint de ações em lote — rebaixar (redownload) |
| 74 | Endpoint de ações em lote — apagar arquivos |
| 75 | Endpoint PATCH /api/v1/media-itens/{id} — edição de metadados |
| 76 | Frontend — estrutura da feature downloads-video |
| 77 | Frontend — componentes CardVideo e GridVideos |
| 78 | Frontend — CampoNovoLink e BarraAcoesEmLote |
| 79 | Frontend — página DownloadsVideo.tsx completa |
| 80 | Teste end-to-end do fluxo de download e documentação atualizada |

---

## Checklist

- [x] **61. DTO BaixarVideoDTO e validação de URL**
- [x] **62. ValidadorUrlPlataforma (YouTube/TikTok/Twitter/Instagram + fallback)**
- [x] **63. BaixarVideoService — validação e dispatch da mensagem de download**
- [x] **64. Mensagem BaixarVideoMessage e roteamento no Messenger**
- [x] **65. BaixarVideoMessageHandler — execução do yt-dlp via Process**
- [x] **66. Extração de metadata do vídeo (título, uploader, thumbnail, duração)**
- [x] **67. Integração do handler de download com IngestarMediaService**
- [x] **68. Endpoint POST /api/v1/downloads (criação de pedido de download)**
- [x] **69. Status de download em tempo real**
- [x] **70. MediaItemRepository::paginarComFiltros()**
- [x] **71. Endpoint GET /api/v1/media-itens paginado com filtros**
- [x] **72. Endpoint de ações em lote — categorizar**
- [x] **73. Endpoint de ações em lote — rebaixar (redownload)**
- [x] **74. Endpoint de ações em lote — apagar arquivos**
- [x] **75. Endpoint PATCH /api/v1/media-itens/{id} — edição de metadados**
- [x] **76. Frontend — estrutura da feature downloads-video**
- [x] **77. Frontend — componentes CardVideo e GridVideos**
- [x] **78. Frontend — CampoNovoLink e BarraAcoesEmLote**
- [x] **79. Frontend — página DownloadsVideo.tsx completa**
- [x] **80. Teste end-to-end do fluxo de download e documentação atualizada**

---

## Detalhamento

### Tópico 61 — DTO BaixarVideoDTO e validação de URL

**O que existe hoje:** nenhum DTO de entrada pra pedido de download — só o `IngestarMediaDTO` genérico (Feature 2), que espera um arquivo já em disco, não uma URL.

**Por que importa:** é o primeiro ponto de contato do usuário com o módulo de downloads — precisa validar a URL antes de qualquer processamento custoso.

**O que precisa acontecer:** `BaixarVideoDTO` (`final readonly class`) com campo `url`, validado com `Assert\NotBlank` e `Assert\Url`.

---

### Tópico 62 — ValidadorUrlPlataforma (YouTube/TikTok/Twitter/Instagram + fallback)

**O que existe hoje:** nenhuma checagem de plataforma suportada — qualquer string passaria como URL válida.

**Por que importa:** evita que o worker gaste tempo tentando baixar de um domínio que o `yt-dlp` não suporta, e dá feedback rápido pro usuário.

**O que precisa acontecer:** `ValidadorUrlPlataforma` com whitelist/regex pras plataformas citadas + fallback aceitando qualquer domínio (deixa o `yt-dlp` decidir na prática, mas registra a tentativa).

---

### Tópico 63 — BaixarVideoService — validação e dispatch da mensagem de download

**O que existe hoje:** DTO e validador prontos (tópicos 61–62), mas nenhum service orquestrando o pedido.

**Por que importa:** é o ponto único de entrada do módulo de downloads, seguindo o mesmo padrão `Service::executar()` já usado em `CategoriaService`/`MediaItemService`.

**O que precisa acontecer:** `BaixarVideoService::executar(BaixarVideoDTO $dto)` — valida a URL via `ValidadorUrlPlataforma`, cria um registro provisório (ou aguarda o handler criar o `MediaItem`), despacha `BaixarVideoMessage`.

---

### Tópico 64 — Mensagem BaixarVideoMessage e roteamento no Messenger

**O que existe hoje:** infraestrutura de mensagens já madura (Feature 2 — `ClassificarMediaMessage`, `DistribuirLocalMessage`, `EnviarGoogleFotosMessage`, roteamento `App\Message\*` já configurado no `messenger.yaml`).

**Por que importa:** o download em si pode demorar (arquivo grande, plataforma lenta) — não pode rodar no ciclo de vida do request HTTP.

**O que precisa acontecer:** classe `BaixarVideoMessage` (payload: `url`, `origem`) em `src/Message/` — já cai automaticamente no transport `async` pelo roteamento existente.

---

### Tópico 65 — BaixarVideoMessageHandler — execução do yt-dlp via Process

**O que existe hoje:** `symfony/process` disponível na stack (`DOCUMENTACAO_TECNICA.md`), mas nenhuma chamada real ao `yt-dlp` implementada.

**Por que importa:** é o núcleo técnico do módulo — sem isso não existe download de fato.

**O que precisa acontecer:** `BaixarVideoMessageHandler` → `BaixarVideoDownloadService` executando `yt-dlp` via `Process`, salvando o arquivo em diretório temporário antes da ingestão.

---

### Tópico 66 — Extração de metadata do vídeo (título, uploader, thumbnail, duração)

**O que existe hoje:** `MediaItem.metadata` existe como campo JSON (Feature 1/2), mas nada popula título/uploader/thumbnail de vídeo.

**Por que importa:** o grid do frontend (tópico 77) depende dessas informações pra exibir os cards como no bot atual.

**O que precisa acontecer:** chamada `yt-dlp --dump-json` (ou flag equivalente) antes/durante o download, parseando título, uploader, duração e thumbnail pro campo `metadata`.

---

### Tópico 67 — Integração do handler de download com IngestarMediaService

**O que existe hoje:** `IngestarMediaService` já pronto e testado (Feature 2, tópico 45), mas nenhuma chamada vinda do módulo de downloads.

**Por que importa:** é o que conecta a Feature 3 ao motor da Feature 2 — sem essa integração, o vídeo baixado nunca entra no pipeline de classificação/distribuição/upload.

**O que precisa acontecer:** ao final do download bem-sucedido, `BaixarVideoMessageHandler` chama `IngestarMediaService::executar()` passando o arquivo baixado, a origem (`BOT_TELEGRAM` ou equivalente) e a metadata extraída.

---

### Tópico 68 — Endpoint POST /api/v1/downloads (criação de pedido de download)

**O que existe hoje:** `BaixarVideoService` funcional (tópico 63), mas sem exposição HTTP.

**Por que importa:** é o endpoint que o campo "Cole o link do vídeo" do frontend vai chamar.

**O que precisa acontecer:** `DownloadController extends DefaultController`, rota `POST /api/v1/downloads` com `#[MapRequestPayload] BaixarVideoDTO`, resposta `$this->created()`.

---

### Tópico 69 — Status de download em tempo real

**O que existe hoje:** `MediaItemSerializer` já expõe `status` e `historicoStatus` (Feature 2), mas nenhum status específico de "baixando" existe no enum `StatusMediaItem`.

**Por que importa:** o usuário precisa ver "baixando" distinto de "em_fila" — são situações diferentes (uma é rede externa, outra é fila interna aguardando classificação).

**O que precisa acontecer:** avaliar se `StatusMediaItem` precisa de um valor `BAIXANDO` antes de `RECEBIDO`, ou se isso fica só como metadado transitório; ajustar `podeTransicionarPara()` (Feature 2, tópico 47) se o enum mudar.

---

### Tópico 70 — MediaItemRepository::paginarComFiltros()

**O que existe hoje:** `MediaItemRepository::buscarPorHash()` e `buscarPorUuid()` existem (Feature 2), mas nenhuma listagem paginada com filtro.

**Por que importa:** o grid de downloads (como no bot atual) precisa filtrar por status, origem, buscar por título/uploader e ordenar por data.

**O que precisa acontecer:** método `paginarComFiltros(array $filtros, int $pagina, int $porPagina)` usando `QueryBuilder`, cobrindo os filtros combinados sem N+1.

---

### Tópico 71 — Endpoint GET /api/v1/media-itens paginado com filtros

**O que existe hoje:** `MediaItemController` já existe (Feature 2, tópicos 50/59) com rotas de classificação e retry, mas sem listagem.

**Por que importa:** é o endpoint que alimenta o grid inteiro do frontend.

**O que precisa acontecer:** `GET /api/v1/media-itens` no `MediaItemController`, aceitando query params (`status`, `origem`, `busca`, `ordenacao`, `pagina`, `porPagina`), retornando via `$this->paginated()`.

---

### Tópico 72 — Endpoint de ações em lote — categorizar

**O que existe hoje:** classificação manual individual já existe (`PATCH /api/v1/media-itens/{uuid}/categoria`, Feature 2 tópico 50), mas nada em lote.

**Por que importa:** o padrão de UX do bot atual ("Copiar para VPS" com seleção múltipla) exige aplicar a mesma categoria a vários itens de uma vez.

**O que precisa acontecer:** `POST /api/v1/media-itens/lote/categorizar` (lista de UUIDs + `categoriaId`), reaproveitando `MediaItemService::classificarManualmente()` em loop transacional.

---

### Tópico 73 — Endpoint de ações em lote — rebaixar (redownload)

**O que existe hoje:** nenhum mecanismo de reprocessar o download de um vídeo já existente (diferente do retry de erro da Feature 2, que reprocessa classificação/distribuição/upload, não o download em si).

**Por que importa:** espelha a ação "Rebaixar Selecionados" do bot atual — útil quando o arquivo original foi corrompido ou removido do storage.

**O que precisa acontecer:** `POST /api/v1/media-itens/lote/rebaixar` — busca a URL original guardada em `metadata`, redespacha `BaixarVideoMessage` pros itens selecionados.

---

### Tópico 74 — Endpoint de ações em lote — apagar arquivos

**O que existe hoje:** nenhuma remoção de `MediaItem`/arquivo físico implementada em nenhuma feature anterior.

**Por que importa:** limpeza de espaço e remoção de itens indesejados, como no botão "Apagar" do bot atual.

**O que precisa acontecer:** `POST /api/v1/media-itens/lote/apagar` (ou `DELETE` com corpo de lista de UUIDs) — remove o arquivo físico do `MEDIA_STORAGE_PATH` e o registro do banco; decidir se soft-delete ou remoção definitiva.

---

### Tópico 75 — Endpoint PATCH /api/v1/media-itens/{id} — edição de metadados

**O que existe hoje:** `metadata` é gravado na ingestão, mas não há endpoint pra editar depois (ex: corrigir a data, como no "Alterar Data" do bot atual).

**Por que importa:** metadados extraídos automaticamente às vezes vêm errados ou incompletos — o usuário precisa poder corrigir.

**O que precisa acontecer:** `PATCH /api/v1/media-itens/{uuid}` aceitando campos parciais de `metadata` (data, título), sem tocar em `status`/`categoria_id` (esses têm endpoints próprios).

---

### Tópico 76 — Frontend — estrutura da feature downloads-video

**O que existe hoje:** nenhuma pasta de feature de frontend criada ainda — só a estrutura padrão do skeleton (`web/features/`).

**Por que importa:** organiza o código do módulo de downloads isolado, seguindo o padrão feature-based do guia de padrões.

**O que precisa acontecer:** `web/features/downloads-video/{api.ts, types.ts, hooks/, components/}`, com `api.ts` consumindo a instância Axios centralizada (`@config/api`).

---

### Tópico 77 — Frontend — componentes CardVideo e GridVideos

**O que existe hoje:** nenhum componente visual do módulo — só os primitivos globais de `web/shared/ui/layout.tsx` e o `chart.tsx` do Recharts (Feature 1).

**Por que importa:** é a réplica, em HeroUI, do grid que você já usa no bot (thumbnail, status, badges, ações).

**O que precisa acontecer:** `CardVideo` (thumbnail, título, uploader, badges de status/origem, ações individuais) e `GridVideos` (grid responsivo consumindo a listagem paginada do tópico 71).

---

### Tópico 78 — Frontend — CampoNovoLink e BarraAcoesEmLote

**O que existe hoje:** nenhum componente de input de link nem de ações em lote.

**Por que importa:** são as duas peças de interação principal da tela — colar link pra baixar, e selecionar múltiplos itens pra agir sobre eles.

**O que precisa acontecer:** `CampoNovoLink` (input + botão "Baixar", chamando o endpoint do tópico 68) e `BarraAcoesEmLote` (aparece quando há seleção, com os botões de categorizar/rebaixar/apagar dos tópicos 72–74).

---

### Tópico 79 — Frontend — página DownloadsVideo.tsx completa

**O que existe hoje:** componentes isolados dos tópicos 77–78, mas nenhuma página os integrando.

**Por que importa:** é a tela final que fecha a Feature 3 — equivalente à página que você já usa no bot hoje, mas dentro do CirqueiraX.

**O que precisa acontecer:** `web/pages/DownloadsVideo/DownloadsVideo.tsx`, hooks TanStack Query (`useMediaItens`, `useBaixarVideo`, `useAcoesEmLote`) consumindo os endpoints das seções anteriores, seguindo a hierarquia `MainLayout → AppContainer → Container`.

---

### Tópico 80 — Teste end-to-end do fluxo de download e documentação atualizada

**O que existe hoje:** peças isoladas testáveis, mas nenhuma validação do fluxo completo (colar link → baixar → ingerir → classificar → distribuir → upload → aparecer no grid).

**Por que importa:** é a primeira vez que um fluxo de ponta a ponta do usuário (não só do motor interno) é validado no CirqueiraX.

**O que precisa acontecer:** teste manual completo simulando o uso real; `CIRQUEIRAX.md` e `DOCUMENTACAO_TECNICA.md`/`FRONTEND.md` atualizados com os nomes reais das classes e componentes implementados nesta feature.
