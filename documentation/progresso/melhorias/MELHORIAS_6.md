# Melhorias — M101 a M134

> Detalhamento das melhorias **M101–M134**. Índice em [MELHORIAS.md](MELHORIAS.md).

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

---

### ✅ Melhoria 114 — Foto de Artistas Mais Ouvidos e Top 5 Músicas com Animação Expansível no Spotify

- **Status**: Concluída
- **Data**: 05 de novembro de 2026
- **Problema**:
  - No ranking de artistas mais ouvidos (tanto na Cápsula Sonora quanto na aba Hoje/Semana), as fotos de perfil dos artistas não eram exibidas, caindo sempre nas iniciais do fallback. O resolvedor de imagens exigia código do Spotify e marcava artistas importados sem código como `nao_encontrada`, e as chaves de busca geradas no frontend (`artista_busca:...`) divergiam do padrão do backend (`artista:nome:...`).
  - Não havia como visualizar as músicas mais ouvidas de um artista específico diretamente no ranking.
- **Solução**:
  - **Resolução de fotos de artistas**: Adicionada busca de artistas por nome via API do Spotify (`/search?type=artist`) no `SpotifyClient` com validação de similaridade de strings. Corrigida a compatibilidade de chaves no frontend com `gerarChaveArtista` e `gerarChaveFaixa`. O cache em tempo real do frontend enriquece imediatamente os avatares quando as imagens são resolvidas em segundo plano.
  - **Músicas mais ouvidas do artista**: Nova consulta SQL agregada no `ReproducaoSpotifyRepository` e use case `ObterTopMusicasArtistaService`, exposto no endpoint `GET /api/v1/spotify/artistas/top-musicas?artista=...&ano=...&mes=...`.
  - **Linha expansível e animação suave**: Criado o componente `ListaTopMusicasArtista` com Chakra UI v3 `Collapsible`, exibindo até 5 músicas mais ouvidas do artista (com miniatura, título, álbum, link externo, quantidade de reproduções/streams e minutos escutados formatados), acionado ao clicar sobre o artista.
- **Arquivos**:
  - Backend:
    - `src/Interface/SpotifyInterface.php`, `src/Infra/Spotify/SpotifyClient.php`
    - `src/Repository/ReproducaoSpotifyRepository.php`
    - `src/Service/Spotify/ResolverImagemSpotifyService.php`, `src/Service/Spotify/EnriquecerImagensSpotifyService.php`
    - `src/Service/Spotify/ObterTopMusicasArtistaService.php` (novo)
    - `src/DataObject/Spotify/ItemTopMusicaArtistaDTO.php` (novo)
    - `src/Controller/Spotify/SpotifyController.php`
  - Frontend:
    - `web/features/spotify/utils/chavesSpotify.ts` (novo), `web/features/spotify/utils/index.ts`
    - `web/features/spotify/types.ts`, `web/features/spotify/api.ts`
    - `web/features/spotify/hooks/chavesQuerySpotify.ts`, `web/features/spotify/hooks/useTopMusicasArtista.ts` (novo), `web/features/spotify/hooks/index.ts`
    - `web/features/spotify/components/ListaTopMusicasArtista.tsx` (novo)
    - `web/features/spotify/components/ItensRankingSpotify.tsx`
    - `web/features/spotify/components/SecaoCapsulaSonora.tsx`
    - `web/features/spotify/components/SecaoHojeSemana.tsx`
    - `web/features/spotify/Spotify.tsx`

---

### 🟡 Melhoria 115 — Minutos Reais nas Músicas Coletadas pela API do Spotify

- **Status**: Publicado, falta validar
- **Data**: 06 de novembro de 2026
- **Problema**:
  - A coleta automática (rotina de 30 min e botão "Sincronizar agora") gravava a duração inteira da faixa como tempo ouvido, porque a API não informa quanto foi ouvido. Uma música de 4 min ouvida por 2 somava 4 min, e uma pulada aos 20 s contava como stream.
- **Solução**:
  - O tempo ouvido passa a ser o intervalo entre o fim da reprodução anterior e o fim desta (`played_at`), limitado à duração da faixa. As reproduções do lote são ordenadas e a anterior ao lote vem do banco.
  - Abaixo de 30 s a reprodução continua gravada, mas deixa de contar como stream, como no Spotify.
  - Migration de dados recalcula as reproduções da API já gravadas com a mesma regra (função `LAG` por usuário).
  - Limite conhecido: a primeira música de uma sessão e intervalos com pausa contam até a duração da faixa.
- **Arquivos**:
  - `src/Service/Spotify/EstimarTempoReproduzidoSpotifyService.php` (novo)
  - `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`
  - `src/Repository/ReproducaoSpotifyRepository.php` (`buscarUltimaTocadaAntesDe`)
  - `migrations/Version20261106120000.php` (novo)
  - `documentation/funcionalidades/SPOTIFY.md`

---

### 🟡 Melhoria 116 — Página de Transcrição de Áudios

- **Status**: Publicado, falta validar
- **Data**: 06 de novembro de 2026
- **Objetivo**:
  - Enviar vários áudios de uma vez e ver cada um sendo transcrito em tempo real, com o texto salvo na conta e o áudio apagado 7 dias depois.
- **Solução**:
  - Nova página `/transcricoes` (menu "Transcrições"): envio múltiplo com arrastar e soltar, fila com progresso e tempo restante, texto aparecendo ao vivo, toasts de conclusão, estatísticas da conta, busca no texto, filtros e favoritas.
  - Painel da transcrição: player sincronizado com destaque do trecho falado, trechos clicáveis, visão em trechos ou texto corrido, procurar no texto, copiar, exportar `.txt`, `.md`, `.srt` e `.vtt`, renomear, transcrever de novo em outro idioma e apagar.
  - Motor local `whisper.cpp` (modelo `ggml-small-q5_1`) compilado na imagem de produção; nada sai do servidor. Fila Messenger própria (`transcricao`, 1 worker).
  - Rotina horária apaga os áudios com mais de 7 dias e marca como erro transcrições presas há mais de 6 h. O texto fica no banco.
  - `bootstrap.sh` passa a ajustar o dono de `var/` antes do cache warmup, o que corrige o reinício do container no primeiro boot depois de migrations.
- **Arquivos**:
  - Backend: `src/Entity/Transcricao.php`, `src/Repository/TranscricaoRepository.php`, `src/Controller/Transcricao/`, `src/Service/Transcricao/`, `src/DataObject/Transcricao/`, `src/Exception/Transcricao/`, `src/Enum/StatusTranscricao.php`, `src/Enum/IdiomaTranscricao.php`, `src/Enum/FiltroListagemTranscricao.php`, `src/Interface/TranscritorAudioInterface.php`, `src/Interface/ArmazenamentoTranscricaoInterface.php`, `src/Infra/Transcricao/`, `src/Infra/Storage/ArmazenamentoTranscricaoClient.php`, `src/Message/TranscreverAudioMessage.php`, `src/Message/ExpirarAudiosTranscricaoMessage.php`, `src/MessageHandler/` (2 novos), `src/Serializer/TranscricaoSerializer.php`, `src/Schedule.php`, `migrations/Version20261106213627.php`
  - Config e infra: `config/services.yaml`, `config/packages/messenger.yaml`, `devops/php/Dockerfile.prod`, `devops/docker-compose.prod.yaml`, `devops/php/supervisord-prod.conf`, `devops/supervisord.conf`, `devops/bootstrap.sh`
  - Frontend: `web/features/transcricoes/`, `web/App.tsx`, `web/layouts/Sidebar.tsx`, `web/layouts/Header.tsx`
  - Documentação: `documentation/funcionalidades/TRANSCRICOES.md` (novo)

---

### 🟡 Melhoria 117 — Análises Completas do Spotify: Detalhes, Recordes, Hábitos, Descobertas e Resumo do Ano

- **Status**: Publicado, falta validar
- **Data**: 06 de novembro de 2026
- **Objetivo**:
  - Aproveitar melhor o histórico guardado: ver cada artista e música em detalhe, saber quando e quanto se escuta e ter rankings de qualquer período, inclusive de todos os tempos.
- **Solução**:
  - **Detalhe de artista e de música** (`/spotify/artista?nome=` e `/spotify/musica?nome=&artista=`): streams, minutos, primeira e última vez, dias diferentes, posição de todos os tempos, evolução mês a mês (streams ou minutos), meses em que esteve no top 5, recorde em um dia, taxa de pulos e aleatório, músicas e álbuns mais ouvidos do artista. Os nomes nos rankings levam a essas páginas.
  - **Tocando agora**: cartão ao vivo com capa, barra de progresso e quantas vezes a música já foi ouvida (`/me/player/currently-playing`, escopo já concedido). Consulta de novo perto do fim da faixa.
  - **Recordes e sequências**: sequência atual e maior sequência de dias seguidos, dia e mês recorde, música mais ouvida da vida, artista com mais horas e maior repetição num dia.
  - **Evolução por mês**: gráfico de 12 meses, 24 meses ou 5 anos com média, e o mês atual comparado ao mês passado e ao mesmo mês do ano anterior até o mesmo dia.
  - **Hábitos**: mapa dia da semana × hora, concentração do gosto (fatia dos 5 artistas do topo), músicas ouvidas uma única vez, proporção de repetição, taxa de pulos e de aleatório.
  - **Novas descobertas**: listas com capa de artistas novos, músicas novas, redescobertas (voltou depois de 90 dias) e obsessões (8 ou mais streams em 7 dias).
  - **Rankings**: opção "Sempre" (todos os tempos) e aba "Álbuns" com capa no ranking principal.
  - **Resumo do ano** no estilo Wrapped, com top artistas, músicas e álbuns, mês mais intenso, momento favorito, maior sequência, descobertas e gráfico do ano.
  - **Imagem da Cápsula**: botão "Gerar imagem" cria um PNG 1080×1920 do mês, com capas inteiras sem corte e atribuição "Dados do Spotify", para baixar ou compartilhar.
  - **Pulos e aleatório**: a importação do histórico estendido passa a guardar `skipped` e `shuffle` (campos `pulada` e `aleatorio`). IP, país e plataforma continuam ignorados. Reimportar o arquivo preenche as reproduções já existentes.
  - **Gêneros**: não implementado. A API devolve a lista de gêneros dos artistas vazia desde as mudanças de fevereiro.
  - **Cache**: as análises ficam em cache por usuário (6 h, vira no dia seguinte) e são invalidadas a cada coleta, importação ou desconexão. Com ~100 mil reproduções, a primeira consulta leva de 0,5 a 6 s e as seguintes menos de 0,15 s.
- **Correções encontradas no caminho**:
  - Os workers `messenger` (fila async) e `scheduler` rodavam como root e criavam a pasta do cache da aplicação como root, então o PHP-FPM (www-data) não conseguia gravar nenhum item de cache. Os dois passam a rodar como `www-data`, igual aos demais workers.
  - A busca de capas em segundo plano podia tentar gravar a mesma imagem duas vezes (erro 500 por chave duplicada no ranking). As mensagens agora só são enviadas depois de gravar as imagens novas.
- **Arquivos**:
  - Backend: `src/Controller/Spotify/SpotifyAnaliseController.php` (novo), `src/Repository/AnaliseReproducaoSpotifyRepository.php` (novo), `src/DataObject/Spotify/Analise/` (novo), `src/DataObject/Spotify/TocandoAgoraSpotifyDTO.php` (novo), `src/Enum/TipoPeriodoAnaliseSpotify.php` (novo), `src/Service/Spotify/` (`AplicarImagensAnaliseSpotifyService`, `CacheAnaliseSpotifyService`, `CalcularSequenciasSpotifyService`, `ObterDetalheArtistaSpotifyService`, `ObterDetalheMusicaSpotifyService`, `ObterHabitosSpotifyService`, `ObterRecordesSpotifyService`, `ObterEvolucaoMensalSpotifyService`, `ObterDescobertasSpotifyService`, `ObterRetrospectivaAnualSpotifyService`, `ObterTocandoAgoraSpotifyService` novos; `ObterResumoIntervaloPersonalizadoService`, `EnriquecerImagensSpotifyService`, `DeduplicarEImportarHistoricoSpotifyService`, `ColetarHistoricoRecenteSpotifyService`, `DesconectarSpotifyService` alterados), `src/Entity/ReproducaoSpotify.php`, `src/DataObject/Spotify/ItemHistoricoImportadoDTO.php`, `src/DataObject/Spotify/ResumoIntervaloComImagensDTO.php`, `src/Infra/Spotify/LeitorArquivoHistoricoSpotify.php`, `src/Infra/Spotify/SpotifyClient.php`, `src/Interface/SpotifyInterface.php`, `src/Exception/Spotify/SpotifyException.php`, `src/Serializer/SpotifyResumoSerializer.php`, `src/Controller/Spotify/SpotifyController.php`, `migrations/Version20261106230359.php` (novo)
  - Infra: `devops/php/supervisord-prod.conf`
  - Frontend: `web/features/spotify/DetalheArtistaSpotify.tsx` e `DetalheMusicaSpotify.tsx` (novos), `web/features/spotify/components/` (`CartaoTocandoAgora`, `SecaoRecordes`, `SecaoEvolucaoMensal`, `GraficoMensalSpotify`, `SecaoHabitos`, `MapaHorariosSpotify`, `SecaoDescobertas`, `SecaoRetrospectiva`, `ModalImagemCapsula`, `HeroDetalheSpotify`, `PainelEvolucaoDetalhe`, `EstadoDetalheSpotify`, `CapaSpotify`, `CartaoMetricaSpotify`, `CabecalhoSecaoSpotify`, `SeletorPeriodoAnalise` novos; `SecaoHojeSemana`, `ItensRankingSpotify`, `SecaoCapsulaSonora` alterados), `web/features/spotify/hooks/` (`useAnaliseSpotify`, `useTocandoAgoraSpotify`, `useImagensItensSpotify` novos), `web/features/spotify/utils/analiseSpotify.ts` e `imagemCapsula.ts` (novos), `web/features/spotify/api.ts`, `web/features/spotify/types.ts`, `web/features/spotify/Spotify.tsx`, `web/App.tsx`
  - Documentação: `documentation/funcionalidades/SPOTIFY.md`, `documentation/FUNCIONALIDADES_DO_SISTEMA.md`, `documentation/stack/BACKEND.md`, `documentation/stack/FRONTEND.md`

---

### ✅ Melhoria 118 — Importação do Histórico Estendido Funcionando com Arquivos Grandes

- **Status**: Concluído (validado em produção: 100.574 lidos, 100.484 novos, 83 substituídos, 7 ignorados, em 3 min 27 s)
- **Data**: 06 de novembro de 2026
- **Problema** (achado ao testar a importação com o histórico estendido real, 101 mil registros):
  - Nenhum arquivo com mais de 500 reproduções terminava. Depois do primeiro lote o importador limpava o EntityManager e o lote seguinte falhava com "Unable to find Usuario entity identifier".
  - A busca de duplicados montava a janela de horário no fuso de Brasília, mas o horário fica gravado em UTC. A janela ficava 3 h adiantada e deixava escapar reproduções já gravadas, o que gerava erro de chave duplicada.
  - As reproduções lidas do banco também voltavam deslocadas 3 h, então a tolerância de 90 s nunca casava a coleta automática com o arquivo. A sobreposição entre as duas fontes viraria reprodução duplicada.
  - A tolerância valia também dentro da mesma fonte e juntava duas reproduções reais da mesma faixa com menos de 90 s de diferença (1.730 casos no histórico real, 130 deles streams).
  - Quando algo falhava, o EntityManager fechado impedia gravar o motivo, o arquivo era apagado e a nova tentativa mostrava só "arquivo não encontrado".
  - A primeira música de cada coleta automática recebia a duração inteira, porque a reprodução anterior vinha do banco deslocada 3 h.
- **Solução**:
  - Janela de busca e comparação de horários em UTC.
  - Tolerância de horário só entre fontes diferentes (coleta, arquivo básico e arquivo estendido). Na mesma fonte só a chave exata conta como repetida.
  - Ao substituir uma reprodução da coleta pelo arquivo estendido, ela passa a usar o horário e a chave do arquivo, então reimportar não duplica.
  - O usuário é reanexado a cada lote, a importação é buscada de novo antes de concluir e, em caso de erro, o EntityManager é reaberto para gravar o motivo real.
  - A reprodução anterior usada na estimativa de minutos da coleta é lida em UTC.
- **Validação** (ambiente descartável, histórico real + 40 reproduções falsas da coleta sobrepostas):
  - 100.574 registros lidos (335 com 0 ms descartados), 100.527 novos, 7 repetidos exatos ignorados, 40 substituídos. Total final: 100.567, igual ao número de reproduções únicas nos arquivos.
  - Cerca de 4,5 min e 35 MB de memória no worker. Reimportar o mesmo ZIP não cria nada.
- **Análise feita antes da importação**:
  - Os nomes `Streaming_History_Audio_*.json` e `Streaming_History_Video_*.json` já eram aceitos.
  - O artista do arquivo (`master_metadata_album_artist_name`) é o primeiro artista da faixa, igual ao que a coleta grava. Conferido pela API em 50 faixas, 50 iguais. Trocar a coleta para o artista do álbum pioraria os dados ("Various Artists" em coletâneas).
- **Arquivos**:
  - `src/Service/Spotify/DeduplicarEImportarHistoricoSpotifyService.php`
  - `src/Service/Spotify/ProcessarArquivoImportacaoSpotifyService.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`
  - `src/Entity/ReproducaoSpotify.php`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 119 — Tela de Importação do Spotify Presa em "Processando"

- **Status**: Concluído
- **Data**: 06 de novembro de 2026
- **Problema**:
  - A importação terminava no servidor em cerca de 3,5 min, mas a tela continuava em "Processando histórico em segundo plano..." para sempre.
  - Ao receber o status `concluida`, a própria consulta invalidava todas as chaves `['spotify']`, inclusive a dela. O React Query cancelava a requisição em andamento antes de guardar o resultado e disparava outra, que via `concluida` de novo e repetia o ciclo.
  - Cada volta recarregava todas as consultas pesadas do Spotify (cápsulas, rankings e resumo), o que deixava o MySQL acima de 400% de CPU enquanto a tela ficava aberta.
- **Solução**:
  - A invalidação ao concluir ignora a consulta de status da importação. O resultado fica salvo, a tela mostra o resumo e o polling para.
- **Arquivos**:
  - `web/features/spotify/hooks/useImportacaoSpotify.ts`

---

### ✅ Melhoria 120 — Métricas do Spotify Seguindo as Regras do Próprio Spotify

- **Status**: Concluído
- **Data**: 06 de novembro de 2026
- **Problema**:
  - Os minutos do mês não batiam com o app do Spotify. O CirqueiraX fechava o mês no horário de Brasília, e o Spotify fecha em UTC. Em abril, maio e junho de 2026 o sistema mostrava 15.254, 10.540 e 10.776 minutos; o Spotify mostra 15.387, 10.766 e 10.956.
  - Nos rankings, os minutos só somavam as reproduções de 30 s ou mais. O Spotify soma todo o tempo ouvido.
  - Na Cápsula, a "faixa mais repetida no dia" contava também as puladas antes de 30 s.
- **Solução**:
  - Mês e ano em UTC na Cápsula, rankings, evolução mensal, resumo do ano, recordes, descobertas e detalhes de artista e música.
  - Dias dentro desses períodos agrupados em UTC, para a soma dos dias bater com o total do mês.
  - Minutos dos rankings somando todas as reproduções; stream continua contando a partir de 30 s.
  - Hora do dia, dia da semana, "Hoje", "Últimos N dias" e intervalo personalizado continuam no horário de Brasília, porque o Spotify não tem regra para eles.
- **Validação** (ambiente descartável com o histórico estendido real): abril, maio e junho de 2026 ficaram com 15.392, 10.786 e 10.957 minutos. Os 16 endpoints de análise responderam 200.
- **Arquivos**:
  - `src/DataObject/Spotify/PeriodoMesSpotifyDTO.php`
  - `src/DataObject/Spotify/Analise/PeriodoAnaliseSpotifyDTO.php`
  - `src/Repository/AnaliseReproducaoSpotifyRepository.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`
  - `src/Service/Spotify/ObterEvolucaoMensalSpotifyService.php`
  - `src/Service/Spotify/ObterRecordesSpotifyService.php`
  - `src/Service/Spotify/ObterResumoHojeSemanaCuriosidadesService.php`
  - `src/Service/Spotify/ObterResumoIntervaloPersonalizadoService.php`
  - `src/Service/Spotify/ObterRetrospectivaAnualSpotifyService.php`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 121 — Redesign do Tema Escuro e Design System Inspirado no Spotify (Fundo Suave, Cards Matte Profundo, Badges em Pílula e Bordas Sutis)

- **Status**: Concluído
- **Data**: 06 de novembro de 2026
- **Problema**:
  - O sistema apresentava contraste cansativo e desarmônico: fundo em preto absoluto (`#121212`) provocando cansaço visual, enquanto os cards e painéis usavam tons cinza-claros e opacos (`#1F1F1F`, `#252525`).
  - As badges e tags exibiam caixas retangulares duras (`borderRadius="md"`) com fundos sólidos escuros e turvos (tons 900 opacos, como `#4a1410` para vermelho e `#003225` para verde), gerando baixo contraste com o texto e aparência pesada de blocos coloridos.
  - Cards pequenos de mídias (`CardVideo`, `CardAudio`, `CardPrint`, `CardMidiaCentral`, `CardLivroAudio`), modais e formulários usavam raios legados misturados de 16px/24px (`2xl`/`xl`/`lg`/`md`), sem coerência visual.
  - Vários componentes continham cores em hexadecimal (`#000000`, `#FFFFFF`, `#22e368`, etc.) e strings cruas de RGB/RGBA em vez dos tokens do tema do sistema.
- **Solução**:
  - **Calibração de Superfícies com Alto Contraste no Espectro Preto-Cinza**: Fundo geral (`bg.canvas`) calibrado para o tom grafite escuro neutro `#121315` (RGB: 18, 19, 21), profundo e confortável sem qualquer desvio ou tonalidade verde/azulada excessiva; cards e painéis (`bg.panel`) definidos em `#1E2023` (RGB: 30, 32, 35), proporcionando uma separação nítida e marcante de ~6% de luminosidade sobre o canvas; campos de formulários, inputs e estados elevados (`bg.muted`, `cartaoElevado`) definidos em `#272A2E` e estados ativos/hover (`bg.emphasized`) em `#32363C`. Texto principal (`fg.DEFAULT`) calibrado em `#F4F5F6` e texto secundário em `#9CA3AF`.
  - **Eliminação de Caixas Internas Poluídas nos Cards**: Remoção de caixas internas com bordas pesadas e fundos cinzas dentro do corpo dos cards (em especial o bloco de data/horário no `CardVideo`, que criava um aspecto estranho de botão/input no meio da mídia), substituído por linha tipográfica limpa e sutil com ícones e hover refinados.
  - **Bordas Delimitadas e Neutras**: Bordas refinadas e nítidas em branco translúcido neutro: `border.subtle` (`rgba(255, 255, 255, 0.08)`), `border.muted` (`rgba(255, 255, 255, 0.05)`), `border.DEFAULT` (`rgba(255, 255, 255, 0.12)`) e `border.emphasized` (`rgba(255, 255, 255, 0.20)`), eliminando bordas coloridas invasivas e conferindo profundidade discreta e profissional.
  - **Badges e Pílulas Elegantes**: Receita global de `Badge` (`badgeRecipe`) reformulada com `borderRadius="full"`, fundo neutro escuro matte (`bg.muted`), borda sutil (`border.subtle`) e texto/ícones vibrantes na cor da paleta (`colorPalette.fg`). Fim dos blocos coloridos turvos: todas as badges do sistema (plataformas como YouTube, TikTok, status de pipeline, contagens de mídias e tags) agora seguem o padrão clean de cápsulas refinadas.
  - **Padronização Global de Arredondamento (8px e full)**: Varredura completa em 100% dos componentes frontend eliminando todos os raios legados (`2xl`, `xl`, `lg`, `md`, `sm`). Todos os cards, containers, modais, dialogs, inputs e selects padronizados rigorosamente em `borderRadius="8px"`; todos os botões, badges, pílulas, chips de filtro, avatares e seletores padronizados em `borderRadius="full"`.
  - **Eliminação de Hexadecimais e RGBA**: Remoção de todos os códigos hexadecimais brutos e cores RGB soltas nos componentes JSX, substituídos integralmente pelos tokens semânticos e paletas do `theme.ts` (`cirqueira.<escala>.<tom>`, `border.subtle`, `blackAlpha.800`, `bg.panel`).
---

### ✅ Melhoria 122 — Redesign do Dashboard Geral (Cards Individuais Elevados com Ícones, Barra de Ações Rápidas Expandida e Painéis Modernizados)

- **Status**: Concluído
- **Data**: 07 de novembro de 2026
- **Problema**:
  - O Dashboard geral mantinha uma estrutura visual monótona e ultrapassada: o resumo de mídias utilizava um bloco único dividido por linhas de 1px com tipografia em caixa alta e sem ícones representativos.
  - O cabeçalho continha apenas um ponto simples com texto plano, sem integração visual com a linguagem de pílulas do sistema.
  - A barra de ações rápidas continha poucos botões genéricos, sem atalhos para recursos importantes como Downloads MP3, Transcrições e Spotify.
  - Os painéis de seções (Vídeos, Livros, Gráficos, Atividades e Serviços) careciam de ícones nos cabeçalhos e usavam estados vazios muito simples.
- **Solução**:
  - **Cards de Métricas Individuais e Elevados (`CardsResumo`)**: Substituição da grade contínua de 1px por 4 cards individuais independentes com elevação suave (`bg.panel`, `border.subtle`, hover animado em `translateY(-1px)`). Cada métrica agora conta com um ícone dedicado em container colorido suave (Total de Mídias em Brand, Concluídas em Verde, Processamento em Âmbar e Erros em Vermelho), tipografia em hierarquia clara e métricas secundárias contextuais.
  - **Cabeçalho com Pílula de Status Operacional**: Título do Dashboard alinhado a uma pílula refinada de status em tempo real com indicador luminoso verde/vermelho ("Todos os sistemas operacionais"), padronizada em `borderRadius="full"` e `bg="bg.panel"`.
  - **Barra de Ações Rápidas Expandida (`BarraAcoesRapidas`)**: Inclusão de atalhos diretos para Downloads MP3, Transcrições e Spotify, além de Baixar Vídeo, Prints, Upload Manual, Nova Categoria e Sincronização, cada um com ícone temático e microinterações no hover.
  - **Painéis com Ícones e Microinterações nos Cabeçalhos (`PainelDashboard`)**: Suporte a ícones em containers temáticos em todos os cabeçalhos de painéis (Vídeos, Livros, Origem das Mídias, Armazenamento, Ocupação, Atividades e Serviços).
  - **Modernização de Livros em Áudio e Métricas de Vídeos**: Reformulação do estado vazio de escuta em andamento com card dedicado, ícone de fones e botão de ação direta; barras de proporção calibradas em altura expressiva (6px) com cantos arredondados.
- **Arquivos**:
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/dashboard/components/CardsResumo.tsx`
  - `web/features/dashboard/components/BarraAcoesRapidas.tsx`
  - `web/features/dashboard/components/CardsVideosMetricas.tsx`
  - `web/features/dashboard/components/SecaoLivrosDashboard.tsx`
  - `web/features/dashboard/components/PainelDashboard.tsx`
  - `web/features/dashboard/components/GraficosDashboard.tsx`
  - `web/features/dashboard/components/AtividadesRecentes.tsx`
  - `web/features/dashboard/components/StatusIntegracoes.tsx`
  - `documentation/progresso/melhorias/MELHORIAS.md`, `documentation/progresso/melhorias/MELHORIAS_6.md`

---

### ✅ Melhoria 123 — Página para Extrair Texto de Imagens

- **Status**: Concluído
- **Data**: 07 de novembro de 2026
- **Problema**:
  - Para pegar o texto de um print era preciso digitar tudo à mão ou usar um serviço externo.
- **Solução**:
  - Nova página `/extrair-texto`, no menu como **Extrair Texto**. Colar uma imagem com Ctrl+V (ou arrastar, ou escolher um arquivo) lê o texto na hora e já copia para a área de transferência.
  - OCR feito no navegador com `tesseract.js` 7, em português e inglês. Sem backend e sem salvar nada.
  - O leitor é criado uma vez e reaproveitado. Na primeira leitura o navegador baixa os dados do CDN e depois usa o cache.
  - O texto aparece num campo editável ao lado da imagem, com progresso durante a leitura e botão para copiar de novo.
- **Arquivos**:
  - `web/features/extrair-texto/` (página, hooks, componentes e utilitário)
  - `web/App.tsx`, `web/layouts/Sidebar.tsx`, `web/layouts/Header.tsx`
  - `package.json`, `package-lock.json`
  - `documentation/funcionalidades/EXTRAIR_TEXTO.md`, `documentation/funcionalidades/CIRQUEIRAX.md`, `documentation/funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md`

---

### ✅ Melhoria 124 — Top Artistas do Spotify Ordenado por Minutos Ouvidos

- **Status**: Concluído
- **Data**: 07 de novembro de 2026
- **Problema**:
  - No Resumo do ano, o top artistas aparecia fora de ordem: Lana Del Rey, com 47h 59m, ficava em 3º, atrás de Alan Walker, com 37h 48m.
  - A lista era ordenada por streams, mas mostrava só as horas. Artistas com músicas mais curtas somavam mais streams com menos tempo.
  - O Wrapped pessoal do Spotify ordena os artistas pelos minutos ouvidos. As músicas continuam por streams.
- **Solução**:
  - Todos os rankings de artistas passam a ordenar por minutos e, no empate, por streams: cápsula do mês, rankings (hoje, dias, mês, ano, sempre, personalizado), resumo do ano, recordes, hábitos, meses no top 5 e posição geral do artista.
  - Músicas e álbuns continuam ordenados por streams.
- **Arquivos**:
  - `src/Repository/AnaliseReproducaoSpotifyRepository.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`
  - `src/Service/Spotify/ObterRecordesSpotifyService.php`, `src/Service/Spotify/ObterHabitosSpotifyService.php`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 125 — Tempo do Spotify Exibido em Minutos com Horas no Tooltip

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - A página do Spotify mostrava o tempo ouvido em horas (`47h 59m`), enquanto os relatórios do próprio Spotify usam minutos.
- **Solução**:
  - Todo tempo ouvido passa a ser exibido em minutos (`2.879 min`): cápsula, rankings, hoje e últimos dias, curiosidades, recordes, evolução por mês, hábitos, resumo do ano e páginas de detalhe.
  - Ao passar o mouse, um tooltip no visual do Spotify (fundo `cartaoElevado`, texto branco em negrito, cantos de 4px) mostra o valor em horas, por extenso (`47 horas e 59 minutos`). Abaixo de 1 hora não há tooltip.
  - Gráficos mostram minutos no eixo e minutos e horas no tooltip. A imagem PNG da Cápsula também usa minutos.
  - Novos componentes `MinutosSpotify` e `TooltipSpotify`, e formatadores `formatarMinutos` e `formatarMinutosEmHorasExtenso`.
- **Arquivos**:
  - `web/features/spotify/components/MinutosSpotify.tsx` (novo)
  - `web/features/spotify/utils/formatadoresSpotify.ts`, `web/features/spotify/utils/imagemCapsula.ts`
  - `web/features/spotify/components/` (cápsula, rankings, seções e gráficos), `web/features/spotify/DetalheArtistaSpotify.tsx`, `web/features/spotify/DetalheMusicaSpotify.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 126 — Músicas de Artistas e Álbuns no Ranking com Popup da Lista Completa

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - No ranking da primeira seção (músicas, artistas e álbuns), abrir um artista mostrava no máximo 5 músicas, sem como ver o resto. Álbuns não abriam.
  - As músicas do artista ignoravam o período escolhido: em "Hoje", "Últimos N dias", "Ano" e "Personalizado" apareciam os números de sempre (por exemplo, Faded com 85 streams no ranking de hoje). Só "Mês" filtrava.
- **Solução**:
  - Artistas e álbuns abrem com as 5 músicas mais ouvidas no mesmo período do ranking. Se houver mais, o botão **Ver todas as músicas** abre um popup (tela cheia no celular) com a lista completa.
  - O endpoint `GET /api/v1/spotify/artistas/top-musicas` passou a aceitar o mesmo período do ranking (`tipo`, `dias`, `ano`, `mes`, `inicio`, `fim`), filtro por `album` e `limite` (até 500). O período é resolvido pela mesma regra do ranking (`ObterResumoIntervaloPersonalizadoService::resolverIntervalo`).
  - A Cápsula do mês continua mostrando as músicas do mês.
  - Correção (08/11/2026): o popup ocupava a tela inteira na vertical. Agora tem tamanho fixo (`lg`), altura máxima de 75% da tela no computador e 85% no celular, e a lista rola por dentro.
- **Arquivos**:
  - `src/Controller/Spotify/SpotifyController.php`, `src/Service/Spotify/ObterTopMusicasArtistaService.php`, `src/Service/Spotify/ObterResumoIntervaloPersonalizadoService.php`, `src/Repository/ReproducaoSpotifyRepository.php`
  - `web/features/spotify/components/ListaMusicasItemSpotify.tsx` (antes `ListaTopMusicasArtista.tsx`), `web/features/spotify/components/ModalMusicasItemSpotify.tsx` (novo), `web/features/spotify/components/ItensRankingSpotify.tsx`, `web/features/spotify/components/SecaoHojeSemana.tsx`, `web/features/spotify/components/SecaoCapsulaSonora.tsx`
  - `web/features/spotify/api.ts`, `web/features/spotify/hooks/useMusicasItemSpotify.ts` (antes `useTopMusicasArtista.ts`), `web/features/spotify/hooks/chavesQuerySpotify.ts`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 127 — Sincronização do Spotify Mais Rápida e Sem Perder Músicas Atrasadas

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - Músicas ouvidas não apareciam: das 15 da playlist "Hoje" do Spotify, algumas demoravam a entrar e uma (Force) não entrou.
  - A coleta pedia ao Spotify só as músicas depois da última coletada (cursor `after`). Quando o Spotify registra uma música com atraso, com horário anterior a esse cursor, ela era pulada para sempre.
  - A coleta automática rodava só a cada 30 minutos e o reinício do container atrasava ainda mais.
- **Solução**:
  - Cada coleta pede sempre as 50 últimas músicas e deixa a deduplicação descartar as já gravadas.
  - Coleta automática a cada 5 minutos.
  - Com a página aberta, o cartão **Tocando agora** sincroniza sozinho 20 s depois de cada troca de música e atualiza a tela se entrar música nova.
  - O aviso de "Sincronizar agora" mostra quantas músicas novas entraram e explica que o Spotify só informa a música depois que ela termina.
- **Arquivos**:
  - `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `src/Schedule.php`
  - `web/features/spotify/hooks/useSincronizacaoAutomaticaSpotify.ts` (novo), `web/features/spotify/hooks/useSincronizarSpotify.ts`, `web/features/spotify/hooks/index.ts`
  - `web/features/spotify/components/CartaoTocandoAgora.tsx`, `web/features/spotify/components/PainelConexaoSpotify.tsx`, `web/features/spotify/components/EstadoVazioSpotify.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`


---

### ✅ Melhoria 128 — Streams e Minutos Contam para Todos os Artistas da Música

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - Uma música com vários artistas contava só para o artista principal. Play (K-391 com Alan Walker), End of Time e Strongest (Alan Walker Remix) não entravam nos números do Alan Walker.
  - O histórico importado do Spotify só traz o artista principal, então não havia de onde tirar os demais.
  - A M124 passou a ordenar os artistas por minutos com base numa fonte secundária. A metodologia oficial do Spotify ordena por streams.
- **Solução**:
  - Nova tabela `artista_faixa_spotify` com todos os artistas de cada música. A coleta grava os artistas que a API devolve. Uma rotina a cada minuto busca 15 músicas sem artistas em `GET /tracks/{id}` até cobrir todo o histórico (cerca de 14,9 mil músicas). Comando manual: `app:spotify:artistas-faixas --limite=N`.
  - Rankings de artistas, top 5 de artistas, artista do ano, detalhe do artista, meses no top 5, posição geral, artistas novos, redescobertas, concentração nos 5 do topo e curiosidades passam a creditar a música inteira para cada artista. Totais e rankings de músicas não duplicam.
  - Os números antigos foram recalculados: os cálculos são feitos na hora a partir das reproduções, então valem para todo o histórico assim que os artistas de cada música são gravados.
  - Artistas voltam a ser ordenados por streams, com minutos como desempate. Top artistas da Retrospectiva mostram streams e minutos.
  - Correção (09/11/2026): a busca em massa levou um limite de requisições (429) do Spotify com espera longa. O cliente dormia o tempo inteiro e travava também a coleta das músicas recentes por cerca de 1 hora. Agora o cliente só espera até 10 s, a busca pausa pelo tempo exato que o Spotify pede (o primeiro castigo foi de cerca de 22 horas) e vai mais devagar (15 músicas por minuto, 2 s entre chamadas).
- **Arquivos**:
  - `src/Entity/ArtistaFaixaSpotify.php`, `src/Repository/ArtistaFaixaSpotifyRepository.php`, `migrations/Version20261108220436.php` (novos)
  - `src/Service/Spotify/SincronizarArtistasFaixasSpotifyService.php`, `src/Message/SincronizarArtistasFaixasSpotifyMessage.php`, `src/MessageHandler/SincronizarArtistasFaixasSpotifyMessageHandler.php`, `src/Command/SincronizarArtistasFaixasSpotifyCommand.php` (novos)
  - `src/Schedule.php`, `src/Infra/Spotify/SpotifyClient.php`, `src/Exception/Spotify/SpotifyException.php`, `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `src/Repository/AnaliseReproducaoSpotifyRepository.php`, `src/Repository/ReproducaoSpotifyRepository.php`
  - `web/features/spotify/components/SecaoRetrospectiva.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 129 — Transcrição de Vídeos, Limite de 2 GB e Correção do Texto com IA

- **Status**: Concluído
- **Data**: 09 de novembro de 2026
- **Problema**:
  - A tela de transcrições só falava em áudio, e o limite era de 500 MB por arquivo, pouco para vídeos.
  - O texto que sai do reconhecimento de fala vem com falhas (palavras trocadas, nomes errados, pontuação), e não havia como consertar sem editar na mão.
- **Solução**:
  - Vídeos (MP4, MOV, MKV, WEBM, AVI, WMV, M4V...) são aceitos de forma explícita. Antes de transcrever, o worker tira só o áudio do vídeo com `ffmpeg` e apaga o vídeo, para não ocupar até 2 GB por 7 dias.
  - Limite de 2 GB por arquivo em todas as camadas: Nginx do host, Nginx interno, PHP (`upload_max_filesize`, `post_max_size` 2100M, `max_input_time` 3600) e validação. O Whisper pode rodar por até 12 horas.
  - Botão **Corrigir com IA**: manda o texto pronto para a OpenAI (`gpt-5.4-mini`), explicando que é uma transcrição automática de áudio ou vídeo. Roda na fila, em blocos de até 1.500 palavras. O texto corrigido fica numa aba própria, com copiar e `.txt`; o original continua salvo.
  - Chave `OPENAI_API_KEY` e modelo `OPENAI_MODELO_TEXTO` no `.env`.
- **Arquivos**:
  - `src/Entity/Transcricao.php`, `src/Enum/StatusCorrecaoTranscricao.php` (novo), `migrations/Version20261109193657.php` (novo)
  - `src/Interface/ExtratorAudioVideoInterface.php`, `src/Infra/Transcricao/ExtratorAudioFfmpegClient.php`, `src/Interface/CorretorTextoTranscricaoInterface.php`, `src/Infra/OpenAi/OpenAiCorretorTextoClient.php` (novos)
  - `src/Service/Transcricao/SolicitarCorrecaoTranscricaoService.php`, `src/Service/Transcricao/CorrigirTextoTranscricaoService.php`, `src/Message/CorrigirTextoTranscricaoMessage.php`, `src/MessageHandler/CorrigirTextoTranscricaoMessageHandler.php` (novos)
  - `src/Service/Transcricao/TranscreverAudioService.php`, `src/Service/Transcricao/ExpirarAudiosTranscricaoService.php`, `src/Infra/Transcricao/WhisperCppClient.php`, `src/DataObject/Transcricao/EnviarAudioTranscricaoDTO.php`, `src/Exception/Transcricao/TranscricaoException.php`, `src/Controller/Transcricao/TranscricaoController.php`, `src/Serializer/TranscricaoSerializer.php`
  - `config/services.yaml`, `config/packages/messenger.yaml`, `devops/php/php.prod.ini`, `devops/php/php.dev.ini`, `devops/php/nginx-internal.conf`, `devops/nginx/prod.conf`, `devops/nginx/dev.conf`
  - `web/features/transcricoes/components/CorrecaoIaTranscricao.tsx` (novo), `PainelTranscricao.tsx`, `BarraFerramentasTexto.tsx`, `AreaEnvioAudios.tsx`, `CabecalhoTranscricoes.tsx`, `EstadoSemSelecao.tsx`, `api.ts`, `types.ts`, `hooks/useAcoesTranscricao.ts`, `hooks/useTranscricoes.ts`, `utils/arquivos.ts`, `utils/exportacao.ts`
  - `documentation/funcionalidades/TRANSCRICOES.md`, `documentation/funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md`, `documentation/README.md`

---

### ✅ Melhoria 130 — Página de Teste do Player do Spotify

- **Status**: Concluído
- **Data**: 10 de novembro de 2026
- **Problema**:
  - No trabalho, o proxy bloqueia o Spotify. A ideia é ouvir pelo CirqueiraX, mas antes é preciso saber se o player do Spotify consegue tocar nessa rede.
- **Solução**:
  - Página `/spotify/player-teste` com um teste em 4 passos (biblioteca do Spotify, permissão, dispositivo e som), um registro do que aconteceu e um mini player com tocar e pausar.
  - O comando de tocar sai do servidor; só o áudio vem direto do Spotify para o navegador.
  - A conexão com o Spotify passa a pedir as permissões de reprodução. A página tem o botão **Reconectar Spotify**, que volta para o teste.
  - Ajuste (10/11/2026): no primeiro teste no trabalho, o passo 3 parou sem nenhum erro do Spotify. O registro passou a mostrar o suporte a DRM, o pedido e a entrega do token e a resposta do `connect()`. O tempo limite subiu para 40 s e, se falhar, a página testa os endereços do Spotify e mostra quais o proxy bloqueia.
  - Resultado (10/11/2026): na rede do trabalho, a biblioteca (`sdk.scdn.co`) carrega e o navegador tem DRM, mas a API, o `apresolve`, o `dealer`, o `spclient`, a licença DRM e a CDN de áudio do Spotify ficam todos sem resposta ou bloqueados. O player do Spotify não tem como funcionar nessa rede, e não existe forma permitida de fazer o áudio passar pelo servidor do CirqueiraX. Por isso o player completo não foi construído.
- **Arquivos**:
  - `src/Controller/Spotify/PlayerSpotifyController.php`, `src/Service/Spotify/PlayerTesteSpotifyService.php` (novos)
  - `src/Service/Spotify/GerarUrlAutorizacaoSpotifyService.php`, `src/Interface/SpotifyInterface.php`, `src/Infra/Spotify/SpotifyClient.php`, `src/Repository/ReproducaoSpotifyRepository.php`, `src/Exception/Spotify/SpotifyException.php`
  - `web/features/spotify/PlayerTesteSpotify.tsx`, `web/features/spotify/hooks/usePlayerTesteSpotify.ts` (novos), `web/features/spotify/api.ts`, `web/features/spotify/hooks/index.ts`, `web/features/spotify/components/SpotifyCallback.tsx`, `web/App.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### 🟡 Melhoria 131 — Cada Usuário com as Suas Mídias, Categorias e Google Fotos

- **Status**: Publicado, falta validar
- **Data**: 10 de novembro de 2026
- **Problema**:
  - O sistema vai ser usado por mais pessoas, mas a central de mídias, as categorias, as regras de origem, o Google Fotos (uma conta só), o histórico de envios, os tokens de agente e o painel eram compartilhados: qualquer usuário logado via e mexia em tudo.
- **Solução**:
  - Backup completo antes (`/root/backups/cirqueirax/2026-11-10_antes-multiusuario/`, tag `backup-antes-multiusuario-2026-11-10`).
  - Mídias, categorias, regras de origem, conta do Google Fotos, envios e tokens de agente ganharam dono (`usuario_id`). Tudo o que existia foi ligado à conta `gabrielcirqueira711@gmail.com`.
  - Todas as rotas filtram pela conta logada; item de outra pessoa responde 404, inclusive em lote, stream, miniatura, download, edição de imagem e envio forçado ao Google Fotos. Categoria usada numa ação precisa ser da mesma conta.
  - Duplicados são procurados só dentro da conta. O nome da categoria e a origem da regra só precisam ser únicos por conta.
  - Google Fotos: uma conta Google por usuário; envio usa a conta do dono da mídia; status, álbuns, conectar, desconectar e histórico são da conta logada.
  - Print enviado pelo agente entra na conta do dono do token.
  - Arquivos de cada usuário ficam em `<pasta do usuário>/<pasta da categoria>`. A conta principal usa a pasta vazia, então nenhum arquivo mudou de lugar.
  - Painel: números, últimas mídias, categorias, erros e Spotify da conta logada. Sincronização (Syncthing) só para administradores; a conta principal recebeu `ROLE_ADMIN`.
  - Comandos `app:agente:gerar-token`, `app:seed:origem-regras`, `app:google-fotos:autorizar-conta` e `app:google-fotos:limpar-duplicados-franky` pedem `--usuario`.
- **Arquivos**:
  - `migrations/Version20261110151341.php` (novo)
  - `src/Entity/Usuario.php`, `MediaItem.php`, `Categoria.php`, `OrigemRegra.php`, `ContaGoogleFotos.php`, `RegistroEnvioGoogleFotos.php`, `TokenAgente.php`, `src/DataObject/IngestarMediaDTO.php`
  - `src/Repository/MediaItemRepository.php`, `CategoriaRepository.php`, `OrigemRegraRepository.php`, `ContaGoogleFotosRepository.php`, `RegistroEnvioGoogleFotosRepository.php`, `UsuarioRepository.php`
  - `src/Controller/MediaItem/MediaItemController.php`, `EdicaoImagemController.php`, `src/Controller/Categoria/CategoriaController.php`, `src/Controller/OrigemRegra/OrigemRegraController.php`, `src/Controller/GoogleFotos/GoogleFotosController.php`, `EnviosGoogleFotosController.php`, `src/Controller/Dashboard/DashboardController.php`, `src/Controller/Video/DownloadController.php`, `src/Controller/Sync/SyncController.php`
  - `src/Service/MediaItem/*` (MediaItemService, ClassificarMediaItemService, UploadManualService, SalvarEdicaoImagemService, RetentarMediaItemService, RebaixarMediaItemService), `src/Service/Ingestao/*`, `src/Service/Video/BaixarVideoService.php`, `src/Service/Distribuicao/DistribuirLocalService.php`, `src/Service/Categoria/*`, `src/Service/OrigemRegra/OrigemRegraService.php`, `src/Service/GoogleFotos/*`, `src/Service/Dashboard/DashboardService.php`
  - `src/Message/BaixarVideoMessage.php`, `src/MessageHandler/BaixarVideoMessageHandler.php`, `src/MessageHandler/ClassificarMediaMessageHandler.php`
  - `src/Command/GerarTokenAgenteCommand.php`, `SeedOrigemRegrasCommand.php`, `AutorizarContaGoogleFotosCommand.php`, `LimparDuplicadosFrankyCommand.php`
  - `web/features/dashboard/Dashboard.tsx`, `web/features/dashboard/hooks/useDashboard.ts`
  - `documentation/funcionalidades/MULTIUSUARIO.md` (novo), `CATEGORIAS_E_REGRAS.md`, `GOOGLE_FOTOS.md`, `SYNCTHING.md`, `DASHBOARD.md`, `CENTRAL_MIDIAS.md`, `documentation/stack/BACKEND.md`, `documentation/guias/GUIA_SINCRONIZACAO_ECOSSISTEMA.md`, `documentation/README.md`

---

### ✅ Melhoria 132 — Links Curtos `vt.tiktok.com` Aceitos no Download

- **Status**: Concluído
- **Data**: 10 de novembro de 2026
- **Problema**:
  - O link curto de compartilhamento do TikTok `https://vt.tiktok.com/...` era recusado como "URL inválida ou não pertence a uma plataforma suportada". O validador só aceitava `tiktok.com` e `vm.tiktok.com`.
- **Solução**:
  - O validador passou a aceitar qualquer subdomínio de `tiktok.com`. O yt-dlp já resolve o link curto para o vídeo (testado com o link que falhou).
- **Arquivos**:
  - `src/Service/Video/ValidadorUrlPlataforma.php`
  - `documentation/funcionalidades/DOWNLOADS_VIDEOS.md`

---

### 🟡 Melhoria 133 — Busca de Artistas do Spotify pelas Músicas Mais Tocadas e Registro dos Bloqueios

- **Status**: Publicado, falta validar
- **Data**: 10 de novembro de 2026
- **Problema**:
  - A busca dos artistas (M128) ia das músicas mais recentes para as mais antigas, uma a cada 2 s. O Spotify aceita umas 600 consultas e bloqueia o app por horas; no ritmo de 600 a 700 por dia, as 13.377 que faltavam levariam umas 3 semanas, e as 1.538 já feitas eram as mais recentes, não as mais tocadas.
  - A pausa ficava no cache do container: cada deploy apagava a pausa e a busca chamava o Spotify durante o bloqueio (foi o que aconteceu em 10/11 às 13h33).
  - Durante o bloqueio, a coleta das músicas novas também para, e o recently-played só guarda as últimas 50.
- **Solução**:
  - Ordem por streams (30 s ou mais), das mais tocadas para as menos tocadas. Só entram músicas com 3 ou mais streams (3.522 músicas, 88% dos streams; faltavam 2.576). As outras ficam só com o artista principal.
  - Ritmo mais lento para medir se o bloqueio some: uma consulta a cada 6 s, até 9 por minuto.
  - Tabela `bloqueio_spotify`: cada 429 grava o `Retry-After`, a hora de liberação, a origem (coleta ou busca), as consultas feitas desde o bloqueio anterior e o ritmo. A janela de bloqueio fica no banco e vale para a coleta e para a busca, mesmo depois de deploy. O bloqueio em curso (13h33, 24.179 s, libera às 20h17) já foi gravado.
  - Prioridade da coleta: depois de cada bloqueio, a busca de artistas só volta depois de uma coleta bem-sucedida das músicas recentes.
  - A consulta em lote `GET /tracks?ids=` não foi testada: o Spotify a removeu do modo de desenvolvimento.
- **Arquivos**:
  - `src/Entity/BloqueioSpotify.php`, `src/Repository/BloqueioSpotifyRepository.php`, `src/Service/Spotify/ControleLimiteSpotifyService.php`, `migrations/Version20261110172427.php` (novos)
  - `src/Service/Spotify/SincronizarArtistasFaixasSpotifyService.php`, `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `src/Repository/ArtistaFaixaSpotifyRepository.php`, `src/Command/SincronizarArtistasFaixasSpotifyCommand.php`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### 🟡 Melhoria 134 — Página de Teste do Player do YouTube

- **Status**: Publicado, falta validar
- **Data**: 10 de novembro de 2026
- **Problema**:
  - O Spotify não toca na rede do trabalho (M130). Antes de pensar num player próprio usando o YouTube, é preciso saber se o player oficial embutido do YouTube funciona nessa rede.
- **Solução**:
  - Página `/youtube/player-teste`, só no navegador: baixa a biblioteca do player, abre o player (356 × 200) e, ao clicar em **Tocar**, confirma que o tempo do vídeo anda.
  - Campo para colar um link do YouTube ou do YouTube Music e testar se aquela música aceita tocar fora do YouTube; erros 101/150 aparecem traduzidos.
  - Teste dos endereços do YouTube (biblioteca, site, YouTube Music, imagens, `googlevideo.com` e anúncios) para mostrar o que o proxy bloqueia.
- **Arquivos**:
  - `web/features/youtube/PlayerTesteYoutube.tsx`, `web/features/youtube/hooks/usePlayerTesteYoutube.ts` (novos), `web/App.tsx`
  - `documentation/funcionalidades/YOUTUBE_PLAYER.md` (novo), `documentation/README.md`
