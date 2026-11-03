# Funcionalidade: Livros em Áudio

A funcionalidade **Livros em Áudio** (`/livros-audio`) permite transformar livros digitais em formato PDF em audiolivros interativos com narração em voz neural (Edge TTS) no idioma detectado do livro: português, inglês, espanhol, francês, italiano ou alemão. O leitor integrado sincroniza o áudio com as páginas do livro, salvando o progresso da leitura para retomada contínua em qualquer dispositivo.

---

## 1. Fluxo de Funcionamento

```
[ Usuário envia PDF ] ──► POST /api/v1/livros-audio
                                   │
                                   ▼
             Cria LivroAudio (processando_texto)
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
             Worker: Edge TTS sintetiza narração neural
             Salva áudio em var/livros/{uuid}/blocos/{numero}.mp3
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
             pronto                                erro
                 │
                 ▼ (quando todos os blocos terminarem)
       LivroAudio vira 'pronto'
```

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
  - Ao excluir um livro via `DELETE /api/v1/livros-audio/{uuid}`, os registros no banco são removidos e todos os arquivos em disco (`original.pdf` e todos os arquivos `.mp3` dos blocos) são apagados fisicamente.
- **Marcador de leitura e retomada:**
  - O sistema mantém o registro de última página lida, bloco de áudio e segundo exato da reprodução (`PUT /api/v1/livros-audio/{uuid}/posicao`).
  - O endpoint conta com rate limiting configurado (60 requisições/minuto) e debounce no frontend para salvar o progresso periodicamente sem sobrecarregar o servidor.

---

## 3. Estados do Domínio

### Estados do Livro (`StatusLivroAudio`)

| Status | Significado |
| :--- | :--- |
| `processando_texto` | Extraindo texto do PDF e particionando em blocos |
| `gerando_audio` | Blocos na fila de síntese vocal assíncrona |
| `pronto` | Todos os blocos de áudio foram gerados com sucesso |
| `erro` | Falha estrutural no PDF ou ausência de texto legível |

### Estados dos Blocos (`StatusLivroAudioBloco`)

| Status | Significado |
| :--- | :--- |
| `pendente` | Na fila assíncrona aguardando o worker |
| `gerando` | Em processo de síntese vocal no TTS |
| `pronto` | Áudio gerado e disponível para stream |
| `erro` | Falha na geração do áudio do bloco específico |

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
     - **Seguir áudio:** a página vira para onde está a frase lida. O `bin/sintetizar-voz.py` (biblioteca `edge_tts`) grava o tempo de cada palavra, agrupadas em frases (`livro_audio_bloco.trechos`). O leitor localiza frase e palavras no texto do PDF e destaca na página, com transição. O botão "Por frase / Por palavra" escolhe o destaque. O player mostra a página e o trecho lido. Partes sem essas marcações usam uma estimativa pelo tempo decorrido.
     - **Folhear livre:** permite folhear páginas do PDF sem interromper a reprodução do áudio atual.
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
| `GET` | `/api/v1/livros-audio/{uuid}/blocos/{numeroBloco}/trechos` | Frases da parte com início e fim em segundos e as palavras de cada uma |
| `GET` | `/api/v1/livros-audio/{uuid}/blocos/{numeroBloco}/stream` | Stream HTTP do bloco de áudio (suporte a cabeçalho `Range`) |
