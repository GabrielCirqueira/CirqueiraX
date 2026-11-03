# Melhorias — M101 a M120

> Detalhamento das melhorias **M101–M120**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### 🟡 Melhoria 101 — Apagar Livro Interrompe a Geração e Libera a Fila na Hora

- **Status**: Código pronto, aguardando publicação em produção
- **Data**: 02 de novembro de 2026
- **Problema**: ao apagar um livro, a parte em geração continuava até o fim, por até cerca de 1 minuto, antes de o próximo livro começar. Os MP3 também podiam ficar no disco, porque o worker rodava como root e a exclusão roda como `www-data`.
- **Solução**:
  - `SintetizadorVozInterface::sintetizar` recebe `$deveCancelar`. O `EdgeTtsClient` confere a cada 0,5 s e encerra o processo do `edge-tts`.
  - `GerarAudioBlocoService` verifica se o livro ainda existe por `LivroAudioRepository::existe()`, durante e depois da síntese, e remove o que restou no disco.
  - `ApagarLivroAudioService` apaga primeiro o registro e depois os arquivos.
  - `messenger-livro-audio` passa a rodar como `www-data`, com `HOME=/tmp`.
  - As mensagens restantes do livro apagado já eram ignoradas, pois o handler não encontra a parte.
- **Testado** na imagem nova, fora de produção: a síntese foi cancelada em 1 segundo. A exclusão de um livro real com a fila andando ainda não foi testada em produção.
- **Arquivos**:
  - `src/Interface/SintetizadorVozInterface.php`, `src/Infra/Audio/EdgeTtsClient.php`
  - `src/Exception/Audio/SinteseVozException.php`
  - `src/Service/LivroAudio/GerarAudioBlocoService.php`, `ApagarLivroAudioService.php`
  - `src/Repository/LivroAudioRepository.php`
  - `devops/php/supervisord-prod.conf`

---

### 🟡 Melhoria 102 — Narração Sem Pausa em Toda Quebra de Linha

- **Status**: Código pronto, aguardando publicação em produção
- **Data**: 02 de novembro de 2026
- **Problema**: o texto extraído do PDF mantinha uma quebra para cada linha física da página, e a voz parava em cada uma, mesmo no meio da frase. A narração ficava truncada e mais longa.
- **Solução**:
  - `PrepararTextoNarracaoService` junta as linhas de um mesmo parágrafo logo antes da síntese. O parágrafo termina em linha com pontuação final que seja mais curta que a largura normal da página. Títulos curtos ganham ponto para manter uma pausa natural.
  - `GerarAudioBlocoService` usa esse texto só para a síntese. O texto salvo no banco não muda, e partes ainda pendentes já saem corrigidas.
  - A voz em inglês passa de `en-US-GuyNeural` (categoria notícia) para `en-US-AndrewNeural` (categoria conversa).
- **Medido** com as 60 primeiras linhas do "MANUAL DO ALUNO PBL", usando `silencedetect` (silêncios acima de 0,35 s): de 72 para 37 pausas, e de 251 s para 211 s de áudio. A voz em inglês foi escolhida pela classificação da própria lista do `edge-tts`, sem audição comparativa.
- **Limitação**: partes já prontas continuam com o áudio antigo. Para refazer, é preciso reenviar o livro.
- **Arquivos**:
  - `src/Service/LivroAudio/PrepararTextoNarracaoService.php` (novo)
  - `src/Service/LivroAudio/GerarAudioBlocoService.php`
  - `src/Enum/IdiomaLivroAudio.php`
