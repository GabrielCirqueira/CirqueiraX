# Melhorias — M141 a M160

> Detalhamento das melhorias **M141–M160**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 141 — Login Não Cai Mais a Cada Deploy

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a cada deploy (e a cada hora) o usuário era deslogado. Duas causas: o frontend renovava o token em `/api/token/refresh`, rota que não existe (a certa é `/api/v1/token/refresh`), então a renovação nunca funcionou; e as chaves JWT eram geradas de novo em cada container.
- **Solução**:
  - Rota de renovação corrigida em `web/config/api.ts`.
  - Chaves JWT no volume `jwt_prod`, semeado com as chaves atuais.
  - Se o login cair, a página atual é guardada e o login volta para ela (`destinoAposLogin`).
- **Arquivos**: `web/config/api.ts`, `web/features/auth/Login.tsx`, `web/features/auth/ModalAuth.tsx`, `web/features/auth/hooks.ts`, `web/features/auth/utils.ts`, `devops/docker-compose.prod.yaml`, `documentation/ops/DOCKER.md`, `documentation/ops/DEPLOY_PRODUCAO.md`, `documentation/guias/GUIA-GERAL.md`

---

### ✅ Melhoria 142 — Notificações de Atualização com Popup e Sino

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: não havia como avisar os usuários do que mudou no sistema depois de cada entrega.
- **Solução**:
  - Entidade `Notificacao` por usuário (com `lidaEm`), `GET /api/v1/notificacoes`, `POST /api/v1/notificacoes/marcar-lidas` e o comando `app:notificacao:criar` (todos os usuários ou `--usuario`), rodado depois de cada entrega publicada.
  - Frontend `web/features/notificacoes`: popup com as não lidas (fechar ou "Ler tudo" marca como lidas), sino no topo com contador e histórico, verificação a cada 60 s e ao voltar para a aba.
  - Popup compacto: tamanho `md`, altura até `min(80vh, 640px)` e rolagem interna (antes ocupava a altura toda).
- **Arquivos**: `src/Entity/Notificacao.php`, `src/Enum/TipoNotificacao.php`, `src/Repository/NotificacaoRepository.php`, `src/Serializer/NotificacaoSerializer.php`, `src/Command/CriarNotificacaoCommand.php`, `src/Controller/Notificacao/NotificacaoController.php`, `src/Service/Notificacao/`, `src/DataObject/CriarNotificacaoDTO.php`, `src/DataObject/MarcarNotificacoesLidasDTO.php`, `src/Exception/Notificacao/NotificacaoException.php`, `migrations/Version20261112110000.php`, `web/features/notificacoes/`, `documentation/funcionalidades/NOTIFICACOES.md`, `documentation/stack/AUTH.md`

---

### ✅ Melhoria 143 — Site Se Atualiza Sozinho Depois do Deploy

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a página aberta continuava rodando o JavaScript antigo depois de um deploy (o popup de notificações novo aparecia com o layout antigo).
- **Solução**: `web/shared/pwa/versaoApp.ts` compara a cada 60 s (e ao voltar para a aba) o script principal carregado com o publicado em `/`; se mudou, recarrega a mesma página sem perder o login, mas espera se houver áudio ou vídeo tocando ou se o usuário estiver digitando.
- **Arquivos**: `web/shared/pwa/versaoApp.ts`, `web/main.tsx`, `documentation/stack/FRONTEND.md`

---

### ✅ Melhoria 144 — Documentação do YouTube Music Reescrita

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a documentação não explicava em detalhe como a captura por cookie funciona nem como copiar os cabeçalhos em cada navegador.
- **Solução**: `YOUTUBE_MUSIC.md` reescrito do zero (por que cookie, divisão das peças, passo a passo no Firefox e no Chrome, erros comuns, segurança, o script `bin/ytmusic.py`, detecção pelo topo do histórico, horário e tempo estimados com exemplos, fuso, reconexão, duração das sessões medidas, Takeout, rotas, comandos e diagnóstico). `MUSICA.md` ganhou "Como está dividido" (cinco camadas). O passo a passo do cartão do YouTube Music passou a explicar a cópia no Firefox e no Chrome.
- **Arquivos**: `documentation/funcionalidades/YOUTUBE_MUSIC.md`, `documentation/funcionalidades/MUSICA.md`, `documentation/funcionalidades/SPOTIFY.md`, `documentation/funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md`, `documentation/stack/BACKEND.md`, `documentation/stack/FRONTEND.md`, `documentation/stack/MESSENGER.md`, `web/features/youtube-music/utils/conexaoYoutubeMusic.ts`

---

### ✅ Melhoria 145 — Extensão do Navegador para o YouTube Music

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: o coletor por cookie só vê o histórico do YouTube Music, então o horário e o tempo ouvido são estimados e os pulos não aparecem. O pedido foi manter a lógica do cookie e, quando a extensão estiver ativa, ter os dados exatos.
- **Solução**:
  - Extensão opcional `extensao/youtube-music/` (Manifest V3, Chrome/Edge/Brave e Firefox) que lê o player aberto e manda horário, tempo ouvido (sem pausa e anúncio) e pulos.
  - Backend: fonte `extensao` em `reproducao_youtube` (`id_extensao`, `pulada`, `vista_pelo_coletor`, `extensao_atualizada_em`), tabela `token_extensao_youtube_music` (hash SHA-256, até 5 aparelhos por usuário, revogável), `TokenExtensaoYoutubeMusicAuthenticator` só para `POST /api/v1/youtube-music/extensao/eventos` (60 lotes por minuto), união com o coletor numa janela de 600 s nos dois sentidos (e no Takeout).
  - Frontend: seção "Extensão do navegador" no cartão do YouTube Music (download do `.zip` gerado no build, passo a passo, gerar/copiar/revogar token).
  - Teste ponta a ponta num MySQL temporário encontrou e corrigiu a união com o coletor (passou a filtrar pelo `videoId`).
- **Arquivos**: `extensao/youtube-music/`, `.tooling/frontend/vite.config.js`, `config/packages/rate_limiter.yaml`, `config/packages/security.yaml`, `migrations/Version20261112130000.php`, `src/Controller/YoutubeMusic/YoutubeMusicExtensaoController.php`, `src/Entity/ReproducaoYoutube.php`, `src/Entity/TokenExtensaoYoutubeMusic.php`, `src/Service/YoutubeMusic/RegistrarEventosExtensaoYoutubeService.php`, `web/features/youtube-music/components/SecaoExtensaoYoutubeMusic.tsx`, `documentation/funcionalidades/YOUTUBE_MUSIC.md` (seção 18), `documentation/stack/AUTH.md`

---

### ✅ Melhoria 146 — Extensão Captura Abas do YouTube Music Já Abertas (1.1.0)

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: no primeiro uso, no PC da empresa, a extensão não capturou nada por 11 minutos. O token funcionava, mas a aba do YouTube Music já estava aberta antes da instalação e o Chrome não injeta o script nessas abas. O popup dizia "conectada" mesmo sem ler nada.
- **Solução**: `fundo.js` injeta os scripts nas abas abertas ao instalar, atualizar e abrir o navegador (permissão `scripting`), com trava contra rodar duas vezes. O popup mostra a linha "Aba do YouTube Music" (lendo, pausada, anúncio ou nenhuma aba). O passo a passo ganhou como recarregar e atualizar a extensão. Testado num Chromium real com o YouTube Music tocando; depois confirmado pelo usuário ("Tocando agora: Sugar · Maroon 5").
- **Arquivos**: `extensao/youtube-music/fundo.js`, `extensao/youtube-music/conteudo.js`, `extensao/youtube-music/pagina.js`, `extensao/youtube-music/manifest.json`, `extensao/youtube-music/popup.html`, `extensao/youtube-music/popup.js`, `web/features/youtube-music/utils/extensaoYoutubeMusic.ts`

---

### ✅ Melhoria 147 — Página Música Só com Relatórios e Tela Gerenciar

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a página Música misturava relatórios com configuração (contas, extensão, importações, revisão).
- **Solução**: nova rota `/musica/gerenciar` (`GerenciarMusica.tsx`) com as contas do Spotify e do YouTube Music, a extensão, as importações e o cartão da revisão, aberta pelo botão **Gerenciar** ao lado do seletor de fonte (`BotaoGerenciarMusica`, com contador de pendências). A revisão volta para o Gerenciar, e os avisos de conexão do Dashboard apontam para ele.
- **Arquivos**: `web/features/musica/GerenciarMusica.tsx`, `web/features/musica/Musica.tsx`, `web/features/musica/components/BotaoGerenciarMusica.tsx`, `web/features/musica/components/CartaoRevisaoGerenciar.tsx`, `web/features/musica/utils/gerenciarMusica.ts`, `web/App.tsx`, `web/features/dashboard/utils/metricasDashboard.ts`, `src/Service/Dashboard/ResumoIntegracoesMusicaService.php`

---

### ✅ Melhoria 148 — Tocando Agora do YouTube Music Igual ao do Spotify

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: o "tocando agora" do YouTube Music era só uma linha de texto, diferente do cartão do Spotify. Também, no uso real, uma música de 4,7 s ficou sem a marcação de pulo porque a extensão não mandou o evento de fim.
- **Solução**:
  - `CartaoTocandoAgoraYoutubeMusic` com capa, fundo desfocado, equalizador, barra de progresso que anda sozinha, "Pausado" após 30 s sem evento, links para a música e o artista, "Você já ouviu N vezes · desde" e "Abrir no YouTube Music". O status manda título, artistas, álbum, capa, `videoId` e o histórico (`resumirHistoricoDaMusica`).
  - Reprodução da extensão sem evento de fim é fechada quando a próxima começa (pulada se abaixo de 90% da duração).
- **Arquivos**: `web/features/youtube-music/components/CartaoTocandoAgoraYoutubeMusic.tsx`, `web/features/youtube-music/components/UltimaDetectadaYoutubeMusic.tsx`, `src/DataObject/YoutubeMusic/ResumoExtensaoYoutubeDTO.php`, `src/Serializer/ContaYoutubeMusicSerializer.php`, `src/Repository/ReproducaoMusicalRepository.php`, `src/Repository/ReproducaoYoutubeRepository.php`, `src/Entity/ReproducaoYoutube.php`, `src/Service/YoutubeMusic/RegistrarEventosExtensaoYoutubeService.php`, `src/Service/YoutubeMusic/ObterStatusYoutubeMusicService.php`

---

### ✅ Melhoria 149 — Minutos por Plataforma nas Listas de Música

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: com o seletor em Todas, não dava para ver quanto de cada música ou artista veio do Spotify e quanto do YouTube Music; isso só aparecia no tooltip dos minutos.
- **Solução**: rankings de músicas e artistas, Cápsula e músicas/mashups do artista mostram o ícone e os minutos de cada plataforma (`DivisaoFontesMusica`, `listarParcelasPorFonte`). As músicas do artista ganharam o tooltip e a marca de estimado.
- **Arquivos**: `web/features/musica/components/DivisaoFontesMusica.tsx`, `web/features/musica/components/ItensRankingMusica.tsx`, `web/features/musica/components/ListaMusicasItem.tsx`, `web/features/musica/components/BlocoDetalhe.tsx`, `web/features/musica/components/SecaoCapsulaSonora.tsx`, `web/features/musica/DetalheArtistaMusica.tsx`, `web/features/musica/utils/fonteMusica.ts`, `web/features/musica/types.ts`

---

### ✅ Melhoria 150 — Versões da Música Agrupadas e Critério "por Streams" no Topo

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: "Versões ouvidas neste período" mostrava "Alone" duas vezes no YouTube Music (áudio oficial e clipe, dois vídeos da mesma versão). E a ordem do Top artistas parecia errada quando um artista tem mais minutos com menos streams.
- **Solução**: `listarVariantesMusica` agrupa os vídeos por tipo de versão e usa o mais ouvido como título, capa e link. Os cartões Top artistas, músicas e álbuns da retrospectiva dizem "por streams", porque a ordem segue a regra do Spotify.
- **Arquivos**: `src/Repository/AnaliseReproducaoMusicalRepository.php`, `web/features/musica/components/SecaoRetrospectiva.tsx`

---

### ✅ Melhoria 151 — Rótulos Claros no Total da Retrospectiva

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: o número grande da retrospectiva (127 mil minutos em 2026) é o total de todas as músicas, mas ficava ao lado da foto do artista do ano e parecia ser só dele (Alan Walker tem 3.434 min).
- **Solução**: o total diz "minutos ouvidos no total" com "Somando todas as músicas e artistas de 2026", e o artista do ano mostra "streams só dele". Total conferido no banco (127.786 min).
- **Arquivos**: `web/features/musica/components/SecaoRetrospectiva.tsx`

---

### ✅ Melhoria 152 — Top 5 Artistas, Músicas e Álbuns do Mês na Cápsula Sonora

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a Cápsula Sonora mostrava só o artista e a música nº 1 do mês (o resto ficava no modal) e não tinha álbuns.
- **Solução**: `CalcularCapsulaMensalService` calcula os 5 álbuns do mês (`topAlbuns`, com capa pelo enriquecimento de imagens), e a seção ganhou três listas abaixo dos cartões (`TopsMesCapsula`): top 5 artistas, músicas e álbuns, com streams, minutos e divisão por plataforma. Testado com os dados de outubro/2026.
- **Arquivos**: `src/Service/Musica/Analise/CalcularCapsulaMensalService.php`, `src/Service/Musica/Analise/ObterDetalheCapsulaService.php`, `src/DataObject/Spotify/CapsulaMensalSpotifyDTO.php`, `src/Serializer/SpotifyCapsulaSerializer.php`, `web/features/musica/components/TopsMesCapsula.tsx`, `web/features/musica/components/SecaoCapsulaSonora.tsx`, `web/features/musica/types.ts`

---

### ✅ Melhoria 153 — Tela de Revisão de Música Refeita

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a tela `/musica/revisao` estava com o layout quebrado e não deixava claro o que fazer: o "Voltar" saía em duas linhas, as abas eram cortadas ("Indisponívei"), no celular cada botão ocupava uma linha e a regra do canal se partia, e as "outras leituras" pareciam texto solto.
- **Solução**: categorias em grade com contagem, bloco "Como funciona a revisão", quadro "O que fazer" por categoria, cartão com a pergunta "Qual música é esta?" e opções clicáveis "É esta" (a sugerida em verde com o nível de certeza), "Nenhuma delas?" com buscar/criar, mashup e não é música em grade, atalho do canal explicado, dica do lote, categoria vazia levando à próxima pendente e janela de correção com instruções e rótulo da versão. Conferido em 1280 px e 390 px.
- **Arquivos**: `web/features/revisao-musica/RevisaoMusica.tsx`, `web/features/revisao-musica/components/ComoFuncionaRevisao.tsx`, `web/features/revisao-musica/components/SeletorCategoriaRevisao.tsx`, `web/features/revisao-musica/components/CartaoVideoRevisao.tsx`, `web/features/revisao-musica/components/ListaRevisao.tsx`, `web/features/revisao-musica/components/BarraLoteRevisao.tsx`, `web/features/revisao-musica/components/CartaoCanalRevisao.tsx`, `web/features/revisao-musica/components/CartaoDuplicataRevisao.tsx`, `web/features/revisao-musica/components/PainelCorrecaoVideo.tsx`, `web/features/revisao-musica/utils/revisaoMusica.ts`

---

### ✅ Melhoria 154 — Capas e Atalhos para os Vídeos na Revisão

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: as possíveis duplicadas não mostravam imagem (são músicas vindas do Spotify, sem capa no catálogo nem vídeo), e a revisão não tinha links fáceis para abrir o vídeo e conferir.
- **Solução**:
  - Cada lado da duplicada traz a faixa mais tocada no Spotify (capa e link pelo enriquecimento de imagens), o vídeo mais ouvido no YouTube Music e quantas vezes foi ouvida em cada plataforma (`mapearFaixaSpotifyPorMusica`, `mapearVideoPrincipalPorMusica`).
  - Em toda a revisão a miniatura abre o vídeo e há atalhos "Abrir no YouTube", "YouTube Music" e "Canal" (`AtalhosVideoRevisao`, `MiniaturaVideoRevisao`). Canais novos ganharam o vídeo de exemplo e o id do canal; a janela de correção mostra o vídeo e, no lote, todos os selecionados.
- **Arquivos**: `src/Service/Musica/ListarRevisaoMusicaService.php`, `src/Repository/ReproducaoMusicalRepository.php`, `src/Repository/VideoYoutubeRepository.php`, `src/Serializer/MusicaCatalogoSerializer.php`, `web/features/revisao-musica/components/AtalhosVideoRevisao.tsx`, `web/features/revisao-musica/components/MiniaturaVideoRevisao.tsx`, `web/features/revisao-musica/components/CartaoDuplicataRevisao.tsx`, `web/features/revisao-musica/components/CartaoCanalRevisao.tsx`, `web/features/revisao-musica/components/CartaoVideoRevisao.tsx`, `web/features/revisao-musica/components/PainelCorrecaoVideo.tsx`, `web/features/revisao-musica/types.ts`, `web/features/revisao-musica/utils/revisaoMusica.ts`

---

### 🟡 Melhoria 155 — Duplicadas: Botão "São Músicas Diferentes" e Detecção Mais Precisa

- **Status**: Publicado, falta validar
- **Data**: 12 de novembro de 2026
- **Problema**: "BURN" de "(((())))" aparecia como duplicata de "Burn" da Ellie Goulding, e não havia como dizer que eram músicas diferentes; o texto "é só deixar como está" não explicava o que acontecia.
- **Solução**:
  - O nome "(((())))" fica vazio depois da normalização, e artista vazio contava como parecido com qualquer um. Agora artista vazio só casa com qualquer outro quando a música não tem artista nenhum. Com os dados reais, os pares caíram de 30 para 13.
  - Botão **São músicas diferentes**: grava o par em `duplicata_descartada` (`POST /api/v1/musica/catalogo/duplicatas/descartar`) e ele não volta para a revisão. "Manter esta" virou **Iguais: ficar com este nome**, com a explicação de cada resposta logo abaixo.
- **Arquivos**: `src/Entity/DuplicataDescartada.php`, `src/Repository/DuplicataDescartadaRepository.php`, `src/Service/Musica/Correcao/DescartarDuplicataCatalogoService.php`, `src/Service/Musica/SugerirDuplicatasCatalogoService.php`, `src/Repository/MusicaCatalogoRepository.php`, `src/Controller/Musica/MusicaCorrecaoController.php`, `src/DataObject/Musica/DescartarDuplicataDTO.php`, `migrations/Version20261112150000.php`, `web/features/revisao-musica/api.ts`, `web/features/revisao-musica/hooks/useRevisaoMusica.ts`, `web/features/revisao-musica/components/CartaoDuplicataRevisao.tsx`, `web/features/revisao-musica/components/ListaRevisao.tsx`, `documentation/stack/BACKEND.md`

---

### 🟡 Melhoria 156 — Spotify e YouTube Music Separados na Retrospectiva do Ano

- **Status**: Publicado, falta validar
- **Data**: 12 de novembro de 2026
- **Problema**: a retrospectiva era a única seção sem a divisão por plataforma que as outras mostram.
- **Solução**:
  - Com o seletor em Todas, o total do ano mostra cada plataforma com nome e minutos (`porFonte` no `/retrospectiva/{ano}`), o artista do ano e os tops de artistas, músicas e álbuns mostram a divisão, e o gráfico mensal mostra os minutos de cada plataforma no tooltip (vale para todos os gráficos mensais).
  - Álbuns não tinham divisão nem no backend: `listarRankingAlbuns` passou a somar as colunas por fonte (vale também para a Cápsula e o ranking).
  - A chave do cache das análises ganhou versão (`VERSAO_FORMATO`) para não ler objetos guardados no formato antigo.
  - Conferido com os dados de 2026 (Different World: 273 streams no Spotify e 2 no YouTube Music; Alan Walker: 3.426 min e 9 min).
- **Arquivos**: `src/Repository/AnaliseReproducaoMusicalRepository.php`, `src/DataObject/Spotify/Analise/AlbumAnaliseSpotifyDTO.php`, `src/DataObject/Spotify/Analise/RetrospectivaAnualSpotifyDTO.php`, `src/Service/Spotify/CacheAnaliseSpotifyService.php`, `web/features/musica/components/SecaoRetrospectiva.tsx`, `web/features/musica/components/DivisaoFontesMusica.tsx`, `web/features/musica/components/GraficoMensalMusica.tsx`, `web/features/musica/types.ts`

---

### ✅ Melhoria 157 — Capas nas Versões da Música

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: "Versões ouvidas neste período" (no ranking e no detalhe da música) mostrava só título, canal e o ícone da plataforma, sem imagem (ex.: Little Dark Age e a versão slowed + reverb).
- **Solução**: cada versão mostra a capa à esquerda, com o ícone da plataforma ao lado do tipo de versão. O backend completa a capa de todas as versões (`CompletarCapasVariantesService`): vídeo do YouTube sem capa salva usa a miniatura do vídeo, e faixa do Spotify usa a capa do enriquecimento de imagens. A chave do cache das análises passou para `v3` para o detalhe já vir com as capas.
- **Arquivos**: `src/Service/Musica/Analise/CompletarCapasVariantesService.php`, `src/Service/Musica/Analise/ListarVersoesMusicaService.php`, `src/Service/Musica/Analise/ObterDetalheMusicaService.php`, `src/Service/Spotify/CacheAnaliseSpotifyService.php`, `web/features/musica/components/ListaVersoesMusica.tsx`, `documentation/funcionalidades/MUSICA.md`

---

### 🟡 Melhoria 158 — Relatório da Importação do Takeout em Popup e Várias Importações em Fila

- **Status**: Publicado, falta validar
- **Data**: 12 de novembro de 2026
- **Problema**: o relatório do Takeout só aparecia se a janela da importação continuasse aberta e trazia poucos números. Ele também contava todas as reproduções do Takeout no período, então uma 2ª ou 3ª importação misturaria os números das anteriores. Além disso, o sistema recusava um novo arquivo enquanto outro rodava, e o pedido era fazer umas 3 importações (de contas e aparelhos diferentes), sempre somando ao que já existe.
- **Solução**:
  - Cada reprodução guarda a importação que a trouxe (`reproducao_youtube.importacao_youtube_uuid`, migration `Version20261112180000`), e o relatório é calculado só com ela: músicas identificadas (canal oficial, IA, manual), o que foi para a revisão, o que não era música, vídeos novos, reproduções lidas, novas, já existentes e juntadas com o coletor, minutos e streams, músicas e artistas diferentes, período, custo e o top 5 de músicas e artistas.
  - Popup global (`PopupRelatorioImportacaoYoutube`, no layout) que abre sozinho em qualquer página quando a importação termina, um relatório por vez, até ser fechado (`relatorio_visto_em`, `POST /importacoes/{uuid}/relatorio-visto`).
  - Fila: até 5 arquivos seguidos, que rodam um de cada vez na ordem de envio (`ResultadoEtapaImportacaoYoutube::AguardarVez`, nova tentativa a cada 60 s). Em Gerenciar, "Importações do YouTube" lista as 10 últimas com a situação e "Ver relatório" (`GET /importacoes`).
  - Concatenação conferida: numa cópia do banco, a 2ª importação de um arquivo que repetia metade do 1º somou só as 30 reproduções novas e reconheceu as 40 já existentes.
- **Arquivos**: `migrations/Version20261112180000.php`, `src/Entity/ReproducaoYoutube.php`, `src/Entity/ImportacaoYoutube.php`, `src/Repository/ImportacaoYoutubeRepository.php`, `src/Repository/ReproducaoYoutubeRepository.php`, `src/Repository/AnaliseReproducaoMusicalRepository.php`, `src/Service/YoutubeMusic/Importacao/` (`GerarRelatorioImportacaoYoutubeService`, `ImportarHistoricoTakeoutYoutubeService`, `IniciarImportacaoYoutubeService`, `ProcessarImportacaoYoutubeService`, `ListarImportacoesYoutubeService`, `MarcarRelatorioVistoImportacaoYoutubeService`), `src/Enum/ResultadoEtapaImportacaoYoutube.php`, `src/MessageHandler/ImportarHistoricoYoutubeMessageHandler.php`, `src/Command/ContinuarImportacaoYoutubeCommand.php`, `src/Controller/YoutubeMusic/YoutubeImportacaoController.php`, `src/Serializer/ImportacaoYoutubeSerializer.php`, `src/Exception/ImportacaoYoutube/ImportacaoYoutubeException.php`, `web/features/youtube-music/` (`RelatorioImportacaoYoutube`, `DialogRelatorioImportacaoYoutube`, `PopupRelatorioImportacaoYoutube`, `ListaImportacoesYoutube`, `ModalImportarTakeoutYoutube`, hooks, utils, types, api), `web/layouts/MainLayout.tsx`, `web/features/musica/GerenciarMusica.tsx`, `documentation/funcionalidades/YOUTUBE_MUSIC.md`, `documentation/funcionalidades/MUSICA.md`

---

### ✅ Melhoria 159 — IA Não Troca Mais as Músicas Entre Vídeos

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: no teste do Takeout, a IA trocou respostas entre vídeos do mesmo lote: "Imagine Dragons - Believer (Official Music Video)" virou "Alone — Marshmello" e "Marshmello - Alone (Official Music Video)" virou "Burn — Ellie Goulding". Os vídeos iam para ela identificados por UUID v7, e UUIDs criados juntos são quase iguais. Também marcou "Ellie Goulding - Burn (Lyrics)" como "não é música".
- **Solução**:
  - A IA recebe apelidos curtos (`v1`…`v10`), e o sistema converte de volta para o vídeo certo.
  - A música só é ligada ao vídeo se o título ou um artista dela aparecer no título, no canal ou na descrição do vídeo; senão, o vídeo vai para a revisão com a sugestão.
  - "Não é música" vindo da IA para vídeo da categoria Música ou com marcas de música no título (lyrics, slowed, official video, remix, feat…) vai para a revisão em vez de sumir.
  - Rodando de novo o mesmo teste, todos os 29 vídeos de música e os 3 mashups ficaram certos. As 33 identificações já feitas pela IA em produção foram conferidas, e nenhuma estava trocada.
- **Arquivos**: `src/Infra/OpenAi/OpenAiIdentificadorMusicaClient.php`, `src/Service/IdentificacaoMusica/AplicarIdentificacaoVideoYoutubeService.php`, `documentation/funcionalidades/YOUTUBE_MUSIC.md`

---

### ✅ Melhoria 160 — Takeout Ignora o Histórico de Pesquisa

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: conferindo a estrutura de um Takeout real (`Takeout/YouTube e YouTube Music/histórico/histórico de pesquisa.json` e `histórico-de-visualização.json`, mais os CSV de `metadados do vídeo/`), o arquivo de pesquisas também era tratado como histórico de exibição, porque traz anúncios com link de vídeo. Nenhuma reprodução errada entrava (anúncios e pesquisas já eram descartados), mas cada pesquisa somava em "reproduções descartadas" no relatório.
- **Solução**: a detecção do histórico de exibição só aceita o arquivo quando encontra um vídeo assistido que não seja anúncio. Num zip com a mesma estrutura, as reproduções lidas ficaram iguais e as descartadas caíram de 51 para 11 (só os anúncios do próprio histórico de exibição).
- **Arquivos**: `src/Infra/YoutubeMusic/LeitorArquivoTakeoutYoutube.php`

---
