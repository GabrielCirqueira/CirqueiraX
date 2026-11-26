# Processamento Assíncrono (Messenger e Scheduler)

O **Symfony Messenger** roda a classificação, a distribuição, o envio ao Google Fotos, o download de áudio, o rebaixar em lote, os livros em áudio, as transcrições, a coleta e a identificação de músicas, a transferência de playlists e as rotinas de limpeza.

Duas operações continuam síncronas: `POST /api/v1/downloads` e o rebaixar individual. Elas rodam dentro da requisição e, depois, entregam o restante do trabalho às filas.

---

## 1. Infraestrutura

- **Transporte:** Doctrine, na tabela `messenger_messages`.
- **Filas:** `async`, `livro_audio`, `spotify_importacao`, `transcricao`, `youtube_coleta`, `youtube_identificacao`, `youtube_importacao`, `transferencia_playlist` e `failed`.
- **Novas tentativas:** `max_retries: 3`, `multiplier: 2`.
- **Roteamento** (`config/packages/messenger.yaml`): livros em áudio → `livro_audio`; importação do Spotify → `spotify_importacao`; transcrição → `transcricao`; YouTube Music → `youtube_coleta`, `youtube_identificacao`, `youtube_importacao`; transferência de playlists → `transferencia_playlist`; o resto (`'App\Message\*'`) → `async`.

### Processos

| Processo | Comando | Instâncias |
| :--- | :--- | :--- |
| `messenger` | `messenger:consume async --time-limit=3600 --memory-limit=128M` | 2 |
| `scheduler` | `messenger:consume scheduler_default --time-limit=3600` | 1 |
| `messenger-livro-audio` | `messenger:consume livro_audio` (256M) | 1 |
| `messenger-spotify-importacao` | `messenger:consume spotify_importacao` (256M) | 1 |
| `messenger-transcricao` | `messenger:consume transcricao` (256M) | 1 |
| `messenger-youtube-coleta` | `messenger:consume youtube_coleta` (128M) | 1 |
| `messenger-youtube-identificacao` | `messenger:consume youtube_identificacao` (192M) | 1 |
| `messenger-youtube-importacao` | `messenger:consume youtube_importacao` (256M) | 1 |
| `messenger-transferencia-playlist` | `messenger:consume transferencia_playlist` (256M) | 1 |

Em produção, comandos de console rodam como `www-data` (`docker exec -u www-data …`); como root, o cache fica sem permissão e o scheduler para.

Configurados em `devops/supervisord.conf` (desenvolvimento) e `devops/php/supervisord-prod.conf` (produção).

---

## 2. Pipeline

```
[ Print, upload, edição ou download ]
                 │
          IngestarMediaService
                 │
       ClassificarMediaMessage
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
Com OrigemRegra         Sem regra: sem_categoria
    │                         │
    │                 Usuário escolhe a categoria
    ▼                         │
ClassificarMediaItemService ◄─┘
    │
    ├──► DistribuirLocalMessage ──► cópia para a pasta da categoria
    └──► EnviarGoogleFotosMessage ──► envio ao álbum
```

---

## 3. Mensagens

| Mensagem | Origem | Ação |
| :--- | :--- | :--- |
| `ClassificarMediaMessage` | Ingestão | Aplica `OrigemRegra` ou marca `sem_categoria` |
| `DistribuirLocalMessage` | Classificação | Copia para `{storage}/{pastaLocal}`, reaplica metadados e marca `distribuido_local` |
| `EnviarGoogleFotosMessage` | Classificação, retentativa, reenvio | Envia ou reaproveita a mídia no álbum |
| `BaixarAudioMessage` | `POST /api/v1/audios` | Gera o MP3 |
| `ProcessarLivroAudioMessage` | Upload e `app:livro-audio:corrigir-voz`, fila `livro_audio` | Divide o livro em blocos e enfileira o áudio de cada um |
| `GerarAudioBlocoMessage` | Processamento de Livro, fila `livro_audio` | Sintetiza voz neural Edge TTS e grava em `var/livros/{uuid}/blocos/{numero}.mp3` |
| `GerarAudioBlocoVozMessage` | Troca de voz, refazer narração, fila de geração (`livro_audio`) | Gera de novo um bloco com outra voz |
| `TranscreverAudioMessage` | `POST /api/v1/transcricoes` e reprocessar | Transcreve com whisper.cpp na fila `transcricao` (1 worker), gravando progresso e trechos parciais |
| `CorrigirTextoTranscricaoMessage` | Pedido de correção da transcrição | Corrige o texto da transcrição com IA, em blocos |
| `ExpirarAudiosTranscricaoMessage` | Scheduler (1 hora) | Apaga áudios de transcrição com mais de 7 dias e encerra transcrições presas |
| `SincronizarHistoricoSpotifyMessage` | Scheduler (10 min) | Coleta as últimas 50 faixas de cada conta via API do Spotify. Ritmo e cota em [LIMITE_SPOTIFY.md](../funcionalidades/LIMITE_SPOTIFY.md) |
| `VincularSpotifyAoCatalogoMessage` | Coleta e importação do Spotify | Liga as faixas novas ao catálogo e refaz a projeção das reproduções do período |
| `ImportarHistoricoSpotifyMessage` | Upload de arquivo | Processa assincronamente arquivo ZIP ou JSON de histórico do Spotify |
| `BuscarImagemSpotifyMessage` | Visualização / enriquecimento | Busca capa ou foto de artista na API do Spotify em segundo plano |
| `ColetarHistoricoYoutubeMusicMessage` | Scheduler (30 s), fila `youtube_coleta` (1 worker) | Consulta o histórico das contas do YouTube Music com consulta vencida (30 s com novidade, 120 s parado), grava as reproduções novas e atualiza o tempo da que está tocando. Ver [YOUTUBE_MUSIC.md](../funcionalidades/YOUTUBE_MUSIC.md) |
| `IdentificarVideosYoutubeMessage` | Scheduler (1 min), fila `youtube_identificacao` | Identifica com IA os vídeos ainda sem classificação |
| `AtualizarDetalhesVideosYoutubeMessage` | Scheduler (1 hora) | Atualiza duração, canal e disponibilidade pela YouTube Data API |
| `ImportarHistoricoYoutubeMessage` | Upload do Takeout | Lê o histórico de exibição do Google Takeout |
| `BuscarFotoArtistaMessage` | Detalhe do artista e comando | Busca a foto do artista sem Spotify pelo YouTube Music |
| `SincronizarArtistasFaixasSpotifyMessage` | Scheduler (1 min) | Busca os artistas de até 9 faixas por rodada, respeitando o teto de 300 consultas em 24 h |
| `CasarFaixasTransferenciaMessage` | Início da transferência e comandos de reprocessar, fila `transferencia_playlist` | Casa cada faixa da playlist de origem com o outro serviço |
| `ExecutarTransferenciaPlaylistMessage` | Confirmação da prévia, fila `transferencia_playlist` | Cria a playlist e adiciona as faixas no destino |
| `SincronizarVinculoPlaylistMessage` | Sincronizar vínculo, fila `transferencia_playlist` | Leva as faixas novas de uma playlist vinculada para a outra |
| `RebaixarMediaItemMessage` | Rebaixar em lote | Baixa de novo um vídeo |
| `LimparVideosAntigosMessage` | Scheduler | Remove vídeos com mais de 7 dias |
| `ExpirarAudiosAntigosMessage` | Scheduler | Expira MP3 e encerra áudios presos |
| `BaixarVideoMessage` | Nenhuma no momento | Tem handler, mas a aplicação não a despacha |

---

## 4. Agendamento

`src/Schedule.php` registra as rotinas:

```php
RecurringMessage::every('10 minutes', new SincronizarHistoricoSpotifyMessage()),
RecurringMessage::every('1 minute', new SincronizarArtistasFaixasSpotifyMessage()),
RecurringMessage::every('30 seconds', new RedispatchMessage(new ColetarHistoricoYoutubeMusicMessage(), 'youtube_coleta')),
RecurringMessage::every('1 minute', new RedispatchMessage(new IdentificarVideosYoutubeMessage(), 'youtube_identificacao')),
RecurringMessage::every('1 hour', new RedispatchMessage(new AtualizarDetalhesVideosYoutubeMessage(), 'async')),
RecurringMessage::every('1 day', new LimparVideosAntigosMessage(7)),
RecurringMessage::every('1 day', new ExpirarAudiosAntigosMessage()),
RecurringMessage::every('1 hour', new ExpirarAudiosTranscricaoMessage()),
```

O schedule é `stateful` e usa `processOnlyLastMissedRun(true)`. Veja [RETENCAO_E_LIMPEZA.md](../funcionalidades/RETENCAO_E_LIMPEZA.md).

---

## 5. Falhas

1. O Messenger tenta de novo até 3 vezes, com espera crescente.
2. Mensagens esgotadas vão para a fila `failed`.
3. O motivo da falha fica em `erroMotivo` e o item vai para `erro`.
4. A interface permite retentar por `POST /api/v1/media-itens/{uuid}/retentar`, `POST /api/v1/media-itens/retentar` ou `POST /api/v1/dashboard/erros/retentar`.

A retentativa decide o próximo passo pela categoria:

- **Com categoria:** volta para `classificado` e dispara distribuição e envio.
- **Sem categoria:** volta para `recebido` e passa pela classificação.

---

## 6. Comandos

```bash
# Consumir manualmente
docker exec -it cirqueirax_symfony php bin/console messenger:consume async -vv

# Ver mensagens com falha
docker exec -it cirqueirax_symfony php bin/console messenger:failed:show

# Reprocessar todas
docker exec -it cirqueirax_symfony php bin/console messenger:failed:retry --force

# Remover uma mensagem da fila de falhas
docker exec -it cirqueirax_symfony php bin/console messenger:failed:remove <id>
```

Em produção, use o container `cirqueirax_symfony_prod`.
