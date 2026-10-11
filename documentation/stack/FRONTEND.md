# Frontend (web/)

Este documento descreve a arquitetura, estrutura modular, convenções de estilo e padrões de componentes do frontend **React** localizado no diretório `web/`.

---

## 1. Stack Tecnológica

| Tecnologia | Papel | Detalhes |
| :--- | :--- | :--- |
| **React 19** + **TypeScript 5.9** | Camada de Apresentação | Componentes funcionais estritos com hooks e tipagem forte |
| **Vite 7** | Bundler & Dev Server | HMR ultrarrápido na porta `4012` |
| **Chakra UI v3** (`@chakra-ui/react`) | Design System & Layout | Primitivos semânticos de acessibilidade e layout |
| **Paleta Cirqueira** (`cirqueira.*`) | Design Tokens | Cores corporativas geradas via `scripts/gerar-paleta-brand.mjs` |
| **React Router 7** | Roteamento SPA | `createBrowserRouter` com lazy-loading e `RotaProtegida` |
| **TanStack Query 5** | Cache e Estado de Servidor | Sincronização, paginação, mutações e invalidação reativa |
| **Zustand 5** | Estado Global de UI/Sessão | Store de autenticação com persistência no `localStorage` |
| **Axios** | Cliente HTTP | Instância centralizada com interceptores de injeção de JWT e refresh automático |
| **Recharts** | Gráficos SVG | Visualização de métricas por categoria e status no dashboard |
| **Biome 1.9** | Linter & Formatter | Validação estática de estilo e organização de imports |

---

## 2. Estrutura de Diretórios e Módulos

```text
web/
├── main.tsx                    # Entry point — QueryClient, Chakra Provider
├── App.tsx                     # Definição canônica de rotas com createBrowserRouter
├── index.css                   # Tokens base, micro-animações e temas CSS
│
├── config/
│   ├── api.ts                  # Instância Axios central com interceptores JWT e refresh
│   └── theme/theme.ts          # Definição do design system Chakra UI e paleta cirqueira
│
├── features/                   # Features orientadas a domínio (Domain-Driven UI)
│   ├── auth/                   # Telas de Login, formulários e hooks de sessão
│   ├── dashboard/              # Painel analítico: métricas, gráficos, status Syncthing e erros
│   ├── prints/                 # Galeria minimalista de prints estilo Google Fotos com lightbox
│   ├── downloads-video/        # Downloads yt-dlp: grid, tabela, player, edição de metadata e horários
│   ├── google-fotos/           # Gerenciamento de álbuns, status de conexão OAuth e vinculações
│   ├── upload-manual/          # Dropzone para envio manual de fotos e vídeos com progresso
│   ├── home/                   # Landing page pública de apresentação
│   └── not-found/              # Página de erro 404
│
├── layouts/
│   ├── MainLayout.tsx          # Shell do aplicativo com Sidebar responsiva, Header e Content
│   ├── Sidebar.tsx             # Menu lateral de navegação com contadores
│   ├── Header.tsx              # Barra superior (perfil, conexões e ações rápidas)
│   └── Footer.tsx              # Rodapé do sistema
│
├── routes/
│   └── RotaProtegida.tsx       # Guard de rota que exige autenticação ativa
│
├── shared/
│   ├── hooks/                  # Hooks utilitários: useDebounce, useMediaQuery, useSEO
│   ├── components/             # Primitivos compartilhados: ErrorBoundary, DialogOuDrawer
│   └── utils/                  # Formatadores de data, tamanho e helpers visuais
│
└── stores/
    └── useAuthStore.ts         # Store Zustand de autenticação (token, usuário e persistência)
```

---

## 3. Features Principais

### 3.1. Prints (`web/features/prints/`)
Interface moderna e limpa inspirada no Google Fotos:
- **Layout Minimalista**: Grid de imagens sem molduras pesadas ou caixas de botões poluídas.
- **Ações Contextuais no Hover**: Botões discretos no canto inferior esquerdo do card com transição suave (Download direto, Copiar imagem para a área de transferência, Excluir e Categorizar).
- **Visualizador em Tela Cheia (Lightbox)**: Ao clicar no print, abre o modal de visualização em alta definição com zoom, navegação e metadados.
- **Cópia Instantânea**: Botão de cópia que escreve a imagem binária diretamente na área de transferência do SO via `navigator.clipboard.write([ClipboardItem])`.

### 3.2. Downloads de Vídeos (`web/features/downloads-video/`)
- **Triagem Flexível**: Alternância entre visualização em Grid (cards com player embutido e duração) e Tabela compacta.
- **Ações em Lote**: Barra flutuante ao selecionar múltiplos itens permitindo categorizar, apagar ou distribuir horários.
- **Distribuição de Horários em Lote (`ModalDistribuirHorariosLote.tsx`)**: Permite selecionar múltiplos vídeos e escalonar suas datas e horários em intervalos regulares para organizar cronologias.
- **Edição Individual de Metadados**: Modal com abas para ajustar título, data/hora da captura e capa.

### 3.3. Google Fotos (`web/features/google-fotos/`)
- **Status de Conexão**: Indicador em tempo real se o backend está autenticado com o Google OAuth.
- **Grid de Álbuns**: Exibe todos os álbuns criados pela aplicação, quantidade de mídias e status de vínculo com categorias locais.
- **Modal de Vinculação**: Permite associar categorias locais a álbuns remotos com um clique.

### 3.4. Upload Manual (`web/features/upload-manual/`)
- **Dropzone Inteligente**: Arraste e solte ou seleção de múltiplos arquivos simultâneos.
- **Pré-categorização**: Escolha da categoria no momento do envio ou ingestão em fila para triagem posterior.
- **Barra de Progresso**: Acompanhamento individual e total de upload via Axios `onUploadProgress`.

---

## 4. Regras de Design e Chakra UI v3

1. **Uso Obrigatório de Primitivos Chakra**:
   Nunca utilizar tags HTML cruas como `<div>`, `<p>`, `<span>`, `<h1>`–`<h6>` ou propriedades `className` para estilização. Sempre utilizar componentes semânticos do Chakra UI (`Box`, `Flex`, `HStack`, `VStack`, `Grid`, `Text`, `Heading`, `Badge`, `Button`).
2. **Tokens Estritos da Paleta Cirqueira**:
   Cores e tonalidades devem utilizar exclusivamente tokens `cirqueira.<escala>.<tom>` (ex: `cirqueira.brand.500`, `cirqueira.purple.500`, `cirqueira.blue.500`) ou tokens neutros semânticos (`bg.panel`, `border.subtle`, `fg`). É proibido o uso de cores genéricas ou hexadecimais soltos.
3. **Padrão de Arredondamento (`borderRadius`)**:
   - `borderRadius="xl"`: Cards, modais de diálogo e painéis principais.
   - `borderRadius="lg"`: Botões, caixas de input e seletores.
   - `borderRadius="md"`: Badges e tags.
   - `borderRadius="full"`: Avatares e botões circulares de ação.
