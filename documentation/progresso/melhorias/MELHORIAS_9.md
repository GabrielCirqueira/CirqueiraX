# Melhorias — M161 a M180

> Detalhamento das melhorias **M161–M180**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 161 — Importação do Takeout Não Quebra com Lives Muito Longas

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a primeira importação real do Takeout parou na etapa de buscar os detalhes dos vídeos com `SQLSTATE[22003]: Out of range value for column 'duracao_ms'`. Um dos vídeos do histórico é uma live da NASA que ficou 483 dias no ar (`P483DT2H31M2S`, cerca de 41,7 bilhões de ms), e `video_youtube.duracao_ms` era `INT`, que vai só até cerca de 2,1 bilhões. O mesmo estouro aconteceria em `reproducao_youtube.ms_reproduzidos`, porque o tempo ouvido de uma reprodução do Takeout é estimado pela duração do vídeo ou pelo intervalo até a reprodução seguinte, e no histórico antigo esse intervalo pode ser de meses.
- **Solução**:
  - `video_youtube.duracao_ms` passou para `BIGINT` (migration `Version20261112200000`) e guarda a duração real.
  - O tempo ouvido de cada reprodução do YouTube fica entre 0 e 24 horas (`ReproducaoYoutube::LIMITE_MS_POR_REPRODUCAO`), em todos os caminhos: criação, extensão e estimativa do Takeout.
  - A importação que falhou foi retomada da etapa onde parou (`app:youtube:continuar-importacao`), sem precisar enviar o arquivo de novo.
- **Arquivos**: `migrations/Version20261112200000.php`, `src/Entity/VideoYoutube.php`, `src/Entity/ReproducaoYoutube.php`

---

### ✅ Melhoria 162 — Capa nos Vídeos Vindos do Takeout

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: na revisão do YouTube Music, todos os vídeos da importação do Takeout apareciam sem imagem. O Takeout não traz miniatura, e a busca de detalhes na YouTube Data API não grava capa, então os 296 vídeos importados ficaram com `url_capa` nulo (os 84 capturados pela extensão tinham capa).
- **Solução**:
  - Todo `VideoYoutube` novo já nasce com a miniatura padrão do YouTube (`VideoYoutube::gerarUrlMiniatura`, `https://i.ytimg.com/vi/<id>/hqdefault.jpg`); a extensão e o coletor continuam trocando pela capa que capturam.
  - Migration `Version20261112210000` preenche a capa dos vídeos que estavam sem imagem.
  - `CompletarCapasVariantesService` passou a usar o mesmo método, e o cache das análises de música foi renovado (`VERSAO_FORMATO` 'v4') para as músicas novas aparecerem com capa.
- **Arquivos**: `src/Entity/VideoYoutube.php`, `migrations/Version20261112210000.php`, `src/Service/Musica/Analise/CompletarCapasVariantesService.php`, `src/Service/Spotify/CacheAnaliseSpotifyService.php`

---

### ✅ Melhoria 163 — Capa e Links nas Músicas Sugeridas da Revisão

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: na revisão, a música sugerida (ex.: "Caixão de Areia — 7 Minutoz" para o vídeo "Rap do Gaara (Naruto) - CAIXÃO DE AREIA") aparecia só como texto, sem imagem nem link, e não dava para saber qual música era antes de confirmar.
- **Solução**:
  - `MontarMidiaSugestoesRevisaoService` busca a capa e o link do Spotify de cada sugestão e alternativa da IA (pelo título e primeiro artista, com o cache de `ImagemSpotify` e a busca agendada em segundo plano), e a listagem da revisão manda isso em `midiaSugestoes`.
  - Cada opção (`OpcaoSugestaoRevisao`) mostra a capa, os links "YouTube" (busca da música) e "Spotify" (faixa exata quando encontrada, senão a busca) e, quando a sugestão já é uma música do catálogo, "Ver música".
  - A confirmação passou a ser só pelo botão "É esta", para clicar num link não confirmar a música sem querer. No celular o botão ocupa a largura toda embaixo.
- **Arquivos**: `src/Service/Musica/MontarMidiaSugestoesRevisaoService.php`, `src/Service/Musica/ListarRevisaoMusicaService.php`, `web/features/revisao-musica/components/OpcaoSugestaoRevisao.tsx`, `web/features/revisao-musica/components/CartaoVideoRevisao.tsx`, `web/features/revisao-musica/types.ts`, `web/features/revisao-musica/utils/revisaoMusica.ts`

---

### ✅ Melhoria 164 — Horário Certo nas Reproduções da Extensão e Fim das Duplicadas

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a extensão calculava o início de cada música como "agora menos `video.currentTime`", mas no YouTube Music o tempo do elemento `<video>` não volta a zero ao trocar de música na fila. Músicas ouvidas em sequência ficaram com o mesmo horário (16 delas às 16:59:17 UTC, ouvidas ao longo de 1h20). Com o horário errado, o coletor não reconhecia que era a mesma reprodução e gravava de novo: "Little dark age - slowed" e "Little Dark Age (tiktok remix)", entre outras, apareciam contadas em dobro.
- **Solução**:
  - Extensão 1.2.0: posição e duração vêm da API do player (`getCurrentTime`/`getDuration`), que são da faixa atual; se a posição passar da duração da música, o início é o momento em que ela começou a tocar.
  - Servidor: se o início informado for mais antigo do que a duração da música permite (mais 1 minuto), usa o tempo ouvido no lugar, então os dados ficam certos mesmo com a extensão antiga.
  - Migration `Version20261112220000`: corrigiu o horário das reproduções da extensão para o momento em que o servidor as recebeu (menos 3 s) e apagou as cópias do coletor da mesma música até 10 minutos de distância, uma para uma, pela mais próxima. Depois a projeção do YouTube foi recalculada.
- **Arquivos**: `extensao/youtube-music/conteudo.js`, `extensao/youtube-music/pagina.js`, `extensao/youtube-music/manifest.json`, `src/Service/YoutubeMusic/Extensao/RegistrarEventosExtensaoYoutubeService.php`, `migrations/Version20261112220000.php`

---

### ✅ Melhoria 165 — "São Versões de Outra Música" nas Possíveis Duplicadas

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: nas possíveis duplicadas, os pares eram muitas vezes duas versões (ex.: "Forever Young - Slowed + Reverb" de 3slow2 e "forever young - slowed + reverb" de slō) de uma terceira música, a oficial ("Forever Young — Alphaville"), que não aparecia no par. Só dava para dizer "iguais" (uma vira a outra) ou "diferentes", sem ligar as duas à música oficial.
- **Solução**:
  - Novo botão "São versões de outra música" em cada par. Ele abre uma janela com as duas músicas e a busca no catálogo, já preenchida com o título sem o sufixo da versão (`tituloBaseVersoes`); ao escolher a oficial, as duas são unidas a ela e passam a aparecer como versões, com as reproduções somadas. Dá para separar depois nos detalhes da música.
  - Backend: `POST /api/v1/musica/catalogo/unir-varias` (`UnirVariasMusicasDTO`, até 10 origens), em `UnirMusicasCatalogoService::executarVarias`, que une todas numa operação só e atualiza a projeção uma vez.
- **Arquivos**: `src/DataObject/Musica/UnirVariasMusicasDTO.php`, `src/Service/Musica/Correcao/UnirMusicasCatalogoService.php`, `src/Controller/Musica/MusicaCorrecaoController.php`, `web/features/revisao-musica/components/JanelaVersoesDeOutraMusica.tsx`, `web/features/revisao-musica/components/CartaoDuplicataRevisao.tsx`, `web/features/revisao-musica/components/ListaRevisao.tsx`, `web/features/revisao-musica/components/BuscaCatalogo.tsx`, `web/features/revisao-musica/hooks/useRevisaoMusica.ts`, `web/features/revisao-musica/api.ts`, `web/features/revisao-musica/utils/revisaoMusica.ts`

---

### ✅ Melhoria 166 — Cada Vídeo do YouTube Music Aparece Como Versão e Duplicadas Viram "Principal + Versão"

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: nas versões de uma música, os vídeos do YouTube Music eram agrupados pelo tipo de versão, e só o mais tocado aparecia. "MGMT- Little Dark Age (SLOWED + REVERB)" (cloud punk), "Little dark age - slowed" (Matthew) e "MGMT - Little Dark Age (slowed + reverb) / Johan Liebert" (Diprida) viravam uma linha só. Nas possíveis duplicadas, o texto "Iguais: as duas viram uma só" não deixava claro que a outra continua visível como versão.
- **Solução**:
  - `AnaliseReproducaoMusicalRepository::listarVariantesMusica` lista cada vídeo do YouTube Music separado, com as próprias reproduções e minutos, como já acontecia com cada faixa do Spotify. O cache das análises foi renovado (`VERSAO_FORMATO` 'v5').
  - Nas possíveis duplicadas, o botão virou "Esta é a principal", e o texto explica que a outra vira uma versão dela, que o ranking mostra a principal com o total somado e que os detalhes mostram cada versão.
- **Arquivos**: `src/Repository/AnaliseReproducaoMusicalRepository.php`, `src/Service/Spotify/CacheAnaliseSpotifyService.php`, `web/features/revisao-musica/components/CartaoDuplicataRevisao.tsx`, `web/features/revisao-musica/utils/revisaoMusica.ts`, `web/features/revisao-musica/hooks/useRevisaoMusica.ts`

---

### ✅ Melhoria 167 — Vistoria de Segurança: Papéis, Token na URL, Saída de Verdade e Cabeçalhos

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: vistoria pedida antes de abrir o sistema para amigos. O isolamento entre contas estava certo (todas as rotas com uuid conferem o dono), mas havia pontas soltas: o token da extensão do YouTube Music e o token do agente entravam em qualquer rota `/api` (só precisavam estar autenticados); o login e o refresh consultavam também o usuário interno `master-cli`; o JWT valia ~41 dias e era aceito pela URL (`?token=`) em qualquer rota, inclusive POST/DELETE, e a URL fica em logs e no histórico do navegador; "Sair" só limpava o navegador e o refresh token seguia válido por 30 dias; o CORS usava a origem como regex sem âncora; o `/api/v1/health` público mostrava espaço em disco e versão; a capa de música (rota pública) seguia redirecionamentos; não havia cabeçalhos de segurança e o PHP se anunciava (`X-Powered-By`); e o IP real não chegava ao Symfony (tudo vinha do proxy), então o limite de tentativas de login era por usuário só.
- **Solução**:
  - `security.yaml`: `role_hierarchy` (SUPER_ADMIN → ADMIN → USER); `^/api` exige `ROLE_USER`, `/api/v1/ingestao` exige `ROLE_AGENTE`; login e refresh usam só os usuários do banco.
  - JWT de acesso passou a valer 24 h (`JWT_TTL=86400`); o refresh automático do frontend renova sem pedir login.
  - `RestringirTokenNaUrlListener`: `?token=` só vale em GET/HEAD de arquivos (stream, miniatura e download de mídia, áudio e áudio da transcrição); em qualquer outra rota é descartado.
  - Saída de verdade: `POST /api/v1/auth/logout` (firewall `logout` + gesdinet) apaga o refresh token; `useSair` no Header e na Sidebar.
  - `CabecalhosSegurancaListener`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy: same-origin` (a URL com token não vaza para sites de fora), `Permissions-Policy`, `Cross-Origin-Opener-Policy` e HSTS em HTTPS; `expose_php = Off`.
  - `trusted_proxies` em produção, para o IP real valer no limite de login e de ingestão.
  - CORS com origem exata; `/api/v1/health` mostra só status e horário; capa de música não segue redirecionamentos.
- **Arquivos**: `config/packages/security.yaml`, `config/packages/framework.yaml`, `config/packages/nelmio_cors.yaml`, `devops/php/php.prod.ini`, `.tooling/env/.env.prod.example`, `src/EventListener/RestringirTokenNaUrlListener.php`, `src/EventListener/CabecalhosSegurancaListener.php`, `src/Controller/Auth/AuthController.php`, `src/Controller/Sistema/HealthController.php`, `src/Service/Musica/Capa/ObterCapaMusicaService.php`, `web/features/auth/api.ts`, `web/features/auth/hooks.ts`, `web/layouts/Header.tsx`, `web/layouts/Sidebar.tsx`

---

### ✅ Melhoria 168 — Linha do Tempo: Todos os Meses Lado a Lado

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: a Cápsula Sonora mostra um mês por vez e é preciso escolher o mês na mão. Não havia como ver de uma vez, do primeiro mês até hoje, o que esteve no topo em cada mês.
- **Solução**:
  - Nova seção "Linha do Tempo" na página de Música, abaixo da Cápsula Sonora (que não mudou). Cada mês com reproduções vira uma coluna com o top 10 de músicas ou de artistas (troca por botão), minutos e plays do mês, e a seta de quanto subiu ou caiu em relação ao mês anterior ("novo" quando não estava no top 50 dele). A faixa rola de lado, abre no mês atual e tem atalhos por ano.
  - Tocar numa música ou artista passa a "seguir" o item: ele fica destacado em todos os meses e os outros ficam apagados; um painel mostra quantos meses ficou no top 10, quantas vezes foi o 1º, a melhor posição e um gráfico de barras com a posição em cada mês.
  - Backend: `GET /api/v1/musica/linha-do-tempo` (`ObterLinhaDoTempoMusicaService`), com o mesmo ranking da Cápsula (mês em UTC, ordem por streams, crédito para todos os artistas), respeita o filtro de fonte e fica em cache como as outras análises.
- **Arquivos**: `src/Service/Musica/Analise/ObterLinhaDoTempoMusicaService.php`, `src/DataObject/Spotify/Analise/LinhaDoTempoMusicaDTO.php`, `src/DataObject/Spotify/Analise/MesLinhaDoTempoMusicaDTO.php`, `src/Controller/Musica/MusicaAnaliseController.php`, `web/features/musica/components/SecaoLinhaDoTempo.tsx`, `web/features/musica/utils/linhaDoTempo.ts`, `web/features/musica/types.ts`, `web/features/musica/api.ts`, `web/features/musica/hooks/useAnaliseMusica.ts`, `web/features/musica/hooks/chavesQueryMusica.ts`, `web/features/musica/Musica.tsx`

---

### ✅ Melhoria 169 — Mapa de Horários Removido dos Hábitos

- **Status**: Concluído
- **Data**: 13 de novembro de 2026
- **Problema**: o usuário pediu para tirar o "Mapa de horários" (dia da semana × hora) da seção Hábitos.
- **Solução**: o cartão saiu da tela, junto com o componente `MapaHorariosMusica` e o que só ele usava (`NOMES_DIAS_SEMANA`, `ORDEM_DIAS_SEMANA`, `formatarFaixaHoraria`, `CelulaMapaHorarioSchema`). No backend, `/api/v1/musica/habitos` não calcula nem devolve mais `mapaHorarios`; a consulta continua existindo porque a Retrospectiva usa para achar o momento favorito. O cache das análises foi renovado (`VERSAO_FORMATO` 'v6').
- **Arquivos**: `web/features/musica/components/SecaoHabitos.tsx`, `web/features/musica/components/MapaHorariosMusica.tsx` (removido), `web/features/musica/components/index.ts`, `web/features/musica/utils/analiseMusica.ts`, `web/features/musica/types.ts`, `src/DataObject/Spotify/Analise/HabitosSpotifyDTO.php`, `src/Service/Musica/Analise/ObterHabitosMusicaService.php`, `src/Service/Spotify/CacheAnaliseSpotifyService.php`

---

### ✅ Melhoria 170 — Novas Descobertas Mais Compacta

- **Status**: Concluído
- **Data**: 13 de novembro de 2026
- **Problema**: na seção Novas Descobertas, os artistas novos apareciam em grade de fotos quadradas (6 por linha, ~180 px cada); com 24 artistas a seção ocupava a tela toda. As outras abas também listavam tudo de uma vez.
- **Solução**: todas as abas (artistas, músicas, redescobertas, obsessões) viraram linhas compactas com capa/foto de 36 px, 3 por linha no computador, 2 no tablet e 1 no celular. Aparecem os 9 primeiros e um botão "Ver todos (N)" / "Mostrar menos" abre o resto (volta a fechar ao trocar de aba). No celular as abas ficam numa linha só com rolagem lateral.
- **Arquivos**: `web/features/musica/components/SecaoDescobertas.tsx`, `web/features/musica/utils/descobertas.ts`, `web/features/musica/utils/index.ts`

---

### ✅ Melhoria 171 — Barras de Rolagem no Tema do Sistema

- **Status**: Concluído
- **Data**: 13 de novembro de 2026
- **Problema**: as barras de rolagem usavam o visual padrão do navegador, com trilho branco, o que destoava do tema escuro (ex.: a faixa horizontal da Linha do Tempo).
- **Solução**: estilo global no tema Chakra (`globalCss`): barra fina (8 px), trilho transparente e alça arredondada na cor `border.emphasized` (mais clara no hover com `fg.subtle`), para Chrome/Firefox (`scrollbar-color`) e Safari (`::-webkit-scrollbar`); `color-scheme: dark` no modo escuro. Na página de Música (`TemaMusica`), a alça usa a paleta da página (`textoDesabilitado`, e `textoSecundario` no hover).
- **Arquivos**: `web/config/theme/theme.ts`, `web/features/musica/components/TemaMusica.tsx`, `web/features/musica/components/SecaoLinhaDoTempo.tsx`

---

### ✅ Melhoria 172 — Fonte Ativa do YouTube Music (Extensão ou Cookies) e Extensão 1.3.0 Mais Precisa

- **Status**: Concluído
- **Data**: 13 de novembro de 2026
- **Problema**: o card "Tocando agora" às vezes mostrava "Pausado" com a música tocando. A extensão mandava progresso a cada 20 s, a página consultava a cada 20 s e marcava pausado depois de 30 s sem notícia, então o atraso somado passava do limite. A extensão também não informava pausa: o servidor só deduzia pela falta de eventos. O usuário quis ainda poder usar só uma fonte por vez (extensão ou conexão por cookies), sem apagar a outra.
- **Solução**:
  - Fonte ativa por usuário (`usuario.fonte_captura_youtube_music`: `coletor` ou `extensao`, enum `FonteCapturaYoutubeMusic`), escolhida em Música → Gerenciar ("Fonte ativa": Extensão / Cookies), via `PATCH /api/v1/youtube-music/fonte-captura`. Com a extensão ativa, o coletor não consulta o histórico (o cookie continua guardado). Com os cookies ativos, os eventos da extensão são aceitos mas ignorados, e a resposta traz `ativa: false`, que o popup da extensão mostra. Ao voltar para os cookies, a referência do histórico é reiniciada (`reiniciarReferenciaDoHistorico`) para não registrar de uma vez tudo o que tocou enquanto estava pausado. A migration `Version20261113100000` deixa a extensão como fonte ativa para quem já tem token da extensão.
  - Extensão 1.3.0: lê o estado do player (`getPlayerState`) em vez do `video.paused`, manda um evento na hora em que a música pausa ou volta a tocar (campo `pausada`), manda progresso a cada 10 s enquanto toca e avisa pausa ao fechar a aba.
  - Servidor guarda `extensao_pausada` na reprodução; o "Tocando agora" mostra a música pausada por até 5 minutos. A página marca "Pausado" só quando a extensão disse que pausou ou depois de 45 s sem notícia, e consulta a cada 15 s enquanto há música.
- **Arquivos**: `src/Enum/FonteCapturaYoutubeMusic.php`, `src/Entity/Usuario.php`, `src/Entity/ReproducaoYoutube.php`, `src/Entity/ContaYoutubeMusic.php`, `migrations/Version20261113100000.php`, `src/DataObject/YoutubeMusic/DefinirFonteCapturaYoutubeMusicDTO.php`, `src/DataObject/YoutubeMusic/EventoExtensaoYoutubeDTO.php`, `src/Service/YoutubeMusic/DefinirFonteCapturaYoutubeMusicService.php`, `src/Service/YoutubeMusic/ColetarHistoricoYoutubeMusicService.php`, `src/Service/YoutubeMusic/ObterStatusYoutubeMusicService.php`, `src/Service/YoutubeMusic/Extensao/RegistrarEventosExtensaoYoutubeService.php`, `src/Repository/ContaYoutubeMusicRepository.php`, `src/Repository/ReproducaoYoutubeRepository.php`, `src/Controller/YoutubeMusic/YoutubeMusicController.php`, `src/Controller/YoutubeMusic/YoutubeMusicExtensaoController.php`, `src/Serializer/ContaYoutubeMusicSerializer.php`, `extensao/youtube-music/*`, `web/features/youtube-music/components/SeletorFonteCapturaYoutube.tsx`, `web/features/youtube-music/components/PainelConexaoYoutubeMusic.tsx`, `web/features/youtube-music/hooks/useFonteCapturaYoutube.ts`, `web/features/youtube-music/hooks/useStatusYoutubeMusic.ts`, `web/features/youtube-music/utils/conexaoYoutubeMusic.ts`, `web/features/youtube-music/utils/extensaoYoutubeMusic.ts`, `web/features/youtube-music/api.ts`, `web/features/youtube-music/types.ts`

---
