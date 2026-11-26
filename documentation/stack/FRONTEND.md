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
| **React Router 7** | `createBrowserRouter`, `lazyWithRetry`, `RotaProtegida` e `RotaComPermissao` |
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
│   ├── dashboard/          DashboardAdmin (ADM) e DashboardOperador (usuário)
│   ├── downloads-audio/
│   ├── downloads-video/
│   ├── editor-imagem/
│   ├── google-fotos/
│   ├── home/               Sem rota no momento
│   ├── livros-audio/
│   ├── not-found/
│   ├── perfil/             Dados da conta e troca de senha
│   ├── prints/
│   ├── musica/             Página Música, detalhes, rankings e Cápsula
│   ├── revisao-musica/     Tela de revisão e correções do catálogo
│   ├── spotify/            Conexão, importação, callback e tocando agora
│   ├── youtube-music/      Conexão, extensão do navegador, importação do Takeout e selo de revisão
│   ├── transcricoes/
│   ├── upload-manual/
│   └── usuarios/           Só administrador
├── layouts/                MainLayout, AuthLayout, AppContainer, Sidebar, Header e Footer
├── pages/                  Pontos de entrada de DownloadsVideo e UploadManual
├── routes/                 RotaProtegida, RotaComPermissao
├── shared/
│   ├── hooks/              useDebounce, useFiltrosUrl, useLocalStorageState,
│   │                       useMediaQuery, useMountEffect, useSEO
│   ├── components/
│   └── utils/              funcionalidadesSistema.ts, iniciaisNome.ts, …
└── stores/                 useAuthStore (administrador, roles, permissoes)
```


---

## 3. Rotas

| Rota | Tela | Acesso |
| :--- | :--- | :--- |
| `/login` | Login | Pública |
| `/`, `/dashboard`, `/app` | Dashboard (ADM ou operador) | Autenticada + `dashboard` |
| `/central-midias`, `/todas-midias` | Central de Mídias | Autenticada + permissão |
| `/downloads` | Downloads de vídeo | Autenticada + permissão |
| `/downloads-mp3` | Downloads MP3 | Autenticada + permissão |
| `/prints` | Prints & Capturas | Autenticada + permissão |
| `/editor-imagem` | Editor de Imagem | Autenticada + permissão |
| `/extrair-texto` | Extrair Texto | Autenticada + permissão |
| `/pronuncia` | Inglês & Pronúncia | Autenticada + permissão |
| `/upload-manual` | Upload Manual | Autenticada + permissão |
| `/google-fotos` | Google Fotos | Autenticada + `google_fotos` |
| `/livros-audio` | Livros em Áudio | Autenticada + permissão |
| `/livros-audio/:uuid` | Leitor de Livro em Áudio | Autenticada + permissão |
| `/musica` | Música (Spotify, YouTube Music e Cápsula Sonora) | Autenticada + `musica` |
| `/musica/artista?uuid=` | Detalhe do artista | Autenticada + `musica` |
| `/musica/faixa?uuid=` | Detalhe da música | Autenticada + `musica` |
| `/musica/gerenciar` | Contas, extensões, importações e revisão | Autenticada + `musica` |
| `/musica/revisao?aba=` | Revisão e correções do catálogo | Autenticada + `musica` |
| `/spotify`, `/spotify/artista`, `/spotify/musica` | Redirecionam para as rotas de Música | Autenticada + `musica` |
| `/transcricoes` | Transcrições de Áudio | Autenticada + permissão |
| `/spotify/callback` | Retorno OAuth do Spotify | Autenticada |
| `/musica/youtube/callback` | Retorno OAuth das playlists do YouTube (transferência) | Autenticada |
| `/youtube/player-teste` | Teste do player oficial do YouTube | Autenticada |
| `/usuarios` | Gerenciar usuários | Autenticada + admin / `gerenciar_usuarios` |
| `/perfil` | Perfil e senha | Autenticada (sem permissão de módulo) |
| `*` | NotFound | Pública |

A Sidebar mostra só as telas liberadas (admin vê todas, inclusive Usuários), troca de tema, link **Meu perfil** e logout. Guards: `RotaProtegida` (JWT) + `RotaComPermissao` (funcionalidade). Catálogo em `web/shared/utils/funcionalidadesSistema.ts`. Detalhes em [PERMISSOES.md](../funcionalidades/PERMISSOES.md).

---

## 4. Módulos

| Feature | Documento funcional |
| :--- | :--- |
| `dashboard` | [DASHBOARD.md](../funcionalidades/DASHBOARD.md) |
| `central-midias` | [CENTRAL_MIDIAS.md](../funcionalidades/CENTRAL_MIDIAS.md) |
| `downloads-video` | [DOWNLOADS_VIDEOS.md](../funcionalidades/DOWNLOADS_VIDEOS.md) |
| `downloads-audio` | [DOWNLOADS_AUDIO.md](../funcionalidades/DOWNLOADS_AUDIO.md) |
| `livros-audio` | [LIVROS_AUDIO.md](../funcionalidades/LIVROS_AUDIO.md) |
| `transcricoes` | [TRANSCRICOES.md](../funcionalidades/TRANSCRICOES.md) |
| `prints` | [PRINTS.md](../funcionalidades/PRINTS.md) |
| `editor-imagem` | [EDITOR_IMAGEM.md](../funcionalidades/EDITOR_IMAGEM.md) |
| `pronuncia` | [PRONUNCIA.md](../funcionalidades/PRONUNCIA.md), [MOTOR_PRONUNCIA.md](../funcionalidades/MOTOR_PRONUNCIA.md), [LETRAS_MUSICA.md](../funcionalidades/LETRAS_MUSICA.md) |
| `upload-manual` | [UPLOAD_MANUAL.md](../funcionalidades/UPLOAD_MANUAL.md) |
| `google-fotos` | [GOOGLE_FOTOS.md](../funcionalidades/GOOGLE_FOTOS.md) |
| `musica`, `revisao-musica` | [MUSICA.md](../funcionalidades/MUSICA.md) |
| `spotify` | [SPOTIFY.md](../funcionalidades/SPOTIFY.md), [LIMITE_SPOTIFY.md](../funcionalidades/LIMITE_SPOTIFY.md) |
| `transferencia-playlist` | [MUSICA.md](../funcionalidades/MUSICA.md#transferência-de-playlists-spotify--youtube-music) |
| `extrair-texto` | [EXTRAIR_TEXTO.md](../funcionalidades/EXTRAIR_TEXTO.md) |
| `youtube` | [YOUTUBE_PLAYER.md](../funcionalidades/YOUTUBE_PLAYER.md) |
| `auth`, `home`, `not-found` | Login, entrada e página 404 (sem documento próprio) |
| `youtube-music` | [YOUTUBE_MUSIC.md](../funcionalidades/YOUTUBE_MUSIC.md) |
| `usuarios` | [PERMISSOES.md](../funcionalidades/PERMISSOES.md) |
| `perfil` | [PERMISSOES.md](../funcionalidades/PERMISSOES.md) |
| `notificacoes` | [NOTIFICACOES.md](../funcionalidades/NOTIFICACOES.md) |

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
- **Atualização automática:** `web/shared/pwa/versaoApp.ts` (`iniciarVerificacaoVersao`, chamado no `main.tsx`) compara a cada 60 s e ao voltar para a aba o script principal carregado (`/build/assets/app-*.js`) com o publicado em `/`. Se mudou, recarrega a mesma página sem perder o login; espera se houver áudio ou vídeo tocando ou se o usuário estiver digitando.

### Imagens de música

Capas e fotos da música passam por `urlCapaExibicao` (`web/features/musica/utils/capaMusica.ts`), que troca links do Google/YouTube, Spotify e Deezer por `/api/v1/musica/capa?url=`. Use sempre essa função ao exibir uma capa nova; as imagens levam `referrerPolicy="no-referrer"`.

### Polling

| Tela | Intervalo |
| :--- | :--- |
| Downloads MP3, com item em andamento | 2,5 s |
| Histórico de Envios do Google Fotos | 15 s |
| Notificações (e ao voltar para a aba) | 60 s |
| Versão publicada do site | 60 s |

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
