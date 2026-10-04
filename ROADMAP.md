# Roadmap — Feature 6: Gestão de Álbuns do Google Fotos

> Backlog e planejamento do projeto. Cada tópico descreve o que existe (ou faltava), por que importa e o que precisa acontecer. Marque `[x]` no checklist ao concluir.

**Numeração:** tópicos 121–140.

**Índice visual:** [PROGRESSO_ROADMAP.md](documentation/progresso/PROGRESSO_ROADMAP.md) · **Detalhamento:** [PROGRESSO_ROADMAP_7.md](documentation/progresso/PROGRESSO_ROADMAP_7.md)

---

## Restrição de API que molda esta feature

A Library API do Google Fotos, desde a mudança de política de março de 2025, restringe os escopos disponíveis a `photoslibrary.appendonly`, `photoslibrary.readonly.appcreateddata` e `photoslibrary.edit.appcreateddata`. Isso significa que `albums.list`/`albums.get` **só retornam álbuns criados pelo próprio CirqueiraX** — álbuns feitos manualmente no Google Fotos antes do app existir são invisíveis para a API, e não há endpoint de "adoção" de álbum alheio (`sharedAlbums:join` exige que o app tenha criado e compartilhado o álbum originalmente). Por isso esta feature não lista "todos os seus álbuns do Google Fotos" — ela gerencia os álbuns que o **CirqueiraX cria e controla**, e a migração de conteúdo de álbuns antigos feitos manualmente continua sendo uma ação manual do usuário dentro do próprio app Google Fotos.

---

## Índice

| # | Tópico |
|---|---|
| 121 | Endpoint GET /api/v1/google-fotos/status — verifica conexão da conta |
| 122 | Escopo readonly.appcreateddata — atualização da URL de autorização OAuth |
| 123 | GoogleFotosAlbumService::listarAlbunsDoApp() — chamada a albums.list |
| 124 | Endpoint GET /api/v1/google-fotos/albuns — lista álbuns criados pelo app |
| 125 | Cruzamento de álbuns com Categoria — campo vinculada/orfã |
| 126 | Endpoint PATCH /api/v1/categorias/{uuid}/album — vínculo manual de albumId |
| 127 | Ajuste em criarOuObter() — respeitar vínculo manual e evitar duplicidade |
| 128 | DTO e validação de criação de categoria já nomeando o álbum futuro |
| 129 | Frontend — estrutura da feature google-fotos (types, api, hooks) |
| 130 | Frontend — tela de status/conexão da conta Google Fotos (gate) |
| 131 | Frontend — grid de álbuns do CirqueiraX com capa e contagem |
| 132 | Frontend — modal de vínculo manual de álbum à categoria |
| 133 | Frontend — indicador de categorias sem álbum ainda vinculado |
| 134 | Frontend — aviso/guia de migração manual de álbuns antigos |
| 135 | Backend — BaixarVideoDTO aceita categoriaId opcional na criação |
| 136 | Backend — BaixarVideoService aplica categoria já na criação do download |
| 137 | Frontend — CampoNovoLink.tsx com seletor de categoria/álbum |
| 138 | Página GoogleFotos.tsx completa, rota e item no Header |
| 139 | Atalho cruzado no Dashboard (TabelaCategorias → Gestão de Álbuns) |
| 140 | Teste end-to-end do fluxo completo e documentação atualizada |

---

## Checklist

- [x] **121. Endpoint GET /api/v1/google-fotos/status — verifica conexão da conta**
- [x] **122. Escopo readonly.appcreateddata — atualização da URL de autorização OAuth**
- [x] **123. GoogleFotosAlbumService::listarAlbunsDoApp() — chamada a albums.list**
- [x] **124. Endpoint GET /api/v1/google-fotos/albuns — lista álbuns criados pelo app**
- [x] **125. Cruzamento de álbuns com Categoria — campo vinculada/orfã**
- [x] **126. Endpoint PATCH /api/v1/categorias/{uuid}/album — vínculo manual de albumId**
- [ ] **127. Ajuste em criarOuObter() — respeitar vínculo manual e evitar duplicidade**
- [ ] **128. DTO e validação de criação de categoria já nomeando o álbum futuro**
- [ ] **129. Frontend — estrutura da feature google-fotos (types, api, hooks)**
- [ ] **130. Frontend — tela de status/conexão da conta Google Fotos (gate)**
- [ ] **131. Frontend — grid de álbuns do CirqueiraX com capa e contagem**
- [ ] **132. Frontend — modal de vínculo manual de álbum à categoria**
- [ ] **133. Frontend — indicador de categorias sem álbum ainda vinculado**
- [ ] **134. Frontend — aviso/guia de migração manual de álbuns antigos**
- [ ] **135. Backend — BaixarVideoDTO aceita categoriaId opcional na criação**
- [ ] **136. Backend — BaixarVideoService aplica categoria já na criação do download**
- [ ] **137. Frontend — CampoNovoLink.tsx com seletor de categoria/álbum**
- [ ] **138. Página GoogleFotos.tsx completa, rota e item no Header**
- [ ] **139. Atalho cruzado no Dashboard (TabelaCategorias → Gestão de Álbuns)**
- [ ] **140. Teste end-to-end do fluxo completo e documentação atualizada**

---

## Detalhamento

### 121. Endpoint GET /api/v1/google-fotos/status — verifica conexão da conta

**O que existe hoje**
O fluxo de autorização OAuth já existe (`AutorizarContaGoogleFotosCommand`, Feature 1 tópico 33) e salva a conta em `ContaGoogleFotos`, mas não há nenhum endpoint HTTP que o frontend possa consultar para saber se a autorização já foi feita. Hoje isso só é verificável olhando o banco direto.

**Por que importa**
É o gate da feature inteira: a tela de gestão de álbuns não deve nem renderizar o conteúdo se não houver conta conectada, e precisa saber disso de forma reativa sem acoplar lógica de autenticação Google no frontend.

**O que precisa acontecer**
- Criar `GoogleFotosController` (ou estender o existente) com `GET /api/v1/google-fotos/status`
- Retornar `{ conectado: bool, email: string|null, conectadoEm: string|null }` consultando `ContaGoogleFotosRepository`
- Não expor o `refreshTokenCriptografado` nem qualquer dado sensível no payload

---

### 122. Escopo readonly.appcreateddata — atualização da URL de autorização OAuth

**O que existe hoje**
A URL de autorização montada em `AutorizarContaGoogleFotosCommand` usa o escopo `photoslibrary` (acesso amplo, já parcialmente obsoleto) junto com `userinfo.email`, conforme visto na autorização já realizada.

**Por que importa**
Para o endpoint de listagem de álbuns (tópico 124) funcionar de forma confiável e alinhada à política atual do Google, o app deve pedir explicitamente `photoslibrary.readonly.appcreateddata` (leitura de álbuns/itens criados pelo próprio app) além de `photoslibrary.appendonly` (upload), evitando depender apenas do escopo amplo que pode ser descontinuado.

**O que precisa acontecer**
- Atualizar a montagem da URL de autorização para solicitar os três escopos válidos: `photoslibrary.appendonly`, `photoslibrary.readonly.appcreateddata`, `photoslibrary.edit.appcreateddata`
- Documentar que contas já autorizadas antes dessa mudança (como a conta de teste já conectada) precisam passar por `make google-fotos-autorizar` novamente para emitir um novo refresh token com os escopos corretos
- Atualizar `documentation/stack/BACKEND.md` com os escopos oficiais

---

### 123. GoogleFotosAlbumService::listarAlbunsDoApp() — chamada a albums.list

**O que existe hoje**
`GoogleFotosAlbumService` (Feature 2, tópico 54) só tem `criarOuObter()`, que cria ou retorna o ID já salvo — nunca consulta a lista real de álbuns existentes na conta.

**Por que importa**
É a peça central da feature: sem esse método não há como popular a tela de álbuns nem cruzar o que existe no Google Fotos com o que está salvo em `Categoria`.

**O que precisa acontecer**
- Adicionar `listarAlbunsDoApp(ContaGoogleFotos $conta): array` em `GoogleFotosAlbumService`
- Chamar `GET https://photoslibrary.googleapis.com/v1/albums` com paginação (`pageToken`), acumulando todas as páginas
- Mapear cada álbum retornado para um array simples: `id`, `titulo`, `urlCapa` (`coverPhotoBaseUrl`), `totalItens` (`mediaItemsCount`)
- Tratar resposta vazia (nenhum álbum criado pelo app ainda) sem lançar exceção

---

### 124. Endpoint GET /api/v1/google-fotos/albuns — lista álbuns criados pelo app

**O que existe hoje**
Nenhum endpoint expõe os álbuns do Google Fotos ao frontend.

**Por que importa**
É o dado que alimenta a tela principal da feature — sem ele não há grid de álbuns para mostrar.

**O que precisa acontecer**
- Adicionar `GET /api/v1/google-fotos/albuns` no `GoogleFotosController`
- Delegar para `GoogleFotosAlbumService::listarAlbunsDoApp()` usando a conta ativa
- Retornar `404`/payload vazio com mensagem clara se não houver conta conectada (reaproveitando a checagem do tópico 121)
- Cache curto (ex: 60s) opcional para evitar bater na API do Google a cada refresh de tela

---

### 125. Cruzamento de álbuns com Categoria — campo vinculada/orfã

**O que existe hoje**
`Categoria` já guarda `googlePhotosAlbumId` (Feature 1, tópico 35), mas não há lógica que cruze essa informação com a lista real de álbuns do Google.

**Por que importa**
O usuário precisa ver, de forma clara, quais álbuns do Google Fotos já estão amarrados a uma categoria do sistema e quais ainda estão "soltos" (criados pelo app mas sem categoria associada, ou vice-versa).

**O que precisa acontecer**
- No `DashboardService` ou em um novo `GoogleFotosService`, cruzar a lista de `listarAlbunsDoApp()` com todas as `Categoria` cadastradas
- Para cada álbum, marcar `categoriaVinculada: string|null` (nome da categoria, se houver)
- Para cada categoria sem `googlePhotosAlbumId` preenchido, marcar como `pendente_vinculo: true`
- Expor esse cruzamento no mesmo endpoint do tópico 124 ou em um endpoint dedicado `GET /api/v1/google-fotos/albuns/resumo`

---

### 126. Endpoint PATCH /api/v1/categorias/{uuid}/album — vínculo manual de albumId

**O que existe hoje**
O único jeito de uma `Categoria` ganhar um `googlePhotosAlbumId` hoje é automaticamente, via `criarOuObter()` na primeira mídia enviada (Feature 2, tópico 54). Não há endpoint para vincular manualmente.

**Por que importa**
É o botão central do fluxo pedido: usuário vê um álbum que o CirqueiraX já criou (por exemplo, de um teste anterior) e quer linkar explicitamente a uma categoria, ou trocar o vínculo.

**O que precisa acontecer**
- Criar `VincularAlbumDTO` com `googlePhotosAlbumId` (string, obrigatório)
- Adicionar `PATCH /api/v1/categorias/{uuid}/album` no `CategoriaController`
- Validar que o `albumId` informado realmente existe na lista retornada por `listarAlbunsDoApp()` antes de salvar (evita digitar um ID inválido)
- Persistir via `CategoriaService`

---

### 127. Ajuste em criarOuObter() — respeitar vínculo manual e evitar duplicidade

**O que existe hoje**
`criarOuObter()` cria um álbum novo sempre que a categoria não tem `googlePhotosAlbumId`. Com o vínculo manual do tópico 126 isso já resolve a maior parte do problema, mas falta uma trava explícita.

**Por que importa**
Sem esse ajuste, existe uma janela entre "categoria criada" e "álbum vinculado manualmente" em que, se uma mídia for enviada antes do vínculo, o sistema cria um álbum duplicado por engano.

**O que precisa acontecer**
- Nenhuma mudança funcional necessária em `criarOuObter()` em si (a lógica de "se já tem ID, usa; senão cria" já é a correta) — o ajuste é de **processo**: documentar e, na UI, incentivar vincular o álbum antes do primeiro envio daquela categoria
- Adicionar log de warning quando um álbum é criado automaticamente para uma categoria nova, facilitando auditoria

---

### 128. DTO e validação de criação de categoria já nomeando o álbum futuro

**O que existe hoje**
`CriarCategoriaDTO` (Feature 1, tópico 35) já aceita `nome`, `pastaLocal` e `googlePhotosAlbumId` opcional.

**Por que importa**
Pequeno ajuste de validação para deixar explícito, na hora da criação, que se o campo `googlePhotosAlbumId` for deixado em branco, um álbum será criado automaticamente com o nome da categoria — e isso precisa estar visível tanto na API (mensagem de validação) quanto na UI.

**O que precisa acontecer**
- Adicionar mensagem descritiva no DTO/documentação da API sobre esse comportamento
- Nenhuma mudança de schema necessária, apenas clareza de contrato

---

### 129. Frontend — estrutura da feature google-fotos (types, api, hooks)

**O que existe hoje**
Não existe nenhuma pasta de feature dedicada a Google Fotos no frontend — o que existe hoje (`GoogleFotosOAuthService`, `GoogleFotosAlbumService`) é só backend.

**Por que importa**
Segue o mesmo padrão arquitetural já usado em `dashboard`, `downloads-video` e `upload-manual` — necessário antes de construir qualquer componente visual.

**O que precisa acontecer**
- Criar `web/features/google-fotos/` com `types.ts` (interfaces `StatusGoogleFotos`, `AlbumGoogleFotos`, `CategoriaComAlbum`), `api.ts` (cliente para os endpoints dos tópicos 121/124/126) e `index.ts`
- Criar hooks em `hooks/useGoogleFotos.ts` com TanStack Query: `useStatusGoogleFotos`, `useAlbunsGoogleFotos`, `useVincularAlbum`

---

### 130. Frontend — tela de status/conexão da conta Google Fotos (gate)

**O que existe hoje**
Nenhuma tela do frontend verifica ou exibe o status de conexão com o Google Fotos — a autorização só acontece via CLI (`make google-fotos-autorizar`).

**Por que importa**
É exatamente o comportamento pedido: "se eu ainda não tiver logado no Google, ele não deixa eu entrar nessa página". Sem essa tela, o usuário não tem feedback visual do estado da conexão.

**O que precisa acontecer**
- Criar `web/features/google-fotos/components/GateConexaoGoogle.tsx`
- Usar `useStatusGoogleFotos()`: se `conectado: false`, mostrar card centralizado explicando que é preciso autorizar via `make google-fotos-autorizar` (ou, se houver endpoint de autorização iniciável pelo navegador, um botão "Conectar Google Fotos" apontando pra ele) e bloquear o restante da página
- Se `conectado: true`, mostrar badge com o e-mail conectado e data de autorização, liberando o conteúdo

---

### 131. Frontend — grid de álbuns do CirqueiraX com capa e contagem

**O que existe hoje**
Nada — este é o componente visual central da feature.

**Por que importa**
É a "vitrine" que substitui a ideia original de "ver meus álbuns do Google Fotos", agora mostrando os álbuns que o próprio CirqueiraX gerencia, com dados reais (capa, nome, quantidade de itens).

**O que precisa acontecer**
- Criar `web/features/google-fotos/components/GridAlbuns.tsx`
- Grid responsivo de cards usando `urlCapa` como imagem de fundo, `titulo`, `totalItens` e um badge indicando `categoriaVinculada` (verde, com nome) ou `pendente_vinculo` (âmbar, "sem categoria vinculada")
- Estado vazio elegante quando `listarAlbunsDoApp()` não retorna nada ainda (nenhum álbum criado pelo CirqueiraX até o momento)
- Skeleton de carregamento consistente com os demais grids do sistema (`GridVideos`, Feature 3)

---

### 132. Frontend — modal de vínculo manual de álbum à categoria

**O que existe hoje**
Nada no frontend; backend pronto a partir do tópico 126.

**Por que importa**
É a ação concreta que o usuário pediu: "selecionar e vincular na categoria".

**O que precisa acontecer**
- Criar `web/features/google-fotos/components/ModalVincularAlbum.tsx`
- Ao clicar num álbum sem vínculo no grid, abrir modal com seletor das categorias existentes (via `useCategorias`, já usado em outras features)
- Ao confirmar, chamar `useVincularAlbum()` (`PATCH /api/v1/categorias/{uuid}/album`) e invalidar a query de álbuns/categorias
- Permitir também o caminho inverso: a partir da tela de categorias (`TabelaCategorias`, Feature 5 tópico 116), abrir o mesmo modal pré-filtrado pelos álbuns disponíveis

---

### 133. Frontend — indicador de categorias sem álbum ainda vinculado

**O que existe hoje**
`TabelaCategorias.tsx` (Feature 5, tópico 116) lista categorias com pasta local e indicador de vínculo com Google Fotos, mas de forma genérica.

**Por que importa**
Fecha o ciclo de visibilidade: o usuário precisa enxergar tanto "álbuns do Google sem categoria" (tópico 131) quanto "categorias sem álbum" — as duas pontas do mesmo problema.

**O que precisa acontecer**
- Atualizar `TabelaCategorias.tsx` para destacar visualmente (badge âmbar) categorias cujo `googlePhotosAlbumId` é nulo
- Adicionar ação rápida "Vincular álbum" na linha da categoria, abrindo o `ModalVincularAlbum` do tópico 132

---

### 134. Frontend — aviso/guia de migração manual de álbuns antigos

**O que existe hoje**
Nada — esse é um ponto de educação do usuário, não uma função automatizável (ver a seção "Restrição de API" no topo deste documento).

**Por que importa**
Evita frustração: sem esse aviso, o usuário pode esperar que álbuns antigos feitos manualmente no Google Fotos apareçam na tela e, ao não verem, achar que há um bug.

**O que precisa acontecer**
- Adicionar um card informativo fixo na tela `GoogleFotos.tsx` explicando, em linguagem simples, por que álbuns criados fora do CirqueiraX não aparecem aqui, e o passo manual recomendado (abrir o Google Fotos, selecionar as fotos do álbum antigo, usar "Adicionar a álbum" apontando para o álbum novo criado pelo CirqueiraX)
- Linkar esse texto também em `documentation/funcionalidades/CIRQUEIRAX.md`

---

### 135. Backend — BaixarVideoDTO aceita categoriaId opcional na criação

**O que existe hoje**
`BaixarVideoDTO` (Feature 3, tópico 61) só tem `url`. A classificação de categoria só acontece depois, manualmente, via modal na tela de downloads.

**Por que importa**
É o pedido explícito: "na página de download, toda vez que eu baixar uma mídia, eu consigo selecionar a categoria/álbum correspondente" — hoje isso só é possível depois do download concluído, não no momento de pedir o download.

**O que precisa acontecer**
- Adicionar campo opcional `categoriaId` (`?string`, validado como UUID existente) em `BaixarVideoDTO`
- Manter compatibilidade: se não informado, comportamento atual (vai para `EM_FILA` aguardando classificação manual) continua igual

---

### 136. Backend — BaixarVideoService aplica categoria já na criação do download

**O que existe hoje**
`BaixarVideoService` (Feature 3, tópico 63) apenas valida a URL e despacha `BaixarVideoMessage`, sem qualquer noção de categoria.

**Por que importa**
Conecta o DTO atualizado (tópico 135) ao restante do pipeline — sem isso o campo novo seria apenas decorativo.

**O que precisa acontecer**
- `BaixarVideoMessage` ganha propriedade opcional `categoriaId`
- Em `BaixarVideoMessageHandler` (Feature 3, tópico 65), após a ingestão via `IngestarMediaService`, se `categoriaId` foi informado, chamar imediatamente `MediaItemService::classificarManualmente()` (reaproveitando a lógica da Feature 2, tópico 50) — o item já nasce classificado e os dispatches de `DistribuirLocalMessage`/`EnviarGoogleFotosMessage` seguem automaticamente

---

### 137. Frontend — CampoNovoLink.tsx com seletor de categoria/álbum

**O que existe hoje**
`CampoNovoLink.tsx` (Feature 3, tópico 78) só tem o campo de URL, detecção de plataforma e botão de enviar.

**Por que importa**
É a peça de interface que entrega o pedido do usuário de forma direta — selecionar a categoria/álbum já no momento de colar o link.

**O que precisa acontecer**
- Adicionar um seletor de categoria (reaproveitando `useCategorias`) ao lado do campo de URL, com opção "Classificar depois" como padrão (mantém o comportamento atual se o usuário não escolher nada)
- Ao enviar, incluir `categoriaId` selecionado no payload de `POST /api/v1/downloads`
- Mostrar, junto a cada categoria no seletor, se ela já tem álbum vinculado (reaproveitando o cruzamento do tópico 125) — reforça visualmente que aquele vídeo vai cair num álbum real

---

### 138. Página GoogleFotos.tsx completa, rota e item no Header

**O que existe hoje**
Nenhuma rota de Google Fotos existe no `App.tsx` nem no `Header.tsx`.

**Por que importa**
Consolida todos os componentes da feature (gate, grid, modal) em uma página navegável de verdade.

**O que precisa acontecer**
- Criar `web/features/google-fotos/GoogleFotos.tsx` compondo `GateConexaoGoogle` → `GridAlbuns` → `ModalVincularAlbum` → card de aviso de migração (tópico 134)
- Registrar rota `/google-fotos` em `web/App.tsx` dentro do `MainLayout`
- Adicionar item de navegação no `web/layouts/Header.tsx`

---

### 139. Atalho cruzado no Dashboard (TabelaCategorias → Gestão de Álbuns)

**O que existe hoje**
`TabelaCategorias.tsx` no Dashboard (Feature 5) e a nova página `/google-fotos` resolveriam o mesmo problema a partir de pontos de entrada diferentes, sem se referenciar.

**Por que importa**
Evita que o usuário ache que são duas features desconectadas — reforça que é um único conceito (categoria ⇄ álbum) visto de dois ângulos.

**O que precisa acontecer**
- Adicionar link/botão "Gerenciar álbuns do Google Fotos" na aba de Categorias do Dashboard, apontando para `/google-fotos`
- No sentido inverso, a partir de um álbum vinculado na página `/google-fotos`, permitir navegar direto para a categoria correspondente no Dashboard

---

### 140. Teste end-to-end do fluxo completo e documentação atualizada

**O que existe hoje**
Nenhum teste cobre especificamente o ciclo "ver álbuns → vincular → baixar vídeo já categorizado → conferir no Google Fotos".

**Por que importa**
Fecha a Feature 6 com confiança de que o fluxo pedido pelo usuário funciona ponta a ponta, não só em partes isoladas.

**O que precisa acontecer**
- Validar manualmente: reautorizar a conta com os novos escopos (tópico 122) → conferir que `/google-fotos` mostra o(s) álbum(ns) já criados em testes anteriores → vincular um álbum existente a uma categoria nova → baixar um vídeo já escolhendo essa categoria em `CampoNovoLink` → confirmar no Dashboard que o item chegou a `concluido` → confirmar no Google Fotos que caiu no álbum certo
- Rodar `make lint-all` / `npx biome check` / `npm run build` sem erros
- Atualizar `documentation/funcionalidades/CIRQUEIRAX.md` (nova seção 3.6 — Gestão de Álbuns do Google Fotos), `documentation/stack/FRONTEND.md` (nova feature na árvore de diretórios) e `documentation/stack/BACKEND.md` (novos endpoints e escopos OAuth)