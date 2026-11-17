# Melhorias — M181 a M200

> Detalhamento das melhorias **M181–M200**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 181 — Endurecimento de Segurança Multi-usuário

- **Status**: Concluído
- **Data**: 15 de novembro de 2026
- **Problema**: outras pessoas (devs) vão acessar o CirqueiraX. Havia risco de ver dados de todos no painel de livros, caminho absoluto de mídia na API, Syncthing aberto a qualquer `ROLE_ADMIN`, JWT master e seed com senha fraca em produção, e refresh sem limite de tentativas.
- **Solução**:
  - Painel de livros filtra por `usuario_id`; memória/pasta global só para admin.
  - API de mídia devolve só o nome do arquivo (sem path do storage) e categoria só do dono.
  - Syncthing exige `ROLE_SUPER_ADMIN` (dono promovido; convidados ficam em `ROLE_USER`).
  - `app:jwt:master` e seed bloqueados em prod (JWT master só com `JWT_MASTER_ENABLED=1`; seed só em `dev`).
  - `--admin` em `app:usuario:criar` exige `ALLOW_ADMIN_CREATE=1` em produção.
  - Throttling no refresh JWT; cabeçalhos `X-Frame-Options: DENY`, CORP e cross-domain.
  - **Não alterado**: `POST /api/v1/youtube-music/extensao/eventos` e autenticador da extensão.
- **Arquivos**: `config/packages/security.yaml`, `src/Command/JwtMasterCommand.php`, `src/Command/AppSeedCommand.php`, `src/Command/CriarUsuarioCommand.php`, `src/Controller/Sync/SyncController.php`, `src/Serializer/MediaItemSerializer.php`, `src/Service/LivroAudio/PainelSistemaLivrosAudioService.php`, `src/Repository/LivroAudioRepository.php`, `src/Repository/LivroAudioBlocoRepository.php`, `src/Repository/LivroAudioBlocoVozRepository.php`, `src/EventListener/CabecalhosSegurancaListener.php`, `documentation/stack/AUTH.md`

---

### ✅ Melhoria 182 — Tutorial Spotify Recolhido e Só Histórico Ampliado

- **Status**: Concluído
- **Data**: 15 de novembro de 2026
- **Problema**: o tutorial de dados retroativos do Spotify abria expandido e ainda sugeria caixas além do necessário, gerando dúvida na hora de pedir o export.
- **Solução**: a seção inicia recolhida e o pedido recomenda apenas o Histórico ampliado de streams (sem Informações técnicas).
- **Arquivos**: `web/features/spotify/components/SecaoTutorialHistoricoSpotify.tsx`, `web/features/spotify/utils/tutorialHistoricoSpotify.ts`, `web/features/spotify/components/ModalUploadHistoricoSpotify.tsx`

---

### ✅ Melhoria 183 — Histórico das 15 Faixas Anteriores no Tocando Agora

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: o cartão "Tocando agora" (Spotify e YouTube Music) só mostrava a faixa atual; para ver o que tocou antes era preciso abrir outra seção.
- **Solução**: popup/modal com as 15 faixas anteriores (capa, nome, artista e link), no Spotify e no YouTube Music, sem sair do cartão. Endpoints e serviços dedicados de histórico recente.
- **Arquivos**: `web/features/musica/components/ModalHistoricoRecente.tsx`, `web/features/spotify/components/CartaoTocandoAgora.tsx`, `web/features/youtube-music/components/CartaoTocandoAgoraYoutubeMusic.tsx`, `src/Service/Spotify/ListarHistoricoRecenteSpotifyService.php`, `src/Service/YoutubeMusic/ListarHistoricoRecenteYoutubeService.php`, `src/Controller/Spotify/SpotifyAnaliseController.php`, `src/Controller/YoutubeMusic/YoutubeMusicController.php`

---

### ✅ Melhoria 184 — Catálogo de Artistas e Músicas Compartilhado Entre Usuários

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: cada usuário duplicava artistas, músicas, aliases e vínculos Spotify no catálogo, inchando o banco ao criar contas novas.
- **Solução**: artista/música/alias/vínculo Spotify passam a ser globais; reproduções e vídeos do YouTube Music continuam por usuário. Migração e ajustes nos repositórios/serviços de identificação e análise.
- **Arquivos**: `migrations/Version20261116130140.php`, `src/Entity/ArtistaCatalogo.php`, `src/Entity/MusicaCatalogo.php`, `src/Entity/AliasArtistaCatalogo.php`, `src/Entity/VinculoMusicaSpotify.php`, `src/Repository/ArtistaCatalogoRepository.php`, `src/Repository/MusicaCatalogoRepository.php`, `src/Service/IdentificacaoMusica/`, `documentation/funcionalidades/MUSICA.md`

---

### ✅ Melhoria 185 — Página de Música Mais Rápida com Cache e Lazy Load

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: `/musica` recalculava resumo, ranking e cápsula a cada visita e buscava seções abaixo da dobra mesmo sem aparecer na tela.
- **Solução**: cache no backend para resumo/ranking/cápsula, remoção do ranking duplicado dos 7 dias e lazy load das seções abaixo da dobra (`useVisibilidadeSecao`).
- **Arquivos**: `src/Service/Musica/Analise/ObterResumoHojeSemanaCuriosidadesService.php`, `src/Service/Musica/Analise/ListarMesesCapsulaService.php`, `src/Service/Musica/Analise/ObterDetalheCapsulaService.php`, `web/features/musica/hooks/useVisibilidadeSecao.ts`, `web/features/musica/Musica.tsx`, `web/features/musica/components/SecaoHojeSemana.tsx`

---

### ✅ Melhoria 186 — Transferir e Vincular Playlists entre Spotify e YouTube Music

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: não havia jeito de mover ou manter playlists alinhadas entre Spotify e YouTube Music pelo CirqueiraX.
- **Solução**: fluxo em `/musica/gerenciar` (assistente) com escolha de direção, seleção de playlists, casamento de faixas via Messenger, execução assíncrona, vínculos e sincronização. Entidades, filas, clientes Spotify/YouTube e UI do assistente.
- **Arquivos**: `src/Controller/TransferenciaPlaylist/`, `src/Service/TransferenciaPlaylist/`, `src/Entity/TransferenciaPlaylist.php`, `src/Entity/VinculoPlaylist.php`, `migrations/Version20261116145035.php`, `web/features/transferencia-playlist/`, `documentation/funcionalidades/MUSICA.md`

---

### ✅ Melhoria 187 — OAuth Web Dedicado para Playlists do YouTube

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: o cookie do YouTube Music não serve para criar/editar playlists na API oficial; faltava um cliente OAuth Web separado.
- **Solução**: fluxo OAuth Web dedicado (`ContaYoutubeOAuth`, callback `/musica/youtube/callback`) só para playlists, sem misturar com a sessão de histórico por cookie.
- **Arquivos**: `src/Controller/YoutubeOAuth/YoutubeOAuthController.php`, `src/Entity/ContaYoutubeOAuth.php`, `src/Infra/YoutubeData/YoutubePlaylistClient.php`, `.tooling/env/.env.example`

---

### ✅ Melhoria 188 — Reconexão do Spotify com Escopos de Playlist

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: contas Spotify conectadas só para histórico não tinham permissão de leitura/escrita de playlists, e a transferência falhava sem aviso claro.
- **Solução**: exigir reconexão com escopos de playlist quando faltam; UI e backend sinalizam a necessidade antes de iniciar a transferência.
- **Arquivos**: `src/Infra/Spotify/SpotifyClient.php`, `web/features/transferencia-playlist/`, `web/features/musica/GerenciarMusica.tsx`

---

### ✅ Melhoria 189 — Playlists do Spotify na API `items` (Migração 2026)

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: a API do Spotify migrou campos de playlists; o cliente ainda lia o formato antigo e quebrava listagem/faixas.
- **Solução**: adaptar o cliente e o parse para o formato `items` da migração 2026.
- **Arquivos**: `src/Infra/Spotify/SpotifyClient.php`

---

### ✅ Melhoria 190 — Decisões de Vínculo e Atalhos de Seleção na Transferência

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: na tela de vínculo/seleção de playlists, as decisões e atalhos não estavam claros o bastante para o usuário fechar o pareamento com segurança.
- **Solução**: textos e atalhos de seleção revisados (vincular, criar nova, ignorar) para deixar a intenção de cada escolha explícita.
- **Arquivos**: `web/features/transferencia-playlist/components/AssistenteTransferenciaPlaylists.tsx`, `web/features/transferencia-playlist/utils.ts`

---

### ✅ Melhoria 191 — Correções da Transferência de Playlists (Prévia, Pareamento e Progresso)

- **Status**: Concluído
- **Data**: 16 de novembro de 2026
- **Problema**: a prévia vinha vazia / 422 por UUID com Doctrine IDENTITY; o progresso ficava em 0 durante a execução; playlists numeradas pareavam errado; ao fechar a aba sumiam o relatório e o cartão de pendentes; "Nenhum vínculo" aparecia com dados no banco; a pausa por cota do YouTube não ficava clara.
- **Solução**:
  - Repositórios e serializer passam a carregar por IDENTITY / UUID binário de forma consistente.
  - Confirmação de prévia aceita `uuidsIgnorados` e `itensResumo`; listagem de transferências pendentes e retoma.
  - Pareamento: match exato antes do fuzzy; números das playlists precisam bater; nomes numerados depois só no exato.
  - Persistência de progresso durante a execução; status `pausada_cota` quando a API do YouTube estoura o dia.
  - Comandos de debug/reprocesso e serviço de listagem de transferências.
- **Arquivos**: `src/Repository/ItemTransferenciaPlaylistRepository.php`, `src/Repository/TransferenciaPlaylistRepository.php`, `src/Repository/PlaylistTransferenciaSelecionadaRepository.php`, `src/Serializer/TransferenciaPlaylistSerializer.php`, `src/Service/TransferenciaPlaylist/ConfirmarPreviaTransferenciaService.php`, `src/Service/TransferenciaPlaylist/DetectarParesPlaylistDestinoService.php`, `src/Service/TransferenciaPlaylist/ExecutarTransferenciaPlaylistService.php`, `src/Service/TransferenciaPlaylist/ListarTransferenciasPlaylistService.php`, `src/Command/ReprocessarTransferenciaPlaylistCommand.php`, `src/Command/DebugTransferenciaPlaylistCommand.php`, `web/features/transferencia-playlist/`

---

### ✅ Melhoria 192 — Página `/musica` em Abas com Novos Blocos de Análise

- **Status**: Concluído
- **Data**: 17 de novembro de 2026
- **Problema**: `/musica` era uma página longa demais, com blocos repetidos; faltavam análises que já davam para fazer com `reproducao_musical` e o catálogo, sem nova consulta ao Spotify.
- **Solução**:
  - Mesma rota `/musica` com abas na URL (`?aba=`): Visão geral, Rankings, Hábitos, Descobertas, Versões, Histórico, Recordes, Retrospectiva e Serviços (quando a fonte é Todos).
  - Cada aba carrega os dados ao abrir; tocando agora fica na Visão geral.
  - Novos blocos: rotina (hora e período do dia), sessões, primeira/última do dia, saudade, profundidade do artista, versões alteradas + mashups, neste dia, álbum em sequência, dia clicável (histórico do dia), evolução mensal empilhada Spotify × YouTube Music.
  - Endpoints em `MusicaAnaliseController` + `ObterExtrasPaginaMusicaService` + consultas em `AnaliseReproducaoMusicalRepository`.
  - Sem calendário de calor, sem reimportar aparelho/país/offline do Spotify, sem metas/notificações/imagens extras.
  - Service worker sobe para `cirqueirax-app-v2` para não servir o bundle antigo depois do deploy.
- **Arquivos**: `web/features/musica/Musica.tsx`, `web/features/musica/components/AbasMusica.tsx`, `web/features/musica/components/AbasConteudoMusica.tsx`, `web/features/musica/components/ModalHistoricoDia.tsx`, `web/features/musica/hooks/useAbaMusica.ts`, `web/features/musica/utils/abasMusica.ts`, `src/Service/Musica/Analise/ObterExtrasPaginaMusicaService.php`, `src/Controller/Musica/MusicaAnaliseController.php`, `src/Repository/AnaliseReproducaoMusicalRepository.php`, `documentation/funcionalidades/MUSICA.md`, `public/sw.js`

---

### ✅ Melhoria 193 — Redesenho Visual das Abas de `/musica` (Capas, Gráficos e Tabela de Ranking)

- **Status**: Concluído
- **Data**: 17 de novembro de 2026
- **Problema**: as abas da M192 tinham o mesmo formato em tudo (cartões de número e linhas de texto), sem capas nem gráficos; Visão geral e Rankings repetiam o mesmo conteúdo; o histórico recente era um popup.
- **Solução**:
  - Toda música, álbum e artista com capa/foto (dados do banco + mapa de imagens já existente, sem chamada nova ao Spotify).
  - Visão geral nova: destaque em gradiente (minutos, variação vs período anterior, streams, artistas, dias) com gráfico de minutos por dia/mês; pódio de artistas; música e álbum do período; carrossel do top 10; rosca Spotify × YouTube Music; mini rotina de 24 barras; rostos de artistas novos; últimas 6 tocadas; saudade e neste dia — cada bloco com atalho para a aba.
  - Rankings virou tabela: posição, capa, streams, minutos, serviços, com busca, ordenar por streams/minutos e filtro por serviço.
  - Hábitos: barras por hora coloridas por período do dia com pico, barras por dia da semana, artista de cada período com foto; histograma de sessões e maior maratona com mosaico de capas; primeira/última do dia em duas colunas com capa grande.
  - Descobertas: saudade em grade de capas com selo "X dias sem ouvir"; profundidade com foto, barra de músicas e barra de meses.
  - Versões: rosca original × alterada, barras por tipo, top versões com capa do vídeo e mashups com fotos empilhadas dos artistas.
  - Histórico: feed de últimas ouvidas agrupado por dia (com "carregar mais") no lugar do popup, neste dia por ano com mosaico de 4 capas, álbuns em sequência com capa.
  - Serviços: linha de % por serviço por mês, contagem de músicas exclusivas e listas "só no Spotify" / "só no YouTube Music"; saiu a evolução duplicada.
  - Novos endpoints `/api/v1/musica/visao-geral`, `/ultimas-ouvidas` e `/servicos`; cache de análise sobe para v7; service worker para `cirqueirax-app-v3`.
- **Fora desta entrega**: variação de posição e comparação entre períodos na tabela de ranking.
- **Arquivos**: `src/Service/Musica/Analise/ObterVisaoGeralMusicaService.php`, `src/Service/Musica/Analise/ObterComparativoServicosMusicaService.php`, `src/Service/Musica/Analise/MontarItensComImagemMusicaService.php`, `src/Service/Musica/Analise/ObterExtrasPaginaMusicaService.php`, `src/Repository/AnaliseReproducaoMusicalRepository.php`, `src/Controller/Musica/MusicaAnaliseController.php`, `src/DataObject/Spotify/Analise/PeriodoAnaliseSpotifyDTO.php`, `web/features/musica/components/Aba*.tsx`, `web/features/musica/components/VisaoGeral*.tsx`, `web/features/musica/components/TabelaRankingMusica.tsx`, `web/features/musica/components/PecasBlocoMusica.tsx`, `web/features/musica/hooks/useBlocosMusica.ts`, `web/features/musica/utils/blocosMusica.ts`, `public/sw.js`

---
