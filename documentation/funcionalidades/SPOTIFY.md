# Spotify & Cápsula Sonora

> Desde o lote 186–205 a página é **Música** (`/musica`), que junta Spotify e YouTube Music. As regras de cálculo do Spotify continuam as deste documento; a página unificada, o seletor de fonte e a revisão estão em [MUSICA.md](MUSICA.md), e a coleta do YouTube Music em [YOUTUBE_MUSIC.md](YOUTUBE_MUSIC.md). Com `fonte = spotify`, os números são só do Spotify.

Este documento descreve a funcionalidade do Spotify no CirqueiraX, incluindo a sincronização com a Spotify Web API, a importação retroativa do histórico completo de reproduções, as regras de agregação da Cápsula Sonora e os procedimentos de uso e calibração.

---

## 1. Visão Geral

A funcionalidade do Spotify traz de volta para o usuário a experiência autêntica da antiga **Cápsula Sonora** do aplicativo móvel do Spotify (descontinuada na versão oficial), permitindo reviver mensalmente:
1. **Tempo Total Ouvido** em minutos e reproduções.
2. **Top Artistas** com contagem de reproduções, tempo, foto circular e movimento em relação ao mês anterior (subida, descida, permanência ou estreia).
3. **Top Músicas** com contagem de streams, tempo, capa oficial, álbum e movimento de ranking.
4. **Variedade Musical**: número de músicas distintas ouvidas e comparação percentual com o mês anterior.
5. **Histórico Diário**: gráfico de distribuição de minutos ouvidos por cada dia do mês.
6. **Métricas de Hoje e Últimos 7 Dias** com alternância de períodos e abas de faixas/artistas.
7. **Curiosidades**: horário de pico, dia mais frequente, dia mais longo, faixa mais repetida em um único dia e novos artistas descobertos.
8. **Tocando agora**: cartão ao vivo com capa, progresso e quantas vezes a música já foi ouvida.
9. **Recordes e sequências**, **evolução por mês**, **hábitos** (mapa dia × hora e concentração do gosto), **descobertas** e **resumo do ano** (detalhes na seção 7).
10. **Detalhe de artista e de música** e **imagem da Cápsula** para compartilhar.

---

## 2. Fontes de Dados e Sincronização

O sistema opera com duas origens de dados que se complementam e se deduplicam automaticamente:

| Origem | Mecanismo | Frequência / Prazo | Granularidade |
| :--- | :--- | :--- | :--- |
| **Coleta Periódica (API)** | OAuth 2.0 PKCE (`user-read-recently-played`) | A cada 5 minutos via Symfony Scheduler, e 20 s depois de cada troca de música com a página aberta | Últimas 50 faixas tocadas (minutos estimados pelo intervalo entre reproduções, ver abaixo) |
| **Importação de Arquivo** | Upload de `.json` ou `.zip` (`StreamingHistory*.json` / `Audio_*.json`) | Manual / sob demanda | Histórico exato em milissegundos (`msPlayed`) de até toda a conta |

### Sincronizar agora
- Com a conta conectada, o painel tem um botão discreto (ícone de atualizar) que roda na hora a mesma coleta da rotina de 5 minutos, só para a conta do usuário.
- `POST /api/v1/spotify/sincronizar` (`SincronizarAgoraSpotifyService` → `ColetarHistoricoRecenteSpotifyService::executarParaConta`) devolve `totalColetadas`, `totalNovas` e `totalDuplicadas`. O aviso mostra quantas músicas novas entraram.
- Cada coleta pede sempre as 50 últimas músicas, sem cursor `after`, e a deduplicação descarta as já gravadas. Assim, uma música que o Spotify registra com atraso, com horário anterior à última coletada, ainda entra.
- Com a página aberta, o cartão **Tocando agora** dispara uma sincronização silenciosa 20 s depois de cada troca de música.
- O Spotify só informa a música depois que ela termina. Músicas puladas ou muito curtas podem não aparecer em "tocadas recentemente", mesmo estando na playlist "Hoje" do app; elas entram ao importar o histórico estendido.
- **Artistas de cada música** (`artista_faixa_spotify`): uma linha por artista creditado em cada música (`codigo_faixa`, `posicao`, 0 = principal). A coleta grava os artistas que a API já devolve. Para o histórico importado, que só traz o artista principal, a rotina `SincronizarArtistasFaixasSpotifyMessage` roda a cada minuto e busca até 9 músicas sem artistas em `GET /tracks/{id}`, uma a cada 6 s. A ordem é por streams (reproduções de 30 s ou mais), das mais tocadas para as menos tocadas, e só entram músicas com **3 ou mais streams** (cerca de 3.500 músicas, 88% dos streams); as outras ficam só com o artista principal. A consulta em lote `GET /tracks?ids=` não existe mais para apps em modo de desenvolvimento (guia de fevereiro de 2026: buscar item por item).
- **Bloqueios do Spotify (429)**: o bloqueio vale para o app inteiro. Cada 429, da coleta ou da busca de artistas, é gravado em `bloqueio_spotify` com o `Retry-After`, a hora de liberação, quantas consultas de artistas foram feitas desde o bloqueio anterior e o ritmo usado, para medir o limite. Enquanto bloqueado, nem a coleta nem a busca chamam o Spotify, e isso continua valendo depois de um deploy (a janela fica no banco). Quando libera, a coleta das músicas recentes roda primeiro; a busca de artistas só volta depois de uma coleta bem-sucedida. Em modo de desenvolvimento o bloqueio pode passar de 20 horas, e o recently-played só guarda as últimas 50 músicas. O cliente do Spotify só espera o `Retry-After` quando ele é de até 10 s; acima disso, desiste na hora em vez de travar o processo. Se a música não existir mais, grava só o artista principal. Também dá para rodar na mão: `php bin/console app:spotify:artistas-faixas --limite=50`. Enquanto uma música não tem artistas gravados, ela conta só para o artista principal.
- **Contagem de consultas por origem**: toda chamada ao Spotify soma 1 em `consulta_spotify_hora` (hora UTC + origem: `coleta_historico`, `tocando_agora`, `capas`, `busca_artistas`, `autorizacao`). Cada novo bloqueio grava em `bloqueio_spotify.consultas_por_origem_ultimas24h` o total de cada origem nas últimas 24 h, para descobrir se o limite soma todas as chamadas do app ou só as de artistas.
- **Orçamento da busca de artistas**: no máximo `LIMITE_CONSULTAS_ARTISTAS_EM_24H = 300` consultas nas últimas 24 horas (janela móvel, contada no banco para sobreviver a deploy). Ao atingir, a busca espera as consultas antigas saírem da janela. Antes era 400 por dia de calendário: o contador zerava à meia-noite e a busca chegava a ~570 em 24 h, o que causou o bloqueio de 12/11 (cerca de 20 h). Ela também não roda se a última coleta das músicas recentes falhou (token ou API), e qualquer 429 a interrompe na hora. Tocando agora e capas também não consultam o Spotify enquanto houver bloqueio ativo (as capas caem nas fontes públicas).
- **Aviso de bloqueio**: `GET /api/v1/spotify/status` e o resumo do Dashboard devolvem `bloqueadoAte` (ISO) e `motivoBloqueio`. O painel do Spotify mostra "O Spotify bloqueou o app até HH:mm (horário de Brasília)…" e o Dashboard mostra o Spotify em âmbar com o estado **Bloqueado**, diferente de **Atrasado**.
- Se a API do Spotify falhar, a coleta devolve zero, igual à rotina agendada. O motivo fica só no log.

### Tempo ouvido nas reproduções da API
- A API de "tocadas recentemente" não informa quanto da música foi ouvido, só o momento em que ela terminou (`played_at`).
- O tempo ouvido é o intervalo entre o fim da reprodução anterior e o fim desta, limitado à duração da faixa (`EstimarTempoReproduzidoSpotifyService`). A reprodução anterior pode vir de qualquer fonte e é buscada no banco quando está fora do lote.
- Exemplo: música de 4 min, a anterior terminou 2 min antes, entram 2 min. Se o intervalo ficar abaixo de 30 s, ela não conta como stream.
- A primeira música de uma sessão (sem reprodução anterior próxima) e intervalos com pausa ficam limitados à duração da faixa, então podem contar a música inteira.
- Quando o arquivo de histórico é importado, o `ms_played` real substitui a estimativa.
- A migration `Version20261106120000` recalculou com a mesma regra as reproduções da API gravadas antes da mudança.

### Conexão da conta (OAuth)
- `GET /api/v1/spotify/oauth/url` gera a URL de login do Spotify. `POST /api/v1/spotify/oauth/concluir` recebe `code` e `state` na volta (`/spotify/callback`).
- O `state` é assinado com HMAC-SHA256 usando o `APP_SECRET` (`EstadoAutorizacaoSpotifyService`). Ele leva o id do usuário e a validade de 15 minutos, então não depende de cache no servidor.
- A tela de retorno envia cada `code` uma vez só e mostra a mensagem de erro que veio da API.
- Variáveis no `.env`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` e `SPOTIFY_REDIRECT_URI` (em produção, `https://x.cirqueira.com/spotify/callback`). Com o app em modo de desenvolvimento, só as contas em "User Management" no painel do Spotify podem autorizar.

### Regra de Deduplicação e Refinamento
- Quando um registro importado de arquivo bate no mesmo minuto de uma reprodução coletada via API, o sistema **substitui** a estimativa da API pelo tempo exato registrado pelo arquivo do Spotify (`msPlayed`), marcando a fonte como `arquivo_estendido` ou `arquivo_basico`.
- Reimportar o mesmo arquivo ou arquivos de períodos sobrepostos é totalmente seguro: registros repetidos são identificados e ignorados sem duplicação.
- Os horários são comparados em UTC, que é como ficam gravados. A tolerância vale só entre fontes diferentes: 90 s para o arquivo estendido e 180 s para o básico. Dentro da mesma fonte, só a mesma faixa no mesmo segundo é considerada repetida.
- Ao substituir uma reprodução da coleta, o arquivo estendido também ajusta o horário e a chave para os do arquivo.
- Registros com 0 ms tocados são descartados.
- O importador grava em lotes de 500. Para o histórico estendido completo (cerca de 100 mil registros), a importação leva uns 5 minutos.

---

## 3. Regras de Negócio da Cápsula Sonora

As métricas seguem sempre as regras do próprio Spotify, para os números baterem com os do app. O CirqueiraX não cria regra própria de contagem.

1. **Stream**: só conta como stream a reprodução com 30 segundos ou mais (`30.000 ms`). Rankings só listam o que teve ao menos um stream.
2. **Ordem dos rankings**: artistas, músicas e álbuns são ordenados por streams, como no Wrapped e nos Top Artists do Spotify. Os minutos só desempatam. Vale para cápsula, rankings, resumo do ano, recordes, hábitos, meses no top 5 e posição geral no detalhe.
3. **Crédito para todos os artistas da música**: cada stream e cada minuto contam inteiros para todos os artistas creditados na música, não só para o principal. Exemplo: Play (K-391, Alan Walker, Martin Tungevaag, Mangoo) conta para os quatro. O Spotify dá peso maior ao artista principal; aqui todos recebem o crédito completo, por escolha do usuário. Totais gerais e rankings de músicas não duplicam nada: cada reprodução continua contando uma vez.
4. **Minutos**: somam todo o tempo ouvido, inclusive reproduções com menos de 30 s, nos totais e nos rankings.
5. **Calendário em UTC**: mês e ano começam e terminam em UTC, como no Spotify. Os dias dentro de mês, ano e "desde sempre" (minutos por dia, dia recorde, maior repetição num dia, sequências) também são dias UTC, para a soma dos dias bater com o mês.
6. **Horário local onde o Spotify não define regra**: hora do dia e dia da semana (mapa de hábitos, horário de pico), "Hoje", "Últimos N dias", "Personalizado" e as datas exibidas seguem o horário de Brasília (`America/Sao_Paulo`).
7. **Mês em Andamento**: o mês corrente é exibido como "em andamento" na interface, recalculando suas métricas a cada nova coleta ou importação.
8. **Comparação com o Mês Anterior**:
   - Variação percentual de músicas distintas: `((músicas_mês_atual - músicas_mês_anterior) / músicas_mês_anterior) * 100`.
   - Variação de ranking (`movimento`): diferença de posições no top 5 em relação ao mês imediatamente anterior.
   - Flag de estreia (`isEstreia`): sinaliza se o artista ou música entrou no top 5 pela primeira vez no histórico recente.
8. **Tempo exibido em minutos**: como nos relatórios do Spotify, todo tempo ouvido aparece em minutos (ex.: `2.879 min`). Ao passar o mouse, um tooltip no visual do Spotify mostra o mesmo valor em horas (ex.: `47 horas e 59 minutos`). Valores abaixo de 1 hora não têm tooltip. Gráficos mostram minutos no eixo e minutos e horas no tooltip. A imagem PNG da Cápsula também usa minutos.
9. **Exportação CSV**: o frontend permite baixar uma planilha estruturada com BOM UTF-8 com os totais, rankings e histórico diário do mês selecionado.

---

## 4. Como Solicitar os Arquivos no Spotify

Caso deseje carregar seus meses passados para a Cápsula:
1. Acesse sua conta em [spotify.com/account/privacy](https://www.spotify.com/account/privacy).
2. Na seção **Baixar seus dados**:
   - **Dados da conta**: inclui o histórico do último ano (cerca de 5 dias úteis para entrega por e-mail).
   - **Histórico ampliado de streams**: histórico completo desde a criação da conta (até 30 dias para preparação).
3. Baixe o arquivo ZIP recebido por e-mail e envie diretamente na página `/spotify` pelo botão **Importar histórico**.

---

## 5. Resolução Automática de Capas e Fotos

- O sistema cataloga e armazena em cache as capas e fotos de perfil de artistas na entidade `ImagemSpotify`.
- Quando um registro do histórico antigo traz apenas os nomes de texto (sem código Spotify), um processo em segundo plano via Symfony Messenger (`BuscarImagemSpotifyMessage`) busca a capa na API com conferência de similaridade de strings (threshold 70) e tolerância de duração, evitando capas incorretas.
- A interface exibe placeholders neutros e atualiza dinamicamente as capas via polling reativo sem necessidade de recarregar a tela.

---

## 6. Diretrizes de Marca, Identidade Visual e Conformidade

### 6.1 Identidade Visual Autêntica e Paleta Oficial (Exceção de Design)

A página do Spotify (`/spotify` e suas telas de detalhe) é uma **exceção intencional de design** em todo o ecossistema CirqueiraX. Ela foi concebida para recriar com máxima fidelidade a experiência do aplicativo oficial do Spotify e da clássica Cápsula Sonora.

> **Regra Mandatória de Isolamento:** A feature do Spotify possui sua própria identidade visual e **nunca** deve ser mesclada ou sobrescrita pela paleta neutra/cinza/ardósia global da aplicação. Quaisquer scripts de geração de tema (`gerar-paleta-brand.sh`/`mjs`) ou refatorações visuais devem obrigatoriamente manter preservada a paleta oficial do Spotify.

| Token Semântico | Token de Cor | Hex Oficial | Uso na Interface |
| :--- | :--- | :--- | :--- |
| `spotify.fundo` | `cirqueira.spotify.fundo` | `#121212` | Superfície base da tela (preto fosco oficial Spotify) |
| `spotify.cartao` | `cirqueira.spotify.cartao` | `#1F1F1F` | Superfície base de cartões, listas e painéis de dados |
| `spotify.cartaoElevado` | `cirqueira.spotify.cartaoElevado` | `#252525` | Superfícies elevadas, hover de cartões, badges e bordas de separação |
| `spotify.textoPrincipal` | `cirqueira.spotify.textoPrincipal` | `#FFFFFF` | Títulos, métricas em destaque, valores e texto de alto contraste |
| `spotify.textoSecundario` | `cirqueira.spotify.textoSecundario` | `#B3B3B3` | Legendas, subtítulos, durações e metadados (contraste > 5:1) |
| `spotify.textoDesabilitado` | `cirqueira.spotify.textoDesabilitado` | `#6A6A6A` | Rótulos inativos ou controles desabilitados |
| `spotify.verde` | `cirqueira.spotify.verde` | `#1ED760` | Verde oficial Spotify: botões de ação principal, minutos e status |
| `spotify.verdeHover` | `cirqueira.spotify.verdeHover` | `#22E368` | Estado hover interativo dos botões em pílula |
| `spotify.azul` | `cirqueira.spotify.azul` | `#539DF5` | Destaque oficial para "Top Artista" e badges de artistas |
| `spotify.amarelo` | `cirqueira.spotify.amarelo` | `#FEE44F` | Destaque oficial para "Top Música" e posições do ranking |

### 6.2 Regras Estruturais de Design

- **Dark Mode Sempre Ativo**: A página é renderizada sob o wrapper `<TemaSpotify>`, que força modo escuro independente do tema claro ou escuro configurado no restante do sistema. Header e Sidebar continuam respeitando o tema global.
- **Tipografia Inter**: Carregada pontualmente para esta feature (`fontFamily="inter"`), respeitando a tipografia moderna do player.
- **Geometria dos Componentes**:
  - Botões de ação em pílula (`borderRadius="full"`).
  - Cartões com raio suave de 8px (`borderRadius="8px"`).
  - Capas de álbuns quadradas com 4px (`borderRadius="4px"`) e 8px no desktop.
  - Fotos de artista estritamente circulares (`borderRadius="full"`).

### 6.3 Conformidade com Diretrizes da Marca Spotify

- O logotipo do Spotify é exibido no rodapé e no painel de conexão em estrita conformidade com as diretrizes de marca (área de respiro, cores oficiais e links diretos para abertura no aplicativo com `Abrir no Spotify`).
- Nenhuma alteração, recorte ou sobreposição de texto é aplicada às capas de álbuns originais.


---

## 7. Análises

Todas seguem as regras da seção 3: calendário (mês e ano) em UTC, hora e dia da semana no horário de Brasília, stream a partir de 30 s, minutos somando todo o tempo ouvido, artistas, músicas e álbuns ordenados por streams, artistas creditados com todos os artistas da música. Uma música é identificada pelo nome e pelo artista principal, sem diferenciar maiúsculas.

| Seção | O que mostra | Regra |
| :--- | :--- | :--- |
| Tocando agora | Faixa atual, capa, progresso, vezes ouvida e primeira vez | `GET /me/player/currently-playing`. Consulta de novo perto do fim da faixa; sem conta conectada não aparece |
| Recordes e sequências | Sequência atual e maior sequência, dia e mês recorde, música mais ouvida, artista mais ouvido, maior repetição num dia | Sequência atual conta até ontem quando ainda não houve música hoje |
| Evolução por mês | Barras de 12, 24 ou 60 meses e comparação do mês atual | Compara até o mesmo dia do mês passado e do mesmo mês no ano anterior |
| Hábitos | Mapa dia × hora, % do tempo nos 5 artistas do topo, músicas ouvidas uma vez, streams por música, pulos e aleatório | Pulos e aleatório só contam reproduções vindas do histórico estendido |
| Descobertas | Artistas novos, músicas novas, redescobertas e obsessões | Novo = primeira reprodução dentro do período. Redescoberta = volta após 90 dias sem ouvir. Obsessão = 8 ou mais streams em 7 dias |
| Resumo do ano | Totais, top 5 de artistas, músicas e álbuns, mês mais intenso, momento favorito, maior sequência, descobertas e gráfico do ano | Ano em andamento aparece marcado |
| Detalhe | Totais, primeira e última vez, evolução mensal, meses no top 5, músicas e álbuns | `/spotify/artista?nome=` e `/spotify/musica?nome=&artista=` |
| Rankings | Hoje até 90 dias, mês, ano, sempre e personalizado; abas de músicas, artistas e álbuns | Álbum agrupado por nome e artista. Clicar num artista ou álbum abre as 5 músicas mais ouvidas no mesmo período do ranking; se houver mais, **Ver todas as músicas** abre um popup com a lista completa (`GET /api/v1/spotify/artistas/top-musicas` com `tipo`, `dias`, `ano`, `mes`, `inicio`, `fim`, `album` e `limite`, até 500) |

### Pulos e aleatório
- Vêm dos campos `skipped` e `shuffle` do histórico estendido (`Streaming_History_Audio_*.json`) e ficam em `reproducao_spotify.pulada` e `reproducao_spotify.aleatorio`. IP, país e plataforma não são guardados.
- A API e o arquivo básico não trazem esses campos. Reimportar o histórico estendido preenche as reproduções já gravadas.

### Gêneros
- Não há análise por gênero: desde as mudanças de fevereiro, a API devolve a lista de gêneros dos artistas vazia.

### Cache
- As análises ficam em cache por usuário por até 6 h (a chave muda a cada dia) e são invalidadas quando chegam reproduções novas (coleta ou importação) ou quando a conta é desconectada.

### Imagem da Cápsula
- O botão **Gerar imagem** monta no navegador um PNG 1080×1920 com o mês, os números, as 5 músicas e o artista do topo. As capas aparecem inteiras, sem corte, e a imagem leva o ícone do Spotify com "Dados do Spotify".

---

## Teste do player (removido)

Em 10/11/2026 uma página de teste do Web Playback SDK mostrou que, na rede do trabalho, o proxy bloqueia todos os endereços do Spotify usados pelo player (só a biblioteca em `sdk.scdn.co` carrega). O player não funciona lá. A página, a rota `/api/v1/spotify/player/*` e as permissões extras de reprodução foram removidas no tópico 187; a conta conectada continua funcionando com o token antigo e reconectar é opcional. A alternativa estudada é o player do YouTube (`YOUTUBE_PLAYER.md`).

