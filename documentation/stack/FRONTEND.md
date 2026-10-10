# Frontend (web/)

Este documento explica a estrutura e o fluxo do frontend React que vive em `web/`.

> Versão enxuta — prioriza o mínimo necessário pra rodar bem, com uma trilha clara do que adicionar depois e em que ordem, em vez de instalar tudo de uma vez.

## Tecnologias

### Núcleo (sempre instalado)

| Tecnologia | Papel |
| :--- | :--- |
| **React 19** + **TypeScript 5.9** | UI reativa, modo strict |
| **Vite 7** | Build tool e dev server com HMR ultra-rápido |
| **Chakra UI v3** (`@chakra-ui/react`) | Biblioteca de componentes, layout e design system |
| **Paleta Cirqueira** (`cirqueira.*`) | Design tokens estritos gerados via `scripts/gerar-paleta-brand.mjs` |
| **React Router 7** | Roteamento via `createBrowserRouter` + lazy loading |
| **TanStack Query 5** | Estado do servidor, cache e invalidação |
| **Zustand 5** | Estado global — só para o que não vem da API (auth, UI global) |
| **Zod 4** | Validação de respostas da API e de formulários críticos |
| **Axios** | HTTP client centralizado com interceptores JWT |
| **tailwindcss-motion** | Micro-animações declarativas |
| **Recharts** | Gráficos SVG reativos (dashboards, totais por categoria/origem) |
| **Biome 1.9** | Linter, formatter e organizador de imports |

> **Regra de Zustand**: não criar store por feature "por precaução". Começar com estado local/Context e migrar pra Zustand só quando sentir dor real de estado espalhado.
>
> **Regra de cores**: Toda cor deve usar exclusivamente tokens `cirqueira.<escala>.<tom>` (ex: `cirqueira.brand.500`, `cirqueira.red.500`, `cirqueira.teal.500`) ou tokens semânticos neutros (`bg.panel`, `border.subtle`, `fg`). Proibido cores cruas do Chakra (`red.500`, `blue.500`), hexadecimais soltos ou `className`.

### Módulo `ui-extra` (opt-in — ative no setup.sh)

| Tecnologia | Papel |
| :--- | :--- |
| **Framer Motion** | Animações declarativas com `AnimatePresence` |

## Estrutura de Diretórios

```
web/
├── main.tsx              Entry point — QueryClient, Chakra Provider (system)
├── App.tsx               Router raiz (createBrowserRouter)
├── index.css             tailwindcss-motion e @theme brand
├── config/
│   ├── api.ts            Instância Axios centralizada com interceptores JWT
│   └── theme/theme.ts    Definição de design system Chakra e paleta cirqueira
├── features/
│   ├── auth/                 hooks, api, types de autenticação, Login
│   ├── dashboard/            Dashboard central: CardsResumo, GraficosDashboard, TabelaCategorias, PainelSync, FilaErros
│   ├── downloads-video/      Feature de downloads: CampoNovoLink, CardVideo, GridVideos, hooks, api, types
│   ├── google-fotos/         Feature de Google Fotos: GoogleFotos, GateConexaoGoogle, GridAlbuns, ModalVincularAlbum, AvisoMigracaoAlbuns
│   ├── upload-manual/        Feature de upload manual: DropzoneUpload, hooks, api, types
│   ├── home/                 Home page pública
│   └── not-found/            Página 404
├── layouts/
│   ├── MainLayout.tsx    Layout com Sidebar + Header + Outlet
│   ├── Sidebar.tsx       Menu lateral de navegação
│   ├── Header.tsx        Barra superior (avatar, status)
│   └── Footer.tsx        Rodapé
├── routes/               RotaProtegida.tsx
├── shared/
│   ├── hooks/            useDebounce, useMountEffect, useMediaQuery, useSEO
│   ├── components/       ErrorBoundary, DialogOuDrawer
│   └── utils/            lazyWithRetry, animacoes, formatadores
└── stores/useAuthStore.ts Estado de autenticação (Zustand + localStorage)
```

## Primitivos de Layout e Componentes do Chakra UI

> **Regra obrigatória:** nunca usar `<div>`, `<p>`, `<h1>`–`<h6>` ou `<span>` diretamente, nem `className`. Usar sempre componentes de `@chakra-ui/react`.

```tsx
import { Box, Button, Container, Heading, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react'
```

**Layout e Tipografia:**

| Componente | Papel |
| :--- | :--- |
| `<Box>` | Container genérico |
| `<HStack>` | Filhos lado a lado (`align="center"`, `gap={4}`) |
| `<VStack>` | Filhos empilhados (`align="stretch"`, `gap={4}`) |
| `<Flex>` | Flexbox com direção e alinhamentos customizados |
| `<Grid>` | Grid de colunas (`templateColumns=...`) |
| `<Container>` | Wrapper de página centralizado (`maxW="6xl"`) |
| `<Heading>` | Títulos (`as="h1"`, `size="2xl"`, etc.) |
| `<Text>` | Parágrafos e labels (`fontSize="sm"`, etc.) |

**Padrão de Arredondamento (`borderRadius`):**
- `borderRadius="xl"`: Cards (`Card.Root`), Modais / Diálogos (`Dialog.Content`), Painéis de Seção
- `borderRadius="lg"`: Inputs (`Input`), Selects (`NativeSelect.Field`), Botões (`Button`, `IconButton`), Caixas de ícones (`Box p={2}`)
- `borderRadius="md"`: Badges (`Badge`) e chips
- `borderRadius="full"`: Avatares e pills circulares
```tsx
<Container maxW="6xl" py={12}>
  <Box borderRadius="xl" borderWidth="1px" borderColor="border.subtle" bg="bg.panel" p={4}>
    <Heading as="h1" size="2xl" color="fg">Título</Heading>
    <Text fontSize="sm" color="fg.subtle">Parágrafo</Text>
    <Text as="span" color="cirqueira.brand.500">Destaque</Text>
  </Box>
</Container>
```

## Roteamento (`web/App.tsx`)

```tsx
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route element={<MainLayout />}>
        <Route index lazy={() => import('@pages/Home/Home')} />
        <Route path="login" lazy={() => import('@pages/Login/Login')} />
        <Route path="cadastro" lazy={() => import('@pages/Cadastro/Cadastro')} />
        <Route path="*" lazy={() => import('@pages/NotFound/NotFound')} />
      </Route>
      <Route element={<MainLayout />}>
        <Route element={<RotaProtegida />}>
          <Route path="app" lazy={() => import('@pages/Home/Home')} />
        </Route>
      </Route>
    </Route>
  )
)
```

## Aliases de Importação

| Alias | Resolve para |
| :--- | :--- |
| `@/` | `web/` |
| `@app/` | `web/` |
| `@pages` | `web/pages/` |
| `@layouts` | `web/layouts/` |
| `@features/` | `web/features/` |
| `@shared/` | `web/shared/` |
| `@stores` | `web/stores/` |
| `@config` | `web/config/` |
| `@routes` | `web/routes/` |

## Regras de Ouro

1. **Sem `useEffect` em pages/features**: use TanStack Query para dados, event handlers para ações, `useMemo` para derivações, `useMountEffect` para efeitos de montagem.
2. **Componentes limpos e atômicos**: Proibido colocar lógica pesada, encadeamentos longos de `if/else`, parsers complexos de URL/strings, identificadores de formatos/plataformas ou formatações avançadas diretamente dentro de componentes visuais (`.tsx`). Componentes devem focar exclusivamente na renderização e interação. Toda lógica de negócio, detecção, transformação ou parsing deve ser extraída para utilitários (`utils/`), serviços ou hooks dedicados.
3. **Tipagem estrita**: sem `any`. Respostas de API validadas com schema Zod.
4. **Aderência aos design tokens**: usar exclusivamente tokens da paleta `cirqueira.*` e tokens semânticos neutros (`bg.panel`, `border.subtle`, `fg`). Nunca usar cores arbitrárias, hexadecimais soltos ou `className`.
5. **Sem tags HTML brutas**: nunca usar `<div>`, `<p>`, `<h1>`–`<h6>` ou `<span>` — usar `Box`/`HStack`/`VStack`/`Grid`/`Container` para layout e `Text`/`Text as="h1"`/`Text as="span"` para tipografia, todos de `@/shared/ui/layout`.

## Execução e Build

```bash
npm run dev        # Dev server (ou make up-d no container)
npm run build      # Build de produção
npm run type-check # tsc --noEmit
npm run validate   # type-check + lint Biome
```

## Apêndice: quando adicionar cada peça opcional

| Ferramenta | Gatilho | Instalação |
| :--- | :--- | :--- |
| Vitest + RTL | Primeira lógica que dói quebrar | `npm i -D vitest @testing-library/react` |
| Motion (Framer) | Primeira necessidade real de `AnimatePresence` | módulo `ui-extra` no setup.sh |
| Husky + lint-staged | Time cresce além de 1 pessoa | já incluso no cirqueirax |
| Playwright | Primeiro fluxo crítico de negócio | `npm i -D @playwright/test` |
| Storybook | Mais de uma pessoa nos mesmos componentes | `npm i -D storybook` |
