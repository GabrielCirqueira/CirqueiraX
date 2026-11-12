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
