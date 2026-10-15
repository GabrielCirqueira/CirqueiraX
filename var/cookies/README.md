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

> **Nota:** Arquivos de cookies contêm credenciais de sessão e são ignorados pelo Git (nunca serão comitados).
