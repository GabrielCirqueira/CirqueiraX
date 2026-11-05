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

---

### 🟡 Melhoria 109 — Narração Mais Limpa e Recursos de Escuta

- **Status**: Publicada em produção em 04/11/2026, falta validar no uso
- **Data**: 04 de novembro de 2026
- **Problema**: a voz lia o cabeçalho repetido ("Os Protocolos dos Sábios de Sião - 13 -") a cada página, às vezes no meio da frase, e os marcadores de nota como "(5)". A extração com `pdftotext -layout` misturava linhas de textos em duas colunas. Não havia como ensinar a pronúncia de siglas e abreviações. No player faltavam timer de sono, o tempo do livro inteiro, um recuo ao retomar e a passagem para a próxima parte sem espera.
- **Solução (texto)**:
  - **Extração com posição**: `ExtratorTextoPdfClient::extrairLayoutDoDocumento` roda `pdftotext -bbox-layout` uma vez no PDF inteiro e devolve cada linha com posição, altura e bloco. A ordem de leitura do Poppler separa as colunas. Se falhar, volta para a extração antiga por página.
  - **Cabeçalho e rodapé**: `MontarTextoNarracaoLivroService` descarta linhas na faixa de cima (10%) ou de baixo (8%) da página que se repetem em 3 páginas ou mais (comparando só as letras) e as que só têm número.
  - **Notas**: opção por livro (`livro_audio.modo_notas`):
    - *No fim do capítulo* (padrão para livros novos): tira os marcadores "(5)", "[5]" e números sobrescritos, e lê as notas de rodapé (linhas menores no pé da página) antes do próximo título de capítulo, com "Nota 5." no início.
    - *Pular notas*: também pula as seções que começam com um título "Notas", "Notas e comentários" etc. até o próximo capítulo.
    - *Ler normalmente*: lê como está.
  - **Títulos**: linhas com fonte maior ganham ponto final, para a voz pausar, e títulos quebrados em duas linhas viram um só. Linhas só com símbolos (marcadores de lista) são ignoradas.
  - **Dicionário de pronúncia**: lista por livro (`livro_audio.pronuncias`) aplicada por `AplicarPronunciasService` depois de montar os parágrafos e antes da voz, em palavra inteira e sem diferenciar maiúsculas. Para "não ler", basta deixar a pronúncia vazia.
  - **Refazer a narração**: `PUT /api/v1/livros-audio/{uuid}/narracao` salva os ajustes e `RefazerNarracaoLivroAudioService` extrai o texto de novo mantendo as mesmas partes, reinicia a voz principal e as vozes extras e enfileira tudo a partir da parte que está sendo ouvida. Se uma parte for reiniciada enquanto o worker gera o áudio dela, o resultado antigo é descartado. Livros narrados antes desta melhoria aparecem com o aviso para refazer (`versao_narracao` = 1).
- **Solução (escuta)**:
  - **Timer de sono**: 15, 30, 45 ou 60 minutos (só conta enquanto toca) ou "no fim desta parte", com o volume baixando nos últimos 15 s (ou 10 s antes do fim da parte).
  - **Tempo do livro**: barra fina abaixo da parte com o percentual do livro e quanto falta na velocidade atual. Clicar na barra leva para aquele ponto do livro. Partes ainda sem áudio entram com estimativa por página.
  - **Recuo ao retomar**: depois de uma pausa de 30 s ou mais, e ao reabrir o livro na posição salva, o áudio volta 5 s.
  - **Próxima parte pré-carregada**: enquanto uma parte toca, o áudio e as frases da próxima já são baixados. O stream com `?v=` (data da geração) agora vai com cache de 7 dias no navegador, e a troca de parte não remonta mais o player.
- **Testado** fora de produção:
  - Com o PDF dos Protocolos (84 páginas): 0 cabeçalhos lidos, colunas do resumo na ordem certa, 235 marcadores removidos, os 24 capítulos presentes no modo "pular" (cerca de 10 mil palavras de notas a menos).
  - Com o "MANUAL DO ALUNO PBL": mesmo texto nos três modos.
  - Player no Chromium com a página real e API simulada: retomada em 7 s para posição salva em 12 s, recuo de 5 s depois de 40 s de pausa e nenhum após pausa curta, timer "fim da parte" baixando o volume e parando sem avançar, contagem do timer de 15 min, pré-carga da parte 2, salto pela barra do livro para a parte 3, envio dos ajustes.
- **Arquivos**:
  - `src/Infra/Pdf/ExtratorTextoPdfClient.php`, `src/Interface/ExtratorTextoPdfInterface.php`, `src/DataObject/LinhaPdfDTO.php`, `src/DataObject/PaginaPdfDTO.php` (novos DTOs)
  - `src/Service/LivroAudio/MontarTextoNarracaoLivroService.php`, `ExtrairTextoNarracaoLivroService.php`, `AplicarPronunciasService.php`, `RefazerNarracaoLivroAudioService.php`, `ConfigurarNarracaoLivroAudioService.php` (novos)
  - `src/Service/LivroAudio/DividirLivroEmBlocosService.php`, `GerarAudioBlocoService.php`, `GerarAudioBlocoVozService.php`
  - `src/Enum/ModoNotasLivroAudio.php`, `src/DataObject/ConfigurarNarracaoLivroDTO.php` (novos), `src/Entity/LivroAudio.php`, `src/Entity/LivroAudioBloco.php`, `migrations/Version20261104120000.php`
  - `src/Repository/LivroAudioBlocoRepository.php`, `LivroAudioBlocoVozRepository.php`, `src/Serializer/LivroAudioSerializer.php`, `src/Controller/LivroAudio/LivroAudioController.php`, `src/Exception/LivroAudio/LivroAudioException.php`
  - `web/features/livros-audio/components/PainelNarracao.tsx` (novo), `components/PlayerAudioLivro.tsx`, `api.ts`, `types.ts`, `hooks/useLivrosAudio.ts`

### 🟡 Melhoria 110 — Ler e Ouvir do Seu Jeito: Velocidade, Offline, Busca, Marcações e Capítulos

- **Status**: Publicada em produção em 04/11/2026, falta validar no uso
- **Data**: 04 de novembro de 2026
- **Problema**:
  - A velocidade só alternava entre 5 valores fixos e voltava para 1x ao reabrir.
  - Não dava para ouvir sem internet.
  - Não dava para começar a ouvir de uma frase escolhida na página.
  - A página era sempre branca.
  - O sumário listava só as partes do áudio, não os capítulos do livro.
  - Havia um único marcador por livro, sem destaques nem notas.
  - A lupa da barra de cima não fazia nada.
  - A troca de página era seca.
- **Solução**:
  - **Velocidade fina**: painel com controle de 0,5x a 3x em passos de 0,1, botões −/+ e atalhos (0,8x a 2,5x). Fica guardada por livro neste aparelho (`localStorage` `livros-audio:velocidade:{uuid}`). O tempo que falta do livro considera a velocidade.
  - **Ouvir offline** (botão de nuvem no player):
    - Baixa as próximas 3, 5 ou 10 partes, ou todas que faltam, na voz escolhida. Para cada parte guarda o MP3 e as frases (com tempos) na Cache API do navegador (`livros-audio-offline-v1`) e pede armazenamento persistente.
    - Ao tocar uma parte guardada, o player usa o arquivo local em vez do stream. As frases também vêm de lá quando a rede falha.
    - Quando a parte é refeita (nova versão), a cópia antiga é substituída no próximo download.
    - O painel mostra quantas partes e quantos MB estão guardados e permite apagar. No sumário, as partes guardadas têm um ícone.
  - **Clicar numa frase**: abre um menu com "Ouvir daqui" (toca da palavra clicada), "Destacar" e "Nota". Se a frase já tiver destaque, aparecem "Editar nota" e "Tirar destaque".
  - **Tema da página**: claro, sépia ou escuro (botão de sol/café/lua na barra de cima), aplicado com `filter` no canvas. O destaque da narração continua visível nos três. A escolha fica guardada no aparelho.
  - **Sumário com capítulos reais**: aba "Capítulos" lê o sumário embutido no PDF (`getOutline`, até 2 níveis). Sem sumário, usa os títulos com fonte bem maior que o texto. Clicar num capítulo leva até a página e toca a partir dela. A aba "Partes do áudio" mantém a lista antiga.
  - **Marcadores, destaques e notas**:
    - Nova tabela `marcacao_livro_audio`, com limite de 2000 por livro. Cada marcação guarda página, parte, frase, segundo, texto, nota e os retângulos do destaque.
    - O botão "Marcar" do player guarda o ponto exato que está sendo lido (ou a página aberta se o áudio não foi usado), além de salvar a posição como antes.
    - Destaques aparecem em amarelo e notas em laranja sublinhado.
    - O painel (ícone de marcador na barra de cima) filtra por tipo, leva à página, toca dali, edita e apaga notas, e exporta tudo em Markdown.
  - **Busca no texto**: a lupa abre a busca em todas as páginas, sem diferenciar acentos e maiúsculas. O resultado aparece com o termo marcado e a página rola até ele. "Ouvir" toca a partir da frase do resultado, inclusive quando ela começa na página anterior.
  - **Virar a página**: animação curta (380 ms) só com `transform` e `opacity` (giro de 9° e deslocamento de 2,5%), feita com a Web Animations API. Não roda com "reduzir movimento" ligado no sistema.
- **API**:
  - `GET /api/v1/livros-audio/{uuid}/marcacoes`
  - `POST /api/v1/livros-audio/{uuid}/marcacoes`
  - `PATCH /api/v1/livros-audio/{uuid}/marcacoes/{marcacao}`: só a nota.
  - `DELETE /api/v1/livros-audio/{uuid}/marcacoes/{marcacao}`
- **Limites no iPhone**: o Safari libera a Cache API e dá cota a cada site conforme o espaço livre do aparelho. Uma parte tem em média 1,5 a 2 MB.
  - O Safari pode apagar os dados de um site que fica 7 dias sem ser aberto, a não ser que o site esteja adicionado à Tela de Início.
  - Se a cota acaba no meio, o download para e avisa. O que já baixou continua guardado.
  - O app em si ainda precisa estar aberto: a página do leitor não funciona offline do zero.
- **Testado** fora de produção, no Chromium, com o leitor inteiro, o PDF dos Protocolos e o áudio e as frases reais da parte 1 (API simulada):
  - Velocidade 1,5x → 1,6x aplicada e guardada.
  - Clique na página 3 abriu a frase certa. Destaque salvo com 4 retângulos e desenhado. O segundo clique ofereceu "Tirar destaque". A nota foi salva via PATCH.
  - "Ouvir daqui" tocou a frase clicada.
  - Busca por "ditador": 2 resultados. "Ouvir" tocou a frase do termo, que começa na página 2.
  - "Marcar" guardou a parte 1, a frase 37 e o segundo 119. A exportação em Markdown saiu com marcadores e notas.
  - Os três temas aplicaram o filtro.
  - Sumário: 25 títulos achados (o PDF não tem sumário embutido). Clicar em "CAPÍTULO III" (p. 12) tocou a parte 4 perto da página 12.
  - Animação em toda virada e nenhuma com "reduzir movimento".
  - Offline: 3 partes guardadas (5 MB). Com a rede desligada, a parte 6 tocou do arquivo local, sem nenhum pedido ao servidor.
- **Arquivos**:
  - Backend:
    - `src/Entity/MarcacaoLivroAudio.php`, `src/Enum/TipoMarcacaoLivroAudio.php`, `src/Repository/MarcacaoLivroAudioRepository.php` (novos)
    - `src/DataObject/CriarMarcacaoLivroDTO.php`, `src/DataObject/AtualizarMarcacaoLivroDTO.php`, `src/Serializer/MarcacaoLivroAudioSerializer.php` (novos)
    - `src/Service/LivroAudio/GerenciarMarcacoesLivroAudioService.php`, `migrations/Version20261104180000.php` (novos)
    - `src/Controller/LivroAudio/LivroAudioController.php`, `src/Exception/LivroAudio/LivroAudioException.php`
  - Frontend (`web/features/livros-audio/`):
    - Componentes novos: `components/MenuFrase.tsx`, `components/PainelBusca.tsx`, `components/PainelMarcacoes.tsx`
    - Hooks novos: `hooks/useMarcacoesLivro.ts`, `hooks/useOfflineLivro.ts`, `hooks/localizacaoBloco.ts`
    - Utilitários novos: `utils/offline.ts`, `utils/capitulos.ts`, `utils/buscaLivro.ts`, `utils/exportarMarcacoes.ts`
    - Alterados: `LeitorLivroAudio.tsx`, `components/PlayerAudioLivro.tsx`, `components/VisualizadorLivro.tsx`, `components/PaginaPdf.tsx`, `components/BarraSuperiorLeitor.tsx`, `hooks/useNarracaoAtual.ts`, `utils/pdf.ts`, `utils/localizacaoNarracao.ts`, `api.ts`, `types.ts`

---

### 🟡 Melhoria 111 — Fila Inteligente, Estatísticas de Escuta, Voz Piper, Links Assinados e Painel de Livros

- **Status**: Publicada em produção em 05/11/2026, falta validar no uso
- **Data**: 05 de novembro de 2026
- **Problema**:
  - A fila gerava as partes na ordem do livro, mesmo quando a pessoa já estava ouvindo lá na frente.
  - Não dava para pausar a geração de um livro nem passar um livro na frente dos outros.
  - O Dashboard não mostrava nada dos livros: quanto foi ouvido, o que continuar, quanto disco e memória eles ocupam.
  - Quando o Edge TTS caía, a parte ficava com erro e não havia outra voz.
  - O áudio e o PDF eram pedidos com `?token=<JWT>` na URL. O token ficava no log do Nginx e no histórico.
  - Uma gravação de posição atrasada (de outro aparelho ou de uma aba antiga) podia sobrescrever uma mais nova.
  - O aviso de disco só aparecia quando já estava quase cheio, e o painel de vozes não mostrava quanto cada voz ocupava.
- **Solução**:
  - **Gerar à frente de onde você está**:
    - Cada mensagem da fila não aponta mais para uma parte fixa. O worker escolhe a melhor parte pendente na hora, nesta ordem:
      1. livros priorizados;
      2. livro ouvido nos últimos 30 minutos;
      3. livro mais antigo;
      4. partes a partir da página atual antes das que ficaram para trás;
      5. número da parte.
    - A reserva é um `UPDATE ... WHERE status = 'pendente'` atômico, então duas mensagens nunca pegam a mesma parte.
    - Partes presas em "gerando" por mais de 10 minutos voltam para a fila.
    - Ao terminar uma parte, o worker coloca uma nova mensagem na fila se ainda houver partes pendentes e a fila estiver vazia.
  - **Pausar e priorizar**:
    - Cada livro pode ser pausado, retomado ou passado para o começo da fila, pelos botões no card ou pelo painel "Fila de geração" da biblioteca.
    - O painel mostra a posição de cada livro, quantas partes faltam e a previsão de término, calculada pela média real das últimas gerações.
    - Livros pausados também não geram vozes extras.
    - Retomar volta a enfileirar as partes pendentes.
    - Reprocessar um livro limpa antes as partes com erro.
  - **Continuar ouvindo e estatísticas** (nova seção "Livros em áudio" no Dashboard):
    - O player conta o tempo real tocando e envia a cada 30 s, ao pausar, ao sair e no `pagehide` (com `keepalive`).
    - O servidor aceita no máximo 120 s por envio e soma por livro e por dia, na nova tabela `escuta_livro_audio_dia`.
    - O Dashboard mostra hoje, a semana, o total e a sequência de dias batendo a meta. Há um gráfico dos últimos 14 dias com a linha da meta.
    - A meta diária é editável (padrão 30 min, de 5 a 600), guardada em `usuario.meta_escuta_minutos`.
    - "Continuar ouvindo" lista os 3 livros ouvidos por último que têm áudio, com o progresso, e leva direto ao leitor.
  - **Segundo motor de voz (Piper)**:
    - Piper 1.8.0 roda localmente no container, com as vozes `pt_BR-faber-medium` e `en_US-lessac-medium` em `/opt/piper/vozes`.
    - O script `bin/sintetizar-voz-piper.py` gera frase por frase, com o tempo exato de cada frase e o de cada palavra estimado, e converte para MP3 com ffmpeg.
    - As vozes "Faber" e "Lessac" aparecem no painel de vozes com o selo Piper.
    - Na narração principal, o Edge TTS é tentado 2 vezes. Se falhar nas duas, a parte é gerada com o Piper do mesmo idioma, e a parte registra a voz usada.
    - Vozes extras não trocam de motor.
    - O `espeakbridge` do Piper é compilado na imagem, porque o pacote pip não traz a versão para Alpine (musl).
  - **Links curtos e assinados**:
    - O áudio das partes, o PDF baixado e as amostras de voz agora usam `/api/v1/livros-audio-arquivos/...`, assinados com o `UriSigner` do Symfony. Não há mais JWT na URL.
    - O link vale de 20 a 30 minutos. A expiração é arredondada em janelas de 10 minutos, então a URL não muda dentro da janela e o cache do navegador funciona.
    - O player pede de uma vez os links de todas as partes prontas (`GET /{uuid}/links`), fixa o link da parte que está tocando e renova sozinho quando o link expira (erro no `<audio>`).
    - O PDF do leitor é carregado pelo pdf.js com o cabeçalho `Authorization`.
    - As respostas têm `Referrer-Policy: no-referrer`.
  - **Marcador que ignora gravação antiga**:
    - Cada gravação de posição leva `registradaEm` (ms do aparelho).
    - O servidor ignora uma gravação com marca mais antiga que a guardada (`livro_audio.posicao_registrada_em`).
    - Clientes antigos sem a marca continuam funcionando.
  - **Alerta de disco mais cedo**:
    - "Atenção" com menos de 5 GB ou 10% livres, e "crítico" com menos de 1 GB. O cálculo conta o que a fila ainda vai ocupar: partes pendentes × tamanho médio de uma parte.
    - A biblioteca e o painel de vozes mostram o aviso.
    - Pedir uma voz extra que deixaria o disco crítico é recusado (409).
    - O painel de vozes mostra o tamanho de cada voz, ou a estimativa antes de gerar.
    - O `/health` ganhou `alerta` e `alerta_mb` (5 GB) por disco.
  - **Painel de armazenamento dos livros** no Dashboard:
    - Livros por status, quantidade e tamanho dos PDFs.
    - Partes de áudio prontas, horas e tamanho, e vozes extras com o tamanho por voz.
    - Tamanho no banco comparado ao tamanho real da pasta.
    - Disco livre com a barra de uso.
    - Memória do container (cgroup), do servidor e do worker de áudio (RSS do processo `messenger:consume livro_audio`).
    - Situação da fila.
- **API**:
  - `GET /api/v1/livros-audio/fila`, `POST /api/v1/livros-audio/{uuid}/fila/pausar|retomar|priorizar`
  - `GET /api/v1/livros-audio/estatisticas`, `PUT /api/v1/livros-audio/meta`, `POST /api/v1/livros-audio/{uuid}/escuta`
  - `GET /api/v1/livros-audio/disco`, `GET /api/v1/dashboard/livros`
  - `GET /api/v1/livros-audio/{uuid}/links`, `GET /api/v1/livros-audio/{uuid}/pdf/link`, `GET /api/v1/livros-audio/vozes/amostras`
  - Públicas, só com assinatura válida:
    - `GET /api/v1/livros-audio-arquivos/{uuid}/blocos/{n}/stream`
    - `GET /api/v1/livros-audio-arquivos/{uuid}/pdf`
    - `GET /api/v1/livros-audio-arquivos/vozes/{voz}/amostra`
- **Banco** (`Version20261105120000`):
  - `livro_audio` ganha `posicao_registrada_em`, `fila_pausada` e `prioridade_fila`.
  - `usuario` ganha `meta_escuta_minutos`.
  - Nova tabela `escuta_livro_audio_dia`, com chave única (livro, dia).
- **Testado** fora de produção, com MySQL descartável e o código real dos serviços. 32 de 33 verificações passaram; a que não passou era um empate de horário no próprio teste. Cobertas:
  - A fila pula para a página 65 quando o livro é aberto lá. O livro ouvido agora e o priorizado passam na frente, o pausado é pulado.
  - Partes presas voltam para a fila, e o reabastecimento não duplica mensagens.
  - A posição antiga é ignorada, a nova é aceita, e o cliente sem marca continua funcionando.
  - A soma de escuta respeita o limite de 120 s, e a sequência de dias está certa.
  - O link assinado é aceito. O alterado e o vencido são recusados. A validade fica entre 20 e 30 min, e a URL fica estável na janela.
  - O Piper gerou 17,9 s de MP3 com os tempos de 44 palavras.
  - No navegador (API simulada):
    - O link vencido foi renovado sozinho e o áudio tocou.
    - Nenhuma URL tinha token, e o PDF foi pedido com `Authorization`.
    - A escuta foi registrada ao pausar, e todas as posições levaram `registradaEm`.
    - O painel de vozes mostrou tamanhos, o selo Piper e o aviso de disco.
    - Na fila, os botões de pausar, retomar e priorizar enviaram as ações.
    - A meta do Dashboard foi salva.
    - Biblioteca e Dashboard sem rolagem horizontal no celular. O cabeçalho da biblioteca passou a empilhar no celular.
- **Limites**:
  - Prints, Central de Mídias e Downloads ainda usam `?token=`; a troca ficou só nos livros.
  - O Piper existe só na imagem de produção (`Dockerfile.prod`).
  - O tempo de cada palavra no Piper é estimado dentro da frase, então o destaque por palavra é menos preciso que no Edge.
  - A geração continua com um único worker; o Piper é mais lento que o Edge (cerca de 1× tempo real no servidor).
- **Arquivos**:
  - Backend novos:
    - Serviços: `src/Service/LivroAudio/FilaGeracaoLivrosAudioService.php`, `EstatisticasEscutaLivrosAudioService.php`, `PainelSistemaLivrosAudioService.php`, `LinkAssinadoLivroAudioService.php`
    - Entidade e repositório: `src/Entity/EscutaLivroAudioDia.php`, `src/Repository/EscutaLivroAudioDiaRepository.php`
    - Controller: `src/Controller/LivroAudio/ArquivoLivroAudioController.php`
    - Voz: `src/Infra/Audio/SintetizadorVozPorProcesso.php`, `PiperTtsClient.php`, `SintetizadorVozRoteador.php`, `bin/sintetizar-voz-piper.py`
    - Migração: `migrations/Version20261105120000.php`
  - Backend alterados:
    - Entidades: `LivroAudio`, `LivroAudioBlocoVoz`, `Usuario`
    - Repositórios: `LivroAudioRepository`, `LivroAudioBlocoRepository`, `LivroAudioBlocoVozRepository`
    - Serviços: `GerarAudioBlocoService`, `GerarAudioBlocoVozService`, `GerenciarVozesLivroAudioService`, `ProcessarLivroAudioService`, `ResolverVozLivroAudioService`, `SalvarPosicaoLivroService`
    - Message handlers dos dois tipos de geração
    - Voz: `EdgeTtsClient`, `VozNarracao`, `SintetizadorVozInterface`, `ResultadoSinteseVozDTO`, `SinteseVozException`
    - Controllers: `LivroAudioController`, `DashboardController`, `HealthController`
    - Outros: `LivroAudioSerializer`, `LivroAudioException`, `SalvarPosicaoLivroDTO`
    - Configuração: `config/services.yaml`, `config/packages/security.yaml`, `devops/php/Dockerfile.prod`
  - Frontend:
    - Novos:
      - `web/features/livros-audio/components/PainelFilaGeracao.tsx`
      - `web/features/livros-audio/hooks/useRegistroEscuta.ts`
      - `web/features/livros-audio/utils/posicao.ts`
      - `web/features/dashboard/components/SecaoLivrosDashboard.tsx`
    - Alterados:
      - Livros em áudio: `LivrosAudio.tsx`, `LeitorLivroAudio.tsx`, `components/PlayerAudioLivro.tsx`, `components/PainelVozes.tsx`, `components/CardLivroAudio.tsx`, `components/GradeLivrosAudio.tsx`, `components/LeitorSemPdf.tsx`, `components/CabecalhoLivrosAudio.tsx`, `hooks/useLivrosAudio.ts`, `utils/pdf.ts`, `utils/livros.ts`, `api.ts`, `types.ts`
      - Dashboard: `Dashboard.tsx`, `api.ts`, `hooks/useDashboard.ts`, `types.ts`

---

### 🟡 Melhoria 112 — Ouvir Sem Internet Dentro do Sistema e Leitor Pensado para o Celular

- **Status**: Publicada em produção em 05/11/2026, falta validar no uso
- **Data**: 05 de novembro de 2026
- **Problema**:
  - Sem sinal (no ônibus, por exemplo) o sistema não abria. A sessão caía quando a renovação do token falhava por falta de rede.
  - O download offline da M110 só existia dentro do player, por número de partes, sem tamanho, sem atualizar partes refeitas e sem liberar espaço sozinho.
  - O PDF e os recursos do pdf.js (cMaps, fontes) vinham de CDN, então o leitor não abria offline.
  - A posição e o tempo ouvidos sem internet se perdiam.
  - No celular o player ocupava a tela toda, a página do PDF ficava pequena e não havia leitura em texto com letra grande.
- **Solução**:
  - **App instalável e offline (PWA)**:
    - Service worker `public/sw.js`. A página usa rede primeiro, com 5 s de limite, e cai na cópia guardada do app. Os arquivos de `/build/` são guardados de vez. As consultas dos livros (lista, livro, partes, vozes, marcações e frases) usam rede primeiro, com 7 s de limite, e caem na última resposta guardada.
    - O build gera `build/sw-assets.json` com a lista de arquivos, e o service worker guarda tudo depois do primeiro acesso. Os recursos do pdf.js vão para `build/pdfjs/` e não dependem mais de CDN.
    - Botão "Instalar app" na biblioteca, quando o navegador oferece. O manifest ganhou `id`, `scope`, atalho e ícone `maskable`, e abre direto nos livros.
    - A sessão não cai mais por falha de rede, 429 ou erro 5xx na renovação do token. Só uma recusa real desloga. Ao sair, a cópia das respostas da API é apagada.
    - Faixa amarela "Sem internet" na biblioteca e no leitor, com quantas alterações esperam a conexão. Sem internet, ficam desligados: enviar livro, atualizar, apagar, pausar e priorizar na fila, gerar e apagar voz e abrir o PDF original.
  - **Baixar para ouvir offline** (no card da biblioteca e no player):
    - Opções: próximas 1, 2 ou 5 horas ou o livro todo, com a duração e o tamanho de cada uma. Mostra o progresso e tem "Parar".
    - Cada parte guarda o áudio e as frases com os tempos. Opcionalmente guarda também o PDF original.
    - As partes refeitas no servidor aparecem como desatualizadas, com o botão "Atualizar".
    - **Download inteligente** (por livro): mantém sempre baixadas as próximas 1, 2 ou 5 horas, pode apagar as partes já ouvidas e pode baixar só no Wi-Fi. Roda enquanto o livro está aberto com internet.
    - O card mostra quantas partes estão no aparelho. O painel mostra o total guardado e tem "Apagar".
  - **Sincronizar depois**:
    - A posição e os segundos ouvidos vão para uma fila no navegador quando não há rede. Eles são enviados quando a conexão volta ou a cada 60 s, com a escuta em pedaços de até 120 s. O servidor ignora a posição mais antiga pelo `registradaEm`.
    - Ao abrir o livro, a posição pendente no aparelho vale mais que a do servidor.
  - **Leitor no celular**:
    - **Modo texto**: o texto da parte em letra grande (serifada), nos três temas, com a frase atual destacada (ou a palavra) e rolagem automática. Tocar numa frase toca dali. Botões A−/A+ ajustam a letra. No celular ele é o padrão, e a escolha fica salva.
    - **Modo página**: a página se ajusta à largura da tela e vira com o dedo, arrastando para os lados.
    - **Player em duas camadas**: o mini-player tem play, ±15 s e o tempo. O botão "Mais" abre uma gaveta com velocidade, sumário, voz, timer, offline, marcar, seguir áudio, frase/palavra, ajustes e a navegação das páginas.
    - Barra superior enxuta no celular. Respeita a área segura (notch) e usa `100dvh`.
    - Tela de bloqueio com capa, avançar/voltar e a barra de posição (Media Session `seekto` e `setPositionState`).
    - Quando o PDF não abre, o leitor mostra o modo texto em vez de só o player.
- **Testes**:
  - `tsc` sem erros novos e Biome limpo.
  - No navegador, com tela de 390×844 e API simulada:
    - Nenhuma rolagem horizontal na biblioteca, no modo texto e no modo página.
    - "Próximas 1 h" guardou 14 partes (1h02). O card passou a mostrar o selo.
    - O leitor abriu em modo texto e destacou a frase tocada. A troca para a página do PDF funcionou.
    - Com a rede cortada, apareceu a faixa. Tocar numa frase tocou do arquivo guardado, e as posições ficaram pendentes.
    - Quando a rede voltou, a posição e a escuta foram enviadas e a fila ficou vazia.
- **Limites**:
  - O service worker só funciona em HTTPS e só depois de abrir o sistema uma vez com internet.
  - No iPhone, o Safari pode apagar os arquivos guardados se o site não estiver na Tela de Início e ficar dias sem abrir.
  - O download inteligente só roda com o livro aberto. Não há download em segundo plano.
  - Partes narradas antes de o texto ser guardado (antes da M106) não têm modo texto.
- **Arquivos**:
  - Novos:
    - `public/sw.js`, `web/shared/pwa/serviceWorker.ts`
    - Stores: `web/stores/useConexaoStore.ts`, `web/stores/useInstalacaoAppStore.ts`
    - Componentes: `components/LeitorTexto.tsx`, `components/PainelOffline.tsx`, `components/ModalOfflineLivro.tsx`, `components/FaixaConexao.tsx`
    - Hooks: `hooks/useSincronizacaoOffline.ts`, `hooks/usePreferenciasLeitura.ts`
    - Utils: `utils/gerenciadorOffline.ts`, `utils/downloadAutomatico.ts`, `utils/pendenciasOffline.ts`, `utils/vozSalva.ts`
  - Alterados:
    - Configuração e app: `.tooling/frontend/vite.config.js`, `devops/php/nginx-internal.conf`, `public/site.webmanifest`, `templates/base.html.twig`, `web/main.tsx`, `web/config/api.ts`, `web/stores/useAuthStore.ts`, `web/stores/index.ts`, `web/layouts/MainLayout.tsx`
    - Livros em áudio (`web/features/livros-audio/`): `LeitorLivroAudio.tsx`, `LivrosAudio.tsx`, `api.ts`
    - Componentes: `PlayerAudioLivro`, `BarraSuperiorLeitor`, `VisualizadorLivro`, `LeitorSemPdf`, `CardLivroAudio`, `GradeLivrosAudio`, `CabecalhoLivrosAudio`, `PainelVozes`
    - Hooks e utils: `hooks/useDocumentoPdf.ts`, `useLeitorLivro.ts`, `useLivrosAudio.ts`, `useNarracaoAtual.ts`, `useOfflineLivro.ts`, `useRegistroEscuta.ts`, `utils/offline.ts`, `utils/pdf.ts`

---

### 🟡 Melhoria 113 — Spotify Funcionando em Produção

- **Status**: Publicada em produção em 05/11/2026, falta validar no uso
- **Data**: 05 de novembro de 2026
- **Problema**:
  - Ao subir a integração com o Spotify, o sistema não iniciava. O `DashboardController` tinha o `use App\Entity\Usuario` repetido.
  - A tela `/spotify` ficava em branco. As rotas usam o `lazy` do React Router, que precisa do export `Component`, e `Spotify.tsx` e `SpotifyCallback.tsx` não o tinham.
  - "Vincular ao Spotify" dava erro: o front chamava `/spotify/autorizar`, `/spotify/callback` e `/spotify/capsula/meses`, que não existem no backend. A resposta era a página HTML do app.
  - A importação do histórico esperava `motivoErro`, mas o backend devolve `erroMotivo`.
  - Na volta do login do Spotify dava "state inválido ou expirado". O state ficava no cache em arquivo do servidor e não era encontrado na volta.
- **Solução**:
  - Removido o `use` repetido.
  - Adicionado o export `Component` nas duas páginas. O `useSEO` passou a usar `title` e `description`.
  - O front passou a usar `/spotify/oauth/url`, `/spotify/oauth/concluir` e `/spotify/capsula`. O campo da importação virou `erroMotivo`.
  - Novo `EstadoAutorizacaoSpotifyService`: o state é assinado com HMAC usando o `APP_SECRET`, com o id do usuário e 15 minutos de validade. Não usa mais cache.
  - A tela de retorno envia o `code` uma vez só e mostra a mensagem real da API.
  - Credenciais do Spotify adicionadas ao `.env` de produção.
  - Botão discreto "Sincronizar agora" no painel de conexão. Ele chama `POST /api/v1/spotify/sincronizar` (`SincronizarAgoraSpotifyService`), que faz a mesma coleta da rotina de 30 minutos para a conta do usuário e mostra quantas músicas eram novas.
- **Testes**:
  - O kernel de produção sobe e o `lint:container` passa.
  - O state válido é aceito. O de outro usuário, o adulterado e o inválido são recusados.
  - A página `/spotify` renderiza no navegador (API simulada).
  - O Spotify aceitou o Client ID e o Redirect URI.
- **Arquivos**:
  - Backend: `src/Controller/Dashboard/DashboardController.php`, `src/Controller/Spotify/SpotifyController.php`, `src/Service/Spotify/EstadoAutorizacaoSpotifyService.php` e `SincronizarAgoraSpotifyService.php` (novos), `GerarUrlAutorizacaoSpotifyService.php`, `ConcluirAutorizacaoSpotifyService.php`
  - Frontend: `web/features/spotify/Spotify.tsx`, `api.ts`, `types.ts`, `components/SpotifyCallback.tsx`, `components/ModalUploadHistoricoSpotify.tsx`, `components/PainelConexaoSpotify.tsx`, `hooks/useSincronizarSpotify.ts` (novo)
