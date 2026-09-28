# Roadmap — Feature 5: Dashboard Completo

> Backlog e planejamento do projeto. Cada tópico descreve o que existe (ou faltava), por que importa e o que precisa acontecer. Marque `[x]` no checklist ao concluir.

**Numeração:** tópicos 101–120.

**Índice visual:** [PROGRESSO_ROADMAP.md](documentation/progresso/PROGRESSO_ROADMAP.md) · **Detalhamento:** [PROGRESSO_ROADMAP_6.md](documentation/progresso/PROGRESSO_ROADMAP_6.md)

---

## Índice

| # | Tópico |
|---|---|
| 101 | Endpoint GET /api/v1/dashboard/resumo — totais por status |
| 102 | Endpoint GET /api/v1/dashboard/resumo — totais por origem |
| 103 | DashboardService — agregações via QueryBuilder |
| 104 | Endpoint GET /api/v1/dashboard/categorias — contagem e tamanho |
| 105 | Cálculo de tamanho total (bytes) por categoria/origem |
| 106 | SyncthingClient — cliente HTTP para a REST API do Syncthing |
| 107 | Endpoint proxy GET /api/v1/sync/pastas |
| 108 | Endpoint proxy POST /api/v1/sync/pastas/{id}/sincronizar |
| 109 | Configuração de credenciais da API do Syncthing |
| 110 | Endpoint de fila de erros (status=erro) com motivo |
| 111 | Ação de retry em lote na fila de erros |
| 112 | Reclassificação manual — mover pasta local |
| 113 | Reclassificação manual — trocar álbum no Google Fotos |
| 114 | Frontend — estrutura da feature dashboard |
| 115 | Frontend — cards de visão geral |
| 116 | Frontend — visão por categoria com edição de mapeamento |
| 117 | Frontend — painel de status de sincronização |
| 118 | Frontend — fila de erros com ação de retry |
| 119 | Frontend — gráficos Recharts |
| 120 | Página Dashboard.tsx completa, teste end-to-end geral e documentação final |

---

## Checklist

- [x] **101. Endpoint GET /api/v1/dashboard/resumo — totais por status**
- [x] **102. Endpoint GET /api/v1/dashboard/resumo — totais por origem**
- [x] **103. DashboardService — agregações via QueryBuilder**
- [x] **104. Endpoint GET /api/v1/dashboard/categorias — contagem e tamanho**
- [x] **105. Cálculo de tamanho total (bytes) por categoria/origem**
- [x] **106. SyncthingClient — cliente HTTP para a REST API do Syncthing**
- [x] **107. Endpoint proxy GET /api/v1/sync/pastas**
- [x] **108. Endpoint proxy POST /api/v1/sync/pastas/{id}/sincronizar**
- [x] **109. Configuração de credenciais da API do Syncthing**
- [x] **110. Endpoint de fila de erros (status=erro) com motivo**
- [x] **111. Ação de retry em lote na fila de erros**
- [x] **112. Reclassificação manual — mover pasta local**
- [x] **113. Reclassificação manual — trocar álbum no Google Fotos**
- [x] **114. Frontend — estrutura da feature dashboard**
- [x] **115. Frontend — cards de visão geral**
- [x] **116. Frontend — visão por categoria com edição de mapeamento**
- [x] **117. Frontend — painel de status de sincronização**
- [ ] **118. Frontend — fila de erros com ação de retry**
- [ ] **119. Frontend — gráficos Recharts**
- [ ] **120. Página Dashboard.tsx completa, teste end-to-end geral e documentação final**

---

## Detalhamento

### Tópico 101 — Endpoint GET /api/v1/dashboard/resumo — totais por status

**O que existe hoje:** `MediaItemRepository::paginarComFiltros()` já filtra por status (Feature 3, tópico 70), mas nenhum endpoint retorna uma contagem agregada — só listas paginadas.

**Por que importa:** é o primeiro card que você vê ao abrir o sistema — "quantos baixados, quantos concluídos, quantos com erro" — sem precisar contar manualmente.

**O que precisa acontecer:** `DashboardController extends DefaultController`, rota `GET /api/v1/dashboard/resumo`, retornando contagem de `MediaItem` agrupada por `StatusMediaItem`.

---

### Tópico 102 — Endpoint GET /api/v1/dashboard/resumo — totais por origem

**O que existe hoje:** filtro por `origem` já existe no repository (Feature 3, tópico 70), mas sem agregação.

**Por que importa:** você precisa distinguir quanto vem do bot, dos dois agentes de print e do upload manual — são fontes com comportamento e volume bem diferentes.

**O que precisa acontecer:** estender o mesmo endpoint do tópico 101 (ou endpoint irmão) somando a contagem por `OrigemMedia`.

---

### Tópico 103 — DashboardService — agregações via QueryBuilder

**O que existe hoje:** nenhuma camada de serviço dedicada a métricas — os tópicos 101–102 dependeriam de lógica direto no controller se não for extraída agora.

**Por que importa:** mantém a regra de "controller sem lógica de negócio" (guia de padrões) e centraliza toda query de agregação num único lugar, reaproveitável pelos tópicos seguintes.

**O que precisa acontecer:** `DashboardService` com métodos `resumoPorStatus()`, `resumoPorOrigem()`, usando `QueryBuilder` com `GROUP BY` em vez de carregar entidades completas na memória.

---

### Tópico 104 — Endpoint GET /api/v1/dashboard/categorias — contagem e tamanho

**O que existe hoje:** `CategoriaService`/`CategoriaController` já existem (Feature 2, tópicos 41–42), mas sem nenhuma métrica agregada — só CRUD puro.

**Por que importa:** é a visão "por categoria" do dashboard — quantos itens e quanto espaço cada categoria (X, Y, Z, prints) está ocupando.

**O que precisa acontecer:** `DashboardService::resumoPorCategoria()` — `JOIN` entre `Categoria` e `MediaItem`, contando itens e somando tamanho por `categoria_id`.

---

### Tópico 105 — Cálculo de tamanho total (bytes) por categoria/origem

**O que existe hoje:** nenhum campo de tamanho de arquivo persistido no `MediaItem` — só `metadata` genérica.

**Por que importa:** sem esse dado, o card "espaço usado" do dashboard não tem como existir.

**O que precisa acontecer:** avaliar se o tamanho já está em `metadata` (alguns módulos podem já gravar) ou se precisa de um campo dedicado `tamanho_bytes` no `MediaItem`, preenchido na ingestão (`IngestarMediaService`, Feature 2).

---

### Tópico 106 — SyncthingClient — cliente HTTP para a REST API do Syncthing

**O que existe hoje:** nenhuma integração com o Syncthing feita a partir do backend — o volume compartilhado (Feature 1, tópico 27) só cobre o sistema de arquivos, não a API de controle.

**Por que importa:** é o que permite o dashboard mostrar "pasta X: pausada" e oferecer o botão "sincronizar agora", sem você precisar abrir o app do Syncthing.

**O que precisa acontecer:** `SyncthingClient` usando `HttpClientInterface`, consumindo a REST API local/remota do Syncthing (`GET /rest/db/status`, `POST /rest/db/scan`, etc.).

---

### Tópico 107 — Endpoint proxy GET /api/v1/sync/pastas

**O que existe hoje:** `SyncthingClient` pronto (tópico 106), mas nenhuma rota exposta pro frontend.

**Por que importa:** o frontend nunca deve falar direto com o Syncthing (princípio de design do `CIRQUEIRAX.md`) — precisa passar pelo backend.

**O que precisa acontecer:** `SyncController extends DefaultController`, rota `GET /api/v1/sync/pastas` retornando status de cada pasta observada.

---

### Tópico 108 — Endpoint proxy POST /api/v1/sync/pastas/{id}/sincronizar

**O que existe hoje:** só leitura de status (tópico 107) — nenhuma ação de controle exposta.

**Por que importa:** é o botão "sincronizar agora" mencionado no design original — evita você precisar mexer no celular manualmente.

**O que precisa acontecer:** rota `POST /api/v1/sync/pastas/{id}/sincronizar`, delegando ao `SyncthingClient` pra disparar rescan/sync da pasta correspondente.

---

### Tópico 109 — Configuração de credenciais da API do Syncthing

**O que existe hoje:** nenhuma variável de ambiente ou configuração pra autenticar contra a API do Syncthing (que normalmente exige uma API key).

**Por que importa:** sem isso, `SyncthingClient` não consegue nem autenticar as chamadas dos tópicos 106–108.

**O que precisa acontecer:** variável `SYNCTHING_API_URL` e `SYNCTHING_API_KEY` no `.env`, documentadas no `DOCUMENTACAO_TECNICA.md`.

---

### Tópico 110 — Endpoint de fila de erros (status=erro) com motivo

**O que existe hoje:** `GET /api/v1/media-itens` já aceita filtro por `status` (Feature 3, tópico 71) e `erroMotivo` já é serializado (`MediaItemSerializer`, Feature 2).

**Por que importa:** é praticamente reaproveitamento direto — a "fila de erros" do dashboard é a mesma listagem paginada, só com o filtro fixo em `status=erro`.

**O que precisa acontecer:** confirmar que o endpoint existente cobre esse caso sem alteração; se precisar, adicionar um atalho semântico `GET /api/v1/dashboard/erros` que já aplica esse filtro por padrão.

---

### Tópico 111 — Ação de retry em lote na fila de erros

**O que existe hoje:** `POST /api/v1/media-itens/lote/retentar` já existe desde a Feature 2 (tópico 59) e foi usado também pelo redownload da Feature 3.

**Por que importa:** o botão "tentar de novo" da fila de erros do dashboard não precisa de nenhum endpoint novo — só precisa ser plugado no frontend.

**O que precisa acontecer:** validar que o endpoint existente cobre os cenários de erro desta feature (falha de Syncthing/Google Fotos) sem ajuste adicional no backend.

---

### Tópico 112 — Reclassificação manual — mover pasta local

**O que existe hoje:** `PATCH /api/v1/media-itens/{uuid}/categoria` já existe (Feature 2, tópico 50), mas hoje só é usado pra classificar item que ainda **não** tinha categoria (`EM_FILA`) — não trata o caso de trocar categoria de item já `CONCLUIDO`.

**Por que importa:** o design da Feature 5 pede reclassificação de item **já processado**, o que implica mover o arquivo fisicamente de uma pasta pra outra, não só atualizar o campo no banco.

**O que precisa acontecer:** estender `MediaItemService` (ou criar `ReclassificarMediaService` dedicado) pra, quando o item já estiver `CONCLUIDO`, mover o arquivo de `categoriaAntiga.pastaLocal` pra `categoriaNova.pastaLocal` além de atualizar `categoria_id`.

---

### Tópico 113 — Reclassificação manual — trocar álbum no Google Fotos

**O que existe hoje:** `google_photos_media_id` já é gravado desde a Feature 2 (tópico 56) — é exatamente o dado guardado com esse propósito, mas nunca usado até agora.

**Por que importa:** é o motivo pelo qual aquele campo foi salvo desde o início — sem ele, a API do Google Fotos não permite mover um item entre álbuns.

**O que precisa acontecer:** no mesmo fluxo do tópico 112, chamar `mediaItems.batchAddMediaItems` no álbum novo e `batchRemoveMediaItems` no álbum antigo, usando o `google_photos_media_id` já salvo.

---

### Tópico 114 — Frontend — estrutura da feature dashboard

**O que existe hoje:** as features `downloads-video` (Feature 3) e `upload-manual` (Feature 4) já estabeleceram o padrão de estrutura — nada específico do dashboard existe ainda.

**Por que importa:** mantém a consistência arquitetural do frontend em todas as telas do sistema.

**O que precisa acontecer:** `web/features/dashboard/{api.ts, types.ts, hooks/, components/, index.ts}`.

---

### Tópico 115 — Frontend — cards de visão geral

**O que existe hoje:** nenhum componente visual de métricas agregadas — só cards de mídia individual (`CardVideo`, Feature 3).

**Por que importa:** é a primeira coisa que você vê ao abrir o dashboard — totais por status e por origem, como os cards que você já usa hoje no bot ("Total downloads", "Na VPS", etc.).

**O que precisa acontecer:** componente `CardsResumo` consumindo os endpoints dos tópicos 101–102, com HeroUI + tailwindcss-motion pra transição de entrada.

---

### Tópico 116 — Frontend — visão por categoria com edição de mapeamento

**O que existe hoje:** `CategoriaController` (Feature 2) já permite `PATCH` de categoria via API, mas nenhuma tela usa isso.

**Por que importa:** você precisa poder ajustar pasta local/álbum de uma categoria direto pela UI, sem precisar chamar a API manualmente.

**O que precisa acontecer:** tabela/lista de categorias com contagem e tamanho (tópicos 104–105), com modal de edição reaproveitando `CategoriaService::atualizar()` já existente.

---

### Tópico 117 — Frontend — painel de status de sincronização

**O que existe hoje:** endpoints proxy do Syncthing prontos (tópicos 107–108), mas nenhuma tela consumindo.

**Por que importa:** fecha o ciclo de "ver e agir" sobre a sincronização com o celular sem sair do dashboard.

**O que precisa acontecer:** componente listando pastas com status (ativa/pausada) e botão "sincronizar agora" por pasta.

---

### Tópico 118 — Frontend — fila de erros com ação de retry

**O que existe hoje:** `GridVideos`/`BarraAcoesEmLote` da Feature 3 já implementam seleção múltipla e ações em lote — reaproveitável aqui com filtro fixo em erro.

**Por que importa:** é o painel operacional pra você ver o que falhou e agir rápido, sem precisar entrar no servidor ou nos logs.

**O que precisa acontecer:** view filtrada por `status=erro` mostrando `erroMotivo` visível por item, com botão de retry individual/lote chamando o endpoint já existente (tópico 111).

---

### Tópico 119 — Frontend — gráficos Recharts

**O que existe hoje:** `web/shared/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`, `ChartLegend`) já foi criado na Feature 1 (tópico 24), mas nenhum gráfico real foi montado ainda.

**Por que importa:** é o uso concreto do Recharts que justificou ativar o módulo `ui-extra` desde a fundação do projeto.

**O que precisa acontecer:** gráficos de volume por categoria/origem ao longo do tempo e de espaço usado (VPS vs. Google Fotos), consumindo os endpoints de resumo (tópicos 101–105) através de `ChartContainer`.

---

### Tópico 120 — Página Dashboard.tsx completa, teste end-to-end geral e documentação final

**O que existe hoje:** componentes isolados dos tópicos 115–119, e todas as quatro features anteriores (1 a 4) já validadas ponta a ponta individualmente.

**Por que importa:** é o fechamento da v1 inteira do CirqueiraX — a partir daqui, todo o pipeline (ingestão → classificação → distribuição → upload → visualização/controle) está funcional e visível num único lugar.

**O que precisa acontecer:** `web/pages/Dashboard/Dashboard.tsx` integrando todos os componentes das seções anteriores como rota inicial do sistema; teste manual cobrindo o ciclo completo (baixar vídeo, capturar print nos dois agentes, upload manual, ver tudo refletido no dashboard, forçar um erro e reprocessar, reclassificar um item concluído); `CIRQUEIRAX.md`, `DOCUMENTACAO_TECNICA.md` e `FRONTEND.md` atualizados como fechamento da v1.