# Funcionalidade: Dashboard

O **Dashboard** (`/`, `/dashboard` ou `/app`) é a página inicial e mostra o estado de todo o pipeline. A interface foi simplificada na melhoria M86.

---

## 1. Estrutura

Sempre visíveis no topo:

| Componente | Conteúdo |
| :--- | :--- |
| `BarraAcoesRapidas` | Atalhos: Baixar vídeo, Prints e Upload manual |
| `CardsResumo` | Total de mídias, Concluídas, Em processamento e Erros |
| `CardsVideosMetricas` | Baixados, No disco, Apagados hoje e Espaço liberado |

### Aba Visão geral

- `GraficosDashboard`: gráficos em Recharts.
- `AtividadesRecentes`: as 6 últimas movimentações.
- `StatusIntegracoes`: estado real de Syncthing, Pipeline, Google Fotos e Armazenamento.

### Aba Categorias

`TabelaCategorias` traz busca, criação (`ModalCriarCategoria`), edição (`ModalEditarCategoria`) e vínculo ou troca de álbum. A API aceita `DELETE /api/v1/categorias/{uuid}`, mas a tela não oferece exclusão.

### Aba Sincronização

`PainelSync` mostra as pastas do Syncthing e dispara a sincronização de cada uma.

### Aba Erros

`FilaErros` lista as mídias com falha e o motivo, com retentativa individual ou em lote.

---

## 2. API

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/resumo` | Métricas por status e origem |
| `GET` | `/api/v1/dashboard/categorias` | Métricas por categoria |
| `GET` | `/api/v1/dashboard/erros` | Fila paginada de erros |
| `POST` | `/api/v1/dashboard/erros/retentar` | Retenta todas as mídias com erro |
| `GET` | `/api/v1/sync/pastas` | Estado das pastas no Syncthing |
| `POST` | `/api/v1/sync/pastas/{id}/sincronizar` | Dispara a sincronização de uma pasta |

---

## 3. Retentativa

`RetentarMediaItemService` decide o próximo passo de cada item:

- **Com categoria:** volta para `classificado` e dispara distribuição e envio.
- **Sem categoria:** volta para `recebido` e passa pela classificação.

---

## 4. Código

`web/features/dashboard/`. Rótulos e cálculos das métricas ficam em `utils/metricasDashboard.ts`.
