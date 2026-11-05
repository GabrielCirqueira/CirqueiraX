# Frontend (`web/`)

Arquitetura, estrutura e convenções do frontend React do CirqueiraX.

---

## 1. Stack

| Tecnologia | Papel |
| :--- | :--- |
| **React 19** e **TypeScript 5.9** | Interface |
| **Vite 7** | Build e servidor de desenvolvimento (porta `4012`) |
| **Chakra UI 3** | Design system e layout |
| **Paleta `cirqueira.*`** | Tokens de cor, gerados por `scripts/gerar-paleta-brand.mjs` |
| **React Router 7** | `createBrowserRouter`, `lazyWithRetry` e `RotaProtegida` |
| **TanStack Query 5** | Dados do servidor |
| **Zustand 5** | Estado global persistido |
| **Axios** | Cliente HTTP com renovação de token |
| **Recharts 2** | Gráficos do Dashboard |
| **zod** e **lucide-react** | Validação e ícones |
| **Biome 1.9** | Lint e formatação |

Fontes: Lato e Poppins.

---

## 2. Estrutura

```text
web/
├── main.tsx                Entrada da aplicação
├── App.tsx                 Rotas
├── index.css               Estilos globais
├── config/
│   ├── api.ts              Axios, JWT e refresh
│   └── theme/              Tema Chakra e paleta
├── contexts/               ThemeContext
├── features/               Módulos por domínio
│   ├── auth/
│   ├── central-midias/
│   ├── dashboard/
│   ├── downloads-audio/
│   ├── downloads-video/
│   ├── editor-imagem/
│   ├── google-fotos/
│   ├── home/               Sem rota no momento
│   ├── livros-audio/
│   ├── not-found/
│   ├── prints/
│   └── upload-manual/
├── layouts/                MainLayout, AuthLayout, AppContainer, Sidebar, Header e Footer
├── pages/                  Pontos de entrada de DownloadsVideo e UploadManual
├── routes/                 RotaProtegida
├── shared/
│   ├── hooks/              useDebounce, useFiltrosUrl, useLocalStorageState,
│   │                       useMediaQuery, useMountEffect, useSEO
│   ├── components/
│   └── utils/
└── stores/                 useAuthStore
```

---

## 3. Rotas

| Rota | Tela | Acesso |
| :--- | :--- | :--- |
| `/login` | Login | Pública |
| `/`, `/dashboard`, `/app` | Dashboard | Protegida |
| `/central-midias`, `/todas-midias` | Central de Mídias | Protegida |
| `/downloads` | Downloads de vídeo | Protegida |
| `/downloads-mp3` | Downloads MP3 | Protegida |
| `/prints` | Prints & Capturas | Protegida |
| `/editor-imagem` | Editor de Imagem | Protegida |
| `/upload-manual` | Upload Manual | Protegida |
| `/google-fotos` | Google Fotos | Protegida |
| `/livros-audio` | Livros em Áudio | Protegida |
| `/livros-audio/:uuid` | Leitor de Livro em Áudio | Protegida |
| `*` | NotFound | Pública |

A Sidebar leva às nove telas principais e tem a troca de tema e o logout. `MainLayout` abre `ModalAuth` quando necessário.

---

## 4. Módulos

| Feature | Documento funcional |
| :--- | :--- |
| `dashboard` | [DASHBOARD.md](../funcionalidades/DASHBOARD.md) |
| `central-midias` | [CENTRAL_MIDIAS.md](../funcionalidades/CENTRAL_MIDIAS.md) |
| `downloads-video` | [DOWNLOADS_VIDEOS.md](../funcionalidades/DOWNLOADS_VIDEOS.md) |
| `downloads-audio` | [DOWNLOADS_AUDIO.md](../funcionalidades/DOWNLOADS_AUDIO.md) |
| `livros-audio` | [LIVROS_AUDIO.md](../funcionalidades/LIVROS_AUDIO.md) |
| `prints` | [PRINTS.md](../funcionalidades/PRINTS.md) |
| `editor-imagem` | [EDITOR_IMAGEM.md](../funcionalidades/EDITOR_IMAGEM.md) |
| `upload-manual` | [UPLOAD_MANUAL.md](../funcionalidades/UPLOAD_MANUAL.md) |
| `google-fotos` | [GOOGLE_FOTOS.md](../funcionalidades/GOOGLE_FOTOS.md) |

---

## 5. Estado e dados

- **Servidor:** TanStack Query, com hooks dentro de cada feature.
- **Global:** Zustand, em `stores/` ou dentro da feature, como `useFilaDownloadsStore`.
- **Preferências locais:** `localStorageService` e `useLocalStorageState`, com namespace `cirqueirax:` e chaves em `CHAVES_STORAGE`.
- **Filtros na URL:** `useFiltrosUrl`.
- **Conexão:** `useConexaoStore` (`useSemConexao()`) diz se o app está sem rede ou usando cópia guardada. As queries usam `networkMode: 'offlineFirst'` e as mutations `'always'`.

### Offline (PWA)

- `public/sw.js` é registrado em `web/shared/pwa/serviceWorker.ts`, só no build de produção.
- A página e `/build/` ficam no cache `cirqueirax-app-v1`. As consultas dos livros em áudio ficam em `cirqueirax-api-v1` e são servidas com o cabeçalho `X-Cirqueirax-Offline: 1` quando não há rede.
- O plugin `recursosOffline` do Vite gera `build/sw-assets.json` e copia os recursos do pdf.js para `build/pdfjs/`.
- O Nginx serve `/sw.js` e `/site.webmanifest` com `Cache-Control: no-cache`.

### Polling

| Tela | Intervalo |
| :--- | :--- |
| Downloads MP3, com item em andamento | 2,5 s |
| Histórico de Envios do Google Fotos | 15 s |

---

## 6. Regras de UI

1. **Use primitivos Chakra.** Prefira `Box`, `Flex`, `HStack`, `VStack`, `Grid`, `Text`, `Heading`, `Badge` e `Button` a tags HTML cruas ou `className`.
2. **Use tokens.** Cores vêm de `cirqueira.<escala>.<tom>` ou de tokens semânticos, como `bg.panel`, `border.subtle` e `fg`.
3. **Arredondamento:**
   - `xl`: cards, modais e painéis
   - `lg`: botões e campos
   - `md`: badges e tags
   - `full`: avatares e botões circulares

Guia completo em [DESIGN.md](../guias/DESIGN.md).

---

## 7. Comandos

```bash
npm run check       # Biome: lint e formato
npm run check:fix   # Corrige o que for possível
```
