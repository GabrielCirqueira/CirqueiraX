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
