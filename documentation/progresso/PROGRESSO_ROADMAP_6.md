# Progresso do Roadmap — Feature 6 (Feature 5: Dashboard Completo)

> Detalhamento dos tópicos 101 ao 120.

---

### ✅ Tópico 101 — Endpoint GET /api/v1/dashboard/resumo — totais por status
- **Status**: Concluído
- **O que foi feito**:
  - **Endpoint HTTP REST**: Criada a rota `GET /api/v1/dashboard/resumo` (`api_dashboard_resumo`) em [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php).
  - **Agregação por Status**: Retorna o envelope JSON com a contagem total de mídias por `status` (mapeando todos os valores do enum `StatusMediaItem`), garantindo inicialização com zero para status sem registros.
- **Arquivos envolvidos**:
  - [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php)

### ✅ Tópico 102 — Endpoint GET /api/v1/dashboard/resumo — totais por origem
- **Status**: Concluído
- **O que foi feito**:
  - **Métricas por Origem**: Integrado no mesmo payload unificado do endpoint `GET /api/v1/dashboard/resumo` o agrupamento por `origem` (`print_empresa`, `print_pessoal`, `bot_telegram`, `download`, `manual`).
  - **Contagem Consolidada**: Incluídos também os contadores agregados `totalGeral` e `totalErros` para consumo direto dos cards de visão geral do frontend.
- **Arquivos envolvidos**:
  - [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php)

### ✅ Tópico 103 — DashboardService — agregações via QueryBuilder
- **Status**: Concluído
- **O que foi feito**:
  - **Serviço de Métricas Dedicado**: Criado [`src/Service/Dashboard/DashboardService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/Dashboard/DashboardService.php) mantendo os Controllers enxutos e sem regras de negócio.
  - **Consultas Otimizadas no Repository**: Adicionados em [`src/Repository/MediaItemRepository.php`](file:///home/gabriel/dev/CirqueiraX/src/Repository/MediaItemRepository.php) os métodos `contarAgrupadoPorStatus()` e `contarAgrupadoPorOrigem()` utilizando `QueryBuilder` com `GROUP BY` e `COUNT(m.uuid)`, evitando o carregamento de entidades em memória.
- **Arquivos envolvidos**:
  - [`src/Service/Dashboard/DashboardService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/Dashboard/DashboardService.php)
  - [`src/Repository/MediaItemRepository.php`](file:///home/gabriel/dev/CirqueiraX/src/Repository/MediaItemRepository.php)

### ✅ Tópico 104 — Endpoint GET /api/v1/dashboard/categorias — contagem e tamanho
- **Status**: Concluído
- **O que foi feito**:
  - **Endpoint HTTP REST**: Criada a rota `GET /api/v1/dashboard/categorias` (`api_dashboard_categorias`) em [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php).
  - **Métricas de Categoria**: Mapeia todas as categorias cadastradas (mais a pseudo-categoria `Sem Categoria`) contendo a contagem total de itens (`totalItens`), tamanho acumulado em bytes (`tamanhoBytes`) e tamanho formatado (`tamanhoFormatado`, ex: `12.50 MB`).
- **Arquivos envolvidos**:
  - [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php)
  - [`src/Service/Dashboard/DashboardService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/Dashboard/DashboardService.php)

### ✅ Tópico 105 — Cálculo de tamanho total (bytes) por categoria/origem
- **Status**: Concluído
- **O que foi feito**:
  - **Método Auxiliar de Tamanho**: Criado o método `MediaItem::tamanhoBytes()` em [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/CirqueiraX/src/Entity/MediaItem.php) para obter o tamanho do arquivo via `metadata['tamanho_bytes']`, `metadata['filesize']` ou inspecionando o arquivo físico em disco.
  - **Enriquecimento na Ingestão**: Atualizado [`src/Service/Ingestao/IngestarMediaService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/Ingestao/IngestarMediaService.php) para gravar automaticamente a chave `tamanho_bytes` durante o recebimento de arquivos.
  - **Consolidação de Métricas**: `DashboardService` calcula o tamanho total acumulado (`tamanhoTotalBytes` e `tamanhoTotalFormatado`) e o detalhamento por `origemEspaco` para exibição no dashboard.
- **Arquivos envolvidos**:
  - [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/CirqueiraX/src/Entity/MediaItem.php)
  - [`src/Service/Ingestao/IngestarMediaService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/Ingestao/IngestarMediaService.php)
  - [`src/Service/Dashboard/DashboardService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/Dashboard/DashboardService.php)

### ✅ Tópico 106 — SyncthingClient — cliente HTTP para a REST API do Syncthing
- **Status**: Concluído
- **O que foi feito**:
  - **Interface do Cliente**: Criada a interface [`src/Interface/SyncthingClientInterface.php`](file:///home/gabriel/dev/CirqueiraX/src/Interface/SyncthingClientInterface.php) definindo os métodos `obterStatusPastas()`, `sincronizarPasta()` e `isOnline()`.
  - **Implementação do Cliente HTTP**: Criado [`src/Infra/Syncthing/SyncthingClient.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/Syncthing/SyncthingClient.php) consumindo a REST API do Syncthing (`/rest/system/status`, `/rest/config/folders`, `/rest/db/status` e `/rest/db/scan`) com autenticação via header `X-API-Key`.
  - **Resiliência e Fallback**: Tratamento gracioso caso a instância do Syncthing esteja temporariamente offline ou sem credenciais configuradas, evitando falhas em cascata no dashboard.
- **Arquivos envolvidos**:
  - [`src/Interface/SyncthingClientInterface.php`](file:///home/gabriel/dev/CirqueiraX/src/Interface/SyncthingClientInterface.php)
  - [`src/Infra/Syncthing/SyncthingClient.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/Syncthing/SyncthingClient.php)
  - [`src/Exception/Syncthing/SyncthingException.php`](file:///home/gabriel/dev/CirqueiraX/src/Exception/Syncthing/SyncthingException.php)
  - [`config/services.yaml`](file:///home/gabriel/dev/CirqueiraX/config/services.yaml)

### ✅ Tópico 107 — Endpoint proxy GET /api/v1/sync/pastas
- **Status**: Concluído
- **O que foi feito**:
  - **Controller REST de Sincronização**: Criado [`src/Controller/Sync/SyncController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Sync/SyncController.php) estendendo `DefaultController`.
  - **Proxy Seguro para o Frontend**: Exposta a rota `GET /api/v1/sync/pastas` (`api_sync_pastas`) que retorna a lista padronizada de pastas sincronizadas (id, label, caminho, estado, se está em sincronização e tamanho acumulado em bytes/formatado).
- **Arquivos envolvidos**:
  - [`src/Controller/Sync/SyncController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Sync/SyncController.php)

### ✅ Tópico 108 — Endpoint proxy POST /api/v1/sync/pastas/{id}/sincronizar
- **Status**: Concluído
- **O que foi feito**:
  - **Ação de Sincronização Sob Demanda**: Adicionada a rota `POST /api/v1/sync/pastas/{id}/sincronizar` (`api_sync_sincronizar_pasta`) em [`src/Controller/Sync/SyncController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Sync/SyncController.php).
  - **Disparo de Scan via SyncthingClient**: O endpoint aciona `SyncthingClientInterface::sincronizarPasta($id)`, chamando a REST API `/rest/db/scan` do Syncthing.
  - **Tratamento de Exceções**: Em caso de falha de conexão ou erro reportado pelo daemon Syncthing, captura `SyncthingException` e retorna resposta estruturada de erro com status `HTTP 502 Bad Gateway` mantendo o padrão `DefaultController`.
- **Arquivos envolvidos**:
  - [`src/Controller/Sync/SyncController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Sync/SyncController.php)
  - [`src/Infra/Syncthing/SyncthingClient.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/Syncthing/SyncthingClient.php)

### ✅ Tópico 109 — Configuração de credenciais da API do Syncthing
- **Status**: Concluído
- **O que foi feito**:
  - **Variáveis de Ambiente**: Definidas as variáveis `SYNCTHING_API_URL` (default `http://localhost:8384`) e `SYNCTHING_API_KEY` no arquivo [`.env`](file:///home/gabriel/dev/CirqueiraX/.env).
  - **Injeção de Dependências**: Parâmetros mapeados em [`config/services.yaml`](file:///home/gabriel/dev/CirqueiraX/config/services.yaml) com injeção explícita no serviço `App\Infra\Syncthing\SyncthingClient` (`$apiUrl`, `$apiKey` e `$client` via `@guzzle.default`).
  - **Atualização da Documentação**: Endpoints documentados na tabela da API em [`documentation/stack/BACKEND.md`](file:///home/gabriel/dev/CirqueiraX/documentation/stack/BACKEND.md).
- **Arquivos envolvidos**:
  - [`.env`](file:///home/gabriel/dev/CirqueiraX/.env)
  - [`config/services.yaml`](file:///home/gabriel/dev/CirqueiraX/config/services.yaml)
  - [`documentation/stack/BACKEND.md`](file:///home/gabriel/dev/CirqueiraX/documentation/stack/BACKEND.md)

### ✅ Tópico 110 — Endpoint de fila de erros (status=erro) com motivo
- **Status**: Concluído
- **O que foi feito**:
  - **Fila de Erros Paginada**: Implementada a rota `GET /api/v1/dashboard/erros` (`api_dashboard_erros`) em [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php), retornando itens com `status=erro` com suporte a paginação (`pagina`, `limite`).
  - **Serialização Completa com Motivo**: Cada item inclui `uuid`, `hash`, `origem`, `status`, `caminhoLocal`, `categoria`, `metadata`, `erroMotivo` (detalhando a causa da falha: Syncthing, download, Google Fotos, etc.) e histórico de status serializados por [`src/Serializer/MediaItemSerializer.php`](file:///home/gabriel/dev/CirqueiraX/src/Serializer/MediaItemSerializer.php).
  - **Compatibilidade**: Mantida também a funcionalidade completa via `GET /api/v1/media-itens?status=erro`.
- **Arquivos envolvidos**:
  - [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php)
  - [`src/Serializer/MediaItemSerializer.php`](file:///home/gabriel/dev/CirqueiraX/src/Serializer/MediaItemSerializer.php)
  - [`src/Repository/MediaItemRepository.php`](file:///home/gabriel/dev/CirqueiraX/src/Repository/MediaItemRepository.php)

### ✅ Tópico 111 — Ação de retry em lote na fila de erros
- **Status**: Concluído
- **O que foi feito**:
  - **Ação de Retentativa em Lote**: Implementada a rota `POST /api/v1/dashboard/erros/retentar` (`api_dashboard_erros_retentar`) no [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php) e validado o endpoint existente `POST /api/v1/media-itens/retentar` em [`src/Controller/MediaItem/MediaItemController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/MediaItem/MediaItemController.php).
  - **Lógica de Reprocessamento**: O serviço [`src/Service/MediaItem/RetentarMediaItemService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/MediaItem/RetentarMediaItemService.php) limpa `erroMotivo`, transiciona os itens para `CLASSIFICADO` (se já possuírem categoria definida) disparando `DistribuirLocalMessage` e `EnviarGoogleFotosMessage`, ou para `RECEBIDO` disparando `ClassificarMediaMessage`.
- **Arquivos envolvidos**:
  - [`src/Controller/Dashboard/DashboardController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/Dashboard/DashboardController.php)
  - [`src/Controller/MediaItem/MediaItemController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/MediaItem/MediaItemController.php)
  - [`src/Service/MediaItem/RetentarMediaItemService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/MediaItem/RetentarMediaItemService.php)

### ✅ Tópico 112 — Reclassificação manual — mover pasta local
- **Status**: Concluído
- **O que foi feito**:
  - **Movimentação Física de Arquivo**: Atualizado [`src/Service/MediaItem/ClassificarMediaItemService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/MediaItem/ClassificarMediaItemService.php) para identificar itens que já foram processados/distribuídos (`CONCLUIDO` ou `DISTRIBUIDO_LOCAL`) e mover fisicamente o arquivo do diretório da categoria antiga para o diretório da nova categoria mapeada.
  - **Método `mover` no Armazenamento**: Adicionado o método `mover(string $origem, string $destino)` em [`src/Interface/ArmazenamentoInterface.php`](file:///home/gabriel/dev/CirqueiraX/src/Interface/ArmazenamentoInterface.php) e implementado com atomicidade em [`src/Infra/Storage/ArmazenamentoLocalClient.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/Storage/ArmazenamentoLocalClient.php) (usando `rename` com fallback para `copy` + `unlink`).
  - **Atualização do Caminho Local**: O registro de `MediaItem::caminhoLocal` é atualizado para o novo caminho no disco e persistido.
- **Arquivos envolvidos**:
  - [`src/Interface/ArmazenamentoInterface.php`](file:///home/gabriel/dev/CirqueiraX/src/Interface/ArmazenamentoInterface.php)
  - [`src/Infra/Storage/ArmazenamentoLocalClient.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/Storage/ArmazenamentoLocalClient.php)
  - [`src/Service/MediaItem/ClassificarMediaItemService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/MediaItem/ClassificarMediaItemService.php)
  - [`config/services.yaml`](file:///home/gabriel/dev/CirqueiraX/config/services.yaml)

### ✅ Tópico 113 — Reclassificação manual — trocar álbum no Google Fotos
- **Status**: Concluído
- **O que foi feito**:
  - **Operações em Lote de Álbuns na Google Fotos API**: Implementados os métodos `adicionarItensAoAlbum()` e `removerItensDoAlbum()` em [`src/Infra/GoogleFotos/GoogleFotosAPI.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/GoogleFotos/GoogleFotosAPI.php) utilizando os endpoints `:batchAddMediaItems` e `:batchRemoveMediaItems` da Google Photos Library API.
  - **Migração Automática entre Álbuns**: No fluxo de reclassificação de [`src/Service/MediaItem/ClassificarMediaItemService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/MediaItem/ClassificarMediaItemService.php), para itens com `googlePhotosMediaId` existente, o serviço obtém ou cria o álbum da nova categoria via [`GoogleFotosAlbumService`](file:///home/gabriel/dev/CirqueiraX/src/Service/GoogleFotos/GoogleFotosAlbumService.php), vincula o item ao novo álbum e remove do álbum anterior de forma resiliente.
- **Arquivos envolvidos**:
  - [`src/Infra/GoogleFotos/GoogleFotosAPI.php`](file:///home/gabriel/dev/CirqueiraX/src/Infra/GoogleFotos/GoogleFotosAPI.php)
  - [`src/Service/MediaItem/ClassificarMediaItemService.php`](file:///home/gabriel/dev/CirqueiraX/src/Service/MediaItem/ClassificarMediaItemService.php)

### ✅ Tópico 114 — Frontend — estrutura da feature dashboard
- **Status**: Concluído
- **O que foi feito**:
  - **Módulo de Feature Dedicado**: Criada a pasta [`web/features/dashboard`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard) estruturada segundo o padrão arquitetural do projeto (`types.ts`, `api.ts`, `hooks/`, `components/`, `index.ts`).
  - **Tipagem Completa**: Criado [`web/features/dashboard/types.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/types.ts) definindo interfaces tipadas para o resumo do dashboard (`ResumoDashboard`), métricas de categorias (`CategoriaMetrica`), status do Syncthing (`PastaSync`) e fila de erros (`ItemFilaErro`).
  - **Cliente de API e Hooks TanStack Query**: Implementados [`web/features/dashboard/api.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/api.ts) e os hooks reativos em [`web/features/dashboard/hooks/useDashboard.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/hooks/useDashboard.ts) com polling inteligente (`refetchInterval`) e invalidação automática de cache pós-mutações.
- **Arquivos envolvidos**:
  - [`web/features/dashboard/types.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/types.ts)
  - [`web/features/dashboard/api.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/api.ts)
  - [`web/features/dashboard/hooks/useDashboard.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/hooks/useDashboard.ts)
  - [`web/features/dashboard/index.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/index.ts)

### ✅ Tópico 115 — Frontend — cards de visão geral
- **Status**: Concluído
- **O que foi feito**:
  - **Componente `CardsResumo`**: Criado [`web/features/dashboard/components/CardsResumo.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/CardsResumo.tsx) utilizando HeroUI v3 (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `Chip`, `Skeleton`) e design glassmorphism moderno.
  - **Métricas Chave**:
    - **Total Ingerido**: Contagem geral consolidada com indicador de espaço em disco utilizado.
    - **Concluídas**: Total de itens processados com cálculo automático da taxa de sucesso (`%`) e destaque verde esmeralda.
    - **Em Processamento**: Total de mídias em fila ou etapas assíncronas com feedback visual de loader animado.
    - **Fila de Erros**: Destaque dinâmico em vermelho/rosa quando há itens com falha requerendo ação.
  - **Distribuição por Origens**: Grade secundária detalhando a contagem e consumo de armazenamento por fonte (`Prints Empresa`, `Prints Pessoal`, `Bot Telegram`, `Downloads de Vídeo`, `Upload Manual`) com ícones temáticos dedicados.
- **Arquivos envolvidos**:
  - [`web/features/dashboard/components/CardsResumo.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/CardsResumo.tsx)
  - [`web/features/dashboard/index.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/index.ts)

### ✅ Tópico 116 — Frontend — visão por categoria com edição de mapeamento
- **Status**: Concluído
- **O que foi feito**:
  - **Componente `TabelaCategorias`**: Criado [`web/features/dashboard/components/TabelaCategorias.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/TabelaCategorias.tsx) apresentando a grade de categorias com contagem de mídias, espaço acumulado formatado, subdiretório local e indicador de vinculação com Google Fotos.
  - **Modal de Edição de Mapeamento**: Criado [`web/features/dashboard/components/ModalEditarCategoria.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/ModalEditarCategoria.tsx) com HeroUI v3 (`Modal`, `TextField`, `Input`, `Button`) permitindo renomear a categoria e alterar a pasta local no disco sob demanda.
  - **Filtro em Tempo Real**: Adicionado campo de busca interativo para filtragem rápida entre categorias cadastradas.
- **Arquivos envolvidos**:
  - [`web/features/dashboard/components/TabelaCategorias.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/TabelaCategorias.tsx)
  - [`web/features/dashboard/components/ModalEditarCategoria.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/ModalEditarCategoria.tsx)
  - [`web/features/dashboard/index.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/index.ts)

### ✅ Tópico 117 — Frontend — painel de status de sincronização
- **Status**: Concluído
- **O que foi feito**:
  - **Componente `PainelSync`**: Criado [`web/features/dashboard/components/PainelSync.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/PainelSync.tsx) integrando com a REST API do Syncthing via hooks `usePastasSync` e `useSincronizarPasta`.
  - **Monitoramento em Tempo Real**: Exibe o status de cada pasta sincronizada (`idle`, `syncing`, `paused`, `offline`) com chips de estado coloridos, tamanho consumido e caminho local.
  - **Ação de Sincronização Sob Demanda**: Botão "Sincronizar agora" por pasta com loading de rotação (`Loader2`) e feedback visual de sucesso (`CheckCircle2`).
- **Arquivos envolvidos**:
  - [`web/features/dashboard/components/PainelSync.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/PainelSync.tsx)
  - [`web/features/dashboard/index.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/index.ts)

### ✅ Tópico 118 — Frontend — fila de erros com ação de retry
- **Status**: Concluído
- **O que foi feito**:
  - **Componente `FilaErros`**: Criado [`web/features/dashboard/components/FilaErros.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/FilaErros.tsx) consumindo a rota `GET /api/v1/dashboard/erros` via TanStack Query (`useFilaErros`).
  - **Exibição Explícita de Falhas**: Cada card detalha o título/nome original da mídia, hash identificador, ícone de origem (`Bot`, `Building2`, `Smartphone`, `DownloadCloud`, `UploadCloud`), categoria associada, caminho em disco e o motivo detalhado da falha (`erroMotivo`).
  - **Ações de Reprocessamento**: Botão de retry individual (`useRetentarErroIndividual`) e botão global "Retentar Todos ({total})" (`useRetentarErros`) com feedback de loading (`Loader2`), badges de contagem e toast de sucesso pós-reprocessamento.
  - **Estado Saudável e Paginação**: Exibição de card temático verde esmeralda quando o pipeline não possui erros ativos e controles de paginação responsivos.
- **Arquivos envolvidos**:
  - [`web/features/dashboard/components/FilaErros.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/FilaErros.tsx)
  - [`web/features/dashboard/index.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/index.ts)

### ✅ Tópico 119 — Frontend — gráficos Recharts
- **Status**: Concluído
- **O que foi feito**:
  - **Componente `GraficosDashboard`**: Criado [`web/features/dashboard/components/GraficosDashboard.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/GraficosDashboard.tsx) utilizando a biblioteca `recharts` com design glassmorphism e paleta de cores temática.
  - **Donut Chart por Origem**: Gráfico `PieChart` com corte interno (`innerRadius={60}`, `outerRadius={85}`) ilustrando a distribuição proporcional de mídias por canal de entrada (`Prints Empresa`, `Prints Pessoal`, `Telegram`, `Downloads`, `Upload Manual`), com legendas customizadas e tooltip flutuante moderno.
  - **BarChart por Categoria**: Gráfico de barras verticais `BarChart` exibindo o consumo em megabytes (MB) por categoria mapeada no disco, com grid sutil (`CartesianGrid`), eixos rotacionados (`XAxis`, `YAxis`) e tooltip interativo detalhando tamanho formatado e contagem total de itens.
- **Arquivos envolvidos**:
  - [`web/features/dashboard/components/GraficosDashboard.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/components/GraficosDashboard.tsx)
  - [`web/features/dashboard/index.ts`](file:///home/gabriel/dev/CirqueiraX/web/features/dashboard/index.ts)

### ⏳ Tópico 120 — Página Dashboard.tsx completa, teste end-to-end geral e documentação final
- **Status**: Pendente

