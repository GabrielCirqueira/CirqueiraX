# YT Music Spotify Skin (v0.10.0)

Deixa o YouTube Music com o layout do Spotify e mantém o vermelho do YouTube.

## Instalar

1. Extraia `ytm-spotify-v0.10.0.zip`.
2. Abra `chrome://extensions` e ligue o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e escolha a pasta extraída.
4. Abra ou recarregue o [music.youtube.com](https://music.youtube.com/). Se o YouTube Music estiver instalado como aplicativo, feche e abra de novo.

Para atualizar uma instalação que já existe, substitua a pasta e clique em **Recarregar** na extensão.

## O que muda

- Superfície escura em cartões, com a sidebar, o conteúdo e o painel direito separados.
- Biblioteca à esquerda: Músicas que gostei, capas, busca, filtros e ordenação. A largura é arrastável.
- Playlist em tabela: número, título com o canal embaixo, álbum e duração. A caixa de seleção aparece no hover e, ao marcar uma faixa, dá para selecionar todas.
- Barra de baixo com a música à esquerda, os controles no centro e volume, painel e player à direita.
- Painel Tocando agora com a capa, os dados da faixa e a fila.
- Cabeçalho da playlist com a cor tirada da capa.
- Início com os cards alinhados na largura útil.

## Atalhos

| Tecla | Ação |
| --- | --- |
| `/` | Buscar |
| `Ctrl` + `↑` `↓` | Volume |
| `Alt` + `P` | Vídeo, letra e comentários |
| `Alt` + `R` | Mostrar ou ocultar Tocando agora |
| `Alt` + `L` | Curtir |
| `Alt` + `F` | Buscar na biblioteca |
| `Alt` + `S` | Trocar a ordenação |

## Arquivos

- `content/theme.css` — visual
- `content/content.js` — sidebar, lista, player e painel
- `content/main-world.js` — dados da página que o content script não alcança
- `background.js` — cor da capa
- `popup/` — janela da extensão
- `fonts/` — Figtree, usada na janela da extensão

A ordem das playlists e as larguras ficam salvas só neste navegador. Nada é enviado para fora do YouTube.
