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

### ⏳ Tópico 104 — Endpoint GET /api/v1/dashboard/categorias — contagem e tamanho
- **Status**: Pendente

### ⏳ Tópico 105 — Cálculo de tamanho total (bytes) por categoria/origem
- **Status**: Pendente

### ⏳ Tópico 106 — SyncthingClient — cliente HTTP para a REST API do Syncthing
- **Status**: Pendente

### ⏳ Tópico 107 — Endpoint proxy GET /api/v1/sync/pastas
- **Status**: Pendente

### ⏳ Tópico 108 — Endpoint proxy POST /api/v1/sync/pastas/{id}/sincronizar
- **Status**: Pendente

### ⏳ Tópico 109 — Configuração de credenciais da API do Syncthing
- **Status**: Pendente

### ⏳ Tópico 110 — Endpoint de fila de erros (status=erro) com motivo
- **Status**: Pendente

### ⏳ Tópico 111 — Ação de retry em lote na fila de erros
- **Status**: Pendente

### ⏳ Tópico 112 — Reclassificação manual — mover pasta local
- **Status**: Pendente

### ⏳ Tópico 113 — Reclassificação manual — trocar álbum no Google Fotos
- **Status**: Pendente

### ⏳ Tópico 114 — Frontend — estrutura da feature dashboard
- **Status**: Pendente

### ⏳ Tópico 115 — Frontend — cards de visão geral
- **Status**: Pendente

### ⏳ Tópico 116 — Frontend — visão por categoria com edição de mapeamento
- **Status**: Pendente

### ⏳ Tópico 117 — Frontend — painel de status de sincronização
- **Status**: Pendente

### ⏳ Tópico 118 — Frontend — fila de erros com ação de retry
- **Status**: Pendente

### ⏳ Tópico 119 — Frontend — gráficos Recharts
- **Status**: Pendente

### ⏳ Tópico 120 — Página Dashboard.tsx completa, teste end-to-end geral e documentação final
- **Status**: Pendente
