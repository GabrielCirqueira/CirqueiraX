# Melhorias — M201 a M220

> Detalhamento das melhorias **M201–M220**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 201 — Ajuda Contextual nos Cards de `/musica`

- **Status**: Concluído
- **Data**: 17 de novembro de 2026
- **Problema**: os cards redesenhados (M193) não explicavam o que cada bloco media — usuário novo não sabia o significado de Saudade, Neste dia, Álbum em sequência, etc.
- **Solução**:
  - `CartaoBlocoMusica` ganhou prop `descricao` e um ícone discreto `CircleHelp` no canto superior direito; hover abre tooltip (`TooltipMusica`).
  - Todos os cards das abas (visão geral, hábitos, descobertas, versões, histórico, serviços) receberam texto curto explicando o contexto.
- **Arquivos**: `web/features/musica/components/PecasBlocoMusica.tsx`, `VisaoGeralTopos.tsx`, `VisaoGeralAtalhos.tsx`, `AbaHabitos.tsx`, `AbaDescobertas.tsx`, `AbaVersoes.tsx`, `AbaHistorico.tsx`, `AbaServicos.tsx`

---

### ✅ Melhoria 202 — Tooltip no Hover do Card (sem ícone ?)

- **Status**: Concluído
- **Data**: 17 de novembro de 2026
- **Problema**: o ícone `?` no canto do card poluía o layout; a ajuda deveria vir do próprio card.
- **Solução**: removido o ícone; o tooltip da `descricao` abre ao passar o mouse no card inteiro, com atraso de 4 s (`openDelay={4000}`).
- **Arquivos**: `PecasBlocoMusica.tsx`, `MinutosMusica.tsx`

---

### ✅ Melhoria 203 — Extensão do YouTube Music: Tempo Real, Pausa Certa e Identificação Imediata

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Problema**: o painel mostrava a música do YouTube Music como pausada, com o tempo diferente do player, e ficava "identificando" sem terminar — mesmo para músicas que já estavam no catálogo pela importação do Spotify.
- **Causas encontradas**:
  - O cache de produção ficou com dono `root` em 17/11 (`cache:clear` rodado como root via `make cache-clear-prod`). O PHP e os workers (`www-data`) não conseguiam gravar; o scheduler não salvava o checkpoint e **parou de disparar as tarefas**: identificação, detalhes dos vídeos e coleta do Spotify ficaram paradas desde 17/11 (11 mil erros de gravação em 48 h).
  - A extensão lia a duração do player durante o anúncio (29,9 s / 49,9 s) e o servidor guardava essa duração errada; a barra travava e parecia pausada.
  - O painel calculava o tempo pelo "tempo ouvido", não pela posição do player — qualquer pausa, avanço ou início no meio deixava o tempo diferente.
  - A fila de identificação pegava os 50 pendentes mais antigos; vídeos que falhavam sempre bloqueavam os novos.
- **Solução**:
  - Permissão do cache corrigida; `make` passa a rodar o console de produção como `www-data`.
  - Extensão 1.5.0: envia a posição real do player e o momento da leitura; avisa na hora ao pausar, dar play ou avançar; progresso a cada 5 s; detecção de anúncio melhor (estado do player e overlay visível) e duração só fora do anúncio.
  - Servidor guarda posição e horário da leitura (`extensao_posicao_ms`, `extensao_posicao_em`) e corrige duração curta demais enquanto a API do YouTube não trouxe a oficial.
  - Painel calcula o tempo pela posição do player (atualiza a cada 10 s); duração impossível não trava a barra.
  - Identificação: pendentes tocados mais recentemente primeiro, e a primeira reprodução de um vídeo pendente dispara a identificação na hora.
- **Arquivos**: `extensao/youtube-music/pagina.js`, `extensao/youtube-music/conteudo.js`, `extensao/youtube-music/fundo.js`, `extensao/youtube-music/manifest.json`, `src/Service/YoutubeMusic/Extensao/RegistrarEventosExtensaoYoutubeService.php`, `src/DataObject/YoutubeMusic/EventoExtensaoYoutubeDTO.php`, `src/Entity/ReproducaoYoutube.php`, `src/Entity/VideoYoutube.php`, `src/Repository/VideoYoutubeRepository.php`, `src/Serializer/ContaYoutubeMusicSerializer.php`, `migrations/Version20261123090000.php`, `web/features/youtube-music/types.ts`, `web/features/youtube-music/utils/extensaoYoutubeMusic.ts`, `web/features/youtube-music/hooks/useStatusYoutubeMusic.ts`, `Makefile`

---

### ✅ Melhoria 204 — YouTube Music Instantâneo no Painel

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Problema**: ao trocar de música no YouTube Music o painel levava ~10 s para mudar; ao voltar para a aba do CirqueiraX depois de várias músicas, aparecia a última música vista antes de sair, marcada como "Pausado".
- **Causa**: o painel só sabia da música pela consulta ao servidor (a cada 10 s, e parada com a aba em segundo plano); ao voltar, mostrava o dado antigo, que sem evento recente virava "Pausado".
- **Solução**:
  - Extensão 1.6.0 manda o estado do player direto para as abas abertas do CirqueiraX (troca de música, pausa e avanço na hora; posição a cada 2 s), sem passar pelo servidor.
  - A página pede o estado atual à extensão ao abrir, e o painel junta esse estado com o do servidor (capa, artistas e identificação vêm do servidor quando o vídeo bate).
  - Consulta de status refeita ao voltar para a aba; quando a extensão já mostra outro vídeo, o painel consulta a cada 2 s até o servidor alcançar.
- **Arquivos**: `extensao/youtube-music/conteudo.js`, `extensao/youtube-music/fundo.js`, `extensao/youtube-music/ponte.js`, `extensao/youtube-music/manifest.json`, `web/features/youtube-music/utils/tempoRealExtensao.ts`, `web/features/youtube-music/hooks/useTocandoAgoraTempoReal.ts`, `web/features/youtube-music/hooks/useStatusYoutubeMusic.ts`, `web/features/youtube-music/hooks/useConectarYoutubeMusic.ts`, `web/features/youtube-music/components/UltimaDetectadaYoutubeMusic.tsx`

---

### ✅ Melhoria 205 — Visão Geral com Ranking de Hoje, Filtro Ontem e Top 50 na Cápsula

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Pedido**: ao entrar em `/musica`, ver logo o card das músicas ouvidas no período começando em "Hoje" (antes abria em 7 dias), poder abrir a lista das 50 mais ouvidas num popup, ter o filtro rápido "Ontem" e ver o top 50 do mês nos cards de top artistas, músicas e álbuns da Cápsula Sonora.
- **Solução**:
  - Card de ranking por período (`SecaoHojeSemana`) no topo da Visão geral, abrindo em "Hoje"; a aba Rankings também passa a abrir em "Hoje".
  - Botão **Top 50** no card abre `ModalTop50Musica`: a mesma tabela da aba Rankings (busca, ordenação, serviço), com abas Músicas / Artistas / Álbuns.
  - Filtro **Ontem** no card (intervalo personalizado do dia anterior) e no seletor da Visão geral (`periodo=ontem` → `PeriodoAnaliseSpotifyDTO::ontem()`); Visão geral também abre em "Hoje".
  - Cápsula Sonora: "Ver top 50" em cada um dos 3 cards, abrindo o mesmo modal com o ranking do mês da cápsula (mês UTC, regra do Spotify).
- **Arquivos**: `web/features/musica/components/ModalTop50Musica.tsx`, `web/features/musica/components/SecaoHojeSemana.tsx`, `web/features/musica/components/AbaVisaoGeral.tsx`, `web/features/musica/components/AbasConteudoMusica.tsx`, `web/features/musica/components/TopsMesCapsula.tsx`, `web/features/musica/utils/blocosMusica.ts`, `web/features/musica/typesBlocos.ts`, `web/features/musica/types.ts`, `src/Enum/TipoPeriodoAnaliseSpotify.php`, `src/DataObject/Spotify/Analise/PeriodoAnaliseSpotifyDTO.php`

---

### ✅ Melhoria 206 — Revisão em Massa: Filtros, Lista Compacta, Lote e Atalhos

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Problema**: depois de importar o Takeout do YouTube, a revisão ficou com 7.273 pendências e só dava para resolver um vídeo por vez, em cartões grandes de 20 em 20.
- **Diagnóstico (dados reais)**: ~1.855 sem vínculo (842 com sugestão "música" e 625 "não é música", confiança média ~85%), 429 compilações, 3.206 indisponíveis (3.203 só com o código do vídeo, sem título nem canal) e ~1.760 canais novos (1.559 com um único vídeo).
- **Solução**:
  - **Filtros** em todas as abas: busca por título/canal; sugestão da IA (música, não é música, mashup, sem sugestão) e confiança mínima (70%+, 90%+); ordenação (recentes, mais ouvidos, confiança, canal A–Z); 20/50/100 por página; paginação com primeira/última.
  - **Lista compacta** (padrão): uma linha por vídeo com a sugestão, confiança, versão e botões Aceitar / Buscar / Não é música.
  - **Atalhos de teclado** (lista e cartões): A aceitar, N não é música, B buscar, X selecionar, J/K navegar; o foco pula para o próximo vídeo depois de resolver.
  - **Seleção e lote** em todas as abas, com "selecionar a página": vídeos → Aceitar sugestões (inclui as de "não é música"), São todos a mesma música, Não é música, Manter como compilação; canais → Sempre música / Nunca música; duplicatas → Mais ouvida vira a principal / São músicas diferentes.
  - **Resolver o filtro inteiro** (com confirmação): "Não é música para todos" / "Manter como compilação para todos" aplica a todos os vídeos do filtro, não só da página (`POST /revisao/videos/acao-filtro`, até 5.000). Em Indisponíveis, "Só os sem título" + essa ação limpa os 3.203 de uma vez.
  - **Canais novos** passa a mostrar (e contar) só canais com 2+ vídeos; "Incluir canais com só 1 vídeo" mostra o resto.
- **Arquivos**: `src/DataObject/Musica/FiltroRevisaoMusicaDTO.php`, `src/DataObject/Musica/AcaoRevisaoEmLoteDTO.php`, `src/DataObject/Musica/AcaoRevisaoPorFiltroDTO.php`, `src/Service/Musica/Correcao/AplicarAcaoRevisaoEmLoteService.php`, `src/Service/Musica/ListarRevisaoMusicaService.php`, `src/Repository/VideoYoutubeRepository.php`, `src/Controller/Musica/MusicaCorrecaoController.php`, `src/Exception/Musica/MusicaCatalogoException.php`, `web/features/revisao-musica/components/ListaRevisao.tsx`, `web/features/revisao-musica/components/BarraFiltrosRevisao.tsx`, `web/features/revisao-musica/components/BarraLoteRevisao.tsx`, `web/features/revisao-musica/components/LinhaCompactaVideoRevisao.tsx`, `web/features/revisao-musica/components/PainelAcaoFiltroRevisao.tsx`, `web/features/revisao-musica/components/CartaoVideoRevisao.tsx`, `web/features/revisao-musica/hooks/useAcoesEmMassaRevisao.ts`, `web/features/revisao-musica/hooks/useRevisaoMusica.ts`, `web/features/revisao-musica/hooks/chavesQueryRevisao.ts`, `web/features/revisao-musica/utils/tecladoRevisao.ts`, `web/features/revisao-musica/utils/revisaoMusica.ts`, `web/features/revisao-musica/api.ts`, `web/features/revisao-musica/types.ts`

---

### ✅ Melhoria 207 — Seletor de Período em Menu e Modal

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Pedido**: as barras de período (Hoje, Ontem, 7/30/90 dias, Mês, Ano, Sempre, Personalizado) poluíam a tela; trocar por um select com a opção escolhida que abre a lista, e abrir mês/ano/personalizado num popup em vez de expandir na seção.
- **Solução**:
  - `SeletorPeriodoMusica`: botão com o período atual que abre um menu com as opções (marca a escolhida); "Escolher mês…", "Escolher ano…" e "Personalizado…" abrem `ModalPeriodoMusica` e só filtram ao clicar em Aplicar (personalizado valida início ≤ fim).
  - `SeletorPeriodoAnalise` passou a usar o menu, então Visão geral, Hábitos, Versões, Descobertas, Linha do tempo e Evolução mensal ficaram iguais.
  - Card de ranking por período (`SecaoHojeSemana`): os chips e os três painéis embutidos de mês, ano e datas viraram um único seletor; o rótulo mostra o período escolhido ("Março de 2026", "01/11/26 – 15/11/26").
- **Arquivos**: `web/features/musica/components/SeletorPeriodoMusica.tsx`, `web/features/musica/components/ModalPeriodoMusica.tsx`, `web/features/musica/components/SeletorPeriodoAnalise.tsx`, `web/features/musica/components/SecaoHojeSemana.tsx`

---

### ✅ Melhoria 208 — Música: Este Mês, Tocando Agora em Todas as Abas e Transições

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Pedido**: a seção "Visão geral" abrir com o mês atual (mantendo o filtro); "Tocando agora" em todas as abas, com opção de ocultar; barra de abas acima do "Tocando agora" e o conteúdo da aba abaixo; transições mais fluidas entre as abas.
- **Solução**:
  - Nova opção **Este mês** nos seletores de período (mês do calendário, regra do Spotify); a seção "Visão geral" abre nela. O card de ranking do topo continua abrindo em "Hoje" (M205).
  - `PainelTocandoAgoraMusica`: Spotify e YouTube Music juntos, visível em todas as abas, com botão Ocultar/Mostrar (lembrado no navegador) e recolhimento animado (grid 0fr↔1fr + opacidade).
  - Ordem da página: barra de abas → Tocando agora → conteúdo da aba.
  - Troca de aba com entrada suave (fade + deslize + leve desfoque, 380 ms, curva ease-out) e botões da barra com transição de cor e toque; respeita `prefers-reduced-motion`.
- **Arquivos**: `web/features/musica/Musica.tsx`, `web/features/musica/components/PainelTocandoAgoraMusica.tsx`, `web/features/musica/components/AbasConteudoMusica.tsx`, `web/features/musica/components/AbasMusica.tsx`, `web/features/musica/components/AbaVisaoGeral.tsx`, `web/features/musica/components/index.ts`, `web/features/musica/utils/blocosMusica.ts`

---

### ✅ Melhoria 209 — Música: Imagem da Cápsula Personalizável e Seletor de Mês

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Pedido**: mais personalizações na geração de imagem (tamanhos, temas e outras opções) e um select no topo do modal com o mês, para trocar de mês e atualizar a imagem com os dados dele.
- **Solução**:
  - Seletor de mês no topo do modal (lista das cápsulas com plays e música do mês, mais setas anterior/próximo); a prévia é refeita com os dados do mês escolhido.
  - Tamanhos novos: Retrato 3:4, Paisagem 16:9 e Papel de parede de celular, mais exportação em alta qualidade (2×).
  - 6 temas novos (Aurora, Pastel, Café, Meia-noite, Cereja, Limão) e o tema "Suas cores", com 4 cores escolhidas pelo usuário.
  - Fundo gradiente, sólido ou capa desfocada da música do mês; brilho e textura granulada liga/desliga.
  - Tipografia (moderna, clássica, máquina), título editável, cantos das capas (retos, arredondados, redondos) e assinatura CirqueiraX opcional.
  - Preferências lembradas no navegador e botão "Restaurar padrão"; a prévia usa valor adiado para não travar enquanto se digita ou arrasta a cor.
- **Arquivos**: `web/features/musica/components/ModalImagemCapsula.tsx`, `web/features/musica/utils/temasImagemCapsula.ts`, `web/features/musica/utils/desenhoCapsula.ts`, `web/features/musica/utils/imagemCapsula.ts`, `web/features/musica/utils/modelosImagemCapsula.ts`, `documentation/funcionalidades/MUSICA.md`

---

### ✅ Melhoria 210 — Música: Novos Modelos de Imagem da Cápsula

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Pedido**: mais modelos na personalização da imagem da Cápsula.
- **Solução**: 6 modelos novos, todos adaptados a retrato e paisagem e respeitando tema, fundo, tipografia, título e cantos:
  - **Gráfico:** minutos de cada dia do mês em barras, com o dia de pico em destaque, média por dia e o que mais tocou.
  - **Números:** painel com minutos, streams, músicas diferentes, dias ouvindo, média por dia e dia mais ouvido, mais artista e música do mês.
  - **Vinil:** disco saindo da capa da música do mês e o "Lado A" com as seguintes.
  - **Revista:** título como nome da revista, capa e manchetes (artista do mês, minutos, música e álbum do mês).
  - **Ingresso:** o artista do mês como atração principal, os outros como convidados, dados do mês e canhoto com código de barras.
  - **Player:** tela de "tocando agora" com a música do mês, barra de progresso, controles e a fila a seguir.
  - Utilitários comuns dos modelos foram para `apoioModelosCapsula.ts`.
- **Arquivos**: `web/features/musica/utils/modelosExtrasImagemCapsula.ts`, `web/features/musica/utils/apoioModelosCapsula.ts`, `web/features/musica/utils/modelosImagemCapsula.ts`, `web/features/musica/utils/temasImagemCapsula.ts`, `documentation/funcionalidades/MUSICA.md`

---

### ✅ Melhoria 211 — Música: Correções de Layout no Celular

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Pedido**: as seções da página de música estavam quebradas no celular.
- **Causa**: os grids das seções usavam `1fr`, que no CSS vale "no mínimo a largura do conteúdo". Fileiras com rolagem horizontal, gráficos e textos sem quebra alargavam a coluna além da tela e empurravam a página inteira para o lado.
- **Solução**:
  - Todas as colunas de grid da página passaram para `minmax(0, …fr)` (Visão geral, Rankings, Hábitos, Descobertas, Versões, Histórico, Retrospectiva, Serviços, tabela de ranking e esqueleto de carregamento).
  - Contêiner da página com `overflow-x: clip`, para nada mais criar rolagem lateral.
  - Espaçamentos internos e números grandes menores no celular (Cápsula, Topos, Atalhos, Hábitos, modal da música, estado vazio) e contadores da aba Serviços que encolhem sem vazar.
  - A barra de abas rola até a aba escolhida.
- **Arquivos**: `web/features/musica/Musica.tsx` e componentes em `web/features/musica/components/` (AbasMusica, AbaDescobertas, AbaHabitos, AbaHistorico, AbaServicos, AbaVersoes, EsqueletoPaginaMusica, EstadoVazioMusica, ModalMusica, PecasBlocoMusica, SecaoCapsulaSonora, SecaoHojeSemana, SecaoRetrospectiva, TabelaRankingMusica, VisaoGeralAtalhos, VisaoGeralDestaque, VisaoGeralTopos)

---

### ✅ Melhoria 212 — Usuários: Modal de Atividade por Usuário

- **Status**: Concluído
- **Data**: 24 de novembro de 2026
- **Pedido**: na página de usuários, um botão em cada usuário que abre um modal com tudo o que ele fez no sistema (músicas, downloads, MP3, transcrições e mais dados de música).
- **Solução**:
  - Nova rota `GET /api/v1/usuarios/{id}/resumo` (só admin). Junta contas conectadas, música (todo o período e mês atual, por fonte, top 5 músicas e artistas com capa), downloads de vídeo, MP3, prints, Telegram, upload manual, transcrições, livros em áudio, YouTube, transferências de playlist e custo de IA.
  - Os números de música reaproveitam as consultas da página de Música (`AnaliseReproducaoMusicalRepository`), então seguem as mesmas regras do Spotify.
  - Botão de gráfico ao lado de "Editar" na tabela e nos cartões do celular. O modal mostra a atividade em cartões de 2 colunas no celular e 3 no computador.
- **Arquivos**: `src/Repository/ResumoAtividadeUsuarioRepository.php`, `src/DataObject/Usuario/ResumoAtividadeUsuarioDTO.php`, `src/Service/Usuario/ObterResumoAtividadeUsuarioService.php`, `src/Controller/Usuario/UsuarioController.php`, `web/features/usuarios/` (ModalResumoUsuario, PecasResumoUsuario, ListaUsuarios, Usuarios, api, types, hooks, utils/formatarResumoUsuario)

---

### ✅ Melhoria 213 — Spotify: Importação Sem Fila de Vínculos Travada

- **Status**: Concluído
- **Data**: 24 de novembro de 2026
- **Pedido**: depois de importar o histórico do Spotify, as reproduções não apareciam na página de Música.
- **Causa**: a importação mandava um `VincularSpotifyAoCatalogoMessage` por lote de 500 reproduções (cerca de 540 mensagens para dois arquivos). Cada uma religava o histórico inteiro a partir da sua data. Com dois workers em paralelo, as duas tentavam criar o mesmo `vinculo_musica_spotify` e caíam em `Duplicate entry … UNIQ_VINCULO_MUSICA_SPOTIFY_IDENTIDADE`.
- **Solução**:
  - A importação junta o intervalo de todos os lotes e manda uma única mensagem no fim.
  - A ligação ao catálogo roda sob uma trava do MySQL (`GET_LOCK('cirqueirax_vincular_spotify')`), então workers e comandos nunca ligam faixas ao mesmo tempo.
  - Operação: backup completo do banco antes, mensagens repetidas removidas da fila e `app:musica:projetar-spotify` rodado para os usuários 6 e 7.
- **Arquivos**: `src/Service/Spotify/DeduplicarEImportarHistoricoSpotifyService.php`, `src/Service/Musica/VincularFaixasSpotifyAoCatalogoService.php`, `src/Repository/VinculoMusicaSpotifyRepository.php`, `src/Exception/Musica/MusicaCatalogoException.php`

---

### ✅ Melhoria 214 — Música: Capas e Fotos que Faltavam Após Importação

- **Status**: Concluído
- **Data**: 24 de novembro de 2026
- **Pedido**: algumas imagens de artistas e músicas não apareciam.
- **Causa**: as músicas novas, que vieram de importação, entram no catálogo sem capa. A capa só era buscada quando a página mostrava a música, e mesmo depois de encontrada ficava apenas em `imagem_spotify`: não ia para `musica_catalogo.url_capa`. Além disso, o resultado da página de Música fica em cache, então a imagem encontrada depois só aparecia no dia seguinte.
- **Solução**:
  - Quando uma capa é encontrada (ou já existia), ela é gravada em todas as músicas do catálogo ligadas àquela faixa que ainda não têm capa.
  - Capas e fotos de artista encontradas marcam o cache de análise do usuário para ser recalculado.
  - A capa de faixa é buscada primeiro pelos caminhos públicos (oEmbed do Spotify e Deezer), que não gastam a cota da API do Spotify. A API só é usada se eles falharem. Motivo: um lote grande de capas levou a um bloqueio 429 de cerca de 22 h.
  - Novo comando `app:musica:buscar-capas-faltantes --usuario=N --limite=1000` enfileira a busca de capa das músicas mais ouvidas sem capa.
  - `app:musica:buscar-fotos-artistas --usuario=N --mais-ouvidos=500` busca primeiro as fotos dos artistas mais ouvidos daquele usuário (via YouTube Music, fora da cota do Spotify).
- **Arquivos**: `src/Service/Spotify/ResolverImagemSpotifyService.php`, `src/Service/Musica/BuscarFotoArtistaCatalogoService.php`, `src/Repository/MusicaCatalogoRepository.php`, `src/Repository/ArtistaCatalogoRepository.php`, `src/Command/BuscarCapasFaltantesCommand.php`, `src/Command/BuscarFotosArtistasCommand.php`

---
