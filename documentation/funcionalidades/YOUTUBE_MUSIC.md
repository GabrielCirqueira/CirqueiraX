# YouTube Music

> Parte da página **Música** (`/musica`). As regras gerais, as decisões, o catálogo único e o histórico de cada tópico ficam em [MUSICA.md](MUSICA.md). Este documento explica, do começo ao fim, como o CirqueiraX captura o que a conta ouve no YouTube Music usando a sessão (cookie) do navegador e, opcionalmente, a extensão do navegador (seção 18), que traz horário e tempo exatos.

---

## 1. O que faz

Registra o que a conta ouve no YouTube Music, no computador, no celular, na TV ou em qualquer aparelho, **sem extensão de navegador e sem nada instalado no celular**. Quem faz o trabalho é o servidor:

1. A pessoa conecta a conta uma vez, colando os cabeçalhos de uma requisição logada do `music.youtube.com`.
2. A cada 30 s (ou 120 s quando não há novidade) o servidor lê o histórico da conta, como se fosse a página "Histórico" do YouTube Music.
3. O que subiu no topo do histórico desde a última leitura vira reprodução, com horário e tempo ouvido estimados.
4. Cada vídeo novo é identificado (música, artistas, versão, mashup ou não música) e ligado ao catálogo único, o mesmo do Spotify.
5. As reproduções entram na projeção `reproducao_musical` e aparecem nos rankings, na Cápsula, nos detalhes e no Dashboard, junto com o Spotify ou separadas pelo seletor de fonte.

Cada usuário tem a própria conexão, as próprias reproduções e o próprio catálogo (toda tabela tem `usuario_id`). Um usuário não vê nem mexe nos dados de outro.

## 2. Por que cookie

O histórico de exibição do YouTube Music **não existe em nenhuma API oficial**. Opções avaliadas:

| Caminho | Resultado |
|---|---|
| YouTube Data API v3 (oficial) | Não tem histórico de exibição. Serve só para detalhes de vídeos (duração, canal, categoria), usada na identificação |
| OAuth por código de TV (`ytmusicapi`) com cliente próprio | O token sai e funciona na API oficial, mas a API interna do YouTube Music responde `HTTP 400: Request contains an invalid argument` (bloqueio do Google, discussão #682 da `ytmusicapi`). Testado duas vezes |
| Extensão de navegador sozinha | Não cobre o celular nem a TV e obriga a ter o navegador aberto. Por isso não substitui o cookie: entrou depois como **complemento opcional** (seção 18), dando horário, tempo ouvido e pulos exatos no computador |
| **Sessão do navegador (cookie)** | Funciona: a `ytmusicapi` usa os mesmos cabeçalhos que o site usa e lê o histórico da conta inteira, de qualquer aparelho |

O custo dessa escolha é que o cookie é a **sessão inteira da conta Google** e o Google pode derrubar a sessão quando quiser. Por isso a seção 6 (segurança) e a seção 10 (reconexão).

## 3. Como as peças se dividem

```
Navegador do usuário                     Servidor (container symfony)
────────────────────                     ─────────────────────────────────────────────────────────
Cartão "YouTube Music"   ──POST /conectar──▶ InterpretadorCabecalhosNavegadorService  (filtra os cabeçalhos)
(cola os cabeçalhos)                         ConectarYoutubeMusicService               (valida, criptografa, grava)
                                                    │
                                                    ▼
                                             conta_youtube_music  (cabeçalhos criptografados, snapshot do topo)
                                                    │
Scheduler (30 s) ── ColetarHistoricoYoutubeMusicMessage ─▶ fila youtube_coleta (1 worker)
                                                    │
                                                    ▼
                                             ColetarHistoricoYoutubeMusicService
                                               ├─ YoutubeMusicClient ─stdin─▶ python3 bin/ytmusic.py historico ─▶ music.youtube.com
                                               ├─ DetectarNovasReproducoesYoutubeService   (o que subiu no topo)
                                               ├─ RegistrarReproducoesYoutubeService       (video_youtube + reproducao_youtube)
                                               ├─ AtualizarReproducaoEmAndamentoYoutubeService (tempo da música tocando)
                                               └─ TratarErroColetaYoutubeMusicService       (esperas e "reconectar")
                                                    │
Scheduler (1 min) ── IdentificarVideosYoutubeMessage ─▶ fila youtube_identificacao ─▶ IA + busca do YouTube Music
                                                    │
                                                    ▼
                                             musica_catalogo / artista_catalogo  (catálogo único com o Spotify)
                                                    │
                                                    ▼
                                             reproducao_musical (projeção, fonte = youtube_music)
                                                    │
Página /musica  ◀── GET /api/v1/musica/...?fonte= ──┘
```

| Camada | Onde fica |
|---|---|
| Tela de conexão, status, Takeout, última detectada | `web/features/youtube-music/` (`PainelConexaoYoutubeMusic`, `CampoCabecalhosYoutubeMusic`, `ModalImportarTakeoutYoutube`, `UltimaDetectadaYoutubeMusic`) |
| Rotas de conexão e importação | `src/Controller/YoutubeMusic/` (`/api/v1/youtube-music/...`) |
| Conexão, coleta, estimativa de tempo, erros | `src/Service/YoutubeMusic/` |
| Takeout | `src/Service/YoutubeMusic/Importacao/`, `src/Infra/YoutubeMusic/LeitorArquivoTakeoutYoutube.php` |
| Cliente que chama o Python | `src/Infra/YoutubeMusic/YoutubeMusicClient.php` (implementa `YoutubeMusicInterface`) |
| Script que fala com o YouTube Music | `bin/ytmusic.py` (`ytmusicapi` 1.12.3, fixada em `YTMUSICAPI_VERSAO` nos Dockerfiles) |
| Detalhes dos vídeos | `src/Infra/YoutubeData/` (YouTube Data API v3) |
| Identificação | `src/Service/IdentificacaoMusica/`, `src/Infra/OpenAi/OpenAiIdentificadorMusicaClient.php` |
| Catálogo, projeção e análises | `src/Service/Musica/` (ver [MUSICA.md](MUSICA.md)) |

## 4. Como conectar (passo a passo do usuário)

O passo a passo também aparece no próprio cartão do YouTube Music, na página **Música**.

1. No computador, abra uma **janela anônima** (no Firefox, "janela privada") e entre em `music.youtube.com` com a conta Google.
2. Abra as ferramentas do desenvolvedor (**F12**) → aba **Rede** (Network) e digite `browse` no filtro.
3. Clique em qualquer página do YouTube Music (por exemplo, **Biblioteca**) para aparecer uma requisição `browse`.
4. Copie os cabeçalhos dessa requisição:
   - **Firefox:** botão direito na requisição → **Copiar valor** → **Copiar cabeçalhos da requisição**.
   - **Chrome/Edge:** botão direito na requisição → **Copiar** → **Copiar como cURL (bash)**. Também serve abrir a requisição → **Cabeçalhos** → **Cabeçalhos da requisição** e copiar tudo.
5. Cole no campo do cartão e clique em conectar.
6. **Feche a janela anônima sem clicar em Sair.** Sair da conta invalida a sessão copiada.

### Erros comuns na hora de colar

| Mensagem | Causa | O que fazer |
|---|---|---|
| "O cookie está cortado" | O painel de cabeçalhos do Firefox encurta valores longos com `…`; copiando o valor de lá, o cookie chega incompleto | Usar o botão direito → Copiar valor → Copiar cabeçalhos da requisição |
| "Os cabeçalhos não têm cookie" | Copiou a resposta, ou só parte da requisição | Copiar os cabeçalhos **da requisição** |
| "O cookie não é de uma sessão logada" | Falta o `__Secure-3PAPISID` (página aberta sem login) | Entrar na conta antes de copiar |
| "Copie os cabeçalhos de novo" | O YouTube Music tratou a sessão como deslogada | Copiar de novo, de uma janela recém-logada |
| "Muitas tentativas" | Mais de 5 conexões por minuto (`youtube_music_conexao` em `rate_limiter.yaml`) | Esperar 1 minuto |
| "YouTube Music indisponível" | O Google devolveu respostas vazias ou a página "Sorry" ao IP do servidor | Tentar de novo em alguns minutos (não é problema do cookie) |

## 5. O que o sistema faz ao conectar

`POST /api/v1/youtube-music/conectar` com `{ "cabecalhos": "..." }` (no máximo 32.768 caracteres).

1. **Limite de tentativas:** 5 por minuto por usuário.
2. **Leitura do texto colado** (`InterpretadorCabecalhosNavegadorService`). Aceita três formatos:
   - `Nome: valor` uma por linha (Firefox e Chrome);
   - o formato do Chrome com o nome numa linha e o valor na seguinte (inclusive `:authority`, `:path`, que são ignorados);
   - `curl ... -H '...' -b '...'` ("Copiar como cURL").
3. **Filtro:** guarda **só** `cookie`, `x-goog-authuser` (0 se faltar), `x-goog-visitor-id`, `user-agent` e `accept-language`. Todo o resto é descartado. Recusa: sem `cookie`, cookie com `…` (cortado) ou cookie sem `__Secure-3PAPISID`.
4. **Validação real:** chama `bin/ytmusic.py validar`, que lê o histórico e pega o nome da conta e o @ do canal (opcionais; se falharem, a conexão continua).
5. **Primeiro retrato:** lê o histórico e guarda os 50 primeiros `videoId` em `snapshotTopo`. Nada vira reprodução nesse momento: o que já estava no histórico antes de conectar não é contado.
6. **Gravação:** os cabeçalhos filtrados são criptografados com a `CriptografiaInterface` e gravados em `conta_youtube_music`, com status `conectada` e a primeira coleta para **1 minuto depois**.
7. O texto colado não é devolvido, não vai para log e o campo é limpo no navegador depois do envio.

Reconectar (colar cabeçalhos novos com a conta em `reconectar`) usa a mesma rota e a mesma linha da conta: as reproduções continuam todas lá.

## 6. Segurança do cookie

- É a **sessão inteira da conta Google**. Por isso:
  - fica **criptografado** no banco (`CriptografiaInterface`);
  - só é descriptografado em memória, no momento da consulta;
  - entra no script Python **pela entrada padrão** (stdin), nunca por argumento, variável de ambiente ou arquivo (argumentos aparecem em `ps`);
  - o script monta a autenticação em memória (`setup_browser(filepath=None)`), sem gravar `browser.json`;
  - nunca vai para log, Sentry, resposta de API, repositório ou chat; o parâmetro é marcado com `#[SensitiveParameter]`; a saída bruta do script nunca é registrada;
  - os logs da coleta só levam o uuid da conta, o código do erro e as contagens.
- **Desconectar** (`POST /api/v1/youtube-music/desconectar`) apaga a credencial e o retrato e **mantém as reproduções**.
- `GET /api/v1/youtube-music/status` nunca devolve credenciais.

## 7. O script `bin/ytmusic.py`

O PHP não fala direto com o YouTube Music: o `YoutubeMusicClient` roda `python3 bin/ytmusic.py <comando>` com `Process` (tempo limite de 30 s), manda um JSON pela entrada padrão e lê um JSON da saída padrão.

| Comando | Entrada | Usa login | Saída |
|---|---|---|---|
| `validar` | `{"cabecalhos": "..."}` | sim | `nomeConta`, `canal` |
| `historico` | `{"cabecalhos": "..."}` | sim | lista de itens |
| `buscar` | `{"texto": "...", "limite": 5}` | não | itens da busca de músicas (confirmação da identificação) |
| `foto_artista` | `{"nome": "..."}` | não | `urlFoto` do artista com nome igual |

Cada item do histórico vira `ItemHistoricoYoutubeMusicDTO`: `videoId`, `titulo`, `textoArtistas` (sem o texto de visualizações), `album`, `urlCapa` (a maior), `duracaoMs`, `secao` ("Today", "Yesterday", mês), `posicao` e `tipoVideo` (`MUSIC_VIDEO_TYPE_ATV` = faixa oficial, etc.).

### Cuidados que o script toma

- **Normalização dos cabeçalhos:** descarta a primeira linha `POST /youtubei/... HTTP/3` que o Firefox inclui ao copiar, os pseudo-cabeçalhos `:authority`/`:path` e `accept-encoding`, `content-encoding`, `content-length` e `priority` (com eles a resposta vem compactada e a biblioteca não lê).
- **Autenticação de navegador forçada:** como o PHP guarda só os cabeçalhos essenciais (sem `Authorization`), a `ytmusicapi` 1.12 assumiria OAuth e falharia. O script marca `authorization = "SAPISIDHASH"`, e a biblioteca calcula o `SAPISIDHASH` a partir do cookie a cada chamada, como o site faz.
- **Respostas vazias:** cerca de 1 em cada 5 consultas autenticadas do IP do servidor volta vazia (não é JSON). O script tenta até **4 vezes** (`TENTATIVAS_RESPOSTA_VAZIA`), esperando 3, 6 e 9 s. Se continuar vazio, responde "serviço indisponível", **não** "cookie inválido".
- **Distinguir cookie morto de Google fora do ar:** quando a sessão morre, a biblioteca só devolve `YTMusicServerError: None` ou uma resposta sem os campos esperados. O script então faz uma busca **sem login** (até 3 tentativas, porque o Google às vezes devolve a página "Sorry" ao servidor): se a busca funciona, o problema é a sessão; se também falha, é o serviço.

### Códigos de saída

| Código | Significado | No PHP |
|---|---|---|
| `0` | Sucesso | — |
| `2` | Credenciais inválidas (sessão recusada ou deslogada) | `YoutubeMusicException::credenciaisInvalidas` → conta vai para `reconectar` |
| `3` | Serviço indisponível, limite ou rede | `servicoIndisponivel` → nova tentativa com espera |
| `4` | Formato inesperado | `respostaInesperada` → nova tentativa com espera |

## 8. Coleta contínua

### Quando consulta

- O agendador (`src/Schedule.php`) dispara `ColetarHistoricoYoutubeMusicMessage` **a cada 30 s** na fila `youtube_coleta`, consumida por **1 worker** (`messenger-youtube-coleta`, 128 MB).
- O handler pega só as contas `conectada` com `proximaConsultaEm` vencida (`executarContasVencidas`).
- **Intervalo adaptativo:** 30 s (`INTERVALO_ATIVO_SEGUNDOS`) se houve novidade nos últimos 10 minutos (`JANELA_ATIVIDADE_SEGUNDOS = 600`), senão 120 s (`INTERVALO_OCIOSO_SEGUNDOS`). Nunca menos de 15 s entre duas consultas da mesma conta (`INTERVALO_MINIMO_SEGUNDOS`).
- **A conta do início da consulta:** a próxima consulta é marcada para *início da consulta + intervalo − 5 s* (`TOLERANCIA_AGENDADOR_SEGUNDOS`). Sem essa folga, o horário caía logo depois do disparo do agendador e a consulta só acontecia no disparo seguinte (na prática, a cada 60 s).
- **Sem consultas sobrepostas:** antes de consultar, a conta recebe `proximaConsultaEm` daqui a 2 minutos (`RESERVA_CONSULTA_SEGUNDOS`) e é gravada. Com um worker só, as consultas ficam em série.

### Como descobre o que foi ouvido

O histórico do YouTube Music é uma lista em ordem, **sem horário**: só a seção ("Today", "Yesterday", mês). Então o sistema compara listas:

1. Lê o histórico atual (até umas 200 entradas) e pega os `videoId` em ordem.
2. `DetectarNovasReproducoesYoutubeService` compara com o `snapshotTopo` (50 primeiros da leitura anterior). Procura o menor número `N` de itens no topo tal que, tirando esses `N` itens da lista antiga (porque uma música que você ouviu de novo **sobe** para o topo e sai de onde estava), os próximos até 15 itens (`JANELA_COMPARACAO`) batem com a lista anterior. Esse `N` é a quantidade de reproduções novas.
3. Se não alinha (histórico muito mexido), conta os itens do topo até achar o primeiro que já era conhecido.
4. Grava o novo snapshot e se houve novidade (`ultimaNovidadeEm`).

Exemplo: antes `[A, B, C, D]`, agora `[E, B, A, C, D]`. Com `N = 3` (E, B, A subiram), tirando E, B e A da lista antiga sobra `[C, D]`, que bate com o resto da nova. Resultado: 3 reproduções novas, E a mais recente.

### Como grava

`RegistrarReproducoesYoutubeService`:

1. Para cada item novo, cria ou atualiza o `VideoYoutube` do usuário (título, canal, duração, capa, tipo).
2. Cria uma `ReproducaoYoutube` com `fonte = coletor`.
3. **Horário (`tocadaEm`, sempre em UTC):** a mais recente começa no **meio do intervalo** entre a consulta anterior e a atual (no máximo 60 s antes de ser vista), porque ela começou em algum momento entre as duas leituras. As que vieram juntas abaixo dela começam, cada uma, a duração dela antes da seguinte.
4. **Deduplicação:** `chaveDeduplicacao = sha256(videoId + horário UTC)`; chaves que já existem são descartadas.
5. **Tempo ouvido (estimado):**
   - a do topo (tocando agora) nasce com **0**;
   - as que vieram juntas abaixo dela já terminaram e entram com a duração;
   - a reprodução anterior que já estava no banco é fechada com `min(intervalo até a nova, duração)` (`EstimarTempoReproduzidoYoutubeService`; sem duração conhecida, o intervalo).
6. Projeta os vídeos afetados em `reproducao_musical` e invalida o cache das análises do usuário.

### A música que está tocando

Enquanto a mesma música continua no topo, `AtualizarReproducaoEmAndamentoYoutubeService` sobe o tempo dela a cada coleta para `min(agora − início, duração)` (sem duração, até 10 min) e reprojeta. Assim o ranking mostra os minutos crescendo durante a música, em vez de contar a duração inteira na hora em que ela aparece.

Exemplo com coleta a cada 30 s: a música de 4:00 aparece às 10:00:30 (consulta anterior às 10:00:00) → início estimado 10:00:15, tempo 0. Às 10:01:00 → 45 s. Às 10:02:00 → 1:45. A próxima aparece às 10:04:30 (início 10:04:15) → a anterior fecha com `min(4:00, 4:00)` = 4:00.

### Fuso horário

O banco grava `tocada_em` em UTC, mas o Doctrine hidrata a coluna no fuso do PHP (`America/Sao_Paulo`). `ReproducaoYoutube::tocadaEm()` sempre devolve em UTC e `buscarUltimaAntesDe` converte o momento consultado para UTC. Sem isso o intervalo entre uma reprodução nova e uma lida do banco saía negativo (3 h de diferença) e o tempo da anterior virava 0.

## 9. Do vídeo à música

O que vem do YouTube é **vídeo**, não música. A ligação com o catálogo:

1. **Faixa oficial** (canal "- Topic" ou tipo `MUSIC_VIDEO_TYPE_ATV`): vira a música direto, sem IA.
2. **Regra de canal:** canal marcado como "nunca música" sai sem IA.
3. **YouTube Data API** (`YOUTUBE_API_KEY`): completa duração, categoria e descrição quando faltam.
4. **IA** (`OPENAI_MODELO_TEXTO`, esforço `low`) em lotes de 10: tipo (música, mashup, compilação, não música), título, artistas, versão (slowed, reverb, sped up, 8D, nightcore, lyrics, remix, cover, ao vivo...), confiança e leituras alternativas.
5. **Confirmação** pela busca do YouTube Music (comando `buscar`): só vira música se bater título e artista (pontuação mínima 70). Confirmada, usa título, álbum e capa oficiais.
6. O que não fecha vai para a **Revisão** (`/musica/revisao`).

A identificação roda a cada minuto (fila `youtube_identificacao`). Versões ficam na mesma música do Spotify (a chave é título + artista principal normalizados), mashups são músicas próprias e creditam todos os artistas. Detalhes completos em [MUSICA.md](MUSICA.md), tópicos 193 a 196.

## 10. Erros e reconexão

`TratarErroColetaYoutubeMusicService`:

- **Sessão recusada** (código 2): a conta vai para `reconectar` na hora, a coleta para e o motivo é gravado. O cartão da página Música e o Dashboard mostram "reconectar".
- **Falha passageira** (códigos 3 e 4, rede, Google fora): espera 1, 2, 5 e 15 minutos (e fica em 15 nas seguintes).
- **No 3º erro seguido**, valida a sessão de novo; se for recusada, `reconectar`.
- Reconectar é só colar cabeçalhos novos. Nenhuma reprodução é perdida, mas o que for ouvido enquanto a conta está parada só volta pelo Takeout (o histórico guarda umas 200 entradas e a próxima leitura conta só o que subiu desde o último retrato).

### Quanto dura a sessão

| Teste | Duração |
|---|---|
| 1º cookie (Chrome, 10/11) | Menos de um dia |
| 2º cookie (Chrome, 11/11, janela normal) | Cerca de 25 minutos |
| Cabeçalhos do Chrome (12/11) | Morta 28 minutos depois de copiada |
| Cabeçalhos do Firefox, janela normal (conectada pela página às 22h11 de 11/11) | Ainda funcionando às 09h47 de 12/11 (mais de 11 h), 0 erros, 36 reproduções coletadas |

Hipótese para o Chrome: no Windows ele prende os cookies da sessão do Google ao aparelho e a cópia morre na primeira renovação. O caminho recomendado continua sendo a janela anônima/privada fechada sem sair da conta, porque o navegador não renova (nem troca) os cookies dela depois.

## 11. Passado pelo Google Takeout

O coletor só vê o que acontece depois da conexão. O passado vem do Takeout:

1. Em `takeout.google.com`, desmarcar tudo e marcar só **YouTube e YouTube Music**; em "Todos os dados do YouTube incluídos" deixar só o **histórico**; formato do histórico **JSON**.
2. Enviar o `.zip` ou o `.json` em "Importar do Google Takeout", no cartão do YouTube Music (até 200 MB).
3. Etapas: leitura → enriquecimento (YouTube Data API) → filtro sem IA (categorias que não são música, vídeos longos) → **prévia de custo** (até US$ 2 segue sozinha; acima, pede confirmação) → classificação → tempo ouvido → relatório.
4. Só o histórico de exibição é lido; buscas, comentários e inscrições são ignorados.
5. Reprodução do Takeout a até 600 s de uma do coletor (mesmo vídeo) vira uma só, com o horário do Takeout e o tempo do coletor.
6. **Vários arquivos (várias contas ou aparelhos):** cada importação **soma** ao que já existe. Reprodução com o mesmo vídeo no mesmo segundo é reconhecida e não entra de novo ("já estavam no sistema"), e vídeo já conhecido não volta para a IA. Cada reprodução guarda de qual importação veio (`reproducao_youtube.importacao_youtube_uuid`).
7. **Fila:** dá para enviar até 5 arquivos seguidos. Eles rodam um de cada vez, na ordem de envio (a próxima espera, verificando a cada 60 s, até a anterior terminar ou falhar). Se uma ficar esperando a confirmação de custo, as seguintes também esperam.
8. **Relatório em popup:** quando uma importação termina, o relatório abre sozinho em qualquer página (`PopupRelatorioImportacaoYoutube`, no layout), um por vez, até ser fechado (`relatorio_visto_em`). Mostra músicas identificadas (pelo canal oficial, pela IA ou por você), o que foi para a revisão (sem certeza, compilações, indisponíveis), o que não era música, vídeos novos, reproduções lidas, novas, já existentes e juntadas com o coletor, minutos e streams de música, músicas e artistas diferentes, período, custo da IA e as 5 músicas e os 5 artistas mais ouvidos do arquivo. Em **Gerenciar → Importações do YouTube** ficam as 10 últimas, com a situação (na fila, lendo, identificando com %, esperando confirmação, concluída, erro) e "Ver relatório".
9. **Proteções da identificação:** a IA recebe apelidos curtos (`v1`…`v10`) em vez dos UUIDs, porque UUIDs v7 criados juntos são quase iguais e ela trocava as respostas entre vídeos do lote. Uma música só é ligada ao vídeo se o título ou um artista dela aparecer no título, no canal ou na descrição do vídeo; senão o vídeo vai para a revisão. Quando a IA diz "não é música" para um vídeo da categoria Música ou com marcas de música no título (lyrics, slowed, official video, remix, feat…), ele também vai para a revisão.

Detalhes em [MUSICA.md](MUSICA.md), tópicos 197 e 198.

## 12. Nos relatórios

- O que vem só do coletor tem `tempoExato = false` e aparece como **estimado** ("est." e tooltip separando Spotify e YouTube Music). O que passou pela extensão tem `tempoExato = true`.
- Stream = 30 s ou mais, como no Spotify.
- Pulos: contam só as reproduções da extensão (as do coletor e do Takeout ficam `pulada = NULL`). Sem nenhuma reprodução da extensão no período, aparece "indisponível para o YouTube Music". Aleatório continua indisponível.
- "Tocando agora" aparece quando a extensão mandou evento nos últimos 75 s, no mesmo cartão do Spotify: capa (com o fundo desfocado), título e artistas do catálogo quando a música já foi identificada (senão, título do vídeo e canal), barra de progresso que avança sozinha entre os eventos e vira "Pausado" se a extensão fica mais de 30 s sem mandar nada, quantas vezes você já ouviu e desde quando, e "Abrir no YouTube Music". Sem extensão, aparece "Última detectada: título · canal, há cerca de X min".
- Se o evento de "fim" de uma música da extensão se perder (aba fechada, extensão atualizada no meio), ela é fechada quando chega a próxima: pulada se ficou abaixo de 90% da duração.
- **Capas:** as capas do YouTube (`yt3.googleusercontent.com`, `i.ytimg.com`...) e as do Spotify são servidas pelo próprio sistema em `GET /api/v1/musica/capa?url=` (cache de 30 dias), porque alguns navegadores e redes não abriam esses links direto. Ver "Capas servidas pelo sistema" em [MUSICA.md](MUSICA.md).

## 13. Rotas

| Método | Rota | Uso |
|---|---|---|
| `POST` | `/api/v1/youtube-music/conectar` | Conecta ou reconecta com os cabeçalhos colados |
| `GET` | `/api/v1/youtube-music/status` | `status` (`nao_configurado`, `conectada`, `reconectar`, `desconectada`), `nomeConta`, `conectadoEm`, `ultimaConsultaEm`, `ultimaNovidadeEm`, `erroMotivo`, `totalReproducoesColetadas` |
| `POST` | `/api/v1/youtube-music/desconectar` | Apaga a credencial, mantém as reproduções |
| `POST` | `/api/v1/youtube-music/importacoes` | Envia o Takeout (multipart, campo `arquivo`) |
| `GET` | `/api/v1/youtube-music/importacoes` | As 10 últimas importações (`recentes`) e os relatórios ainda não vistos (`relatoriosNaoVistos`) |
| `GET` | `/api/v1/youtube-music/importacoes/{uuid}` | Andamento e relatório (`naFila`, `relatorioVistoEm`) |
| `POST` | `/api/v1/youtube-music/importacoes/{uuid}/relatorio-visto` | Fecha o popup do relatório |
| `POST` | `/api/v1/youtube-music/importacoes/{uuid}/confirmar` | Confirma o custo da IA |
| `POST` | `/api/v1/youtube-music/importacoes/{uuid}/cancelar` | Cancela na confirmação: pula a IA e deixa os vídeos na revisão |
| `GET` | `/api/v1/youtube-music/extensao/tokens` | Aparelhos com a extensão ligada (sem o token) |
| `POST` | `/api/v1/youtube-music/extensao/tokens` | Gera o token de um aparelho (`nomeAparelho`); o token só aparece nessa resposta |
| `DELETE` | `/api/v1/youtube-music/extensao/tokens/{uuid}` | Revoga o token do aparelho |
| `POST` | `/api/v1/youtube-music/extensao/eventos` | Usada só pela extensão, com o cabeçalho `X-Extensao-Token` (não aceita o login normal) |

O `status` também traz `extensao`: `aparelhosAtivos`, `ultimoEventoEm` e `tocandoAgora` (`titulo`, `canal`, `inicioEm`, `msOuvidos`, `duracaoMs`) ou `null`.

## 14. Comandos

| Comando | Uso |
|---|---|
| `app:youtube:identificar [--pendentes] [--todos --usuario=ID] [--limite=N]` | Identifica vídeos na hora |
| `app:youtube:continuar-importacao {uuid}` | Roda as etapas do Takeout no terminal |
| `app:musica:projetar-spotify [-u ID]` | Refaz a projeção (inclui a reprojeção do YouTube) |
| `app:musica:buscar-fotos-artistas [-u ID]` | Busca fotos dos artistas sem Spotify pelo YouTube Music |

## 15. Configuração

| Variável | Uso |
|---|---|
| `YOUTUBE_API_KEY` | Chave da YouTube Data API v3, restrita a essa API (orçamento de 5.000 unidades por dia) |
| `OPENAI_MODELO_TEXTO` | Modelo da identificação (padrão `gpt-5.4-mini`) |
| `OPENAI_ESFORCO_IDENTIFICACAO` | Esforço de raciocínio (padrão `low`) |
| `OPENAI_PRECO_ENTRADA_POR_MILHAO` | Preço em US$ por milhão de tokens de entrada (padrão 0,75) |
| `OPENAI_PRECO_SAIDA_POR_MILHAO` | Preço em US$ por milhão de tokens de saída (padrão 4,50) |

A `ytmusicapi` vem instalada na imagem (`YTMUSICAPI_VERSAO = 1.12.3`). Atualizar só depois de testar `validar` e `historico` com uma sessão real.

## 16. Limites

- Sem a extensão, não há horário exato nem tempo ouvido real: o que vem do coletor é estimado. Se você pausa no meio, a música continua subindo até a duração, porque o histórico não informa pausa.
- Repetir a mesma música em seguida não muda o topo do histórico, então a segunda vez não é contada pelo coletor (a extensão conta).
- O horário tem margem de até uma consulta (30 a 120 s) mais o atraso do próprio histórico do Google.
- Música ouvida enquanto a conta está em `reconectar` só volta pelo Takeout.
- A sessão pode cair a qualquer momento por decisão do Google.
- O IP do servidor às vezes recebe respostas vazias ou a página "Sorry"; o script repete, mas uma consulta pode falhar e ficar para a próxima.

## 17. Diagnóstico

| Sintoma | Onde olhar |
|---|---|
| Cartão em "reconectar" | `erroMotivo` no status; colar cabeçalhos novos |
| Música ouvida não apareceu | `ultimaConsultaEm` no status (a coleta está rodando?); se for repetição seguida, é o limite conhecido; vídeo pode estar em `revisar` ou ser `nao_musica` (tela de Revisão) |
| Minutos zerados numa música | Deveria subir a cada coleta enquanto toca; se ficou 0, conferir se a reprodução seguinte tem horário anterior (problema de fuso) |
| Coleta parada sem erro | Worker `messenger-youtube-coleta` rodando? `proximaConsultaEm` da conta no futuro distante? |
| Capa quebrada | A URL está no banco? `GET /api/v1/musica/capa?url=` responde 200? |
| Extensão não registra | No popup, "Aba do YouTube Music": se diz "Nenhuma aba sendo lida", a aba foi aberta antes da extensão (versão 1.0.0) ou o script não rodou; recarregar a aba. "Eventos guardados" parado em 0 com música tocando = mesmo caso. "Salvar e testar" com 401 = token revogado ou errado. A fila guarda os eventos até o servidor responder |

Logs relevantes: "Coleta do YouTube Music concluída." (itens novos e reproduções criadas), "Coleta do YouTube Music falhou; nova tentativa agendada." e "Sessão do YouTube Music recusada; conta marcada para reconectar.".

## 18. Extensão do navegador (opcional)

O coletor por cookie continua sendo a base (pega celular, TV e qualquer aparelho). A extensão é um complemento para o computador: enquanto a aba do `music.youtube.com` está aberta, ela diz **quando** a música começou, **quanto** foi ouvido de verdade (pausa e anúncio não contam) e se ela foi **pulada**. Quando os dois veem a mesma reprodução, vale o dado da extensão.

### Instalar

1. No cartão do YouTube Music, seção "Extensão do navegador", baixar o `.zip` (`/build/extensao/cirqueirax-youtube-music-<versão>.zip`, gerado no `npm run build` a partir de `extensao/youtube-music/`) e descompactar.
2. Chrome/Edge/Brave: `chrome://extensions` → ligar "Modo do desenvolvedor" → "Carregar sem compactação" → escolher a pasta. Firefox: `about:debugging#/runtime/this-firefox` → "Carregar extensão temporária" → `manifest.json` (no Firefox some ao fechar o navegador).
3. No cartão, dar um nome ao aparelho ("PC de casa") e gerar o token. O token aparece **uma vez**; copiar e colar no popup da extensão → "Salvar e testar".
4. Tocar uma música e conferir no popup a linha "Aba do YouTube Music": "Lendo: título" quer dizer que a aba está sendo lida. "Nenhuma aba sendo lida" = recarregar a aba (F5).
5. Atualizar: baixar o `.zip` de novo, substituir os arquivos da pasta e clicar em recarregar na extensão (`chrome://extensions`).

Abas do YouTube Music que já estavam abertas antes de instalar ou atualizar não recebem o script sozinhas (regra do Chrome). Desde a versão 1.1.0, `fundo.js` injeta `pagina.js` e `conteudo.js` nessas abas na instalação, na atualização e quando o navegador abre (`chrome.scripting`, permissão `scripting`). Os dois scripts têm trava contra rodar duas vezes na mesma aba.

### Como a extensão mede

`extensao/youtube-music/`, Manifest V3:

| Arquivo | Papel |
|---|---|
| `pagina.js` | Roda no contexto da página e lê `getVideoData()` do player (videoId, título, autor, anúncio) a cada 1 s |
| `conteudo.js` | Soma o tempo tocado a cada 1 s (só com o vídeo rodando e sem anúncio), detecta troca de música e repetição |
| `fundo.js` | Guarda os eventos em `chrome.storage.local` e envia a cada minuto para `POST /extensao/eventos` com `X-Extensao-Token` |
| `popup.*` | Colar o token, testar, ver o estado do envio e se alguma aba está sendo lida (`conteudo.js` grava a presença da aba a cada 5 s em `chrome.storage.local`; vale por 15 s) |

Eventos de uma reprodução (`idReproducao` gerado pela extensão):

- `inicio`: depois de 3 s ouvidos.
- `progresso`: a cada 20 s, se o tempo mudou, e ao fechar a aba.
- `fim`: ao trocar de música ou repetir. `pulada = true` quando parou antes de 90% e não chegou ao final.

O horário de início é calculado no servidor: `recebidoEm − segundosDesdeInicio`, para não depender do relógio do computador. Reenviar o mesmo evento não duplica (chave `usuario + id_extensao`) e o tempo só cresce (`max`).

### União com o coletor

Janela de 600 s, mesmo vídeo, a mais próxima primeiro, uma para uma:

- **Coletor primeiro:** a reprodução estimada vira a da extensão (fonte `extensao`, `tempo_exato = 1`, horário e tempo da extensão) e fica marcada `vista_pelo_coletor`.
- **Extensão primeiro:** quando o coletor detecta a mesma música, a detecção é descartada e a reprodução da extensão é marcada `vista_pelo_coletor`. A estimativa de tempo não mexe numa reprodução com tempo exato.
- **Takeout:** reprodução da extensão conta como já registrada (o Takeout não cria outra).

### Segurança do token

- Um token por aparelho, até 5 ativos por usuário. Guardado só o hash SHA-256 (`token_extensao_youtube_music`); o texto (`cxyt_` + 64 hex) só aparece na resposta da geração.
- O token só autentica `POST /api/v1/youtube-music/extensao/eventos` (`TokenExtensaoYoutubeMusicAuthenticator`, papel `ROLE_EXTENSAO_YOUTUBE_MUSIC`). Não lê nada e não abre outras rotas; o login normal não entra nessa rota.
- Limite de 60 lotes por minuto por token (`youtube_music_extensao`), 50 eventos por lote. Capa só de hosts do Google.
- Quem roubar o token só consegue inserir reproduções falsas na conta dona do token. Revogar no cartão corta na hora (a extensão passa a receber 401).

### Testes (12/11/2026)

Ambiente isolado (MySQL e app temporários): geração e limite de 5 tokens, nome vazio (422), token de outro usuário (404 na revogação, lista vazia), token errado (401), token em outra rota (401), login normal na rota da extensão (403), `inicio` → "tocando agora", `progresso` e `fim` com pulo, `fim` repetido sem duplicar, `progresso` atrasado sem diminuir tempo, evento inválido (422), união com linha estimada do coletor (virou uma só, sem duplicar na projeção), detecção do coletor descartada depois da extensão, revogação (401). O `conteudo.js` foi testado numa página simulada: pausa e anúncio não contam, troca de música fecha a anterior com pulo, repetição abre nova reprodução.
