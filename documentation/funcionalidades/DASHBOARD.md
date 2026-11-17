# Funcionalidade: Dashboard

O **Dashboard** (`/`, `/dashboard` ou `/app`) é a página inicial. O conteúdo muda conforme o papel do usuário.

> Desde a M131, números, últimas mídias, categorias, fila de erros e Spotify são da conta logada. Syncthing só para super-admin. Desde a M196, o layout completo de operação fica só para administrador; usuário comum vê um início pessoal.

---

## 1. Dois dashboards

| Papel | Componente | Conteúdo |
| :--- | :--- | :--- |
| Administrador (`ROLE_ADMIN`) | `DashboardAdmin` | Pipeline completo: resumo, vídeos, livros, abas (visão geral, categorias, sync, erros) |
| Usuário | `DashboardOperador` | Saudação, atalhos pelas permissões, resumo de mídias (se tiver), continuar ouvindo (se tiver livros), badges de acesso |

`Dashboard.tsx` escolhe entre os dois com `usuarioEhAdministrador`.

---

## 2. Dashboard do administrador

Sempre visíveis no topo:

| Componente | Conteúdo |
| :--- | :--- |
| `BarraAcoesRapidas` | Atalhos: Baixar vídeo, Prints e Upload manual |
| `CardsResumo` | Total de mídias, Concluídas, Em processamento e Erros |
| `CardsVideosMetricas` | Baixados, No disco, Apagados hoje e Espaço liberado |
| `SecaoLivrosDashboard` | Continuar ouvindo, meta diária, disco e memória |

### Aba Visão geral

- `GraficosDashboard`, `AtividadesRecentes`, `StatusIntegracoes` (Syncthing, Pipeline, Google Fotos, Spotify, YouTube Music).

### Aba Categorias

`TabelaCategorias` com criação/edição e vínculo de álbum.

### Aba Sincronização

`PainelSync` (API exige `ROLE_SUPER_ADMIN`).

### Aba Erros

`FilaErros` com retentativa individual ou em lote.

---

## 3. Dashboard do operador

- Atalhos filtrados por `usuario.permissoes` (`utils/atalhosOperador.ts`).
- Cards de mídia e últimas entradas só se houver alguma permissão de mídia.
- Bloco de livros em áudio só com `livros_audio`.
- Lista das funcionalidades liberadas + link para `/perfil`.
- Não carrega Syncthing, categorias, fila de erros nem métricas de sistema.

---

## 4. API

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/resumo` | Métricas por status e origem |
| `GET` | `/api/v1/dashboard/categorias` | Métricas por categoria |
| `GET` | `/api/v1/dashboard/erros` | Fila paginada de erros |
| `GET` | `/api/v1/dashboard/livros` | Armazenamento, memória e fila dos livros em áudio |
| `GET` | `/api/v1/livros-audio/estatisticas` | Tempo ouvido, meta, sequência e "continuar ouvindo" |
| `PUT` | `/api/v1/livros-audio/meta` | Altera a meta diária de escuta |
| `POST` | `/api/v1/dashboard/erros/retentar` | Retenta todas as mídias com erro |
| `GET` | `/api/v1/sync/pastas` | Estado das pastas no Syncthing |
| `POST` | `/api/v1/sync/pastas/{id}/sincronizar` | Dispara a sincronização de uma pasta |

---

## 5. Retentativa

`RetentarMediaItemService` decide o próximo passo de cada item:

- **Com categoria:** volta para `classificado` e dispara distribuição e envio.
- **Sem categoria:** volta para `recebido` e passa pela classificação.

---

## 6. Código

`web/features/dashboard/`:

- `Dashboard.tsx` — roteador ADM vs operador
- `DashboardAdmin.tsx` / `DashboardOperador.tsx`
- `components/AtalhosOperador.tsx`, `CardsResumoOperador.tsx`, `ContinuarOuvindoOperador.tsx`
- Rótulos e cálculos em `utils/metricasDashboard.ts` e `utils/atalhosOperador.ts`
