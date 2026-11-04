# Funcionalidade: Livros em Áudio

A funcionalidade **Livros em Áudio** (`/livros-audio`) permite transformar livros digitais em formato PDF em audiolivros interativos com narração em voz neural (Edge TTS) no idioma detectado do livro: português, inglês, espanhol, francês, italiano ou alemão. O leitor integrado sincroniza o áudio com as páginas do livro, salvando o progresso da leitura para retomada contínua em qualquer dispositivo.

---

## 1. Fluxo de Funcionamento

```
[ Usuário envia PDF ] ──► POST /api/v1/livros-audio
                                   │
                                   ▼
             Cria LivroAudio (enviado → extraindo)
             Salva arquivo original em var/livros/{uuid}/original.pdf
                                   │
                                   ▼
          Extração de texto por página (pdftotext / Ghostscript)
          e divisão inteligente em blocos sem quebrar frases
                                   │
                                   ▼
        Criação dos blocos LivroAudioBloco (pendente)
        Atualiza LivroAudio para gerando_audio
                                   │
                                   ▼ (para cada bloco)
                   GerarAudioBlocoMessage (async)
                                   │
                                   ▼
             Worker (fila livro_audio): bin/sintetizar-voz.py
             grava o mp3 e o tempo de cada palavra
             Salva áudio em var/livros/{uuid}/blocos/bloco_{n}.mp3
             e as frases com palavras em livro_audio_bloco.trechos
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
             pronto                                erro
                 │
                 ▼ (quando todos os blocos terminarem)
       LivroAudio vira 'pronto' (ou 'parcial' se algum bloco falhou)
```

### Vozes adicionais

```
[ Usuário escolhe outra voz ] ──► POST /api/v1/livros-audio/{uuid}/vozes
                                   │
                                   ▼
        Cria um LivroAudioBlocoVoz (pendente) por bloco
                                   │
                                   ▼ (para cada bloco)
               GerarAudioBlocoVozMessage (fila livro_audio)
                                   │
                                   ▼
        Salva em var/livros/{uuid}/blocos/vozes/{voz}/bloco_{n}.mp3
        e as frases com palavras em livro_audio_bloco_voz.trechos
```

A voz usada no upload é a **principal** e fica em `livro_audio_bloco`. As outras ficam em `livro_audio_bloco_voz`, uma linha por bloco e voz.

### Sincronização com o PDF

1. `bin/sintetizar-voz.py` usa a biblioteca `edge_tts` com `boundary="WordBoundary"` e devolve cada palavra com início e fim em segundos.
2. `AgrupadorPalavrasNarracao` junta as palavras em frases a partir do texto enviado ao TTS.
3. No navegador, `utils/localizacaoNarracao.ts` alinha as palavras da parte inteira com as palavras do PDF (pdf.js), por programação dinâmica ponderada pelo tamanho de cada palavra. Uma frase repetida mais à frente não desvia o resto.
4. Uma segunda passada procura frases que ficaram incompletas (por exemplo, resumos em duas colunas) entre as páginas das frases vizinhas.
5. `utils/pdf.ts` mede cada palavra com a fonte do próprio PDF, para o destaque não cortar letras.

---

## 2. Regras de Negócio

- **Dono do livro:** cada `LivroAudio` pertence exclusivamente ao usuário autenticado (`Usuario`). Nenhum usuário acessa ou reproduz livros de outro.
- **Formato aceito:** arquivos PDF (`application/pdf`) de até 100 MB.
- **Extração e divisão em blocos:**
  - O livro é dividido em blocos de páginas/palavras para viabilizar streaming rápido e permitir que o usuário comece a ouvir os primeiros blocos antes mesmo do término da geração dos demais.
  - O particionamento respeita pontuações e limites de parágrafos/frases, evitando cortes abruptos na narração.
- **PDF sem texto (OCR/Scan puro):**
  - Se o PDF consistir apenas em imagens sem camada de texto extraível, o processo é marcado com erro claro informando que o documento não contém texto legível.
- **Falhas e retentativas:**
  - Blocos com falha temporária de rede ou indisponibilidade do TTS entram no mecanismo de retentativas do Messenger (até 3 tentativas).
  - Persistindo a falha, o bloco fica com status `erro` e armazena o motivo detalhado em `erroMotivo`.
- **Exclusão completa (Cascata):**
  - Ao excluir um livro via `DELETE /api/v1/livros-audio/{uuid}`, os registros no banco são removidos (blocos e vozes em cascata) e a pasta `var/livros/{uuid}/` inteira é apagada, incluindo o PDF, os blocos e os áudios de todas as vozes.
  - Ao remover uma voz adicional, só a pasta `blocos/vozes/{voz}/` e as linhas dessa voz são apagadas. A voz principal não pode ser removida.
- **Vozes:**
  - As vozes disponíveis vêm do enum `VozNarracao` e dependem do idioma do livro: livros em português mostram todas, os de outros idiomas só as vozes Multilingual (Thalita, Andrew, Brian, Ava e Emma).
  - Se o livro foi apagado ou a voz removida durante a geração, o worker cancela o bloco.
  - Amostras de voz são geradas na primeira vez que alguém ouve e ficam em `var/livros/amostras/{voz}.mp3`, compartilhadas entre livros.
  - Partes que ainda não foram geradas na voz escolhida tocam na voz principal.
- **Marcador de leitura e retomada:**
  - O sistema mantém o registro de última página lida, bloco de áudio e segundo exato da reprodução (`PUT /api/v1/livros-audio/{uuid}/posicao`).
  - O endpoint conta com rate limiting configurado (60 requisições/minuto) e debounce no frontend para salvar o progresso periodicamente sem sobrecarregar o servidor.

---

## 3. Estados do Domínio

### Estados do Livro (`StatusLivroAudio`)

| Status | Significado |
| :--- | :--- |
| `enviado` | PDF recebido, aguardando extração |
| `extraindo` | Extraindo texto do PDF e particionando em blocos |
| `gerando_audio` | Blocos na fila de síntese vocal assíncrona |
| `parcial` | Terminou, mas algum bloco ficou com erro |
| `pronto` | Todos os blocos de áudio foram gerados com sucesso |
| `erro` | Falha estrutural no PDF ou ausência de texto legível |

### Estados dos Blocos (`StatusLivroAudioBloco`)

| Status | Significado |
| :--- | :--- |
| `pendente` | Na fila assíncrona aguardando o worker |
| `gerando` | Em processo de síntese vocal no TTS |
| `pronto` | Áudio gerado e disponível para stream |
| `erro` | Falha na geração do áudio do bloco específico |

Os blocos de vozes adicionais (`LivroAudioBlocoVoz`) usam os mesmos status.

### Estados de uma voz (calculados em `GerenciarVozesLivroAudioService`)

| Status | Significado |
| :--- | :--- |
| `nao_gerada` | Nenhum bloco pedido nessa voz |
| `gerando` | Há blocos pendentes ou em geração |
| `parcial` | Terminou com parte dos blocos com erro |
| `pronta` | Todos os blocos prontos |
| `erro` | Todos os blocos falharam |

### Vozes (`VozNarracao`)

| Voz | Identificador | Idioma |
| :--- | :--- | :--- |
| Antonio | `pt-BR-AntonioNeural` | Português (Brasil) |
| Francisca | `pt-BR-FranciscaNeural` | Português (Brasil) |
| Thalita | `pt-BR-ThalitaMultilingualNeural` | Português (Brasil), multilíngue |
| Duarte | `pt-PT-DuarteNeural` | Português (Portugal) |
| Raquel | `pt-PT-RaquelNeural` | Português (Portugal) |
| Andrew | `en-US-AndrewMultilingualNeural` | Multilíngue |
| Brian | `en-US-BrianMultilingualNeural` | Multilíngue |
| Ava | `en-US-AvaMultilingualNeural` | Multilíngue |
| Emma | `en-US-EmmaMultilingualNeural` | Multilíngue |

---

## 4. Interface (Frontend)

O módulo é composto por duas páginas principais em `web/features/livros-audio/`:

1. **Biblioteca de Livros (`/livros-audio`):**
   - Grade de livros com capa gerada a partir da primeira página do PDF.
   - Indicador de progresso de áudio (blocos concluídos vs pendentes) e barra de progresso da última leitura.
   - Modal de upload com suporte a arrastar-e-soltar, seleção de arquivo e validação de tamanho.
   - Ação de exclusão com confirmação.

2. **Leitor & Player Imersivo (`/livros-audio/:uuid`):**
   - **Visualizador PDF:** renderização página a página com suporte a zoom, paginação direta e atalhos de teclado (Setas Esquerda/Direita).
   - **Player de Áudio Fixo:**
     - Controles de reprodução: Play/Pause, barra de busca interativa e botões de pular -15s / +15s.
     - Velocidades de áudio ajustáveis: `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`.
     - Menu de capítulos/blocos com indicação visual de status (pronto, gerando, erro).
     - Integração com **Media Session API** para controle de áudio na tela de bloqueio e central de mídia do celular ou desktop.
   - **Sincronização Bidirecional:**
     - **Seguir áudio:** a página vira para onde está a frase lida, que fica destacada no PDF com transição suave. Se você abrir outra página e der play, o áudio começa na primeira frase da página aberta (no modo livro, a da esquerda).
     - **Por frase / Por palavra:** o botão no player escolhe se o destaque acompanha a frase inteira ou cada palavra (com a frase num tom mais claro). A escolha fica salva no navegador.
     - **Vozes:** o botão com o nome da voz abre o painel `PainelVozes` para ouvir amostras, gerar o livro em outra voz e trocar na hora. A troca continua da mesma frase. A voz escolhida fica salva no navegador, por livro.
     - O player mostra a página e o trecho lido. Partes sem tempo por palavra (geradas antes da M106) usam uma estimativa pelo tempo decorrido.
     - **Folhear livre:** permite folhear páginas do PDF sem interromper a reprodução do áudio atual. O play continua de onde parou.
     - Navegação por clique na página do PDF pula a reprodução para o bloco correspondente.

---

## 5. API Backend

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/livros-audio` | Lista os livros do usuário logado |
| `POST` | `/api/v1/livros-audio` | Upload de arquivo PDF de livro |
| `GET` | `/api/v1/livros-audio/{uuid}` | Detalhes do livro com posição e progresso |
| `GET` | `/api/v1/livros-audio/{uuid}/blocos` | Lista todos os blocos e capítulos de áudio |
| `PUT` | `/api/v1/livros-audio/{uuid}/posicao` | Atualiza o marcador de leitura (página/bloco/segundos) |
| `DELETE` | `/api/v1/livros-audio/{uuid}` | Apaga o livro, metadados e arquivos de áudio |
| `GET` | `/api/v1/livros-audio/{uuid}/pdf` | Serve o arquivo PDF original |
| `GET` | `/api/v1/livros-audio/{uuid}/blocos/{numeroBloco}/trechos` | Frases da parte com início e fim em segundos e as palavras de cada uma (`?voz=` para outra voz) |
| `GET` | `/api/v1/livros-audio/{uuid}/vozes` | Vozes do livro com status e partes prontas |
| `POST` | `/api/v1/livros-audio/{uuid}/vozes` | Gera o áudio do livro em outra voz (`{"voz": "pt-BR-FranciscaNeural"}`) |
| `DELETE` | `/api/v1/livros-audio/{uuid}/vozes/{voz}` | Apaga o áudio de uma voz adicional |
| `GET` | `/api/v1/livros-audio/vozes/{voz}/amostra` | Amostra curta da voz |
| `GET` | `/api/v1/livros-audio/{uuid}/blocos/{numeroBloco}/stream` | Stream HTTP do bloco de áudio (suporte a cabeçalho `Range`; `?voz=` para outra voz) |
