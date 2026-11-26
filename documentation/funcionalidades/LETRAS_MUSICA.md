# Letras de Música com Pronúncia (aba Tocando agora)

> Parte da página **Inglês & Pronúncia** ([PRONUNCIA.md](PRONUNCIA.md)). Criada em M221, com ritmo ajustado em M222/M224 e YouTube Music em M225.

A aba **Tocando agora** mostra a música que a pessoa está ouvindo, com a letra acompanhando o tempo e a pronúncia embaixo de cada linha. A tradução aparece só quando pedida.

```
▶  The club isn't the best place to find a lover
   de clabi izanti de besti pleis tu faindi a laver
   (tradução, quando ligada)
```

---

## 1. Como usar

- Dê play numa música no **Spotify** (conta conectada em `/musica`) ou no **YouTube Music** aberto no computador com a extensão do CirqueiraX.
- A linha atual acende e fica no centro. Rolar com o mouse ou o dedo pausa o acompanhamento por 5 s; **Voltar para a linha atual** retoma.
- Clicar numa linha abre **Ouvir linha**, **Devagar** e o palavra por palavra.
- **Mostrar**: liga e desliga a pronúncia e a tradução. A primeira vez que a tradução é ligada, a letra é traduzida e fica salva.
- **Pronúncia**: Simples, Clara ou Fala natural (o mesmo modo do tradutor; ver [MOTOR_PRONUNCIA.md](MOTOR_PRONUNCIA.md)).
- **Letra fora do tempo?** adianta ou atrasa de meio em meio segundo, até 10 s.
- O cartão mostra de onde veio a música (selo **Spotify** ou **YouTube Music**) e o link para abri-la lá.

As escolhas ficam no navegador: `pronuncia:musica:pronuncia`, `pronuncia:musica:traducao` e `pronuncia:musica:ajuste`.

---

## 2. De onde vem a música

```
PainelMusicaTocando
  │
  ├─ extensão do YouTube Music mandou algo há menos de 15 s?
  │     sim → MusicaDoYoutube ── não consulta o Spotify
  │     não → MusicaDoSpotify ── consulta o Spotify no ritmo do servidor
  │
  └─ os dois viram o mesmo formato (TocandoAgoraPronuncia) → LetraDaMusica
```

### YouTube Music (com a extensão)

Só no computador onde o YouTube Music está aberto com a extensão do CirqueiraX (1.6+). Não gasta cota de nenhum serviço.

1. A extensão publica a cada 2 s, e na hora em toda troca, pausa ou avanço, o estado do player: vídeo, título, canal, capa, duração, posição e se está tocando (`ponte.js` → `utils/tempoRealExtensao.ts` em `web/features/youtube-music/`).
2. `useStatusYoutubeMusic` busca no servidor o mesmo vídeo já identificado no catálogo, quando houver.
3. `mesclarTocandoAgora` junta os dois: a posição vem da extensão; título, artistas e álbum vêm do catálogo se o vídeo já foi identificado.
4. `tocandoDoYoutube` (`web/features/pronuncia/utils/musicaYoutube.ts`) converte para o formato da aba, com `codigoFaixa = yt:{videoId}`. Sem identificação no catálogo, limpa o canal (" - Topic", "VEVO", " Official") e tira o "Artista - " do começo do título.

Pausado por mais de 15 s, a extensão para de publicar e a aba volta para o Spotify. No celular, na TV ou sem a extensão, o YouTube Music não aparece aqui: o histórico da conta não diz em que ponto a música está.

### Spotify

1. O navegador chama `GET /api/v1/pronuncia/musica/tocando-agora`.
2. `ObterTocandoAgoraPronunciaService` reaproveita `ObterTocandoAgoraSpotifyService`, que guarda o resultado por 4 s por usuário (dividido com o painel de `/musica`) e respeita o bloqueio do Spotify.
3. A resposta traz `proximaConsultaMs`: 5 s com folga, 15 s sem folga (regras em [LIMITE_SPOTIFY.md](LIMITE_SPOTIFY.md)). Parado, 20 s. Também consulta logo após o fim da faixa, ao voltar para a aba e pelo botão de atualizar. Nada em segundo plano.
4. Entre consultas, o tempo é contado no navegador (`posicaoAtualMs`). A posição devolvida vale para o meio da requisição (quando o servidor falou com o Spotify), não para a chegada da resposta, para não começar atrasada pelo tempo de rede.

### Acompanhamento da linha

- A linha ativa é recalculada a cada 100 ms (`LetraSincronizada`).
- Ela acende `ANTECIPACAO_LINHA_MS = 400` ms antes do tempo da letra, para dar tempo de ler antes de a voz começar, como nos apps de letra. O ajuste manual (**Letra fora do tempo?**) soma em cima disso.
- O destaque da linha nova leva 0,12 s.

---

## 3. Busca da letra

`GET /api/v1/pronuncia/musica/letra` com `codigoFaixa`, `titulo`, `artista`, `album` e `duracaoMs`.

```
ObterLetraMusicaPronunciaService
  ├─ já existe letra_musica_pronuncia com esse codigoFaixa?
  │     não → busca no LRCLIB e salva
  │     sim, não achada e (passaram 3 dias ou chegou outro título/artista) → busca de novo
  └─ pronuncia todas as linhas na hora (GerarAnalisePronunciaService::executarLinhas)
```

**LRCLIB** ([lrclib.net](https://lrclib.net), sem chave, `LrclibClient`):

1. `/api/get` com música, artista, álbum e duração exatos.
2. Se não achar, `/api/search` com o título sem sufixos (`NormalizadorTituloMusica`: " - Remastered 2011", "(feat. …)", "(Official Video)", "[Lyric Video]"…) e duração com até 4 s de diferença. Sem duração (alguns vídeos), qualquer duração serve.
3. Prefere a letra sincronizada (LRC); senão usa a simples.

`LeitorLetraMusica` lê o LRC: várias marcações por linha, metadados ignorados, pausas repetidas removidas, até 400 linhas.

**Situações** (`SituacaoLetraMusica`):

| Situação | Tela |
| :--- | :--- |
| `sincronizada` | Letra acompanhando o tempo e ajuste de sincronia |
| `simples` | Letra inteira com o aviso "não acompanha a música sozinha" |
| `instrumental` | "Música instrumental" |
| `nao_encontrada` | "Não achei a letra"; procura de novo em 3 dias ou quando o nome mudar |

**Por que buscar de novo quando o nome muda:** no YouTube Music o primeiro pedido pode sair com o título do vídeo, antes de o sistema identificar a música. Quando o nome certo chega, a letra não achada é procurada de novo na hora. No navegador, a chave da consulta inclui título e artista (`PRONUNCIA_QUERY_KEYS.letra`), então a troca de nome dispara a nova busca.

A pronúncia **não é salva**: é gerada a cada pedido, então correções aprovadas valem na hora.

---

## 4. Tradução da letra

`POST /api/v1/pronuncia/musica/letra/{uuid}/traducao` (`TraduzirLetraMusicaService`):

- só roda quando o usuário liga **Tradução** pela primeira vez naquela letra;
- manda ao DeepL só as linhas distintas e não vazias, em lotes de até 50 (`traduzirLote`);
- salva em `letra_musica_pronuncia.traducoes`; a próxima vez não gasta cota.

---

## 5. Telas de aviso

| Quando | Aviso |
| :--- | :--- |
| Spotify não conectado e sem a extensão | "Conecte seu Spotify ou use o YouTube Music" |
| Spotify bloqueado | Até que horas, e que o YouTube Music com a extensão continua funcionando |
| Nada tocando | "Nada tocando agora" |
| Podcast ou episódio | "Isso não é uma música" |
| Mais de 25% de palavras aproximadas | "Parece que esta letra não está em inglês" |

---

## 6. Banco de dados

`letra_musica_pronuncia`: `codigo_faixa` único (id do Spotify ou `yt:{videoId}`), título, artista, álbum, duração, situação, `linhas` (JSON com `inicioMs` e `texto`), `traducoes` (JSON), `buscada_em`, `criada_em`.

---

## 7. Arquivos

| Caminho | Papel |
| :--- | :--- |
| `src/Controller/Pronuncia/MusicaPronunciaController.php` | Rotas `/pronuncia/musica/*` |
| `src/Service/Pronuncia/ObterTocandoAgoraPronunciaService.php` | Spotify + ritmo de consulta |
| `src/Service/Pronuncia/ObterLetraMusicaPronunciaService.php` | Letra salva, nova busca e pronúncia |
| `src/Service/Pronuncia/TraduzirLetraMusicaService.php` | Tradução em lote |
| `src/Infra/Lrclib/LrclibClient.php` | Cliente do LRCLIB |
| `src/Domain/Pronuncia/LeitorLetraMusica.php`, `NormalizadorTituloMusica.php` | Leitura do LRC e limpeza do título |
| `src/Entity/LetraMusicaPronuncia.php` | Letra salva |
| `web/features/pronuncia/components/PainelMusicaTocando.tsx` | Escolha da fonte, cartão e avisos |
| `web/features/pronuncia/components/LetraSincronizada.tsx`, `LinhaLetraItem.tsx`, `BarraTempoMusica.tsx` | Letra acompanhando o tempo |
| `web/features/pronuncia/utils/musicaYoutube.ts` | YouTube Music → formato da aba |
| `web/features/pronuncia/hooks/useMusicaTocando.ts` | Consultas, letra, tradução e posição atual |
