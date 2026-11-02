# Funcionalidade: Downloads MP3

A tela **Downloads MP3** (`/downloads-mp3`) baixa o áudio de um link em MP3 com capa e metadados. Foi criada nas melhorias M92 e M93 e é independente do pipeline de mídias: áudios não têm categoria, não vão para o Syncthing nem para o Google Fotos.

---

## 1. Fluxo

```
[ Usuário cola o link ] ──► POST /api/v1/audios
                                  │
                                  ▼
             Cria Audio (pendente) ligado ao usuário
                                  │
                                  ▼
                    BaixarAudioMessage (async)
                                  │
                                  ▼
              Worker: yt-dlp ──► MP3 com capa e metadados
                                  │
                ┌─────────────────┴─────────────────┐
                ▼                                   ▼
       disponivel (var/audios/{uuid}.mp3)        erro (com motivo)
                │
                ▼ 7 dias depois
            expirado
```

Ao contrário do download de vídeo, o pedido responde na hora: o trabalho pesado fica com o worker, e a tela acompanha o estado por polling a cada 2,5 segundos enquanto houver item em andamento.

---

## 2. Regras de negócio

- **Dono do áudio:** cada `Audio` pertence ao usuário que pediu.
- **Qualidade:** MP3 na qualidade máxima do conversor (`--audio-quality 0`), com título, autor e capa.
- **TikTok e X:** quando a extração direta do áudio não funciona, o sistema baixa o vídeo e extrai o áudio com ffmpeg.
- **Retenção:** `Audio::DIAS_RETENCAO_ARQUIVO = 7`, contados de `baixadoEm`. O agendador remove o arquivo uma vez por dia e marca o áudio como `expirado`.
- **Downloads presos:** itens parados em andamento por mais de 1 hora viram `erro`, na mesma rotina diária.
- **Rebaixar:** itens rebaixáveis podem ser baixados de novo pelo mesmo registro.

### Estados (`StatusAudio`)

| Status | Significado |
| :--- | :--- |
| `pendente` | Aguardando o worker |
| `baixando` | Em processamento |
| `disponivel` | Arquivo pronto para tocar e baixar |
| `erro` | Falhou; o motivo fica em `erroMotivo` |
| `expirado` | Arquivo removido após 7 dias |

---

## 3. Interface

- Campo **Colar e baixar** e **Ctrl+V** global na página.
- Grade de capas com 1 a 6 colunas.
- Player fixo **Tocando agora**.
- Barra que mostra o tempo restante até a expiração.
- Ações de baixar, rebaixar e apagar.

Código em `web/features/downloads-audio/`. Stream e arquivo usam JWT na query string (`?token=`), porque o elemento `<audio>` não envia cabeçalho `Authorization`.

---

## 4. API

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/audios` | Lista os áudios |
| `POST` | `/api/v1/audios` | Pede um novo áudio |
| `POST` | `/api/v1/audios/{uuid}/rebaixar` | Baixa de novo |
| `DELETE` | `/api/v1/audios/{uuid}` | Apaga registro e arquivo |
| `GET` | `/api/v1/audios/{uuid}/arquivo` | Baixa o MP3 |
| `GET` | `/api/v1/audios/{uuid}/stream` | Reproduz o MP3 |

---

## 5. Armazenamento

Os arquivos ficam em `var/audios/{uuid}.mp3`, no volume `audios_prod` em produção. Esse volume não é sincronizado pelo Syncthing.
