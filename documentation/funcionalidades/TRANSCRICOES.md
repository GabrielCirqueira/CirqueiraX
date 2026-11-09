# Transcrições de Áudio e Vídeo

A página `/transcricoes` transforma áudios e vídeos em texto. Você envia vários arquivos de uma vez, cada um entra numa fila e o texto aparece na tela enquanto é reconhecido. O texto fica salvo na conta para sempre; o áudio original é apagado 7 dias depois do envio.

---

## 1. Como usar

1. Abra **Transcrições** no menu lateral.
2. Arraste os áudios ou vídeos para a área de envio (ou clique e escolha vários).
3. Escolha o idioma ou deixe em **Detectar idioma**. A escolha fica guardada no navegador.
4. Acompanhe a fila: cada card mostra o status, o percentual e o tempo que falta.
5. Clique num card para abrir o painel com o texto, o player e as ações.
6. Se o texto vier com falhas, clique em **Corrigir com IA**.

Formatos aceitos: qualquer áudio ou vídeo que o `ffmpeg` leia (MP3, M4A, WAV, OGG, OPUS do WhatsApp, AAC, FLAC, AMR, WEBM, MP4, MOV, MKV, AVI, WMV, M4V...). Limite de **2 GB** por arquivo, mesmo que o envio demore. O navegador envia dois arquivos por vez e mostra o progresso de cada envio.

No vídeo, o sistema transcreve o que foi falado. Antes de transcrever, o worker tira só o áudio do vídeo (`ffmpeg -vn`, AAC 96 kbps em `{uuid}-audio.m4a`) e apaga o vídeo, para não guardar arquivos de até 2 GB por 7 dias. O player passa a tocar esse áudio e a transcrição fica marcada com `origemVideo`.

---

## 2. Recursos da página

| Recurso | O que faz |
| :--- | :--- |
| Envio múltiplo | Arrastar e soltar, barra de progresso por arquivo e aviso dos arquivos recusados |
| Acompanhamento ao vivo | Lista e painel se atualizam sozinhos (1,5 a 2 s) enquanto há algo na fila; os trechos aparecem conforme o Whisper reconhece cada bloco de ~30 s de áudio |
| Aviso de conclusão | Toast quando uma transcrição termina ou falha |
| Números da conta | Total de transcrições, horas de áudio transcrito, palavras, tempo de leitura e previsão da fila |
| Busca e filtros | Busca no título, no nome do arquivo e dentro do texto; filtros Todas, Em andamento, Prontas, Favoritas e Com erro |
| Player sincronizado | Enquanto o áudio existe: tocar, voltar/avançar 5 s, velocidade 0,75x a 2x e download do original. O trecho falado fica destacado e a rolagem acompanha o áudio (pode desligar) |
| Trechos clicáveis | Clicar num trecho toca o áudio a partir dele |
| Duas visões do texto | **Trechos** com o tempo de cada frase ou **Texto corrido** em parágrafos (pausas acima de 1,5 s viram novo parágrafo) |
| Procurar no texto | Destaca as ocorrências e mostra quantas são |
| Copiar e exportar | Copiar o texto, baixar `.txt`, `.md` (com tempos), `.srt` e `.vtt` (legendas) |
| Organizar | Renomear o título, favoritar e apagar (pede confirmação) |
| Transcrever de novo | Com o áudio ainda guardado, refaz a transcrição, inclusive em outro idioma |
| Link direto | A transcrição aberta fica na URL (`?transcricao=uuid`) |
| Corrigir com IA | Envia o texto pronto para a OpenAI consertar as falhas do reconhecimento. O resultado aparece na aba **Corrigido com IA**; o texto original e os trechos continuam salvos. Copiar e `.txt` usam o texto da aba aberta |

---

## 3. Motor de transcrição

- **Whisper local** (`whisper.cpp` v1.7.6) com o modelo multilíngue `ggml-small-q5_1` (~190 MB). Nada é enviado para serviços externos e não há custo por minuto.
- O executável é compilado na imagem de produção (`devops/php/Dockerfile.prod`, estágio `whisper-builder`) e fica em `/opt/whisper/`.
- Cada áudio é convertido para WAV 16 kHz mono com `ffmpeg` e transcrito com 4 threads em modo rápido (`-bs 1 -bo 1`).
- O processo do Whisper pode rodar por até 12 horas, e o `redeliver_timeout` da fila `transcricao` é de 14 horas.
- Velocidade medida neste servidor: perto de 1 segundo de processamento por segundo de áudio. A previsão usa `Transcricao::FATOR_TEMPO_PROCESSAMENTO = 1.3`.
- Os trechos parciais são lidos da saída do `whisper-cli` e gravados a cada 1,5 s. O percentual combina os trechos prontos com o tempo decorrido, para a barra andar mesmo entre um bloco e outro.

Configuração (`config/services.yaml`, com padrão para produção):

| Variável | Padrão |
| :--- | :--- |
| `WHISPER_EXECUTAVEL` | `/opt/whisper/whisper-cli` |
| `WHISPER_MODELO` | `/opt/whisper/modelos/ggml-small-q5_1.bin` |
| `WHISPER_THREADS` | `4` |

---

## 4. Correção com IA

- Botão **Corrigir com IA** no painel, para transcrições prontas. A correção roda na fila `async` (`CorrigirTextoTranscricaoMessage` → `CorrigirTextoTranscricaoService`), para textos longos não estourarem o tempo da requisição. O painel se atualiza sozinho enquanto ela roda.
- Cliente: `src/Infra/OpenAi/OpenAiCorretorTextoClient.php` (`CorretorTextoTranscricaoInterface`), API Chat Completions com `reasoning_effort: medium` (testado: acerta mais pontuação, maiúsculas e parágrafos que `low`).
- O texto é dividido em blocos de até 1.500 palavras (por parágrafo, depois por frase, depois por palavra) e cada bloco é corrigido em sequência. A IA recebe a explicação de que o texto é uma transcrição automática de áudio ou vídeo e a regra de não resumir, não traduzir e não acrescentar nada.
- Status (`status_correcao`): `na_fila` → `corrigindo` → `concluida` ou `erro`. Transcrever de novo apaga a correção anterior.
- Campos: `texto_corrigido`, `status_correcao`, `erro_correcao`, `corrigido_em`.

| Variável | Padrão |
| :--- | :--- |
| `OPENAI_API_KEY` | vazio (sem chave, a correção falha com aviso) |
| `OPENAI_MODELO_TEXTO` | `gpt-5.4-mini` |

---

## 5. Fluxo no backend

```
POST /api/v1/transcricoes (multipart: arquivo, idioma)
  └─ EnviarAudioTranscricaoService
       ├─ valida o arquivo (áudio/vídeo, até 2 GB)
       ├─ salva em var/transcricoes/{uuid}.{ext} e mede a duração (ffprobe)
       └─ despacha TranscreverAudioMessage ──► fila "transcricao" (1 worker)
                                                  └─ TranscreverAudioService
                                                       ├─ status transcrevendo
                                                       ├─ vídeo: ExtratorAudioFfmpegClient tira o áudio e apaga o vídeo
                                                       ├─ WhisperCppClient (progresso + trechos parciais)
                                                       └─ concluida | erro
```

Status: `na_fila` → `transcrevendo` → `concluida` ou `erro`. A transcrição só pode ser apagada quando não está no meio da transcrição.

### Rotas (`/api/v1/transcricoes`)

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/transcricoes` | Lista paginada (`busca`, `filtro`, `pagina`, `limite`) |
| `GET` | `/transcricoes/resumo` | Números da conta e previsão da fila |
| `POST` | `/transcricoes` | Envia um áudio (`arquivo`, `idioma`: `auto`, `pt`, `en`, `es`) |
| `GET` | `/transcricoes/{uuid}` | Detalhe com texto e trechos |
| `PATCH` | `/transcricoes/{uuid}` | Renomeia (`titulo`) e favorita (`favorita`) |
| `POST` | `/transcricoes/{uuid}/reprocessar` | Transcreve de novo (`idioma` opcional) |
| `POST` | `/transcricoes/{uuid}/corrigir` | Coloca a correção com IA na fila (só para transcrição pronta, sem outra correção em andamento) |
| `DELETE` | `/transcricoes/{uuid}` | Apaga a transcrição e o áudio |
| `GET` | `/transcricoes/{uuid}/audio` | Reproduz o áudio original (aceita `?token=`) |

### Arquivos principais

- Backend: `src/Controller/Transcricao/TranscricaoController.php`, `src/Service/Transcricao/`, `src/Entity/Transcricao.php`, `src/Repository/TranscricaoRepository.php`, `src/Infra/Transcricao/WhisperCppClient.php`, `src/Infra/Transcricao/LeitorSaidaWhisper.php`, `src/Infra/Transcricao/ExtratorAudioFfmpegClient.php`, `src/Infra/OpenAi/OpenAiCorretorTextoClient.php`, `src/Infra/Storage/ArmazenamentoTranscricaoClient.php`, `src/Serializer/TranscricaoSerializer.php`, `src/Exception/Transcricao/TranscricaoException.php`.
- Frontend: `web/features/transcricoes/`.

---

## 6. Retenção

- O texto, os trechos, o título e os números ficam no banco (tabela `transcricao`) vinculados ao usuário, sem prazo.
- O arquivo de áudio fica no volume `transcricoes_prod` (`var/transcricoes/`) por **7 dias** a partir do envio.
- `ExpirarAudiosTranscricaoMessage` roda **a cada 1 hora**: apaga os áudios vencidos (fora os que ainda estão na fila) e marca `audioExpiradoEm`. Depois disso o player e o "transcrever de novo" somem, e o texto continua disponível.
- A mesma rotina marca como `erro` as transcrições presas em `transcrevendo` há mais de 13 horas (o limite do Whisper é 12 horas, para caber vídeos longos).
- Apagar uma transcrição remove o registro e o áudio na hora.
