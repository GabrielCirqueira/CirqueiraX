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
