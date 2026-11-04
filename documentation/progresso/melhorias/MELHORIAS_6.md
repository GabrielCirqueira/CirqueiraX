# Melhorias — M101 a M120

> Detalhamento das melhorias **M101–M120**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### 🟡 Melhoria 101 — Apagar Livro Interrompe a Geração e Libera a Fila na Hora

- **Status**: Publicada em produção em 03/11/2026, falta validar no uso
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

### ✅ Melhoria 102 — Narração Sem Pausa em Toda Quebra de Linha

- **Status**: Concluída e publicada em produção em 03/11/2026
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

---

### ✅ Melhoria 103 — Redesign do Leitor em Formato de Livro 3D e Player Unificado no Tema do Sistema

- **Status**: Concluída e publicada em produção em 03/11/2026
- **Data**: 02 de novembro de 2026
- **Problema**: o leitor de PDF apresentava páginas estáticas cruas lado a lado sem aspecto de livro físico, contava com duas barras inferiores concorrentes (uma para paginação/zoom e outra para o player de áudio) e utilizava estilos em tons roxos descolados da identidade visual do sistema.
- **Solução**:
  - **Formato de Livro 3D Aberto**: Estrutura com capa dura de fundo, lombada central vincada, profundidade de folhas empilhadas nas bordas externas (`stacked paper edges`), sombras de curvatura interna nas páginas e numeração de rodapé.
  - **Navegação Lateral Flutuante**: Botões circulares translúcidos (`<` e `>`) flutuantes nas laterais com efeito blur e animação suave ao hover.
  - **Player Inferior Unificado**: Eliminação das barras duplicadas e fusão em um único dock inferior contendo:
    - Controles de áudio: Play/Pause em destaque com gradiente da marca, barra de progresso interativa com tempo decorrido/total, controle de volume com mute rápido e seletor de velocidade (`0.75x` a `2.0x`).
    - Controles do leitor: Botão da gaveta de sumário/partes, paginação com input interativo (`< Página X de Y >`), botão de marcar página atual e download do PDF original.
  - **Identidade Visual do Sistema**: Remoção completa de qualquer tom roxo/violeta ou radial-gradients com hexadecimais arbitrários. Aplicação estrita dos tokens oficiais da marca (`cirqueira.brand.500` em verde esmeralda no botão de play, slider e destaques, e `cirqueira.grey.950`/`cirqueira.grey.900` em cinza escuro para superfícies e bordas), garantindo harmonia visual com o restante da plataforma.
- **Arquivos**:
  - `web/features/livros-audio/components/VisualizadorLivro.tsx`
  - `web/features/livros-audio/components/PlayerAudioLivro.tsx`
  - `web/features/livros-audio/components/BarraSuperiorLeitor.tsx`
  - `web/features/livros-audio/components/PaginaPdf.tsx`
  - `web/features/livros-audio/LeitorLivroAudio.tsx`
  - `web/features/livros-audio/hooks/useLeitorLivro.ts`

---

### ✅ Melhoria 104 — Refazer Áudio Gerado Antes da Narração Corrigida

- **Status**: Concluída e publicada em produção em 03/11/2026
- **Data**: 03 de novembro de 2026
- **Problema**: as partes geradas antes da M100 e da M102 continuavam com uma pausa de cerca de 1 s no fim de cada linha do PDF. O `corrigir-voz` não refazia essas partes, porque tratava a voz vazia como pt-BR. O "MANUAL DO ALUNO PBL" tinha 81 pausas acima de 0,8 s só na parte 1.
- **Solução**:
  - `LivroAudioBloco::foiGeradoComVoz` só considera certa a parte que registrou a voz usada. Voz vazia indica áudio gerado pelo código antigo.
  - `app:livro-audio:corrigir-voz` passa a refazer essas partes também, sem reenviar o livro.
- **Arquivos**:
  - `src/Entity/LivroAudioBloco.php`
  - `src/Command/CorrigirVozLivrosAudioCommand.php`

---

### 🟡 Melhoria 105 — Mostrar a Página e a Frase que Estão Sendo Lidas

- **Status**: Publicada em produção em 03/11/2026, falta validar no uso
- **Data**: 03 de novembro de 2026
- **Problema**: durante o áudio não dava para saber em que página ou linha a narração estava. O "Seguir áudio" estimava a página pela proporção do tempo dentro da parte.
- **Solução**:
  - **Backend**: o `EdgeTtsClient` gera a legenda (`--write-subtitles`), e o `LeitorLegendaSrt` converte em frases com início e fim. As frases ficam em `livro_audio_bloco.trechos` (JSON, migração `Version20261103150000`) e saem em `GET /api/v1/livros-audio/{uuid}/blocos/{numeroBloco}/trechos`. O bloco informa `possuiTrechos`.
  - **Localização**: `localizarTrechos` acha cada frase no texto das páginas do PDF (pdf.js), comparando só letras e números, sem acentos. Assim ignora hifenização, pontuação, ligaduras e números de página.
  - **Leitor**: a página vira para a frase atual, e a frase aparece destacada no PDF, linha por linha. O player mostra "Página X" e "Lendo agora: …", e um clique leva à página. A página só vira quando a frase sai das páginas visíveis.
  - `app:livro-audio:corrigir-voz` também refaz as partes sem marcações.
  - Corrigido de passagem: `LeitorSemPdf` não passava `totalPaginas` ao player e tinha assinatura incompatível em `salvarPosicao`.
- **Testado** fora de produção com a parte 1 do "MANUAL DO ALUNO PBL": as 34 frases foram localizadas na página certa, e o destaque conferido em capturas das páginas 1 a 3.
- **Arquivos**:
  - `src/Infra/Audio/EdgeTtsClient.php`, `src/Infra/Audio/LeitorLegendaSrt.php` (novo)
  - `src/DataObject/TrechoNarracaoDTO.php` (novo), `src/DataObject/ResultadoSinteseVozDTO.php`
  - `src/Entity/LivroAudioBloco.php`, `migrations/Version20261103150000.php` (novo)
  - `src/Service/LivroAudio/GerarAudioBlocoService.php`, `ConsultarLivrosAudioService.php`, `CorrigirVozLivrosAudioService.php`
  - `src/Controller/LivroAudio/LivroAudioController.php`, `src/Serializer/LivroAudioBlocoSerializer.php`, `src/Command/CorrigirVozLivrosAudioCommand.php`
  - `web/features/livros-audio/utils/localizacaoNarracao.ts` (novo), `hooks/useNarracaoAtual.ts` (novo)
  - `web/features/livros-audio/utils/pdf.ts`, `components/PlayerAudioLivro.tsx`, `PaginaPdf.tsx`, `VisualizadorLivro.tsx`, `LeitorSemPdf.tsx`
  - `web/features/livros-audio/LeitorLivroAudio.tsx`, `api.ts`, `types.ts`, `hooks/useLivrosAudio.ts`

---

### 🟡 Melhoria 106 — Destaque Preciso, com Transição e por Palavra ou Frase

- **Status**: Publicada em produção em 03/11/2026, falta validar no uso
- **Data**: 03 de novembro de 2026
- **Problema**: o destaque da M105 às vezes cortava uma letra ou palavra, porque calculava a largura pela quantidade de caracteres. A troca de frase era seca, sem transição, e só existia destaque por frase.
- **Solução**:
  - **Tempo de cada palavra**: o novo `bin/sintetizar-voz.py` usa a biblioteca `edge_tts` com `WordBoundary` e grava o áudio e o tempo de cada palavra. O `AgrupadorPalavrasNarracao` junta as palavras em frases pela pontuação do texto narrado. Cada frase em `livro_audio_bloco.trechos` passa a ter `palavras`, e o bloco informa `possuiPalavras`. Substitui o `LeitorLegendaSrt`.
  - **Medida real**: a largura do destaque é medida com a fonte do próprio PDF (a que o pdf.js carrega), e a altura usa a ascendente e a descendente da fonte. Inclui pontuação de abertura e fechamento, com uma pequena folga.
  - **Transição**: os retângulos deslizam de uma frase ou palavra para a seguinte e aparecem com fade.
  - **Escolha do modo**: botão "Por frase / Por palavra" no player, lembrado no navegador. No modo palavra, a frase fica com um tom claro e a palavra falada em destaque. O acompanhamento usa `requestAnimationFrame` durante a reprodução, para a palavra não atrasar.
  - `app:livro-audio:corrigir-voz` refaz as partes que ainda não têm o tempo das palavras.
- **Testado** fora de produção com a parte 1 do "MANUAL DO ALUNO PBL": 41 frases e 608 palavras localizadas no PDF, sem falhas, e destaque conferido em capturas.
- **Arquivos**:
  - `bin/sintetizar-voz.py` (novo), `src/Infra/Audio/EdgeTtsClient.php`, `src/Infra/Audio/AgrupadorPalavrasNarracao.php` (novo), `src/Infra/Audio/LeitorLegendaSrt.php` (removido)
  - `src/DataObject/PalavraNarracaoDTO.php` (novo), `src/DataObject/TrechoNarracaoDTO.php`, `config/services.yaml`
  - `src/Entity/LivroAudioBloco.php`, `src/Serializer/LivroAudioBlocoSerializer.php`, `src/Service/LivroAudio/ConsultarLivrosAudioService.php`, `CorrigirVozLivrosAudioService.php`, `src/Command/CorrigirVozLivrosAudioCommand.php`
  - `web/features/livros-audio/utils/pdf.ts`, `utils/localizacaoNarracao.ts`, `hooks/useNarracaoAtual.ts`, `types.ts`
  - `web/features/livros-audio/components/PaginaPdf.tsx`, `VisualizadorLivro.tsx`, `PlayerAudioLivro.tsx`, `LeitorLivroAudio.tsx`

---

### 🟡 Melhoria 107 — Escolher e Trocar a Voz do Narrador

- **Status**: Publicada em produção em 03/11/2026, falta validar no uso
- **Data**: 03 de novembro de 2026
- **Problema**: cada livro tinha uma única voz, escolhida pelo idioma (Antonio para português), sem opção de ouvir outra.
- **Solução**:
  - **Catálogo** (`VozNarracao`): Antonio, Francisca e Thalita (pt-BR), Duarte e Raquel (pt-PT) e as multilíngues Andrew, Brian, Ava e Emma. Livros em outro idioma só oferecem as multilíngues. Todas mandam o tempo de cada palavra, então o destaque por palavra funciona em qualquer voz.
  - **Várias vozes por livro**: a voz principal continua em `livro_audio_bloco`. Cada voz adicional gera o áudio de cada parte em `livro_audio_bloco_voz` (migração `Version20261104000000`), com arquivos em `blocos/vozes/{voz}/`. A geração usa a fila `livro_audio` (`GerarAudioBlocoVozMessage`) e não mexe no status do livro.
  - **API**: `GET /{uuid}/vozes` (vozes com status e partes prontas), `POST /{uuid}/vozes` (gera uma voz), `DELETE /{uuid}/vozes/{voz}` (apaga o áudio da voz), `GET /vozes/{voz}/amostra` (amostra curta, gerada uma vez e guardada em `var/livros/amostras`). `stream` e `trechos` aceitam `?voz=`.
  - **Player**: botão com o nome da voz abre o painel "Vozes do narrador", com amostra, gerar, usar e apagar. A troca continua da mesma frase, pela marcação de tempo das frases nas duas vozes. Partes que ainda não ficaram prontas na voz escolhida tocam na voz principal e trocam sozinhas quando ficam prontas. A voz escolhida fica lembrada por livro no navegador.
  - Apagar a voz durante a geração cancela a síntese em andamento.
- **Testado** fora de produção: as 9 vozes geraram áudio e tempo de palavras com o script de síntese, o container do Symfony passou no `lint:container`, as rotas novas aparecem no `debug:router` e o mapeamento passou no `doctrine:schema:validate`.
- **Arquivos**:
  - `src/Enum/VozNarracao.php`, `src/Entity/LivroAudioBlocoVoz.php`, `src/Repository/LivroAudioBlocoVozRepository.php`, `migrations/Version20261104000000.php` (novos)
  - `src/Message/GerarAudioBlocoVozMessage.php`, `src/MessageHandler/GerarAudioBlocoVozMessageHandler.php` (novos), `config/packages/messenger.yaml`
  - `src/Service/LivroAudio/GerarAudioBlocoVozService.php`, `GerenciarVozesLivroAudioService.php`, `ResolverVozLivroAudioService.php` (novos), `ConsultarLivrosAudioService.php`
  - `src/Controller/LivroAudio/LivroAudioController.php`, `src/Entity/LivroAudioBloco.php`, `src/Exception/LivroAudio/LivroAudioException.php`, `config/services.yaml`
  - `web/features/livros-audio/components/PainelVozes.tsx` (novo), `components/PlayerAudioLivro.tsx`
  - `web/features/livros-audio/api.ts`, `types.ts`, `hooks/useLivrosAudio.ts`, `hooks/useNarracaoAtual.ts`

---

### 🟡 Melhoria 108 — Destaque que Não se Perde e Play a Partir da Página Aberta

- **Status**: Publicada em produção em 03/11/2026, falta validar no uso
- **Data**: 03 de novembro de 2026
- **Problema**: em um livro com resumo em duas colunas e frases repetidas, o leitor encaixava "O direito reside na força." numa repetição da página 3. A busca de cada frase andava só para frente, então todas as frases seguintes deixavam de ser encontradas. O resultado era a página virando sozinha, o "lendo agora" no lugar errado e o destaque sumindo. Além disso, ao pular para uma página e dar play, o áudio começava do início da parte, e não da página aberta.
- **Solução**:
  - **Alinhamento por palavras**: `localizarTrechos` alinha a sequência inteira de palavras da narração com a do PDF (programação dinâmica ponderada pelo tamanho das palavras), em vez de procurar frase por frase. Aceita palavra com hífen de fim de linha ("con-" + "duz" no PDF e "conduz" na narração) e o inverso. Uma repetição solta não arrasta mais o resto da parte.
  - **Segunda passada**: frases que ficaram incompletas (resumo em duas colunas, que o PDF guarda coluna a coluna e a narração lê linha a linha) são procuradas inteiras entre as páginas das frases vizinhas.
  - **Play na página aberta**: com "Seguir áudio" ativo, se a página aberta não é a que está sendo lida, o play começa na primeira frase dessa página (no modo livro, a da esquerda ou a da direita).
- **Testado** fora de produção com o PDF enviado (parte 1, páginas 1 a 3): 57 de 57 frases localizadas na página certa e 689 de 705 palavras (as que faltam são frases que a extração do texto misturou entre as duas colunas). O "MANUAL DO ALUNO PBL" continua com 100% das frases e palavras.
- **Arquivos**:
  - `web/features/livros-audio/utils/localizacaoNarracao.ts`
  - `web/features/livros-audio/hooks/useNarracaoAtual.ts`, `components/PlayerAudioLivro.tsx`
