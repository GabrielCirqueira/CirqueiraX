# Funcionalidade: Downloads de Vídeos

A tela **Downloads** (`/downloads`) baixa vídeos do **YouTube, TikTok, Instagram e X/Twitter**, extrai os metadados, permite assistir e editar, e encaminha cada vídeo para pasta e álbum pela categoria.

---

## 1. Fluxo do download

O `POST /api/v1/downloads` é **síncrono**: o controller chama `BaixarVideoService::executar` e responde `201` quando o vídeo termina. O axios usa timeout de 300 s nessa rota. Quem dá a sensação de fila é o navegador, que envia um link por vez.

```
[ Usuário cola um ou mais links ] ──► Fila no navegador (um por vez)
                    │
                    ▼
         POST /api/v1/downloads { url, categoriaId? }
                    │
    ├─ 1. ValidadorUrlPlataforma valida a URL
    │
    ├─ 2. buscarPorUrlOriginal: a URL já existe?
    │     └─ Sim: incrementa tentativas_duplicadas, aplica a categoria
    │        informada e devolve o item existente, sem baixar
    │
    ├─ 3. Download para var/downloads/{id}.{ext}
    │
    ├─ 4. ExtrairMetadataVideoService
    │     data e horário = instante do download, em America/Sao_Paulo
    │
    ├─ 5. IngestarMediaService (dedupe e ClassificarMediaMessage)
    │
    ├─ 6. AplicarMetadataArquivoService
    │     ffmpeg -c copy: creation_time, título e artista; depois touch
    │
    └─ 7. Se veio categoria: classifica e distribui
```

`BaixarVideoMessage` e seu handler continuam no código, mas a aplicação não despacha essa mensagem hoje.

### Duplicidade

A dedupe segue esta ordem: SHA-256 → MD5 → hash visual (ffmpeg) → URL original. Veja [GOOGLE_FOTOS.md](GOOGLE_FOTOS.md#5-duplicados).

---

## 2. Extração (`YtDlpClient`)

### Parâmetros gerais

```text
-f bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best
--format-sort res:1080,vcodec:h264
--force-overwrites --no-mtime --write-info-json --no-playlist
```

- **Qualidade:** prioriza até 1080p em H.264, para compatibilidade com celular e Google Fotos.
- **Timeouts:** vídeo 300 s, áudio 900 s e metadados 60 s.
- **Erros permanentes**, como vídeo privado ou removido, não geram novas tentativas.
- **Cookies** ficam em `var/cookies/`: `youtube.txt`, `tiktok.txt`, `instagram.txt` e `x.txt`.

### Por plataforma

| Plataforma | Estratégia |
| :--- | :--- |
| **TikTok** | TikWM primeiro (`hd=1`, 2 tentativas); depois yt-dlp (3 tentativas); depois embed (`/embed/v2/{id}`) e oEmbed |
| **Instagram** | Normaliza a URL, faz 2 tentativas e usa cookies e User-Agent de navegador |
| **X/Twitter** | yt-dlp, com fallback no FxTwitter |
| **YouTube** | Com cookies: `--cookies` e `--remote-components ejs:github`, sem forçar client. Sem cookies: `player_client=android` |

### URLs aceitas

`ValidadorUrlPlataforma` aceita:

- `youtube.com` (`www`, `m`, `music`) e `youtu.be`
- `instagram.com` em `/p/`, `/reel/` e `/tv/`
- `tiktok.com` e `vm.tiktok.com`
- `x.com` e `twitter.com` em `/status/`

---

## 3. Fila de downloads no navegador

Fica em `useFilaDownloadsStore`, com Zustand persistido na chave `cirqueirax-fila-downloads-v2`.

- Aceita vários links, modo lote e **Ctrl+V** global.
- Processa um link por vez.
- Estados dos itens: `pendente`, `baixando` e `erro`. Itens concluídos saem da lista e contam em `concluidosLote`.
- Permite pausar, retomar, retentar um ou todos os erros, remover e limpar erros.
- Link repetido na fila mostra "Esse link já está na fila de downloads."

> **Limitação:** a fila depende da aba aberta. Ao recarregar a página, um item `baixando` volta salvo como `pendente`, mas o processamento não recomeça sozinho. Ele continua ao adicionar outro link ou usar pausar e retomar. O pedido já enviado ao servidor pode terminar mesmo assim.

---

## 4. Listagem

- Ordem: `dataExibicao` decrescente, somente vídeos.
- Paginação de 25, 50 ou 100 itens. O padrão é 50, e a escolha fica salva.
- Modos: **Grade, Compacto, Galeria e Lista**.
- Colunas: 2 a 6 em Grade e Galeria (padrão 5), 1 a 3 em Compacto.
- Filtros: busca, categoria (incluindo com e sem categoria), origem e status.
- Seleção múltipla, com intervalo por `Shift`.

---

## 5. Ações

### Em lote (`BarraAcoesEmLote`)

| Ação | Comportamento |
| :--- | :--- |
| **Distribuir Horários** | Reparte datas com os modos descritos abaixo |
| **Categorizar** | Aplica a categoria e dispara distribuição e envio |
| **Remover categoria** | Veja [CATEGORIAS_E_REGRAS.md](CATEGORIAS_E_REGRAS.md#5-trocar-ou-remover-categoria) |
| **Rebaixar** | Veja [RETENCAO_E_LIMPEZA.md](RETENCAO_E_LIMPEZA.md#4-rebaixar) |
| **Apagar** | Remove registro e arquivo |

### Distribuir horários (`ModalDistribuirHorariosLote`)

| Modo | Comportamento |
| :--- | :--- |
| **Uniforme** | Divide os vídeos entre 08:30 e 22:30 |
| **Retroativo** | Volta no tempo em passos de 120 minutos por padrão |
| **Orgânico / Turnos Reais** | Simula horários naturais ao longo do dia |

Também dá para inverter a ordem e subir ou descer itens.

### Editar metadados (`ModalEditarMetadata`)

Abas: **Geral**, **Data**, **Duração** e **Capa / Thumbnail**. Há atalhos Hoje, Ontem, -7 e -30, ajustes retroativos e horários rápidos.

### Outras ações por vídeo

Assistir em modal, retentar e forçar Google Fotos.

---

## 6. Pastas e sincronização

1. O download vai para `var/downloads/`, volume próprio **fora** da pasta do Syncthing. Portanto, nada é sincronizado antes da triagem.
2. Ao categorizar, `DistribuirLocalService` **copia** o vídeo para `{storage}/{pastaLocal}`, reaplica os metadados e marca `distribuido_local`.
3. O Syncthing detecta o arquivo novo e replica para os dispositivos.
4. O vídeo em `var/downloads/` é limpo depois de 7 dias. Veja [RETENCAO_E_LIMPEZA.md](RETENCAO_E_LIMPEZA.md).
