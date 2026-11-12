# Música — Spotify e YouTube Music juntos

> Página **Música**, rota `/musica`. Reúne o histórico do Spotify e do YouTube Music numa leitura só.
> Lote do roadmap: tópicos 186–205, mais as correções de 11 e 12/11/2026 (conexão pelo Firefox, coleta a cada 30 s de verdade, tempo da música tocando, fuso, capas servidas pelo sistema). Este documento cresce a cada tópico concluído.
> Captura do YouTube Music por cookie, passo a passo e por dentro: [YOUTUBE_MUSIC.md](YOUTUBE_MUSIC.md). Spotify: [SPOTIFY.md](SPOTIFY.md).

---

## Objetivo

Transformar a página do Spotify numa página de música que reúne **Spotify e YouTube Music**. O padrão é ver tudo junto, com opção de filtrar por serviço. O YouTube Music é coletado automaticamente pelo servidor, o passado do YouTube vem do Google Takeout, e uma IA identifica música, artista e versões de cada vídeo para combinar com o que já existe do Spotify.

## Decisões

| Assunto | Decisão |
|---|---|
| Nome e rota | **Música**, em `/musica` |
| Visual | Mantém o tema do Spotify (fundo escuro, verde, cartões) |
| Seletor de fonte | Spotify, YouTube Music ou **Todos** (padrão). Cada música/artista mostra o ícone da origem; música ouvida nos dois aparece uma vez com os dois ícones |
| Coleta do YouTube Music | Pelo servidor, sem extensão de navegador. Cobre o celular, porque o histórico é da conta |
| Versões | Slowed, reverb, sped up, 8D, nightcore, lyrics, vídeo oficial, tradução, remix, cover e instrumental ficam juntos na música principal |
| Mashup | É uma música própria; cada artista dos componentes recebe crédito completo |
| Colaborações | Contam para todos os artistas (M128) |
| Identificação | IA (`OPENAI_MODELO_TEXTO`, hoje `gpt-5.4-mini`). Título e canal originais sempre guardados |
| Tempo ouvido em "Todos" | **Soma** medido (Spotify) e estimado (YouTube), com a marca "inclui estimativas" e tooltip separando os dois |
| Compilação | Vídeo com mais de `LIMITE_COMPONENTES_MASHUP = 5` músicas não credita artistas sem confirmação manual |
| Cápsula Sonora | Acompanha o seletor de fonte, com aviso de que a calibração é do Spotify |
| Desconectar o YouTube Music | Apaga só a credencial e **mantém as reproduções** |

As quatro últimas linhas são as propostas padrão do roadmap, adotadas até o Gabriel dizer o contrário.

## Como está dividido

A música passa por cinco camadas. Cada fonte tem a própria entrada e as próprias tabelas; a partir do catálogo, tudo é igual para as duas.

```
 ENTRADA                          DADOS DA FONTE                 LIGAÇÃO                      CATÁLOGO ÚNICO           LEITURA
 ───────                          ──────────────                 ───────                      ──────────────           ───────
 Spotify
  ├ OAuth + API (30 min) ───────▶ reproducao_spotify   ─────▶ vinculo_musica_spotify  ─┐
  └ importação do histórico ────▶ artista_faixa_spotify        (nome + artista          │
                                  imagem_spotify                normalizados)           │
                                                                                        ├─▶ musica_catalogo ──▶ reproducao_musical ──▶ /api/v1/musica?fonte=
 YouTube Music                                                                          │   artista_catalogo     (projeção, uma        (rankings, Cápsula,
  ├ cookie + coletor (30 s) ────▶ video_youtube        ─────▶ identificação           ─┘   componente_mashup     linha por               detalhes, Dashboard)
  └ Google Takeout ─────────────▶ reproducao_youtube           (regra, IA, busca do                               reprodução)
                                  importacao_youtube           YouTube Music, revisão)
```

| Camada | O que faz | Spotify | YouTube Music |
|---|---|---|---|
| 1. Entrada | Traz o que foi ouvido | API oficial com OAuth, coleta das últimas 50 a cada 30 min, importação do arquivo do Spotify ([SPOTIFY.md](SPOTIFY.md)) | Sessão do navegador (cookie) lida pelo servidor a cada 30 s, Google Takeout para o passado ([YOUTUBE_MUSIC.md](YOUTUBE_MUSIC.md)) |
| 2. Dados da fonte | Guarda como veio, sem perder nada | `reproducao_spotify` (tempo exato, pulos, aleatório), `artista_faixa_spotify`, `imagem_spotify` | `video_youtube` (título e canal originais), `reproducao_youtube` (horário e tempo estimados) |
| 3. Ligação | Diz qual música é | Vínculo por nome + artista principal normalizados (`VincularFaixasSpotifyAoCatalogoService`) | Faixa oficial direto, IA + confirmação na busca, regras de canal e a tela de Revisão (`IdentificarVideosYoutubeService`) |
| 4. Catálogo único | A música e o artista, iguais entre serviços | `musica_catalogo`, `artista_catalogo` (com apelidos e uniões), `musica_artista_catalogo`, `componente_mashup` | (o mesmo) |
| 5. Projeção e leitura | Uma linha por reprodução, com a música efetiva | `reproducao_musical` com `fonte = spotify` | `reproducao_musical` com `fonte = youtube_music` |

Depois da projeção, todas as análises (`Service/Musica/Analise`, `AnaliseReproducaoMusicalRepository`) leem só `reproducao_musical` e recebem o filtro `fonte` (`todas`, `spotify`, `youtube_music`). Nenhuma análise lê as tabelas de uma fonte diretamente, a não ser para complementar o item com o que só existe nela (código da faixa do Spotify, `videoId` do vídeo mais ouvido, capa).

### Onde fica cada parte no código

| Parte | Backend | Frontend |
|---|---|---|
| Spotify (conexão, coleta, importação, limites, capas) | `src/Service/Spotify/`, `src/Controller/Spotify/` | `web/features/spotify/` |
| YouTube Music (conexão por cookie, coleta, Takeout) | `src/Service/YoutubeMusic/`, `src/Infra/YoutubeMusic/`, `bin/ytmusic.py`, `src/Controller/YoutubeMusic/` | `web/features/youtube-music/` |
| Identificação dos vídeos | `src/Service/IdentificacaoMusica/` (`IdentificarVideosYoutubeService`, `AplicarIdentificacaoVideoYoutubeService`, `ConfirmarMusicaYoutubeService`), `src/Infra/OpenAi/`, `src/Infra/YoutubeData/` | — |
| Catálogo e correções | `src/Service/Musica/` (raiz e `Correcao/`), `MusicaCorrecaoController` | `web/features/revisao-musica/` |
| Projeção | `src/Service/Musica/Projecao/` | — |
| Análises | `src/Service/Musica/Analise/`, `AnaliseReproducaoMusicalRepository`, `MusicaController`, `MusicaAnaliseController` | `web/features/musica/` |
| Capas | `src/Service/Musica/Capa/`, `CapaMusicaController` | `web/features/musica/utils/capaMusica.ts` |

### Página principal e Gerenciar

`/musica` mostra só os relatórios: tocando agora (Spotify e YouTube Music), hoje e semana, recordes, evolução, hábitos, descobertas, curiosidades, Cápsula e retrospectiva. Tudo que é configuração fica em `/musica/gerenciar`, aberto pelo botão **Gerenciar** ao lado do seletor de fonte: contas do Spotify e do YouTube Music (com a extensão do navegador), importação do histórico (Spotify e Google Takeout) e o cartão de **Revisão e correções**, que leva a `/musica/revisao`. O botão mostra um número quando há pendência (conta para reconectar ou itens na revisão). Os avisos de conexão do Dashboard também levam ao Gerenciar.

### Quanto foi ouvido em cada plataforma

Com o seletor em **Todas**, cada item das listas mostra uma linha com o ícone de cada plataforma e os minutos ouvidos nela (ex.: ícone do Spotify "42 min", ícone do YouTube Music "15 min"), usando o `porFonte` que a API já devolve. Aparece nos rankings de músicas e artistas (Hoje, Semana, períodos e expansões), na Cápsula (músicas e artistas), nas músicas e mashups da página do artista. Com o seletor num serviço só, a linha some (tudo é daquele serviço). Componente `DivisaoFontesMusica`, regra em `listarParcelasPorFonte`.

### Diferenças que continuam entre as fontes

O YouTube Music tem duas entradas: o **coletor por cookie** (todos os aparelhos, estimado) e a **extensão do navegador** (só o computador com a aba aberta, exato). Quando as duas veem a mesma reprodução, fica uma só com o dado da extensão. Detalhes na seção 18 de [YOUTUBE_MUSIC.md](YOUTUBE_MUSIC.md).

| Assunto | Spotify | YouTube Music |
|---|---|---|
| Horário | Exato (fim da reprodução informado pelo Spotify) | Coletor: estimado, meio do intervalo entre duas leituras do histórico. Extensão: exato |
| Tempo ouvido | Exato (`ms_played`) | Coletor: `min(intervalo até a seguinte, duração)`, a que está tocando cresce a cada coleta. Extensão: exato, sem pausa e sem anúncio |
| Pulos | Sim | Só nas reproduções da extensão |
| Aleatório | Sim | Não existe |
| Tocando agora | Sim (API) | Com a extensão aberta; sem ela, "última detectada" |
| Repetição seguida | Conta cada vez | Coletor não vê a segunda; a extensão conta |
| Duração da conexão | Token renovado sozinho | Sessão do Google, que pode cair (status `reconectar`) |

## Regras de dados

- **Identidade da música:** título normalizado + artista principal normalizado (mesma regra do `SPOTIFY.md`, seção 7). Mashup: conjunto ordenado das chaves dos componentes. Nunca depender do código de faixa do Spotify nem do `videoId`.
- **Horário:** `tocadaEm` em UTC. No YouTube Music coletado, é quando o coletor viu a música aparecer. No Takeout, é o horário do arquivo. Reproduções do YouTube ficam com `tempoExato = false`.
- **Tempo ouvido estimado:** `min(intervalo até a reprodução seguinte, duração do vídeo)`. Tudo que vem do YouTube aparece como "estimado".
- **Stream:** 30 s ou mais (`30.000 ms`), aplicado na leitura, nunca na gravação.
- **Contagem:** cada reprodução conta 1 para a música; minutos totais contam uma vez; cada artista recebe stream e minutos completos. Mês e ano em UTC; "Hoje", hora do dia e "Últimos N dias" em `America/Sao_Paulo` (M120).
- **Ordem dos rankings:** streams, com minutos como desempate (M128).
- **Multiusuário (M131):** toda tabela nova tem `usuario_id`; o catálogo é por usuário; item de outra pessoa responde 404.

## Segurança da credencial do YouTube Music

O cookie é a sessão inteira da conta Google. Ele fica criptografado no banco com a `CriptografiaInterface`, entra no script Python **pela entrada padrão** (nunca argumento nem variável de ambiente), nunca vai para log, Sentry, resposta de API, repositório ou chat, e é apagado ao desconectar. O sistema precisa perceber quando o Google invalida a sessão e avisar.

## Evidências dos testes

- `ytmusicapi` com login por código de TV: erro 400 em tudo. Com cookie e cabeçalhos do navegador: 197 músicas no histórico, 47 playlists, 149 curtidas.
- O histórico não tem horário (só "Today", "Yesterday" e o mês) nem tempo ouvido; repetição seguida conta uma vez; em cerca de 64% dos itens o "artista" é o canal do upload.
- Cada consulta leva cerca de 0,8 s e devolve uns 1,9 MB sem compactar.
- **Duração do cookie:** o primeiro durou menos de um dia. O segundo (colado em 11/11) funcionou das 07h46 até cerca de 08h10 (UTC do servidor) e depois só devolveu `YTMusicServerError: None`. A biblioteca não diz que o problema é o cookie, então o sistema precisa tratar esse erro repetido como "sessão expirada" (tópico 192). A causa provável é a rotação dos cookies de sessão pelo navegador, que invalida a cópia antiga.
- IA com 9 títulos reais: todos separados corretamente; média de 155 tokens de entrada e 102 de saída, 2 a 4 s por chamada, cerca de US$ 0,0006 por vídeo (preço de agregadores, não confirmado). Ponto fraco: título ambíguo ("Renegade") sem aviso de dúvida.
- **OAuth por código de TV (12/11, refeito):** com cliente próprio, YouTube Data API ativada e app em teste, o token sai e funciona na API oficial (achou o canal), mas a API interna do YouTube Music responde `HTTP 400: Request contains an invalid argument`. O bloqueio é do Google (discussão #682 da `ytmusicapi`). A API oficial não tem o histórico de exibição.
- **Cabeçalhos colados do Chrome (12/11):** o formato "nome numa linha, valor na outra" com `:authority`, `:path` etc. quebrava a leitura e aparecia como "formato inesperado"; o `bin/ytmusic.py` agora normaliza os dois formatos e descarta `accept-encoding`, `content-encoding`, `content-length` e `priority`. Corrigido isso, a mesma sessão, 28 minutos depois de copiada, já voltava "Faça login para acessar seu histórico". A duração bate com a do segundo cookie (cerca de 25 minutos). Hipótese não confirmada: o Chrome no Windows prende os cookies da sessão do Google ao aparelho (credenciais de sessão vinculadas ao dispositivo) e a cópia morre na primeira renovação. Teste sugerido: copiar de uma janela privada do Firefox.
- **IP do servidor (12/11):** chamadas sem login ao YouTube Music recebem às vezes a página "Sorry" (tráfego incomum), cerca de 1 em 6. O coletor de teste passou o dia consultando com um cookie morto e foi parado. A verificação "o serviço responde sem login" agora tenta 3 vezes antes de concluir.
- **Cabeçalhos do Firefox (11/11 e 12/11):** a cópia pelo painel corta o cookie com "…" (agora a conexão avisa "cookie cortado"); "Copiar cabeçalhos da requisição" inclui a linha `POST /youtubei/... HTTP/3`, que o script passou a descartar; sem o cabeçalho `Authorization` a `ytmusicapi` 1.12 assumia OAuth, e o script agora força a autenticação de navegador (`SAPISIDHASH`). Com isso a conexão pela página funcionou: conta reconhecida e 199 itens no histórico. A sessão continuou válida a noite inteira.
- **Respostas vazias (12/11):** cerca de 1 em cada 5 consultas autenticadas do servidor volta vazia; o script tenta até 4 vezes antes de dizer "serviço indisponível". Teste: 10 de 10 leituras com sucesso.
- Spotify: o app é bloqueado (429) depois de cerca de 600 consultas de artistas; o bloqueio para também a coleta das músicas recentes. Desde 12/11 a busca de artistas fica em no máximo 300 consultas em 24 h (janela móvel).

## Cliente do YouTube Music (tópico 188)

- A biblioteca `ytmusicapi` é Python e fica fixada na versão **1.12.3** (`YTMUSICAPI_VERSAO` em `devops/php/Dockerfile.prod` e `devops/php/Dockerfile`). Atualizar só depois de testar a coleta.
- `bin/ytmusic.py` tem três subcomandos: `validar`, `historico` e `buscar`. Recebe um JSON pela **entrada padrão** (`{"cabecalhos": "..."}` ou `{"texto": "...", "limite": 5}`) e devolve JSON na saída padrão. As credenciais nunca passam por argumento, variável de ambiente ou arquivo: os cabeçalhos viram autenticação em memória (`setup_browser(filepath=None)`).
- Códigos de saída: `0` sucesso, `2` credenciais inválidas, `3` serviço indisponível ou limite, `4` formato inesperado.
- Cabeçalhos mínimos aceitos: `cookie` e `x-goog-authuser` de uma requisição logada ao `music.youtube.com` (por exemplo `/browse`).
- Quando o cookie morre, a biblioteca só devolve `YTMusicServerError: None`. O script então faz uma busca **sem login**: se ela funciona, o problema é a sessão (saída 2); se também falha, é o serviço (saída 3).
- `buscar` não usa credenciais.
- No PHP: `YoutubeMusicInterface` → `YoutubeMusicClient` (`src/Infra/YoutubeMusic/`), com `Process`, tempo limite de 30 s, mapeamento dos códigos de saída para `YoutubeMusicException` (`credenciaisInvalidas`, `servicoIndisponivel`, `respostaInesperada`). A saída bruta do script nunca é registrada em log.
- Cada item do histórico vira `ItemHistoricoYoutubeMusicDTO`: `videoId`, `titulo`, `textoArtistas` (como veio, sem o texto de visualizações), `album`, `urlCapa`, `duracaoMs`, `secao` ("Today", "Yesterday", mês), `posicao` e `tipoVideo`.

## Conectar o YouTube Music (tópico 190)

### Como copiar os cabeçalhos

1. Abra uma **janela anônima** (no Firefox, janela privada) no computador e entre em `music.youtube.com` com a sua conta.
2. Abra o DevTools (F12) → aba **Rede** (Network) e filtre por `browse`.
3. Clique em qualquer página do YouTube Music (por exemplo, Biblioteca) para aparecer uma requisição `browse`.
4. Copie os cabeçalhos da requisição: no **Firefox**, botão direito → **Copiar valor** → **Copiar cabeçalhos da requisição** (copiar o valor pelo painel corta o cookie com "…"); no **Chrome**, botão direito → Copiar → **Copiar como cURL (bash)**, ou a lista em Cabeçalhos → Cabeçalhos da requisição.
5. Cole na tela de conexão do CirqueiraX.
6. **Feche a janela anônima sem clicar em Sair.** Sair invalida a sessão copiada.

A dica da janela anônima é comum em outras ferramentas que usam a mesma biblioteca: a sessão anônima não é usada depois, então o Google não troca os cookies dela. Medições: cópias do Chrome em janela normal pararam em cerca de 25 minutos; a cópia do Firefox em janela normal, conectada pela página às 22h11 de 11/11, continuava funcionando na manhã seguinte (mais de 11 h, sem erro). O passo a passo completo, os erros comuns e o que acontece por dentro estão em [YOUTUBE_MUSIC.md](YOUTUBE_MUSIC.md).

### O que o sistema faz

- `POST /api/v1/youtube-music/conectar` com `{ "cabecalhos": "..." }` (no máximo 32.768 caracteres). Limite de 5 tentativas por minuto por usuário (`youtube_music_conexao` no `rate_limiter.yaml`).
- `InterpretadorCabecalhosNavegadorService` aceita o formato "Nome: valor" (Firefox e Chrome), o formato do Chrome com nome e valor em linhas separadas e o "Copiar como cURL". Guarda só `cookie`, `x-goog-authuser` (0 se faltar), `x-goog-visitor-id`, `user-agent` e `accept-language`. Recusa texto sem `cookie` ou sem o valor `__Secure-3PAPISID` (sessão não logada).
- `ConectarYoutubeMusicService` valida a sessão com a biblioteca, criptografa os cabeçalhos com a `CriptografiaInterface`, grava a conta, tira o primeiro retrato do topo do histórico (50 `videoId`, sem criar reproduções) e agenda a primeira coleta para 1 minuto depois. O texto colado não é devolvido nem registrado.
- `GET /api/v1/youtube-music/status` devolve `conectada`, `status` (`nao_configurado`, `conectada`, `reconectar`, `desconectada`), `nomeConta`, `conectadoEm`, `ultimaConsultaEm`, `ultimaNovidadeEm` e `erroMotivo`. Nunca as credenciais. O total de reproduções coletadas entra quando as reproduções existirem (tópico 192).
- `POST /api/v1/youtube-music/desconectar` apaga a credencial e o retrato e **mantém as reproduções**.
- Dashboard: o resumo (`GET /api/v1/dashboard/resumo`) ganhou o bloco `youtubeMusic` com `estado` (`nao_configurado`, `conectado`, `reconectar`), `nomeConta`, `ultimaConsultaEm`, `ultimaNovidadeEm`, `motivoErro` e `rota` (`/musica`). O resumo das integrações de música saiu do `DashboardService` para `ResumoIntegracoesMusicaService`.

## Modelo de dados (tópico 191)

| Tabela | Para que serve |
|---|---|
| `video_youtube` | Cada vídeo visto (título e canal como vieram, duração, capa, classificação, versão e música do catálogo). Único por usuário e `videoId` |
| `reproducao_youtube` | Cada reprodução do YouTube (`tocadaEm` UTC, tempo estimado, fonte `coletor` ou `takeout`). Chave de deduplicação = sha256(`videoId` + horário UTC) |
| `musica_catalogo` | A música principal, igual entre serviços. Chave = título + artista principal normalizados; mashup = conjunto ordenado das chaves dos componentes |
| `artista_catalogo` e `alias_artista_catalogo` | Artista único por nome normalizado, com apelidos ("lana" → Lana Del Rey) |
| `musica_artista_catalogo` | Artistas de cada música (posição 0 = principal) |
| `componente_mashup` | Partes de um mashup; a parte pode ficar sem música identificada |
| `vinculo_musica_spotify` | Liga nome + artista principal do Spotify a uma música do catálogo |
| `regra_canal_youtube` | Canal que sempre é música ou nunca é |

As tabelas do Spotify (`reproducao_spotify`, `artista_faixa_spotify`) não mudaram.

## Coleta contínua do YouTube Music (tópico 192)

- O agendador dispara `ColetarHistoricoYoutubeMusicMessage` a cada 30 s na fila própria `youtube_coleta`, consumida por 1 worker (`messenger-youtube-coleta`, limite de 128 MB). O handler só consulta contas conectadas com `proximaConsultaEm` vencida.
- **Intervalo adaptativo**: 30 s enquanto houve novidade nos últimos 10 minutos, 120 s quando parado. Nunca menos de 15 s entre duas consultas da mesma conta. A próxima consulta conta do **início** da consulta atual, com 5 s de folga (`TOLERANCIA_AGENDADOR_SEGUNDOS`); antes contava do fim e caía logo depois do disparo do agendador, então na prática a consulta acontecia a cada 60 s.
- **Sem consultas sobrepostas**: antes de consultar, a conta recebe `proximaConsultaEm` daqui a 2 minutos e é gravada. Com um único worker na fila, as consultas da mesma conta ficam em série. Se um dia houver mais workers, essa reserva evita a maioria das sobreposições, mas não é um bloqueio rigoroso (o projeto não tem o componente Lock).
- **Detecção**: o histórico vem em ordem, sem horário. A consulta é comparada com o `snapshotTopo` (50 primeiros `videoId`) e conta como novo cada item que aparece antes do alinhamento com a lista anterior. A primeira consulta só grava o snapshot (a conexão já faz isso).
- **Gravação**: cria ou atualiza o `VideoYoutube` (título, canal, duração, capa) e cria a `ReproducaoYoutube` com `fonte = coletor`. A mais recente recebe o horário em que foi vista; quando várias aparecem de uma vez, cada anterior começa a duração dela antes da seguinte. Duplicatas são descartadas pela `chaveDeduplicacao`.
- **Tempo ouvido estimado**: a música do topo (tocando agora) nasce com 0 e o horário de início é estimado no meio do intervalo entre a consulta anterior e a atual (até 60 s antes). A cada coleta, enquanto ela continua no topo, `AtualizarReproducaoEmAndamentoYoutubeService` passa o tempo a `min(agora − início, duração)` (sem duração conhecida, até 10 min) e reprojeta. Itens que entraram juntos abaixo do topo já terminaram e entram com a duração. Quando chega a seguinte, a anterior passa a `min(intervalo, duração)`. Limite: se você para de ouvir no meio, a última música sobe até a duração, porque o histórico não informa pausa. `ReproducaoYoutube::tocadaEm()` sempre devolve o horário em UTC: o Doctrine hidrata a coluna no fuso do PHP (America/Sao_Paulo), e sem essa conversão o intervalo entre uma reprodução nova e uma lida do banco saía negativo e zerava o tempo.
- **Erros**: falha passageira espera 1, 2, 5 e 15 minutos. No terceiro erro seguido a sessão é validada de novo; se for recusada, ou se o YouTube Music recusar a sessão a qualquer momento, a conta vai para `reconectar`, a coleta para e o motivo fica gravado. Os logs só levam o id da conta, o código e as contagens, nunca o conteúdo das respostas.
- Novas reproduções invalidam o cache das análises do usuário. A identificação dos vídeos sem classificação entra no tópico 195.
- O status (`/api/v1/youtube-music/status`) e o resumo do dashboard trazem `totalReproducoesColetadas`.

### Limites conhecidos

- Repetir a mesma música em seguida não muda o topo do histórico, então a segunda reprodução é perdida.
- O horário é o momento em que a reprodução foi vista, não o início real. O atraso entre tocar e aparecer no histórico ainda precisa ser medido (Pendências do Gabriel).

## Detalhes dos vídeos pela YouTube Data API (tópico 193)

- `YoutubeDataInterface` / `YoutubeDataClient` (`src/Infra/YoutubeData/`) com o Guzzle `guzzle.youtube_data`. `buscarVideos` chama `videos.list` com `snippet,contentDetails` em lotes de 50 e devolve título, canal, `canalId`, `categoriaId` (10 = Música), duração em ms (convertida do formato `PT#H#M#S`), descrição cortada em 1.000 caracteres e a maior capa. Os `videoId` que não voltam vêm em `idsNaoEncontrados`.
- A chave `YOUTUBE_API_KEY` vai no cabeçalho `X-goog-api-key`, nunca na URL, então não aparece em log de requisição. Sem chave configurada, o cliente lança `YoutubeDataException::chaveInvalida()` e nada é consultado.
- **Cota**: orçamento de 5.000 unidades por dia (cada `videos.list` custa 1, ou seja, até 250.000 vídeos por dia), contado na tabela `cota_youtube_data_dia`. O dia segue o horário do Pacífico, que é como o Google costuma reiniciar a cota (a política não diz o horário; confirmar no console do Google Cloud). Ao receber `quotaExceeded`, o dia é marcado como excedido e nada mais é consultado até o dia seguinte.
- `AtualizarDetalhesVideosYoutubeService` aplica os dados no `VideoYoutube` e grava `detalhesAtualizadosEm`. Vídeo que não volta fica `disponivel = false`; só muda o status para `indisponivel` se ainda estava pendente, para não apagar das contas uma música já identificada que saiu do ar depois de ouvida.

### Política de dados da API do YouTube

As políticas para desenvolvedores (seção III.E.4) dizem que dados obtidos sem login do usuário, como os desta chave, só podem ficar guardados temporariamente e precisam ser **atualizados ou apagados depois de 30 dias**, além de manter esforço razoável para que fiquem iguais aos dados atuais. Pedido de exclusão do usuário precisa ser atendido em até 7 dias.

Decisão: o catálogo é reatualizado. A cada hora, `AtualizarDetalhesVideosYoutubeMessage` pega até 500 vídeos com `detalhesAtualizadosEm` vazio ou com mais de 30 dias e consulta de novo (10 unidades por rodada). As reproduções e a identificação feita pelo sistema são dados do próprio usuário e não dependem dessa regra.

## Identificação por IA (tópico 194)

- `IdentificadorMusicaInterface` / `OpenAiIdentificadorMusicaClient` (`src/Infra/OpenAi/`). Recebe lotes de até 10 vídeos (`TAMANHO_LOTE_IDENTIFICACAO`) com id, título, canal, duração, categoria e no máximo 500 caracteres da descrição. Nada além disso sai do sistema.
- A resposta usa **saída estruturada** (esquema JSON estrito): `id`, `tipo` (`musica`, `mashup`, `compilacao`, `nao_musica`), `confianca` (0–100), `versao` (valores de `TipoVersaoMusica`), `componentes` (`titulo` + `artistas`), `ambiguo` e até 2 `alternativas`. Cada item é validado com o Validator do Symfony em `ResultadoIdentificacaoDTO`; JSON quebrado, item faltando ou valor fora do esperado gera `IdentificacaoException::respostaInvalida()` (o serviço do tópico 195 manda esses vídeos para `revisar`), que leva junto os tokens gastos para o custo ser registrado mesmo assim.
- As instruções ficam em `InstrucoesIdentificacaoMusica`: remover rótulos, remix/cover/instrumental como versões da mesma música, colaboração ≠ mashup, as duas ordens de "Artista - Título", letras espaçadas e títulos em português, não usar o canal como artista e não inventar.
- Tempo limite de 30 s, 2 tentativas com espera crescente (respeitando `Retry-After` no 429). Pedido recusado (4xx) não é repetido.
- **Custo:** cada chamada vira uma linha em `consumo_ia` (finalidade, modelo, tokens de entrada e saída, custo em microdólares, usuário), gravada por `RegistrarConsumoIaService`. Os preços por milhão de tokens vêm de `OPENAI_PRECO_ENTRADA_POR_MILHAO` e `OPENAI_PRECO_SAIDA_POR_MILHAO` (padrão 0,75 e 4,50 dólares, valores de agregadores, **a confirmar** na página de preços da OpenAI).

### Esforço de raciocínio

Comparação com os 14 títulos reais disponíveis (os 9 do teste anterior e 5 do coletor de teste), em lotes de 10, com o `gpt-5.4-mini`:

| Esforço | Tokens entrada / saída | Tempo | Custo por vídeo | Resultado |
|---|---|---|---|---|
| `low` | 2.323 / 2.272 | 18 s | US$ 0,00086 | Todos corretos. "Renegade" com confiança 46 e marcado como ambíguo. |
| `none` | 2.323 / 893 | 7 s | US$ 0,00041 | Mesmos títulos, mas inventou "Renegade (Ariana Grande)" com confiança 92. |
| `minimal` | — | — | — | Recusado pelo modelo (só existe nos modelos mais antigos). |

Decisão: `low` como padrão (`OPENAI_ESFORCO_IDENTIFICACAO`). Custa o dobro, mas o ponto fraco do teste era justamente a confiança alta em título ambíguo, e só o `low` acertou isso. Em 10.000 vídeos do Takeout, o `low` sai por volta de US$ 8,60. A comparação com 100 títulos fica para o tópico 205, quando houver histórico coletado e Takeout importado.

## Identificação dos vídeos (tópico 195)

`IdentificarVideosYoutubeService` recebe vídeos de um usuário e segue esta ordem:

1. **Decisão manual** nunca é sobrescrita: o vídeo é pulado.
2. **Regra de canal** (`RegraCanalYoutube` pelo canal normalizado): `nao_musica` encerra sem chamar a IA; `musica` segue.
3. **Faixa oficial** (canal terminado em " - Topic" ou tipo `MUSIC_VIDEO_TYPE_ATV` vindo da coleta): vira música original com título e artistas do próprio item, confiança 100, origem `regra`, sem IA.
4. **Enriquecimento** pela YouTube Data API quando faltam duração ou categoria e o vídeo nunca foi consultado. Vídeo que não existe mais e ainda estava pendente sai da fila como `indisponivel`.
5. **IA** em lotes de 10, com 1 s de pausa entre lotes. Cada chamada grava o custo em `consumo_ia`.
6. `AplicarIdentificacaoVideoYoutubeService` aplica o resultado:
   - `nao_musica` → `nao_musica`. `compilacao` ou mais de 5 componentes (`LIMITE_COMPONENTES_MASHUP`) → `compilacao`, sem crédito de artista.
   - Sem componentes, `ambiguo` ou confiança abaixo de 70 (`LIMITE_CONFIANCA_REVISAO`) → `revisar`, guardando as alternativas em `respostaIa`.
   - **Música:** confirmada pela busca do YouTube Music (`ConfirmarMusicaYoutubeService`, mesma pontuação do `ResolverImagemSpotifyService`: artista 50/35, título 30/20, duração 20/10, limiar 70). A duração só pesa quando a versão é a original, porque slowed e sped up mudam a duração. Confirmada, usa título, álbum, capa e `videoOficialId` oficiais. Os artistas vêm da IA quando o artista principal dela aparece no texto oficial (o YouTube Music às vezes escreve "Jigulina, Vika"); senão, os oficiais. Não confirmada → `revisar`.
   - **Colaboração:** um componente com vários artistas é uma música só, com os artistas na ordem.
   - **Mashup (2 a 5):** cada componente precisa ter artista e ser confirmado; senão `revisar`. A `MusicaCatalogo` do mashup é achada pela chave do conjunto de componentes (ordenado), então a mesma mistura postada por outro canal cai no mesmo mashup. Artistas = união dos componentes; capa = miniatura do vídeo.
   - **Versões:** a música é achada ou criada pela `chaveNormalizada` (título sem "feat./with" + artista principal, sem acentos e pontuação), e o vídeo guarda o `tipoVersao`.
7. Resposta da IA malformada para um item → `revisar`. Item que a IA esqueceu de devolver (acontece em cerca de 1 a cada 4 lotes) continua pendente e volta na próxima rodada. Falha da busca do YouTube Music deixa o vídeo pendente.

**Execução:** o agendador dispara `IdentificarVideosYoutubeMessage` a cada minuto na fila `youtube_identificacao` (1 worker, 192 MB), que pega até 50 vídeos pendentes de todos os usuários e processa cada usuário separadamente. Os vídeos novos da coleta entram por aí. Comando manual: `php bin/console app:youtube:identificar [--pendentes] [--todos --usuario=ID] [--limite=N]`; `--todos` reidentifica tudo do usuário, menos o que foi corrigido à mão.

**Teste com os casos reais** (banco de produção, transação desfeita no fim): as 4 versões de "Little Dark Age" (oficial, "- Topic", slowed, sped up) caíram na mesma música; "Let Down + Choir" virou música única; "one of the girls" virou colaboração de 3 artistas; os mashups de 2 e de 4 músicas saíram certos; "Renegade" sozinho foi para `revisar`; o canal "- Topic" não chamou a IA. 18 vídeos custaram cerca de US$ 0,013. A IA varia entre execuções: num mashup de 4 músicas ela listou só 3 uma vez, e o mashup com "renegade" foi marcado ambíguo numa execução e não na outra. Os limiares são revistos com dados reais no tópico 205.

## Catálogo único e correções manuais (tópico 196)

### Normalização

`NormalizarTextoMusicaService` é a base de todas as chaves: forma de compatibilidade Unicode (letras largas como "ｓｔｅｒｅｏ" viram "stereo"), minúsculas, sem acentos, sem pontuação, letras espaçadas juntadas ("s t e r e o" → "stereo"), `&` igual a `and` e hífen interno como espaço ("Lily-Rose" → "lily rose"). Na chave da música, o título também perde participações e rótulos de versão entre parênteses ou depois de " - " (slowed, reverb, sped up, remaster, live, remix, lyrics, official video e afins), então "Here Comes The Sun - Remastered 2009" e "Little Dark Age (Slowed + Reverb)" caem na música original.

### Spotify no catálogo

- `VincularFaixasSpotifyAoCatalogoService` percorre as músicas distintas do Spotify (nome + artista principal) em lotes de 200, cria ou acha a `MusicaCatalogo` (álbum, capa da `imagem_spotify`, todos os artistas de `artista_faixa_spotify` ou só o principal), e grava o `VinculoMusicaSpotify`. É idempotente: só vincula identidades ainda sem vínculo.
- Comando: `php bin/console app:musica:vincular-spotify [--usuario=ID]`, com progresso por lote. No teste com 400 músicas reais: cerca de 11 s por lote de 200, versões juntas ("Birds", "Birds feat. Elisa" e "Birds - Live in Vegas" na mesma música), colaborações com todos os artistas, e a segunda execução não vinculou nada de novo.
- A coleta do Spotify (quando há reprodução nova, olhando o último dia) e a importação do histórico disparam `VincularSpotifyAoCatalogoMessage` na fila `async`, para não mexer na memória do Doctrine no meio da coleta.
- Quando a busca de artistas (M133) grava os artistas de uma música, `AtualizarArtistasMusicaSpotifyService` acrescenta os que faltam na música do catálogo, a não ser que ela tenha sido corrigida à mão.
- O título exibido passa para a forma limpa quando ela aparece ("Birds - Live in Vegas" vira "Birds").

### Correções manuais

Toda correção marca a música como `confirmadaManualmente` (ou o vídeo com origem `manual`), nunca apaga título, canal ou resposta da IA, e invalida o cache das análises. A projeção das reproduções (tópico 199) vai reagir a essas mudanças.

| Serviço | O que faz |
|---|---|
| `UnirMusicasCatalogoService` | A origem passa a apontar para o destino (`unidaA`). Nada é apagado; quem lê usa `musicaEfetiva()`. Música e mashup não se unem. |
| `DesfazerUniaoMusicaService` | Tira o apontamento, e as duas voltam a ser separadas. |
| `SepararVideoDaMusicaService` | Tira o vídeo da música e o devolve para a revisão como decisão manual. |
| `DefinirMusicaDoVideoService` | Define a música (do catálogo ou por título e artistas), ou marca "não é música", ou mantém como compilação (a resolução de compilação do roadmap ficou aqui). |
| `DefinirComponentesMashupService` | Troca os componentes, recalcula a chave, o título e os artistas. Se já existir outro mashup com as mesmas músicas, responde 409 para usar a união. |
| `DefinirArtistasMusicaService` | Redefine e reordena os artistas. A chave da música não muda. |
| `UnirArtistasCatalogoService` | O artista de origem aponta para o destino (`unidoA`) e vira alias dele, então as próximas identificações já usam o destino. |
| `ClassificarCanalYoutubeService` | Cria ou troca a regra do canal. "Não música" classifica na hora os vídeos pendentes, em revisão ou compilação desse canal; "música" devolve esses vídeos para a fila de identificação. |

`SugerirDuplicatasCatalogoService` sugere pares com o mesmo título normalizado e artista parecido (contido ou similaridade de 75%), sem aplicar nada. O critério de duração próxima ficou de fora porque o catálogo não guarda duração.

### Endpoints (`MusicaCorrecaoController`)

- `GET /api/v1/musica/revisao?tipo=&pagina=&porPagina=`, com `tipo` = `sem_vinculo`, `ambiguo`, `compilacao`, `canal_novo`, `possivel_duplicata` ou `indisponivel`. Vídeos vêm com miniatura, status, confiança, versão, sugestão da IA (com as alternativas) e a música atual; canais vêm com total e um título de exemplo; duplicatas vêm em pares.
- `POST /api/v1/musica/revisao/videos/{uuid}/musica` — corpo `{acao: definir_musica|nao_musica|manter_compilacao, musicaUuid?, titulo?, artistas?, versao?}`.
- `POST /api/v1/musica/catalogo/unir` — `{origemUuid, destinoUuid}`.
- `POST /api/v1/musica/catalogo/separar` — `{musicaUuid}` desfaz uma união; `{videoUuid}` tira o vídeo da música.
- `PUT /api/v1/musica/catalogo/{uuid}/artistas` — `{artistas: []}` (a mais do roadmap, para a tela do tópico 202).
- `POST /api/v1/musica/canais/classificar` — `{canal, classificacao: musica|nao_musica}`.
- `POST /api/v1/musica/artistas/unir` — `{origemUuid, destinoUuid}`.
- `PUT /api/v1/musica/mashups/{uuid}/componentes` — `{componentes: [{titulo, artistas}]}` (2 a 5).
- Item de outro usuário responde 404, porque toda busca filtra pelo usuário logado.

## Importação do Google Takeout (tópico 197)

`POST /api/v1/youtube-music/importacoes` (multipart, campo `arquivo`, ZIP ou JSON até 200 MB) cria a `ImportacaoYoutube` e manda para a fila `youtube_importacao`. `GET /api/v1/youtube-music/importacoes/{uuid}` mostra o andamento e os contadores. Só uma importação por usuário de cada vez; a de outro usuário responde 404.

- **Arquivo do histórico achado pelo conteúdo:** dentro do ZIP, cada `.json` é amostrado (até 50 objetos). Só vale o arquivo cujos objetos têm `header`, `title`, `titleUrl` e `time` com endereço de vídeo. O histórico de buscas (endereços `results?search_query`) e o resto do ZIP são ignorados. Se o histórico vier em HTML, a importação falha pedindo o formato JSON.
- **Campos:** `videoId` do `v=` ou do `youtu.be`, título sem o prefixo do idioma ("Assistiu a ", "Watched "), canal de `subtitles[0].name`, horário em UTC e se veio do YouTube Music (`header`). Posts, entradas sem vídeo e anúncios (qualquer `details`) contam como descartados. Vídeo apagado (título igual ao endereço) entra sem título, para virar `indisponivel` no enriquecimento.
- **Gravação:** lotes de 500, reanexando o usuário a cada lote. Cada `videoId` novo vira `VideoYoutube` pendente marcado com `aguardandoImportacao`, que o tira da identificação automática e da atualização de detalhes até a prévia de custo do tópico 198. Se a coleta encontra o mesmo vídeo, a marca sai. A reprodução entra com `fonte = takeout`, tempo 0 (estimado no tópico 198) e chave de usuário, vídeo e segundo; reimportar o mesmo arquivo não cria nada.
- **Unificação com a coleta:** reprodução da coleta do mesmo vídeo a até `JANELA_TOLERANCIA_TAKEOUT_SEGUNDOS` (600) vira uma só, com o horário do Takeout, fonte `takeout` e o tempo estimado pela coleta. Cada reprodução da coleta é usada uma vez, a mais próxima primeiro.
- **Arquivo temporário:** em `var/tmp/youtube_importacoes`, pelo `ArmazenamentoImportacaoYoutubeInterface`, apagado no fim do processamento com sucesso ou erro. Em erro, o EntityManager é reaberto para gravar o motivo.
- O leitor de JSON em streaming saiu do leitor do Spotify para `LeitorStreamObjetosJson` e é usado pelos dois.

## Importação do Takeout — etapas até o relatório (tópico 198)

Depois da leitura, a importação anda por etapas (`EtapaImportacaoYoutube`), uma por mensagem da fila `youtube_importacao`. Cada etapa devolve `continuar` (a mensagem é reenviada na hora), `aguardar` (reenviada em 1 hora) ou `parar`. Todas são idempotentes e trabalham sobre os vídeos com `aguardandoImportacao`.

1. **Enriquecimento:** até 1000 vídeos por rodada pela YouTube Data API (lotes de 50, respeitando o orçamento diário). Os que não voltam viram `indisponivel`. Sem cota ou sem chave, a etapa espera 1 hora.
2. **Filtro sem IA:** regra de canal, categorias de `CATEGORIAS_NAO_MUSICA_DIRETAS` (20, 25, 26, 27, 28) e duração acima de `DURACAO_MAXIMA_SEM_CATEGORIA_MUSICA_MS` (20 min) fora da categoria Música viram `nao_musica` (origem `regra`). Entretenimento (24) e Pessoas e Blogs (22) seguem para a IA. Os resolvidos saem da reserva.
3. **Prévia:** conta os pendentes, separa as faixas oficiais ("- Topic", classificadas sem IA) e estima o custo com `TOKENS_ENTRADA_ESTIMADOS_POR_VIDEO = 300` e `TOKENS_SAIDA_ESTIMADOS_POR_VIDEO = 170` (medição do tópico 194 com folga para a descrição) e os preços do tópico 194. Até `LIMITE_CUSTO_AUTOMATICO_MICRODOLARES` (US$ 2) segue sozinha; acima, fica em `aguardando_confirmacao` até `POST /api/v1/youtube-music/importacoes/{uuid}/confirmar`.
4. **Classificação:** 100 vídeos por rodada pelo `IdentificarVideosYoutubeService`. Os classificados saem da reserva; tokens e custo reais vêm do `consumo_ia` desde o início da classificação. Rodada sem nenhum classificado (falha da IA) espera 1 hora.
5. **Tempo ouvido:** 6 meses por rodada, com cursor gravado. Ordena todas as reproduções do usuário no mês (de qualquer fonte e de vídeos que não são música) e estima as do Takeout com `EstimarTempoReproduzidoYoutubeService`: o menor entre o intervalo até o próximo vídeo e a duração. Sem duração, 0; a última de todas fica com a duração.
6. **Relatório:** ao concluir, libera qualquer vídeo que ainda estivesse reservado (o identificador de cada minuto assume) e grava o relatório: reproduções lidas, vídeos únicos, músicas, mashups, compilações, não música, a revisar, indisponíveis, pendentes, meses com dados e tokens e custo estimados contra reais.

`app:youtube:continuar-importacao {uuid}` roda as etapas no terminal até terminar ou precisar esperar; se a importação estiver em erro depois da leitura, retoma da etapa onde parou.

## Projeção única das reproduções (tópico 199)

- **Tabela, não view:** a ligação das reproduções do Spotify ao catálogo depende da normalização feita em PHP (`vinculo_musica_spotify` por nome e artista normalizados). Não existe chave em SQL para uma view juntar as duas fontes sem mexer em `reproducao_spotify`, o que o roadmap proíbe. A escolha é a tabela `reproducao_musical`.
- **Colunas:** usuário, música efetiva (`musica_uuid`, já seguindo as uniões), música de origem (`musica_origem_uuid`, a do vínculo ou do vídeo), fonte (`spotify`, `youtube_music`), `tocada_em`, `ms_reproduzidos`, `tempo_exato`, `pulada` e `aleatorio` (só Spotify), `origem_id` (uuid da reprodução original) e `criado_em`. Única por fonte e origem; índices em `(usuario, tocada_em)`, `(usuario, musica)`, `(usuario, fonte, tocada_em)` e na música de origem.
- **Alimentação:** `app:musica:projetar-spotify [-u id]` faz a carga (vínculo, projeção em lotes de 2000 com `INSERT … ON DUPLICATE KEY UPDATE`, remoção de órfãs e reprojeção do YouTube). Depois de cada coleta e lote importado do Spotify, a `VincularSpotifyAoCatalogoMessage` liga e projeta só a janela de tempo afetada; a substituição da M118 atualiza a mesma linha. No YouTube, entram só vídeos `musica` e `mashup`, reprojetados após a identificação, cada coleta, as correções de vídeo e o fim da importação do Takeout. Uniões e desfazer união só atualizam a música efetiva das linhas que mudaram (CTE recursiva).
- **Leitura:** `AnaliseReproducaoMusicalRepository` (totais, ranking de músicas e de artistas) com `FiltroFonteMusica` (`todas`, `spotify`, `youtube_music`), divisão por fonte e minutos estimados. Mesmas regras do `SPOTIFY.md` seção 3; artistas creditados pela música inteira e, em mashup, pelos componentes, sem contar duas vezes o mesmo artista na mesma reprodução. O cache de análise aceita a fonte na chave e é invalidado a cada projeção.
- **Paridade (`app:musica:comparar-paridade -u id`)**, rodada numa cópia dos dados de produção (101.015 reproduções, todas projetadas, nenhuma sem vínculo), em abril, maio e junho de 2026, ano de 2026, ano de 2025, últimos 30 dias e desde sempre:
  - **Zero diferença** em minutos, streams, reproduções e dias, em todos os períodos.
  - **Diferenças esperadas pelo catálogo:** o catálogo junta versões que o Spotify conta separado (14.121 faixas viram 12.935 músicas, 867 grupos: acústica, slowed, remaster, "feat."). Isso muda a contagem de músicas distintas e o top de músicas (ex.: "Let Down" 139 + "Let Down - Remastered" 20 = 159). Nos artistas a diferença fica abaixo de 2%: as versões juntadas emprestam os créditos umas às outras.
  - A paridade achou um defeito do tópico 196, corrigido: o vínculo usava um só código de faixa e às vezes pegava um sem lista de artistas ("Unity" ficava sem Alan Walker). Agora junta os artistas de todos os códigos da faixa.
  - Consulta: a paridade inteira (7 períodos, totais e dois tops cada) roda em 24 s nas duas consultas somadas.
- **Decisão pendente do Gabriel:** com `fonte = spotify`, agrupar por música do catálogo (versões juntas, como acima) ou por faixa (números iguais ao app do Spotify). As consultas antigas continuam até essa decisão.

## Endpoints unificados `/api/v1/musica` (tópico 200)

- **Parâmetro `fonte`:** `todas` (padrão), `spotify` ou `youtube_music`, validado pelo enum `FiltroFonteMusica` (`FiltroFonteRequisicaoDTO`). Valor inválido devolve 422.
- **`MusicaController`:** `GET /musica/resumo`, `/musica/capsula`, `/musica/capsula/{ano}/{mes}`, `/musica/ranking` (mesmos parâmetros de antes: `tipo`, `dias`, `ano`, `mes`, `inicio`, `fim`, `limite`) e `/musica/artistas/{uuid}/top-musicas`.
- **`MusicaAnaliseController`:** `GET /musica/habitos`, `/recordes`, `/evolucao`, `/descobertas`, `/retrospectiva/{ano}`, `/musicas/{uuid}`, `/artistas/{uuid}`, `/identificacao/resumo` (contagem por status: pendentes, em revisão, compilações e o total por status) e `/identificacao/consumo?dias=30` (tokens e custo por dia, mais o total, a partir de `ConsumoIa`).
- **Alias (removido no tópico 203):** as rotas antigas de análise em `/api/v1/spotify/` saíram. Os links antigos por nome são resolvidos por `GET /musica/artistas/resolver?nome=` e `/musica/musicas/resolver?nome=&artista=` (alias de artista, nome normalizado ou vínculo do Spotify). Conexão, importação, status, sincronizar, desconectar, imagens e tocando agora continuam em `/api/v1/spotify/`.
- **Serviços sem duplicação:** os serviços de análise saíram de `Service/Spotify` para `Service/Musica/Analise`, com nomes neutros (`ObterHabitosMusicaService`, `ObterRecordesMusicaService`, `ObterEvolucaoMensalMusicaService`, `ObterDescobertasMusicaService`, `ObterRetrospectivaAnualMusicaService`, `ObterDetalheMusicaService`, `ObterDetalheArtistaMusicaService`, Cápsula, resumo, ranking e top músicas do artista). Todos leem `AnaliseReproducaoMusicalRepository` e recebem a fonte. O `MontarResumoIntervaloMusicaService` monta totais e tops de um intervalo para o resumo e para o ranking.
- **Itens dos rankings:** além dos campos de antes (`nomeFaixa`, `artista`, `codigoFaixa`, `album`, `streams`, `minutos`, `imagemUrl`, `urlSpotify`), trazem `musicaUuid` ou `artistaUuid`, `artistas`, `fontes`, `porFonte` (streams e minutos de cada fonte), `mashup`, `estimado` e `urlYoutubeMusic` (`https://music.youtube.com/watch?v=<videoId>` do vídeo oficial do catálogo ou do vídeo mais ouvido). `urlSpotify` só vem quando a música ou o artista tem reprodução no Spotify.
- **Detalhe da música:** `variantes` (uma linha por faixa do Spotify e uma por versão do YouTube Music: vídeos diferentes da mesma versão, como o áudio oficial e o clipe, somam numa linha só, com título, capa e link do vídeo mais ouvido; campos: fonte, título, canal ou artista, código, `tipoVersao`, capa, link, streams e minutos), `componentes` dos mashups e `porFonte` com primeira e última vez de cada fonte. **Detalhe do artista:** inclui `mashups` (marcados com `mashup: true`) e a mesma divisão por fonte. Ambos pelo `uuid` do catálogo; uuid de outro usuário dá 404.
- **Capas e fotos:** capa da música vem da imagem do Spotify (quando a música tem Spotify), senão da capa do catálogo, senão da miniatura do vídeo. Itens só do YouTube **não** entram no enriquecimento de imagens do Spotify, para não gastar cota. Foto de artista: `imagem_spotify` quando existe; para os demais, uma única busca pela `ytmusicapi` (comando `foto_artista` do `bin/ytmusic.py`, sem login), na fila `async` (`BuscarFotoArtistaMessage`), gravando em `ArtistaCatalogo.urlFoto` e marcando `fotoBuscadaEm` (migration `Version20261111190918`), mesmo quando nada é achado. A busca é enfileirada ao abrir o detalhe do artista e pelo comando `app:musica:buscar-fotos-artistas [-u id]`.
- **Cache:** a chave inclui a fonte; a Cápsula passou a ter cache da lista de meses. Tudo é invalidado a cada projeção (novas reproduções, importações, correções e reclassificações).
- **Teste com a cópia dos dados de produção** (101.015 reproduções, sem cache): resumo 4,5 s, Cápsula de um mês 3,4 s, lista da Cápsula (24 meses) 22 s na primeira vez, ranking do ano 4,2 s, hábitos 2,2 s, recordes 4,6 s, descobertas 5,3 s, retrospectiva 8,2 s, detalhe da música 1,9 s, detalhe do artista 6 s. Com um vídeo de teste ligado a uma música do catálogo: a música passou a mostrar as duas fontes, a variante do vídeo com `tipoVersao`, o link do YouTube Music, minutos estimados e a primeira e a última vez de cada fonte; o ranking com `fonte = youtube_music` trouxe só os 7 minutos do vídeo. Fonte inválida dá 422 e uuid inexistente dá 404.

## Página Música (tópicos 201 a 203)

- **Rotas:** `/musica`, `/musica/artista?uuid=`, `/musica/faixa?uuid=`, `/musica/gerenciar` e `/musica/revisao`. `/spotify`, `/spotify/artista` e `/spotify/musica` redirecionam mantendo a busca; `/spotify/callback` continua sendo o retorno do OAuth.
- **Tema:** tokens `cirqueira.musica.*` com os mesmos valores do antigo tema do Spotify, mais `fonteSpotify` (#1ED760) e `fonteYoutubeMusic` (#FF0033) para ícones e gráficos.
- **Seletor de fonte:** pílulas Todos, Spotify e YouTube Music no topo, guardadas em `?fonte=`. Todas as consultas levam a fonte na chave e no parâmetro. Os links internos mantêm a fonte.
- **Origem e estimativa:** cada item mostra os ícones das fontes; minutos com YouTube Music levam a marca "est." e o tooltip separa Spotify e YouTube Music.
- **Topo:** cartões de conexão do Spotify e do YouTube Music lado a lado; selo "N itens para revisar" e o link "Revisão e correções".
- **Rankings:** linhas de música com ícones, artistas creditados, selo Mashup e expansão "Versões ouvidas neste período" (`GET /musica/musicas/{uuid}/versoes`, com o período do ranking) ou "Contém" nos mashups.
- **Detalhes:** resumo por fonte, evolução mensal empilhada por fonte (quando há YouTube Music), "Versões que você ouviu", "Contém" (mashup), "Mashups em que aparece" (artista), link do YouTube Music e as ações do tópico 204.
- **Efeitos da fonte:** pulos e aleatório ficam "Indisponível para o YouTube Music" quando a fonte é só YouTube Music; o cartão "Tocando agora" é só do Spotify e some nessa fonte; em Todos e YouTube Music aparece "Última detectada: título · canal, há cerca de X min" (sem horário exato).
- **Cápsula:** com YouTube Music na fonte, aparece "Calibrada com o Spotify. Os minutos do YouTube Music são estimados." A imagem PNG e o CSV levam a atribuição da fonte escolhida.
- **Dashboard:** item YouTube Music no status das integrações (não configurado, conectado ou reconectar).

## Revisão e correções (tópico 204)

- **Tela `/musica/revisao`:** abas Sem vínculo (vídeos pendentes ou em revisão sem ambiguidade), Ambíguos, Compilações, Canais novos, Possíveis duplicadas e Indisponíveis, com contagem (`GET /musica/revisao/contagens`) e paginação de 20.
- **Cartão do vídeo:** miniatura, título e canal originais, duração, link do YouTube, sugestão da IA com confiança e outras leituras. Ações: confirmar a sugestão, escolher música (busca no catálogo em `GET /musica/catalogo/musicas?busca=` ou criar nova com título, artistas e versão), marcar como mashup (`acao = definir_mashup` com `componentes`), não é música, manter compilação e regra do canal (sempre ou nunca música).
- **Lote:** vários vídeos de uma vez para a mesma música do catálogo (`POST /musica/revisao/videos/lote`, até 100).
- **Duplicadas:** "Manter esta e unir" chama `POST /musica/catalogo/unir`.
- **Nos detalhes:** "Unir com outra música…", "Separar esta versão" (`POST /musica/catalogo/separar` com `videoUuid`; o vídeo volta para a revisão) e "Unir com outro artista" (`POST /musica/artistas/unir`, busca em `GET /musica/catalogo/artistas?busca=`).
- **Nada é apagado:** unir pode ser desfeito (`separar` com `musicaUuid`) e os títulos e canais originais ficam guardados. A interface remove o item da lista na hora e desfaz se a API recusar.

## Teste com dados reais (tópico 205)

Lista do que só pode ser conferido com a conta e os arquivos do Gabriel. Cada constante alterada depois desses testes precisa do motivo registrado aqui.

| Verificação | Situação |
|---|---|
| Coleta ao vivo com 5 a 10 músicas (slowed da mesma música, um mashup, uma repetição e uma pulada) | Em andamento: de 11/11 22h11 a 12/11 09h47, 36 reproduções coletadas, 33 vídeos (30 músicas, 2 mashups, 1 em revisão), 0 erros. Falta o roteiro com slowed, repetição e pulada |
| Takeout real: relatório, fila de revisão e custo real contra o estimado | _pendente_ |
| Acerto da IA em 100 títulos reais (inclusive português e gospel) e confirmação pela busca | _pendente_ |
| 30 músicas ouvidas nos dois serviços: duplicatas falsas e uniões erradas | _pendente_ |
| Paridade com `fonte = spotify` (abril, maio e junho de 2026 e o comando de paridade do tópico 199) | _pendente_ |
| Outubro de 2025 combinado (se o Google ainda tiver o histórico) | _pendente_ |
| Rede do trabalho: a página abre e a coleta continua no servidor | _pendente_ |
| Cookie vencido: `reconectar` no painel e no Dashboard e retomada sem perder reproduções | _pendente_ |
| Bloqueio do Spotify: aviso e pausa da coleta e da busca de artistas | _pendente_ |
| Celular: página, seletor, modal do Takeout e revisão | _pendente_ |

### Constantes em observação

| Constante | Valor | Onde |
|---|---|---|
| Janela do Takeout para tempo ouvido | 600 s | importação do Takeout (tópico 198) |
| Componentes para compilação | `LIMITE_COMPONENTES_MASHUP = 5` | `AplicarIdentificacaoVideoYoutubeService` |
| Intervalo da coleta | 30 s com novidade, 120 s parado, mínimo 15 s | tópico 192 |
| Stream | 30.000 ms | regra do Spotify |

## Pendências do Gabriel

1. **Google Takeout:** em `takeout.google.com`, desmarcar tudo, marcar só YouTube e YouTube Music; em "Todos os dados do YouTube incluídos" deixar só o **histórico**; trocar o formato do histórico para **JSON**; exportar uma vez. Opcional: agendar a cada 2 meses por 1 ano.
2. **Exclusão automática:** conferir em `myactivity.google.com` se o histórico do YouTube estava ligado e se há exclusão automática. Prazo menor que 13 meses significa que outubro de 2025 já foi apagado.
3. **Marca do Spotify:** ler as diretrizes de marca e a política de desenvolvedor do Spotify para confirmar se dados do Spotify podem aparecer misturados com outro serviço sob o visual do Spotify. Conclusão: _pendente_.
4. **Atraso do histórico:** dar play em 5 músicas novas anotando o horário de cada play, para comparar com a hora em que o coletor viu cada uma. Mediana: _pendente_. Máximo: _pendente_. Precisa de um cookie válido no coletor de teste.
5. **Credenciais do teste OAuth:** apagar o cliente OAuth do teste no Google Cloud e revogar o acesso em myaccount.google.com → Segurança → Apps de terceiros. As variáveis `YTMUSIC_CLIENT_ID` e `YTMUSIC_CLIENT_SECRET` já foram removidas do `.env` do servidor.
6. **Chave da YouTube Data API:** no Google Cloud, num projeto separado do cliente OAuth do teste, ativar a YouTube Data API v3, criar uma chave de API restrita só a essa API e colocar em `YOUTUBE_API_KEY` no `.env` do servidor. Sem ela, os detalhes dos vídeos não são buscados.
7. **Preço da OpenAI:** conferir na página de preços o valor por milhão de tokens do modelo em `OPENAI_MODELO_TEXTO` e ajustar `OPENAI_PRECO_ENTRADA_POR_MILHAO` e `OPENAI_PRECO_SAIDA_POR_MILHAO` se for diferente de 0,75 e 4,50.
8. **Amostra do Takeout:** quando o arquivo chegar, enviar só as primeiras entradas do histórico de exibição para conferir o formato real (prefixo do título em português, campo de anúncio) e a janela de 600 s.
9. **Agrupamento com fonte Spotify:** decidir se o filtro só Spotify agrupa por música do catálogo ou por faixa (seção do tópico 199).
10. **Confirmar as decisões** marcadas como proposta padrão na tabela acima.

## Limpeza do teste

Depois do deploy final, com o YouTube Music conectado pela página e coletando em produção: parar e remover o contêiner `ytmusic_teste_coletor` e apagar `/root/ytmusic_teste`. Situação em 12/11: a conta está conectada pela página desde 22h11 de 11/11 e coletando; o contêiner de teste está parado (não removido) e a pasta ainda existe, aguardando o OK do Gabriel para apagar. O cliente OAuth do teste e o acesso de terceiros ficam no item 5 das pendências.

## Fora do escopo

Player próprio dentro do CirqueiraX (M134); extensão de navegador; "tocando agora" do YouTube Music; gêneros; podcasts; YouTube comum depois da troca de hábito; relatórios de TV e outros aparelhos.

## Capas servidas pelo sistema (12/11/2026)

Capas hospedadas no Google/YouTube (`yt3.googleusercontent.com`, `lh3.googleusercontent.com`, `yt3.ggpht.com`, `i.ytimg.com`, `www.gstatic.com`), no Spotify (`i.scdn.co`, `mosaic.scdn.co`, `image-cdn-*.spotifycdn.com`) e no Deezer (`cdn-images.dzcdn.net`, `e-cdns-images.dzcdn.net`) não abriam em alguns navegadores e redes, mesmo com o link válido (caso real: todas as capas `image-cdn-*.spotifycdn.com` quebradas no navegador do Gabriel, abrindo normalmente no servidor). O frontend (`urlCapaExibicao`, em `web/features/musica/utils/capaMusica.ts`) troca esses links por `GET /api/v1/musica/capa?url=...`.

- Rota pública (sem token, para o `<img>` funcionar e o navegador guardar em cache por 30 dias).
- Só aceita `https` desses hosts e só URLs que já existem no banco (`musica_catalogo.url_capa`, `video_youtube.url_capa`, `artista_catalogo.url_foto`, `imagem_spotify`), então não serve de proxy aberto.
- Baixa uma vez (até 5 MB, só `image/*`) e guarda em `var/cache/thumbnails/capas-musica/<sha256>`, no volume `thumbnails_prod`.
- Vale para todas as capas e fotos da música: `CapaMusica`, linhas dos rankings, lista de músicas, Cápsula (inclusive a imagem PNG gerada no navegador) e o fundo do topo do detalhe (`HeroDetalheMusica`).
- Links de outros hosts continuam direto do endereço original.
- Diagnóstico usado no caso real: gerar a resposta do ranking do usuário, separar as capas quebradas das que funcionam e comparar os hosts. As quebradas eram todas `image-cdn-ak/fa.spotifycdn.com`; as que abriam eram `i.scdn.co`. Do servidor, todas respondiam 200, e o log do Nginx não mostrava pedidos do navegador para as quebradas, sinal de bloqueio no próprio navegador ou na rede.
