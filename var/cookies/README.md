# Cookies para Download de Vídeos (yt-dlp)

Esta pasta permite fornecer cookies de autenticação para plataformas de vídeo (principalmente o YouTube) que bloqueiam requisições de servidores em nuvem (VPS) com o erro:
`Sign in to confirm you’re not a bot` ou restrições de idade / login obrigatório.

## Como exportar e usar:

1. No seu navegador (Chrome, Edge ou Firefox), instale a extensão:
   - **"Get cookies.txt LOCALLY"** (disponível na Chrome Web Store / Firefox Addons).
2. Acesse o **YouTube** e certifique-se de estar logado (recomenda-se uma conta secundária).
3. Abra a extensão e clique para exportar os cookies do YouTube.
4. Salve o arquivo nesta pasta com um dos nomes aceitos:
   - `youtube.txt`
   - `cookies.txt`
5. O CirqueiraX detectará automaticamente o arquivo e passará `--cookies` para o `yt-dlp`.

## Cookies por plataforma

Cada plataforma usa só o seu arquivo, para que os cookies de uma não vazem para outra:

| Plataforma | Arquivo |
| :--- | :--- |
| YouTube | `youtube.txt` (ou `cookies.txt`) |
| TikTok | `tiktok.txt` |
| Instagram | `instagram.txt` |

O Instagram às vezes recusa posts acessados a partir da VPS ("empty media response"). Se isso virar regra, exporte os cookies do `instagram.com` logado (de preferência numa conta secundária) e salve como `instagram.txt`.

> **Nota:** Arquivos de cookies contêm credenciais de sessão e são ignorados pelo Git (nunca serão comitados).
