# Música — Spotify e YouTube Music juntos

> Página **Música**, rota `/musica`. Reúne o histórico do Spotify e do YouTube Music numa leitura só.
> Lote do roadmap: tópicos 186–205. Este documento cresce a cada tópico concluído.

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
- Spotify: o app é bloqueado (429) depois de cerca de 600 consultas de artistas; o bloqueio para também a coleta das músicas recentes.

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

1. Abra uma **janela anônima** no navegador do computador e entre em `music.youtube.com` com a sua conta.
2. Abra o DevTools (F12) → aba **Rede** (Network) e filtre por `browse`.
3. Clique em qualquer página do YouTube Music (por exemplo, Biblioteca) para aparecer uma requisição `browse`.
4. Clique na requisição → **Cabeçalhos** (Headers) → **Cabeçalhos da requisição** → copie tudo. No Chrome também serve botão direito → Copiar → **Copiar como cURL**.
5. Cole na tela de conexão do CirqueiraX.
6. **Feche a janela anônima sem clicar em Sair.** Sair invalida a sessão copiada.

A dica da janela anônima é comum em outras ferramentas que usam a mesma biblioteca: a sessão anônima não é usada depois, então o Google não troca os cookies dela. Ainda falta medir aqui quanto ela dura em comparação com a janela normal (no teste, a cópia da janela normal parou em cerca de 25 minutos).

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
- **Intervalo adaptativo**: 30 s enquanto houve novidade nos últimos 10 minutos, 120 s quando parado. Nunca menos de 15 s entre duas consultas da mesma conta.
- **Sem consultas sobrepostas**: antes de consultar, a conta recebe `proximaConsultaEm` daqui a 2 minutos e é gravada. Com um único worker na fila, as consultas da mesma conta ficam em série. Se um dia houver mais workers, essa reserva evita a maioria das sobreposições, mas não é um bloqueio rigoroso (o projeto não tem o componente Lock).
- **Detecção**: o histórico vem em ordem, sem horário. A consulta é comparada com o `snapshotTopo` (50 primeiros `videoId`) e conta como novo cada item que aparece antes do alinhamento com a lista anterior. A primeira consulta só grava o snapshot (a conexão já faz isso).
- **Gravação**: cria ou atualiza o `VideoYoutube` (título, canal, duração, capa) e cria a `ReproducaoYoutube` com `fonte = coletor`. A mais recente recebe o horário em que foi vista; quando várias aparecem de uma vez, cada anterior começa a duração dela antes da seguinte. Duplicatas são descartadas pela `chaveDeduplicacao`.
- **Tempo ouvido estimado**: ao criar, `msReproduzidos` = duração. Quando chega a seguinte, a anterior passa a `min(intervalo, duração)`. Sem seguinte, fica com a duração.
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

## Pendências do Gabriel

1. **Google Takeout:** em `takeout.google.com`, desmarcar tudo, marcar só YouTube e YouTube Music; em "Todos os dados do YouTube incluídos" deixar só o **histórico**; trocar o formato do histórico para **JSON**; exportar uma vez. Opcional: agendar a cada 2 meses por 1 ano.
2. **Exclusão automática:** conferir em `myactivity.google.com` se o histórico do YouTube estava ligado e se há exclusão automática. Prazo menor que 13 meses significa que outubro de 2025 já foi apagado.
3. **Marca do Spotify:** ler as diretrizes de marca e a política de desenvolvedor do Spotify para confirmar se dados do Spotify podem aparecer misturados com outro serviço sob o visual do Spotify. Conclusão: _pendente_.
4. **Atraso do histórico:** dar play em 5 músicas novas anotando o horário de cada play, para comparar com a hora em que o coletor viu cada uma. Mediana: _pendente_. Máximo: _pendente_. Precisa de um cookie válido no coletor de teste.
5. **Credenciais do teste OAuth:** apagar o cliente OAuth do teste no Google Cloud e revogar o acesso em myaccount.google.com → Segurança → Apps de terceiros. As variáveis `YTMUSIC_CLIENT_ID` e `YTMUSIC_CLIENT_SECRET` já foram removidas do `.env` do servidor.
6. **Chave da YouTube Data API:** no Google Cloud, num projeto separado do cliente OAuth do teste, ativar a YouTube Data API v3, criar uma chave de API restrita só a essa API e colocar em `YOUTUBE_API_KEY` no `.env` do servidor. Sem ela, os detalhes dos vídeos não são buscados.
7. **Preço da OpenAI:** conferir na página de preços o valor por milhão de tokens do modelo em `OPENAI_MODELO_TEXTO` e ajustar `OPENAI_PRECO_ENTRADA_POR_MILHAO` e `OPENAI_PRECO_SAIDA_POR_MILHAO` se for diferente de 0,75 e 4,50.
8. **Confirmar as decisões** marcadas como proposta padrão na tabela acima.

## Limpeza do teste

Só depois do tópico 192 estar em produção coletando: parar e remover o contêiner `ytmusic_teste_coletor` e apagar `/root/ytmusic_teste`.

## Fora do escopo

Player próprio dentro do CirqueiraX (M134); extensão de navegador; "tocando agora" do YouTube Music; gêneros; podcasts; YouTube comum depois da troca de hábito; relatórios de TV e outros aparelhos.
