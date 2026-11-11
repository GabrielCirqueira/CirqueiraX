# Progresso do Roadmap — Feature 11 (Música unificada, YouTube Music e importação do passado)

> Detalhamento dos tópicos 201 ao 205.

---

### ✅ Tópico 201 — Frontend — renomear a página, tema, seletor de fonte e ícones de origem
- **Status**: Concluído
- **O que foi feito**:
  - A página virou **Música** em `/musica`, com detalhes em `/musica/artista` e `/musica/faixa`. `/spotify`, `/spotify/artista` e `/spotify/musica` redirecionam mantendo a busca (`redirecionarComBusca`, um `loader` do React Router, sem `useEffect`). `/spotify/callback` não mudou e agora devolve para `/musica`.
  - `web/features/musica/` recebeu a página, os detalhes, as seções, os hooks e os utilitários de análise, com nomes neutros (`TemaMusica`, `CapaMusica`, `ItensRankingMusica`, `MinutosMusica`, `RodapeMusica`, `EstadoVazioMusica`, `useResumoMusica` e outros). `web/features/spotify/` ficou com a conexão, a importação, o callback e o "Tocando agora".
  - Tokens `cirqueira.spotify.*` → `cirqueira.musica.*` no `gerar-paleta-brand.mjs` e no `theme.ts`, sem mudar valores, mais `fonteSpotify` e `fonteYoutubeMusic`. Seção 2.4 do `DESIGN.md` atualizada.
  - `SeletorFonteMusica` em pílulas (Todos, Spotify, YouTube Music) no topo da página, com `?fonte=` na URL por `useFiltrosUrl` e o hook `useFonteMusica`. Todas as chaves de consulta incluem a fonte (`MUSICA_QUERY_KEYS`), e todas as chamadas mandam o parâmetro. Resumo, Cápsula, ranking, hábitos, recordes, evolução, descobertas e retrospectiva já usam `/api/v1/musica`; os detalhes por nome e as músicas do item seguem no alias até o tópico 203. `LinkMusica` mantém a fonte ao abrir os detalhes.
  - `IconeFonteMusica` e `GrupoIconesFonte` (logo de cada serviço na cor da marca, tooltip e rótulo acessível), `MarcaEstimado` ("est.") e `MinutosMusica` com o tooltip separando Spotify e YouTube Music (estimado). Os esquemas Zod aceitam `fontes`, `porFonte`, `estimado`, `mashup`, `urlYoutubeMusic` e os uuids.
  - Textos neutros: rodapé com os dois serviços, "Abrir no YouTube Music" no hero do detalhe quando houver link, estado vazio por fonte (Spotify, YouTube Music ou os dois), imagem PNG da Cápsula com "Dados do Spotify e do YouTube Music", título e SEO "Música & Cápsula Sonora". Menu, cabeçalho, atalho e status do Dashboard apontam para `/musica`.
  - Os hooks do Spotify (conectar, desconectar, sincronizar, importar e a sincronização automática) também invalidam as consultas `['musica']`.
- **Diferença do roadmap**: o botão "Conectar o YouTube Music" do estado vazio só aparece quando a página passar a função, o que acontece no tópico 202. A busca de capas pelo Spotify ignora itens só do YouTube, para não gastar cota.
- **Verificação**: `tsc` sem erros novos (os erros que restam já existiam antes, nos mesmos arquivos), Biome nos arquivos alterados e build do Vite sem erros.
- **Arquivos**:
  - `web/features/musica/` (página, detalhes, `components/`, `hooks/`, `utils/`, `api.ts`, `types.ts`)
  - `web/features/spotify/` (api, types, hooks e componentes de conexão)
  - `web/App.tsx`, `web/routes/redirecionarComBusca.ts`, `web/routes/index.ts`, `web/layouts/Header.tsx`, `web/layouts/Sidebar.tsx`
  - `web/features/dashboard/components/BarraAcoesRapidas.tsx`, `web/features/dashboard/utils/metricasDashboard.ts`
  - `web/config/theme/theme.ts`, `scripts/gerar-paleta-brand.mjs`, `documentation/guias/DESIGN.md`

### ⏳ Tópico 202 — Frontend — conexão do YouTube Music, importação do Takeout e status no Dashboard
- **Status**: Pendente

### ⏳ Tópico 203 — Frontend — rankings, Cápsula e detalhes unificados com versões e mashups
- **Status**: Pendente

### ⏳ Tópico 204 — Frontend — tela de revisão e correções do catálogo
- **Status**: Pendente

### ⏳ Tópico 205 — Teste end-to-end com dados reais, calibração e documentação
- **Status**: Pendente
