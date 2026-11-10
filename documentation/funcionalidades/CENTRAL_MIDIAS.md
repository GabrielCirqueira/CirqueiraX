# Funcionalidade: Central de Mídias

A **Central de Mídias** (`/central-midias`, também acessível por `/todas-midias`) é a biblioteca unificada do sistema. Ela lista todos os `MediaItem` do usuário logado, de qualquer origem. Mídias de outros usuários não aparecem e respondem 404 ([MULTIUSUARIO.md](MULTIUSUARIO.md)).

---

## 1. Listagem

- 60 itens por página, ordenados por `criadoEm` decrescente.
- Duas visões: grade no estilo Google Fotos (`GridCentralMidias`) e tabela compacta (`TabelaCentralMidias`).
- Selo **Arquivo Removido** para vídeos que saíram do servidor pela retenção.

### Abas

As abas e os contadores vêm de `GET /api/v1/media-itens/contagens`:

- Todas as Mídias
- Upload Manual
- Downloads Redes
- Prints & Capturas

### Filtros

- **Tipo:** Apenas Fotos ou Apenas Vídeos.
- **Categoria:** qualquer categoria cadastrada.
- **Status:** Classificados, Com Erro, Sem Categoria e demais situações.
- **Busca:** por título, nome do arquivo ou hash.

---

## 2. Ações

**Por item:** visualizar, copiar para a área de transferência, baixar, editar imagem, atribuir categoria e apagar.

**Em lote:** categorizar e apagar.

### Atalhos de teclado

Valem quando o foco não está em um campo de texto.

| Atalho | Ação |
| :--- | :--- |
| `Ctrl+A` | Seleciona ou desmarca todos os itens da página |
| `1` a `9` | Com itens selecionados, aplica a categoria daquela posição na lista |

---

## 3. Endpoints usados

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/media-itens` | Listagem paginada e filtrada |
| `GET` | `/api/v1/media-itens/contagens` | Contadores das abas |
| `PATCH` | `/api/v1/media-itens/{uuid}/categoria` | Categoriza um item |
| `POST` | `/api/v1/media-itens/lote/categorizar` | Categoriza em lote |
| `POST` | `/api/v1/media-itens/lote/apagar` | Apaga em lote |
| `GET` | `/api/v1/media-itens/{uuid}/stream` | Reprodução |
| `GET` | `/api/v1/media-itens/{uuid}/thumbnail` | Miniatura |
| `GET` | `/api/v1/media-itens/{uuid}/download` | Download do arquivo |

---

## 4. Código

`web/features/central-midias/`: `CentralMidias.tsx`, `components/` (`CardMidiaCentral`, `GridCentralMidias`, `TabelaCentralMidias`, `ModalVisualizarMidiaCentral`, `ModalCategorizarMidia`), `hooks/`, `api.ts` e `types.ts`.
