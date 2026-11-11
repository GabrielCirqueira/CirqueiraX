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

### ✅ Tópico 202 — Frontend — conexão do YouTube Music, importação do Takeout e status no Dashboard
- **Status**: Concluído
- **O que foi feito**:
  - Nova feature `web/features/youtube-music/` (types com Zod, api, hooks `useStatusYoutubeMusic`, `useConectarYoutubeMusic`, `useDesconectarYoutubeMusic`, `useIniciarImportacaoYoutube`/`useImportacaoYoutube`, `useConfirmarImportacaoYoutube`/`useCancelarClassificacaoYoutube`, `useResumoIdentificacao`; toasts por `addToast` e erros por `extrairMensagemErroApi`).
  - Topo da página com os dois cartões lado a lado (Spotify em modo compacto, com o aviso de bloqueio do tópico 187, e YouTube Music).
  - `PainelConexaoYoutubeMusic` com os três estados: não conectado (passo a passo, campo grande para colar e o aviso sobre a conta Google), conectado (reproduções registradas, última consulta, última novidade e a nota da margem do horário) e reconectar (alerta em destaque e o campo de novo). O texto colado fica só no estado do componente, é limpo no envio e nunca vai para `localStorage`. Desconectar abre `ModalDesconectarYoutubeMusic`, que diz o que é apagado (credencial) e o que fica (reproduções).
  - `ModalImportarTakeoutYoutube` (Dialog no desktop, Drawer no celular por `useMediaQuery`): instruções em acordeão, área de soltar `.zip`/`.json`, aviso de privacidade e as etapas Lendo → Aguardando confirmação (números, custo estimado, Confirmar e Cancelar) → Classificando (progresso) → Concluída (relatório com músicas, mashups, compilações, não música, a revisar, indisponíveis, período coberto e custo). Ao concluir invalida as consultas de música, status, identificação e Dashboard, menos a da própria importação.
  - Backend: `POST /api/v1/youtube-music/importacoes/{uuid}/cancelar` (`CancelarClassificacaoImportacaoYoutubeService`, `ImportacaoYoutube::pularClassificacao`): só vale com a importação aguardando confirmação, pula a IA, calcula o tempo e conclui; os vídeos sem identificação ficam pendentes para a revisão.
  - Dashboard: `StatusIntegracoes`, `types.ts` e `metricasDashboard.ts` com o item YouTube Music (neutro `nao_configurado`, verde `conectado`, vermelho `reconectar`), link para `/musica`. O estado âmbar `Bloqueado` do Spotify já existia e agora leva a `/musica`.
  - `SeloRevisaoMusica` ("N itens para revisar") ao lado do seletor de fonte, alimentado por `GET /api/v1/musica/identificacao/resumo`, com link para `/musica/revisao` (tela do tópico 204).
  - O estado vazio ganhou o botão "Conectar o YouTube Music", que rola até o cartão.
- **Diferença do roadmap**: o "Cancelar" da confirmação não apaga a importação; pula a IA e deixa os vídeos para a revisão, para não perder as reproduções lidas. Sem teste no navegador, porque o login não é automatizado aqui.
- **Verificação**: `tsc` sem erros novos, Biome, build do Vite, PHPStan e `lint:container`.
- **Arquivos**:
  - `web/features/youtube-music/` (todos)
  - `web/features/musica/Musica.tsx`, `web/features/musica/utils/fonteMusica.ts`, `web/features/spotify/components/PainelConexaoSpotify.tsx`
  - `web/features/dashboard/types.ts`, `web/features/dashboard/utils/metricasDashboard.ts`, `web/features/dashboard/components/StatusIntegracoes.tsx`
  - `src/Controller/YoutubeMusic/YoutubeImportacaoController.php`, `src/Service/YoutubeMusic/Importacao/CancelarClassificacaoImportacaoYoutubeService.php`, `src/Entity/ImportacaoYoutube.php`

### ✅ Tópico 203 — Frontend — rankings, Cápsula e detalhes unificados com versões e mashups
- **Status**: Concluído
- **O que foi feito**:
  - Detalhes por uuid: `/musica/artista?uuid=` e `/musica/faixa?uuid=` (links antigos por `?nome=` continuam valendo e são resolvidos por `GET /api/v1/musica/artistas/resolver` e `/musicas/resolver`). `gerarRotaArtista` e `gerarRotaMusica` aceitam o uuid; `lerAlvoDetalhe` lê a URL. Os aliases antigos de análise em `/api/v1/spotify` saíram; ficaram só os de conexão, importação, tocando agora e capas.
  - Detalhe da música: resumo por fonte (`ResumoPorFonteDetalhe`, com minutos do YouTube Music marcados como estimados), link "Abrir no YouTube Music", bloco "Versões que você ouviu" (`ListaVersoesMusica`, com tipo da versão, fonte, canal e reproduções) e, em mashups, o bloco "Contém" com as músicas que compõem. Artista vinculado pelo uuid.
  - Detalhe do artista: resumo por fonte e "Mashups em que aparece".
  - Evolução mensal nos detalhes empilhada por fonte (`GraficoMensalPorFonte`, cores `fonteSpotify`/`fonteYoutubeMusic` da paleta) quando há reprodução do YouTube Music; o backend passou a mandar `porFonte` em cada mês.
  - Linhas do ranking de músicas: ícones de origem, artistas creditados, selo "Mashup", minutos com o tooltip por fonte e linha expansível com "Versões ouvidas neste período" (`GET /api/v1/musica/musicas/{uuid}/versoes` com o período do ranking) ou "Contém" para mashups. Linhas de artista com ícones de origem e lista de músicas pelo uuid do artista.
  - Efeitos da fonte: pulos e aleatório mostram "Indisponível para o YouTube Music" com a fonte YouTube Music (Hábitos e detalhes); o cartão "Tocando agora" do Spotify some com a fonte YouTube Music e, em Todos e YouTube Music, aparece "Última detectada: título · canal, há cerca de X min" vindo do status do YouTube Music (`ultimaDetectada`), sem prometer horário exato.
  - Cápsula: nota "Calibrada com o Spotify. Os minutos do YouTube Music são estimados." quando a fonte inclui o YouTube Music; PNG e CSV com a atribuição da fonte escolhida (só Spotify, só YouTube Music ou os dois), arquivo CSV renomeado para `capsula-musica-AAAA-MM.csv`.
- **Diferença do roadmap**: sem teste no navegador com dados do YouTube Music, que ainda não foram importados em produção; fica para o tópico 205.
- **Verificação**: `tsc` sem erros novos, Biome, build do Vite, PHPStan e `lint:container`.
- **Arquivos**:
  - `web/features/musica/` (detalhes, `components/BlocoDetalhe.tsx`, `GraficoMensalPorFonte.tsx`, `ListaVersoesMusica.tsx`, `ResumoPorFonteDetalhe.tsx`, `VersoesItemRanking.tsx`, `ItensRankingMusica.tsx`, `SecaoHabitos.tsx`, `SecaoCapsulaSonora.tsx`, `ModalImagemCapsula.tsx`, hooks, utils, api e types)
  - `web/features/youtube-music/components/UltimaDetectadaYoutubeMusic.tsx`, `web/features/youtube-music/types.ts`, `web/features/youtube-music/utils/conexaoYoutubeMusic.ts`
  - `src/Controller/Musica/MusicaAnaliseController.php`, `src/Controller/Musica/MusicaController.php`, `src/Service/Musica/Analise/ResolverPeriodoAnaliseMusicaService.php`, `src/Service/Musica/Analise/ListarVersoesMusicaService.php`, `src/Service/Musica/Analise/ObterTopMusicasArtistaService.php`, `src/Repository/AnaliseReproducaoMusicalRepository.php`
  - `src/Service/YoutubeMusic/ObterStatusYoutubeMusicService.php`, `src/Serializer/ContaYoutubeMusicSerializer.php`

### ✅ Tópico 204 — Frontend — tela de revisão e correções do catálogo
- **Status**: Concluído
- **O que foi feito**:
  - Nova feature `web/features/revisao-musica/` (types com Zod, api, hooks com TanStack Query, utils e componentes) e rota `/musica/revisao` (`RevisaoMusica`), com link "Revisão e correções" no topo da página de Música, além do selo do tópico 202.
  - Abas Sem vínculo, Ambíguos, Compilações, Canais novos, Possíveis duplicadas e Indisponíveis, cada uma com a contagem (`GET /api/v1/musica/revisao/contagens`), a aba na URL (`?aba=`) e paginação.
  - `CartaoVideoRevisao`: miniatura, título e canal originais, duração, "Abrir no YouTube", sugestão da IA com a confiança e as outras leituras como botões (as duas leituras de "Renegade", por exemplo). Ações: Confirmar sugestão, Escolher música (busca no catálogo ou criar nova com título, artistas e versão), Marcar como mashup (editor de até 5 componentes), Não é música e "Este canal é sempre música / nunca é música". Em Compilações aparecem Informar artistas, Marcar como mashup, Manter como compilação e Não é música.
  - Canais novos: lista em ordem de quantos vídeos em aberto cada canal tem, com Sempre música e Nunca música.
  - Possíveis duplicadas: as duas músicas lado a lado, com "Manter esta e unir".
  - Ação em lote: caixa de seleção em cada vídeo e barra fixa "Definir a mesma música" (`POST /api/v1/musica/revisao/videos/lote`).
  - Detalhes: "Unir com outra música…" na música, "Separar esta versão" em cada versão do YouTube Music e "Unir com outro artista" no artista (cria o apelido). Depois de unir, a página vai para a música ou o artista que ficou.
  - Atualização otimista (o item sai da lista e a contagem cai na hora, com volta se der erro) e invalidação das consultas de música, do resumo da identificação e do Dashboard depois de cada correção. `JanelaRevisaoMusica` abre `Dialog` no desktop e `Drawer` no celular, uma de cada vez, sem modal sobre modal; foco inicial na busca e rótulos acessíveis nos botões e caixas de seleção.
  - Backend: `AcaoRevisaoVideo::DefinirMashup` (componentes no `DefinirMusicaVideoDTO`, mashup criado por `ObterMusicaCatalogoService::obterMashup` e confirmado à mão), `DefinirMusicaDoVideoService::executarEmLote`, `BuscarCatalogoMusicaService` (`GET /api/v1/musica/catalogo/musicas?busca=` e `/catalogo/artistas?busca=`), `ListarRevisaoMusicaService::contar` e `VideoYoutubeRepository::contarParaRevisao`. A aba Sem vínculo passou a incluir os vídeos pendentes (os que ficaram sem IA ao cancelar a importação). As versões do detalhe trazem o `videoUuid` para a separação.
- **Diferença do roadmap**: a aba Canais novos conta vídeos em aberto, não reproduções, porque é o que a consulta do tópico 196 entrega. Nada é apagado: unir pode ser desfeito e separar manda o vídeo de volta para a revisão. As consultas novas de busca e contagem não foram rodadas contra o banco antes do deploy.
- **Verificação**: `tsc` sem erros novos, Biome, build do Vite, PHPStan e `lint:container`.
- **Arquivos**:
  - `web/features/revisao-musica/` (todos), `web/App.tsx`
  - `web/features/musica/DetalheMusicaMusica.tsx`, `web/features/musica/DetalheArtistaMusica.tsx`, `web/features/musica/Musica.tsx`, `web/features/musica/components/ListaVersoesMusica.tsx`, `web/features/musica/types.ts`, `web/features/youtube-music/components/SeloRevisaoMusica.tsx`
  - `src/Controller/Musica/MusicaCorrecaoController.php`, `src/Service/Musica/Correcao/DefinirMusicaDoVideoService.php`, `src/Service/Musica/Correcao/BuscarCatalogoMusicaService.php`, `src/Service/Musica/ListarRevisaoMusicaService.php`
  - `src/DataObject/Musica/DefinirMusicaVideoDTO.php`, `src/DataObject/Musica/DefinirMusicaVideosEmLoteDTO.php`, `src/DataObject/Musica/BuscaCatalogoMusicaDTO.php`, `src/Enum/AcaoRevisaoVideo.php`, `src/Exception/Musica/MusicaCatalogoException.php`
  - `src/Repository/VideoYoutubeRepository.php`, `src/Repository/MusicaCatalogoRepository.php`, `src/Repository/ArtistaCatalogoRepository.php`, `src/Repository/AnaliseReproducaoMusicalRepository.php`

### ⏳ Tópico 205 — Teste end-to-end com dados reais, calibração e documentação
- **Status**: Pendente
