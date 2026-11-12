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
