# Teste do Player do YouTube

> Página `/youtube/player-teste`. Serve para saber se o player oficial do YouTube toca na rede do trabalho antes de construir um player próprio no CirqueiraX.

---

## Por que existe

No trabalho, o proxy bloqueia o Spotify (M130). A ideia alternativa é ter no CirqueiraX uma tela própria comandando o **player oficial embutido do YouTube** (IFrame Player API). Ele informa o tempo tocado, então daria para registrar minutos reais e a regra dos 30 segundos no relatório do CirqueiraX. Isso **não conta no Spotify**.

## Como funciona

Tudo roda no navegador; o servidor não participa e nada é salvo.

| Passo | O que testa |
|---|---|
| 1. Biblioteca | Baixar `https://www.youtube.com/iframe_api` |
| 2. Player | Abrir o player (356 × 200, o mínimo exigido pelo YouTube é 200 × 200 visíveis) |
| 3. Tocar | Clicar em **Tocar** e ver o tempo do vídeo andar pelo menos 2 s (prova que o áudio/vídeo chega) |

- Sem link, usa o vídeo de exemplo da documentação do YouTube (`M7lc1UVf-VE`).
- Dá para colar o link de uma música do YouTube ou do YouTube Music e clicar em **Tocar este**, para ver se aquela música aceita tocar fora do YouTube.
- Erros do player são traduzidos: 2 (código inválido), 5 (erro HTML5), 100 (não existe/privado), 101 e 150 (o dono não permite tocar fora do YouTube).
- Se algum passo falhar, ou ao clicar em **Testar endereços**, a página testa `iframe_api`, `www.youtube.com`, `music.youtube.com`, `i.ytimg.com`, `redirector.googlevideo.com` (de onde vem o som) e `googleads.g.doubleclick.net`, e mostra quais o proxy bloqueia.

## Resultado no trabalho

10/11/2026, 14h50: os 3 passos passaram. A biblioteca carregou, o player abriu em cerca de 1 s e o vídeo de exemplo tocou, avançou e pausou normalmente. O proxy não bloqueia o player do YouTube. Falta testar músicas reais, por causa do bloqueio de incorporação de algumas gravadoras.

## Limites conhecidos

- O vídeo precisa ficar visível (regra do YouTube): um player só de áudio não é permitido.
- Alguns vídeos de gravadora bloqueiam a incorporação (erro 101/150).
- O player embutido pode mostrar anúncios.

## Arquivos

- `web/features/youtube/PlayerTesteYoutube.tsx`
- `web/features/youtube/hooks/usePlayerTesteYoutube.ts`
- `web/App.tsx` (rota)
