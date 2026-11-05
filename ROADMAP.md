# Roadmap — Spotify e Cápsula Sonora

> Substitua este arquivo na raiz (`ROADMAP.md`) a cada novo lote.
> O histórico concluído não fica aqui — ele vive em `documentation/progresso/`.
> Lote anterior: Livros em Áudio (tópicos 141–160), concluído.
> Spec: [documentation/progresso/README.md](documentation/progresso/README.md) · depois de preencher: `make progresso`
> Leia primeiro a seção "Premissas e decisões da conversa" no início do Detalhamento. Ela vale para todos os tópicos.

**Numeração:** tópicos 161–185.

## Índice

| # | Tópico |
|---|---|
| 161 | Preparação do app no painel do Spotify e variáveis de ambiente |
| 162 | Infra — SpotifyClient com tratamento de limite de requisições |
| 163 | Entidade ContaSpotify, enum de status e migration |
| 164 | Serviço de tokens — troca do code e renovação com lock |
| 165 | Endpoints de conexão — url, concluir, status e desconectar |
| 166 | Entidade ReproducaoSpotify, enum de fonte e migration |
| 167 | Coleta do histórico recente com cursor e deduplicação |
| 168 | Rotina de coleta no Scheduler a cada 30 minutos |
| 169 | Spotify no status das integrações e alerta de coleta parada |
| 170 | Importação do histórico — leitura dos arquivos básico e estendido |
| 171 | Importação — deduplicação com tolerância e prioridade sobre a API |
| 172 | Endpoint e processamento assíncrono da importação |
| 173 | Agregações por mês no Repository |
| 174 | Regras da Cápsula — streams, fuso de Brasília e comparação com o mês anterior |
| 175 | Endpoints da Cápsula Sonora e Serializer |
| 176 | Endpoints de Hoje, Semana e Curiosidades |
| 177 | Catálogo de capas e fotos — entidade e busca por código |
| 178 | Busca de capa por nome e preenchimento em segundo plano |
| 179 | Frontend — estrutura da feature spotify (types, api, hooks) |
| 180 | Frontend — paleta spotify, tokens e wrapper da página |
| 181 | Frontend — vincular, retornar do Spotify, reconectar e desconectar |
| 182 | Frontend — importação do arquivo de histórico |
| 183 | Frontend — página /spotify com Hoje, Semana e Curiosidades |
| 184 | Frontend — seção Cápsula Sonora com seletor de mês |
| 185 | Calibração com os prints, teste end-to-end e documentação atualizada |

## Checklist

- [x] **161. Preparação do app no painel do Spotify e variáveis de ambiente**
- [x] **162. Infra — SpotifyClient com tratamento de limite de requisições**
- [x] **163. Entidade ContaSpotify, enum de status e migration**
- [x] **164. Serviço de tokens — troca do code e renovação com lock**
- [x] **165. Endpoints de conexão — url, concluir, status e desconectar**
- [x] **166. Entidade ReproducaoSpotify, enum de fonte e migration**
- [x] **167. Coleta do histórico recente com cursor e deduplicação**
- [x] **168. Rotina de coleta no Scheduler a cada 30 minutos**
- [x] **169. Spotify no status das integrações e alerta de coleta parada**
- [x] **170. Importação do histórico — leitura dos arquivos básico e estendido**
- [x] **171. Importação — deduplicação com tolerância e prioridade sobre a API**
- [x] **172. Endpoint e processamento assíncrono da importação**
- [x] **173. Agregações por mês no Repository**
- [x] **174. Regras da Cápsula — streams, fuso de Brasília e comparação com o mês anterior**
- [x] **175. Endpoints da Cápsula Sonora e Serializer**
- [x] **176. Endpoints de Hoje, Semana e Curiosidades**
- [x] **177. Catálogo de capas e fotos — entidade e busca por código**
- [x] **178. Busca de capa por nome e preenchimento em segundo plano**
- [x] **179. Frontend — estrutura da feature spotify (types, api, hooks)**
- [x] **180. Frontend — paleta spotify, tokens e wrapper da página**
- [x] **181. Frontend — vincular, retornar do Spotify, reconectar e desconectar**
- [x] **182. Frontend — importação do arquivo de histórico**
- [x] **183. Frontend — página /spotify com Hoje, Semana e Curiosidades**
- [x] **184. Frontend — seção Cápsula Sonora com seletor de mês**
- [x] **185. Calibração com os prints, teste end-to-end e documentação atualizada**

## Detalhamento

### Premissas e decisões da conversa (valem para todos os tópicos)

**Objetivo.** A Cápsula Sonora saiu do aplicativo do Spotify. O CirqueiraX vai se vincular à conta do Spotify e reproduzir o que ela mostrava: tempo ouvido no mês em minutos, músicas e artistas mais ouvidos, quantidade de músicas diferentes e comparação com o mês anterior, para o mês atual e os meses passados.

**Página.** Uma página nova, `/spotify`, com três partes: (1) métricas de hoje e da semana, (2) curiosidades, (3) a seção "Cápsula Sonora", com o mês atual e os anteriores. Só essa página tem o visual do aplicativo do Spotify (escuro, verde, cartões, botões em pílula). Sidebar e Header continuam sendo os do sistema.

**Vínculo.** Botão "Vincular ao Spotify", que leva à tela de permissões do Spotify. O usuário clica em "Aceito" e volta sozinho ao CirqueiraX. Não há copiar e colar código: esse fluxo manual existe só no Google Fotos, porque foi feito para `localhost`. O login do CirqueiraX continua sendo usuário e senha, e o Spotify é só um vínculo. Os escopos são mínimos e só de leitura. O sistema nunca pede permissão para controlar o player, mexer em playlists ou na biblioteca (o app "I Love This Song", que o usuário mostrou, pede tudo isso, e o CirqueiraX não deve).

**Duas fontes de dados.** (a) Coleta pela API, que só vale a partir do dia da conexão. (b) Arquivos exportados da conta do Spotify, que trazem o passado. A API devolve só as últimas 50 faixas e não informa o tempo realmente ouvido, então o sistema estima pela duração da faixa. O arquivo exportado traz o tempo exato tocado. Quando as duas fontes cobrem o mesmo período, o arquivo prevalece.

**Retroativo.** O usuário já tem o histórico até julho de 2026 e pediu "Dados da conta" no Spotify. Esse pacote inclui o histórico de streams do último ano, com prazo de cerca de 5 dias, e cobre de agosto até a data do pedido. Por isso o "Histórico ampliado de streams" (até 30 dias) não é necessário, nem as "Informações técnicas de registro". Os arquivos antigos, até julho, também podem ser importados, e o que se repetir é ignorado.

**Buracos.** Os dias entre a data do pedido do arquivo e o dia em que a coleta pela API começar só se fecham com um segundo pedido de dados, um ou dois meses depois. Reimportar nunca duplica.

**Regras do Spotify para o modo de desenvolvimento.** O dono do app precisa ter Premium ativo (se a assinatura vencer, o app para até reassinar). Até 5 usuários podem ser cadastrados. As consultas de histórico recente e de itens mais ouvidos continuam disponíveis depois das mudanças de fevereiro de 2026. A busca em lote de faixas e artistas foi removida, então cada item exige uma consulta. O limite de resultados da busca caiu para 10. Campos como popularidade de faixa e seguidores de artista foram removidos das respostas, e nenhuma tela pode depender deles.

**Regras de marca e política do Spotify.** O nome do app não pode começar com "Spotify" nem ser parecido, e o logo do CirqueiraX não pode lembrar o do Spotify. Todo conteúdo do Spotify exibido leva atribuição com o logo e um link de volta ("Abrir no Spotify"). Capas de álbum não podem ser cortadas, borradas, distorcidas nem receber texto, logo ou controles por cima, e usam cantos de 4px (8px em tela grande). Deve existir um jeito simples de desconectar, e ao desconectar os dados pessoais coletados pela API são apagados. A política proíbe replicar uma experiência central do Spotify sem permissão e exige valor próprio, o que estatísticas pessoais dentro de um sistema pessoal atendem. Uma cláusula sobre "métricas derivadas" não teve o alcance confirmado, e a decisão fica no tópico 161. Os arquivos exportados são dados pessoais do próprio usuário e ficam fora da política da API.

**Design.** Os tokens foram medidos nos prints da Cápsula e conferidos com referências de terceiros: fundo `#121212`, cartão `#1F1F1F`, cartão elevado `#252525`, texto `#FFFFFF`, texto secundário `#B3B3B3`, verde `#1ED760` (números de minutos e ações), azul `#539DF5` (artista mais ouvido) e amarelo `#FEE44F` (música mais ouvida, títulos e posições do ranking). A fonte do Spotify (Circular) é proprietária, então a substituta é a Inter. O `DESIGN.md` veta estilos únicos por página e hex, então esta página entra como exceção documentada, com paleta própria gerada e zero hex nos componentes. O `DESIGN.md` ainda cita HeroUI e `className`, mas os documentos mais novos (`FRONTEND.md` e `PARA-IA.md`) mandam usar Chakra. Seguir os mais novos.

**Regras do projeto que valem em todos os tópicos (PARA-IA.md).** Nomes em português. Zero comentários no código. O Controller é criado primeiro e só chama Service. Toda consulta fica no Repository. HTTP externo e disco só em `src/Infra/`. DTO só carrega dados. Exceções por contexto, com métodos estáticos e mensagens completas em português. Constantes em vez de valores soltos. Dependências por injeção, sem `$_ENV` no código. Migration só via `make doctrine-diff`. Serializer sempre, nunca entidade crua. No frontend: sem `useEffect`, sem `<div>` cru, sem hex, sem `any`. Rodar `make lint-all` antes de fechar cada tópico. Commit e push só com `make push`, sem assinatura de IA.

---

### Tópico 161 — Preparação do app no painel do Spotify e variáveis de ambiente

**O que existe hoje:** o CirqueiraX não tem nenhuma integração com o Spotify. A Cápsula Sonora saiu do aplicativo e os meses antigos não podem mais ser consultados lá. Só existe a integração com o Google Fotos como referência de OAuth.

**Por que importa:** sem o app registrado não há OAuth. As regras do modo de desenvolvimento (dono Premium, até 5 usuários) e os termos do Spotify definem o que pode ser construído e como. Descobrir isso depois de implementar custa retrabalho.

**O que precisa acontecer:**
- Criar o app no painel de desenvolvedores do Spotify com a conta do usuário. O nome não pode começar com "Spotify" nem ser parecido (sugestão: CirqueiraX Stats). Tipo de uso: Web API.
- Cadastrar os endereços de retorno: em produção, `https://x.cirqueira.com/spotify/callback`; em desenvolvimento, o loopback com IP, `http://127.0.0.1:4012/spotify/callback` (porta do Vite). Pelo que se sabe, o Spotify não aceita mais `localhost` nem HTTP fora do loopback, mas conferir a regra vigente no painel.
- Em "User Management" do app, cadastrar o e-mail do usuário (limite de 5).
- Definir `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` e `SPOTIFY_REDIRECT_URI` no `.env` e no `.env.local` de produção, injetadas pelo `services.yaml`. O segredo nunca vai para o frontend nem para logs. Passar as variáveis também pelo `docker-compose.prod.yaml`, se for o caso.
- Fixar os escopos: `user-read-recently-played` é obrigatório. `user-top-read` e `user-read-currently-playing` só entram se algum cartão realmente usar (a Cápsula é calculada pelo banco, então o top do Spotify não é necessário; o "tocando agora" é opcional no tópico 183). Documentar a lista final e o motivo de cada escopo.
- Ler os Developer Terms completos e a política do desenvolvedor e registrar aqui duas decisões: (a) pode-se guardar cópia das capas e fotos, ou só o endereço da imagem? (b) a cláusula sobre "métricas derivadas" alcança estatísticas pessoais de um único usuário? Na dúvida, vale o plano mais conservador: guardar só o endereço das imagens.

**Não fazer:** pedir permissões de controle do player, playlists ou biblioteca. Usar o Spotify como forma de login do CirqueiraX.

**A confirmar:** se a conta do Spotify do usuário é Premium. Sem Premium o app não funciona no modo de desenvolvimento.

---

### Tópico 162 — Infra — SpotifyClient com tratamento de limite de requisições

**O que existe hoje:** `src/Infra/` tem clientes para Google Fotos, Syncthing, yt-dlp e armazenamento, mas nenhum para o Spotify.

**Por que importa:** pela regra do projeto, chamada HTTP externa só vive na camada de Infra. O Spotify responde 429 com `Retry-After` quando o limite é excedido, e o modo de desenvolvimento tem limites mais baixos.

**O que precisa acontecer:**
- `SpotifyClient` em `src/Infra/Spotify/`, estendendo o `Client` base (Guzzle), com contrato em `src/Interface/` por ser fronteira de integração externa. Os endereços (autorização `https://accounts.spotify.com/authorize`, token `https://accounts.spotify.com/api/token`, API `https://api.spotify.com/v1`) entram como parâmetros do `services.yaml`.
- Fluxo de autorização por código (Authorization Code) com o segredo do app, sempre no servidor.
- Métodos: trocar o code por tokens; renovar o token; buscar o perfil (`GET /me`, só nome e foto); listar reproduções recentes (`GET /me/player/recently-played`, até 50 itens, com o cursor `after` em milissegundos Unix; conferir os parâmetros na documentação); obter faixa por código (`GET /tracks/{id}`); obter artista por código (`GET /artists/{id}`); buscar faixas por texto (`GET /search`, no máximo 10 resultados).
- DTOs de resposta que mapeiam o JSON externo antes de entrar no negócio: reprodução recente (momento, faixa, artistas, álbum e imagens, duração), faixa, artista e tokens.
- Limite de requisições: em resposta 429, respeitar o `Retry-After` (em segundos) com no máximo N tentativas (constante) e espera progressiva, no padrão do `GoogleFotosAPI`. Esgotadas as tentativas, lançar exceção de contexto.
- `SpotifyException` em `src/Exception/Spotify/`, com métodos estáticos descritivos em português para: limite excedido, token inválido ou expirado (401), conta fora da lista do modo de desenvolvimento (403), falha temporária do Spotify (5xx) e resposta inesperada. A mensagem bruta do Spotify nunca vai para a resposta HTTP.
- Timeouts e número de tentativas como constantes no topo da classe.

**Não fazer:** usar endpoints removidos (busca em lote de faixas e artistas, top tracks do artista, navegação por categorias, perfil de outros usuários). Depender de campos removidos (popularidade, seguidores do artista, país e e-mail do usuário).

---

### Tópico 163 — Entidade ContaSpotify, enum de status e migration

**O que existe hoje:** só existe `ContaGoogleFotos`, que é de conta única e fica fora do vínculo com o usuário.

**Por que importa:** os tokens precisam ficar guardados com segurança, e a conta precisa estar ligada ao usuário do CirqueiraX, como `Audio` e `LivroAudio` já fazem. Cada pessoa vê só os próprios dados.

**O que precisa acontecer:**
- Entidade `ContaSpotify` com UUID v7, uma por `Usuario` (índice único), com: código e nome de exibição da conta Spotify, foto do perfil (opcional), tokens protegidos pelo mesmo serviço de criptografia usado no refresh token do Google Fotos, validade do access token, escopos concedidos, `conectadoEm`, `ultimaColetaEm`, cursor da última reprodução lida (milissegundos) e `erroMotivo`.
- Enum `StatusContaSpotify` com `conectada`, `reconectar` e `desconectada`, com predicados `is*` (`isConectada`, `isReconectar`, `isDesconectada`).
- Métodos de intenção de domínio na entidade: conectar, renovar tokens, marcar como reconectar, desconectar (limpa os tokens), registrar coleta (atualiza o cursor e a data). Mais o predicado `isTokenExpirado`, com margem em constante.
- `ContaSpotifyRepository` com `salvar`, `remover`, `flush`, `buscarDoUsuario` e `listarConectadas`.
- Migration gerada por `make doctrine-diff`, revisada e validada com `make doctrine-validate`.
- Getters sem o prefixo `get`, como nas demais entidades.

**Não fazer:** devolver tokens em qualquer Serializer. Guardar a senha ou outros dados pessoais da conta Spotify.

---

### Tópico 164 — Serviço de tokens — troca do code e renovação com lock

**O que existe hoje:** não há fluxo OAuth do Spotify no sistema. O Google Fotos tem `GoogleFotosOAuthService` e o lock de arquivo nas escritas.

**Por que importa:** o access token dura 1 hora, dois workers podem tentar renová-lo ao mesmo tempo, e o Spotify pode devolver um novo refresh token na renovação. Sem cuidado, a conta se desconecta sozinha.

**O que precisa acontecer:**
- `GerarUrlAutorizacaoSpotifyService`: monta a URL de consentimento com os escopos do tópico 161 e um `state` aleatório de uso único, guardado em cache com validade curta (da ordem de 10 minutos) e amarrado ao usuário logado.
- `ConcluirAutorizacaoSpotifyService`: valida o `state` (existe, não expirou, pertence ao usuário e é consumido), troca o code pelos tokens no servidor com o segredo do app, busca o perfil e grava a `ContaSpotify`. Dispara a primeira coleta ao concluir.
- `ObterTokenValidoSpotifyService`: garante um token válido antes de cada chamada. Renova quando faltar menos que a margem em constante, usando lock (como o do Google Fotos) para impedir renovação simultânea. Se o Spotify devolver um novo refresh token, grava-o.
- Quando a renovação falhar de forma definitiva (acesso revogado, Premium vencido, `invalid_grant`), marcar a conta como `reconectar`, com o motivo, e não tentar de novo até o usuário reconectar.
- Exceções de contexto para `state` inválido ou expirado, autorização negada e falha na troca de tokens.

**A confirmar:** o que fazer se o usuário reconectar com outra conta Spotify. Proposta: bloquear e pedir que desconecte antes, para não misturar históricos de contas diferentes.

---

### Tópico 165 — Endpoints de conexão — url, concluir, status e desconectar

**O que existe hoje:** o Google Fotos tem `oauth/url`, `oauth/concluir`, `status` e `desconectar`. O Spotify não tem nada.

**Por que importa:** é o que faz o botão "Vincular ao Spotify" funcionar de ponta a ponta, e atende à exigência da política de permitir desconectar a conta a qualquer momento.

**O que precisa acontecer:**
- `SpotifyController` em `src/Controller/Spotify/`, criado primeiro, estendendo `DefaultController`. Todas as rotas exigem JWT.
- `GET /api/v1/spotify/oauth/url` devolve `{ url }`.
- `POST /api/v1/spotify/oauth/concluir` recebe `{ code, state }`, conclui e devolve o status da conexão. Erros previstos: `state` inválido ou expirado, autorização negada pelo usuário, conta fora da lista do modo de desenvolvimento.
- `GET /api/v1/spotify/status` devolve se está conectada, o status, nome de exibição, foto, `conectadoEm`, `ultimaColetaEm` e escopos.
- `POST /api/v1/spotify/desconectar` remove os tokens e apaga as reproduções de fonte `api` do usuário (as importadas do arquivo permanecem). O que fazer com o catálogo de imagens segue a decisão do tópico 161.
- DTOs validados com `#[Assert]`, Serializer próprio que nunca devolve tokens, e exceções de contexto com mensagens completas em português.

**Não fazer:** expor o segredo do app, os tokens ou a mensagem bruta do Spotify na resposta.

---

### Tópico 166 — Entidade ReproducaoSpotify, enum de fonte e migration

**O que existe hoje:** nenhum histórico de reprodução é guardado. A API só devolve as últimas 50 faixas tocadas.

**Por que importa:** minutos por mês, rankings e comparações só existem se o histórico ficar no banco. É a base de toda a Cápsula.

**O que precisa acontecer:**
- Entidade `ReproducaoSpotify` com UUID v7 e `Usuario`. Campos: código da faixa (opcional, pois o arquivo básico não traz), nome da faixa, artista principal, código do artista principal (opcional), demais artistas, álbum, `duracaoMs` (opcional), `msReproduzidos`, `tocadaEm` em UTC, fonte e chave de deduplicação.
- A chave de deduplicação é o código da faixa quando houver, ou o nome da faixa e do artista normalizados (minúsculas, sem acentos, espaços normalizados, sem remover sufixos como "Remix"), combinada com o `tocadaEm`. Índice único por usuário e chave, para impedir duplicidade dentro da mesma fonte.
- Enum `FonteReproducaoSpotify` com `api`, `importacao_basica` e `importacao_estendida`. Métodos: `isTempoExato()` (verdadeiro nas importações) e uma prioridade (estendida, depois básica, depois api), usada na reconciliação do tópico 171.
- Índices por (usuário, `tocadaEm`), por (usuário, artista principal) e por (usuário, faixa).
- `ReproducaoSpotifyRepository` com `salvar`, `flush` em lote e consulta de chaves já existentes. As agregações ficam no tópico 173.
- Migration por `make doctrine-diff`, revisada e validada.

**Decidido na conversa:** o artista de cada reprodução é o principal, porque o arquivo exportado só traz um nome de artista por faixa. Se a calibração mostrar que a Cápsula contava todos os artistas, ajustar no tópico 174.

---

### Tópico 167 — Coleta do histórico recente com cursor e deduplicação

**O que existe hoje:** não há coleta. O que for ouvido e não for coletado não pode ser recuperado depois pela API.

**Por que importa:** é a fonte de tudo que vem daqui para frente. A API não informa o tempo realmente ouvido, só a faixa e o momento.

**O que precisa acontecer:**
- Service de coleta (um caso de uso coeso), que para cada conta conectada: obtém um token válido (tópico 164), pede as reproduções após o cursor guardado (na primeira vez, sem cursor, vêm as últimas 50), converte cada item para `ReproducaoSpotify` com a fonte `api`, grava só as novas e atualiza o cursor para o momento da mais recente.
- O tempo reproduzido é estimado pela duração da faixa. Documentar a limitação: faixas puladas cedo podem superestimar os minutos, e o arquivo exportado corrige isso depois.
- Verificação de duplicidade em lote, com uma única consulta de chaves existentes (sem uma consulta por item). Gravação em lote com um único `flush` ao final.
- A capa que já vem na resposta do Spotify deve ser aproveitada pelo catálogo de imagens (tópico 177), sem consulta extra.
- Falhas esperadas tratadas por exceções de contexto, e erros de programação falham rápido, sem `catch` genérico. Se o token falhar, a conta vira `reconectar` e a coleta daquela conta é pulada. Se vier 429, deixar para a próxima rodada.
- Retornar um DTO de saída com a contagem de novas, ignoradas e o novo cursor, em vez de array solto.

**Não fazer:** coletar podcasts ou de outras contas. Tocar ou controlar qualquer coisa no Spotify.

---

### Tópico 168 — Rotina de coleta no Scheduler a cada 30 minutos

**O que existe hoje:** o `Schedule.php` só roda tarefas diárias (limpar vídeos antigos e expirar áudios). O processo `scheduler_default` já está no Supervisor de desenvolvimento e produção.

**Por que importa:** com 50 faixas por consulta, um intervalo de 30 minutos não perde reproduções (50 faixas equivalem a algumas horas de escuta). O cursor também cobre o caso de o servidor ficar desligado por um tempo, desde que não passe de 50 faixas.

**O que precisa acontecer:**
- Mensagem `SincronizarHistoricoSpotifyMessage` e handler que só delega ao service do tópico 167, sem regra de negócio.
- Entrada `RecurringMessage::every('30 minutes', ...)` no `Schedule.php`. O schedule já é `stateful` e usa `processOnlyLastMissedRun(true)`.
- A mensagem processa todas as contas conectadas, ignora as marcadas como `reconectar` e registra `ultimaColetaEm`.
- Decidir em qual fila a mensagem roda: a regra atual envia toda `App\Message\*` para `async`, e isso é suficiente para a coleta. A importação do tópico 172 é que pode pedir fila própria.

---

### Tópico 169 — Spotify no status das integrações e alerta de coleta parada

**O que existe hoje:** o card `StatusIntegracoes` do Dashboard mostra Syncthing, Pipeline, Google Fotos e Armazenamento.

**Por que importa:** se a coleta parar por algumas horas durante uma escuta longa, faixas se perdem, e hoje ninguém seria avisado. O mesmo vale para uma conta que pediu para reconectar.

**O que precisa acontecer:**
- Incluir o Spotify em `GET /api/v1/dashboard/resumo` e no card: estado da conexão (conectada, reconectar, desconectada), data da última coleta e um alerta quando passar do limite sem coletar, definido em constante (da ordem de 3 horas).
- Quando a conta estiver em `reconectar`, o card leva ao botão de reconectar da página `/spotify`.
- Seguir o padrão visual das demais integrações do card (as cores do sistema, não as do Spotify).

---

### Tópico 170 — Importação do histórico — leitura dos arquivos básico e estendido

**O que existe hoje:** não há leitura de arquivos do Spotify. O usuário tem histórico até julho de 2026 e pediu os "Dados da conta" (último ano, cerca de 5 dias). O histórico ampliado leva até 30 dias e cobre a vida toda da conta.

**Por que importa:** é o único jeito de recuperar os meses passados, e traz o tempo exato tocado de cada faixa, que a API não dá.

**O que precisa acontecer:**
- Cliente de Infra (com contrato em `src/Interface/`) que lê o ZIP ou o JSON em fluxo, sem carregar tudo na memória.
- Formato básico ("Dados da conta"): histórico de streams do último ano, com nome da faixa, artista, momento em UTC (provavelmente com precisão de minuto) e tempo tocado. Não traz código de faixa. Formato estendido: momento em UTC, tempo tocado, nome da faixa, artista, álbum e código da faixa, além de dados de podcast. Os nomes exatos dos arquivos e dos campos devem ser confirmados com o arquivo real do usuário.
- Cada linha vira um DTO de saída dedicado, sem acesso a disco no DTO.
- Descartar episódios de podcast.
- Privacidade: o ZIP "Dados da conta" contém muitos outros arquivos (pagamentos, buscas, dados pessoais). O leitor deve abrir só os arquivos de histórico de streams e nunca ler nem guardar os demais. Não persistir endereço de IP, país, plataforma nem user agent, mesmo que o arquivo estendido os traga.
- Aceitar também um arquivo JSON avulso e os arquivos antigos do usuário (até julho de 2026).
- Exceção de contexto para arquivo inválido, sem histórico de streams e formato desconhecido.

**Não fazer:** gravar qualquer dado que não seja necessário para a Cápsula. Guardar o ZIP original depois de processar.

---

### Tópico 171 — Importação — deduplicação com tolerância e prioridade sobre a API

**O que existe hoje:** não existe importação nem regra de reconciliação entre fontes.

**Por que importa:** um arquivo novo repete meses já importados e já coletados pela API. O horário da API e o do arquivo podem diferir por alguns segundos (ou, no formato básico, por até um minuto), mesmo para a mesma reprodução. Sem tolerância, o mesmo play seria contado em dobro.

**O que precisa acontecer:**
- Comparar cada linha importada com as reproduções já existentes da mesma faixa (pelo código, ou por nome e artista normalizados no formato básico) dentro de uma janela de tempo definida em constante. Os valores iniciais da janela (por exemplo, 90 segundos no formato estendido e alguns minutos no básico) devem ser ajustados na calibração do tópico 185, comparando um arquivo e a coleta do mesmo dia.
- Regra de prioridade: estendida vence básica, que vence api. Se a reprodução existente for da API e a importada for exata, atualiza o tempo e a fonte e mantém o mesmo registro (substitui a estimativa). Se for igual ou de menor prioridade, ignora.
- Reimportar o mesmo arquivo é idempotente: nada muda.
- Processar em lotes, com `flush` por lote (tamanho em constante), para não estourar a memória em arquivos grandes.
- Devolver um DTO de saída com os totais: lidos, novos, ignorados e substituídos.
- Não apagar reproduções de fora do período coberto pelo arquivo.
- Documentar o limite conhecido: duas reproduções legítimas da mesma faixa dentro da janela de tolerância podem ser tratadas como uma. É raro e aceitável.

**A confirmar:** se o momento da API (`played_at`) é o início ou o fim da reprodução. A calibração responde, e a janela cobre os dois casos.

---

### Tópico 172 — Endpoint e processamento assíncrono da importação

**O que existe hoje:** não há endpoint de upload de histórico. O padrão de upload multipart e de processamento em fila existe no Upload Manual e nos Livros em Áudio.

**Por que importa:** arquivos de histórico podem ser pesados e não podem travar a requisição. Importações grandes também não devem atrasar a fila de mídias.

**O que precisa acontecer:**
- `POST /api/v1/spotify/importacoes` recebe o arquivo (ZIP ou JSON, multipart, tamanho máximo em constante), usando `fromRequest()` como nos outros uploads com arquivo. `GET /api/v1/spotify/importacoes/{uuid}` informa o progresso e o resultado.
- Entidade `ImportacaoSpotify` (UUID v7, usuário, status, contagens de lidos, novos, ignorados e substituídos, `erroMotivo`, datas) com enum `StatusImportacaoSpotify` (`enviada`, `processando`, `concluida`, `erro`), repositório e migration por `make doctrine-diff`.
- `ImportarHistoricoSpotifyMessage` com handler que só delega. Avaliar uma fila dedicada (como a `livro_audio`): transporte novo em `messenger.yaml`, roteamento da mensagem, worker nos dois Supervisors (desenvolvimento e produção) com limite de memória e reinício automático.
- O arquivo enviado fica numa pasta temporária, escrita e removida por um cliente de Infra de armazenamento (sem `mkdir`, `copy` ou `unlink` no service), e é apagado ao final, com sucesso ou erro.
- Uma importação por vez por usuário, para evitar corrida na deduplicação.
- Serializer próprio e exceções de contexto.

---

### Tópico 173 — Agregações por mês no Repository

**O que existe hoje:** o repositório de reproduções ainda não tem consultas de agregação.

**Por que importa:** pelas regras do projeto, toda consulta vive no Repository. É daqui que saem todos os números da Cápsula.

**O que precisa acontecer:**
- Métodos no `ReproducaoSpotifyRepository` para: soma de milissegundos por mês e por dia; contagem de reproduções por faixa no mês (com o corte de stream do tópico 174); soma por artista; número de faixas distintas por mês; lista dos meses que têm dados; e a posição de cada faixa e artista nos meses anteriores (para movimento e "meses no top 5").
- Todas as consultas filtram pelo usuário e cortam o mês e o dia no fuso `America/Sao_Paulo` (os dados ficam em UTC). A conversão de fuso vive em um lugar só.
- Atenção ao desempenho: com cerca de 1.500 a 1.800 músicas diferentes por mês, conferir os índices do tópico 166 e usar agregação no banco, nunca carregar as reproduções em memória.
- Retornos estruturados em DTOs ou arrays tipados por contrato, sem arrays anônimos.

---

### Tópico 174 — Regras da Cápsula — streams, fuso de Brasília e comparação com o mês anterior

**O que existe hoje:** só restam os prints da Cápsula que o usuário guardou, de abril, maio e junho de 2026.

**Por que importa:** é a regra que faz os números baterem com o que o Spotify mostrava. Sem ela, os meses antigos parecem plausíveis mas errados.

**O que precisa acontecer:**
- `CalcularCapsulaMensalService` devolvendo um DTO de saída com:
  - Tempo ouvindo, em minutos.
  - Artista mais ouvido e a música mais ouvida.
  - Quantidade de músicas diferentes no mês e a variação percentual sobre o mês anterior (por exemplo, "1.824 músicas diferentes, +17% sobre março").
  - Top 5 de músicas, com o número de streams de cada uma, e top de artistas.
  - Movimento de posição de cada item sobre o mês anterior (a seta para cima ou para baixo que a Cápsula mostrava) e há quantos meses a música está no top 5.
- Um stream é uma reprodução com pelo menos 30 segundos tocados (constante). Esse é o ponto de partida, a ser ajustado na calibração do tópico 185.
- O mês corrente é calculado em andamento, com a data do cálculo informada.
- Os prints mostram empates no ranking (30 e 30 streams em abril; 19 e 19, 18 e 18 em junho), então a regra de desempate precisa ser definida na calibração (por exemplo, por minutos ouvidos ou pela reprodução mais recente).

**Não fazer:** gêneros, popularidade e qualquer dado que o histórico não tenha.

**A confirmar na calibração:** se os minutos somam todas as reproduções ou só as que contam como stream; se o artista é contado só pelo principal; se a Cápsula incluía podcasts nos minutos.

---

### Tópico 175 — Endpoints da Cápsula Sonora e Serializer

**O que existe hoje:** nenhuma rota expõe os dados mensais.

**Por que importa:** é o contrato que o frontend consome, e o Serializer protege a tela de mudanças internas no banco.

**O que precisa acontecer:**
- `GET /api/v1/spotify/capsula` com os meses disponíveis, com um resumo de cada (minutos, artista e música mais ouvidos), do mais recente para o mais antigo.
- `GET /api/v1/spotify/capsula/{ano}/{mes}` com o detalhe do mês: minutos, artista e música mais ouvidos, músicas diferentes e variação, top 5 de músicas com streams, movimento e meses no top 5, top de artistas e os minutos por dia (para o gráfico).
- `SpotifyCapsulaSerializer` com JSON estável, sem entidade crua, com chaves em português no padrão camelCase (como em `LivroAudio`) dentro do envelope `{ success, data }`. Itens sem imagem devolvem `imagemUrl` nulo enquanto o tópico 177 busca a imagem.
- Mês sem dados devolve um resultado vazio explícito em vez de erro. O mês corrente indica que está em andamento.
- Cada faixa e artista devolve também o endereço de "Abrir no Spotify", exigido pela atribuição.
- Controller só chama o service e o Serializer.

---

### Tópico 176 — Endpoints de Hoje, Semana e Curiosidades

**O que existe hoje:** não há métricas de curto prazo.

**Por que importa:** é a parte "ao vivo" da página, que dá motivo para abrir o sistema fora do fim do mês.

**O que precisa acontecer:**
- `GET /api/v1/spotify/resumo` devolvendo:
  - Hoje: minutos ouvidos desde as 00:00 no fuso de Brasília, músicas e artistas que mais tocaram.
  - Semana: o mesmo para a semana, com comparação com a semana anterior.
  - Curiosidades.
- Curiosidades da lista inicial, todas calculadas do próprio histórico: horário do dia com mais escuta; dia da semana mais ouvido; dia mais longo do mês (data e minutos); faixa mais repetida em um único dia; artistas descobertos no mês (sem nenhuma reprodução antes do mês); média diária de minutos e comparação com o mês anterior.
- A referência visual de "Hoje | Semana" e "Músicas | Artistas" vem do site de estatísticas que o usuário mostrou, só como inspiração de composição.

**Não fazer:** a aba "Gêneros" (o histórico não traz gênero) e qualquer curiosidade que dependa de popularidade ou de dados removidos da API.

**A confirmar:** a definição de "semana" (proposta: últimos 7 dias incluindo hoje, comparados aos 7 dias anteriores; alternativa: semana de segunda a domingo). A lista de curiosidades também é uma proposta inicial.

---

### Tópico 177 — Catálogo de capas e fotos — entidade e busca por código

**O que existe hoje:** o histórico guarda nomes e códigos, mas nenhuma imagem. A Cápsula original mostrava foto do artista e capas.

**Por que importa:** a API removeu a busca em lote, então cada imagem custa uma consulta. Só o que aparece na tela precisa ser buscado, e cada item deve ser consultado uma única vez.

**O que precisa acontecer:**
- Entidade `ImagemSpotify` com UUID v7: tipo (faixa ou artista), código Spotify (ou nome normalizado quando não houver código), nome, endereços de imagem nos três tamanhos que o Spotify devolve (grande, média e miniatura), endereço de "Abrir no Spotify", `buscadaEm` e status (enum com `pendente`, `encontrada` e `nao_encontrada`). Migration por `make doctrine-diff`.
- Service que obtém a capa pela consulta da faixa (a capa está no álbum) e a foto pela consulta do artista, só para os itens exibidos: top 5 ou 10, artista em destaque e itens de Hoje e Semana. Guardar o endereço da imagem e não o arquivo, conforme a decisão do tópico 161. O front carrega a imagem direto do Spotify.
- Na coleta pela API a capa já vem na resposta e entra no catálogo sem consulta extra. A foto do artista exige a consulta do artista.
- Quando um endpoint de leitura (tópicos 175 e 176) encontrar item sem imagem, ele devolve nulo e dispara o preenchimento em segundo plano (tópico 178). A tela atualiza quando a imagem chegar.
- Endereço de "Abrir no Spotify" montado pelo código (faixa e artista). Sem código, cai numa busca no Spotify pelo nome.
- Opcional: cor dominante da capa, calculada no servidor ao buscar a imagem, para o tom do cartão. Não depender de CORS no navegador. Só fazer se não pesar.

**Não fazer:** cortar, borrar ou editar as capas. Usar imagens que não tenham vindo do Spotify.

---

### Tópico 178 — Busca de capa por nome e preenchimento em segundo plano

**O que existe hoje:** o arquivo básico não traz código de faixa, só nomes.

**Por que importa:** sem código, achar a capa exige busca por nome, que pode errar em remixes e títulos repetidos. E o preenchimento não pode travar a tela nem estourar o limite de requisições.

**O que precisa acontecer:**
- Busca por nome e artista (no máximo 10 resultados) conferindo o artista e a duração para escolher o resultado certo. Descartar quando nenhum resultado for convincente, em vez de aceitar o primeiro.
- `BuscarImagemSpotifyMessage` com handler que só delega, novas tentativas com espera crescente e respeito ao `Retry-After`. Os pedidos devem ser espaçados para não esgotar o limite do modo de desenvolvimento.
- Priorização: primeiro o que está na tela (mês aberto e Hoje e Semana), depois o resto do top, nunca todas as faixas do histórico.
- Item não encontrado fica marcado (`nao_encontrada`) para não repetir a busca, e a tela mostra um placeholder neutro.
- Aproveitar o código da faixa assim que ele aparecer (por exemplo, depois da coleta pela API ou de uma importação estendida) para trocar o resultado por busca de código.

---

### Tópico 179 — Frontend — estrutura da feature spotify (types, api, hooks)

**O que existe hoje:** não há feature `spotify` em `web/features/`.

**Por que importa:** segue o padrão das demais features e mantém a página limpa de lógica.

**O que precisa acontecer:**
- `web/features/spotify/` com `types.ts` (esquemas Zod para status, resumo, Cápsula, itens de ranking, importação e imagens), `api.ts` usando `@/config/api` (único cliente HTTP), `hooks/`, `components/`, `utils/` e `index.ts`.
- Hooks TanStack Query: status da conexão, URL de autorização (mutation), concluir autorização (mutation), desconectar (mutation), resumo de Hoje e Semana, lista de meses da Cápsula, detalhe do mês, importações e envio do arquivo. Toasts de sucesso e erro dentro dos hooks, não no JSX.
- Atualização automática: acompanhamento da importação a cada poucos segundos enquanto estiver processando (como o polling de 2,5 s do Downloads MP3), e novo carregamento das imagens enquanto houver itens sem capa.
- O mês selecionado na Cápsula fica na URL, com o hook `useFiltrosUrl` (por exemplo `?mes=2026-06`), e a página usa `useSEO`.
- `utils/`: formatação de minutos (horas e minutos), datas em português, nome do mês, montagem do CSV do resumo mensal. Nenhuma lógica pesada dentro de `.tsx`.
- Sem `useEffect` e sem erros no Biome (`npm run check`).

---

### Tópico 180 — Frontend — paleta spotify, tokens e wrapper da página

**O que existe hoje:** o `DESIGN.md` veta estilos únicos por página e hex, e restringe `full` a círculos e avatares.

**Por que importa:** a página precisa ter a sensação do aplicativo do Spotify sem espalhar hex pelos componentes nem quebrar o tema do resto do sistema.

**O que precisa acontecer:**
- Escopo de tema só desta página, sem alterar os tokens globais. Estender o gerador de paleta (`scripts/gerar-paleta-brand.mjs`) com uma escala `spotify` com: fundo `#121212`, cartão `#1F1F1F`, cartão elevado e hover `#252525`, texto principal `#FFFFFF`, texto secundário `#B3B3B3`, texto desabilitado `#6A6A6A`, verde `#1ED760`, azul `#539DF5` e amarelo `#FEE44F`. Os hex só existem no gerador.
- Uso das cores, como na Cápsula original: números de minutos e ações em verde; "Artista mais ouvido" em azul; "Música mais ouvida", títulos de seção e posições do ranking em amarelo; rótulos pequenos em cinza.
- Tipografia: Inter, carregada só nesta página. Escala de partida: títulos 24 e 32 em peso 700, corpo 14 ou 16, legendas 11 ou 12 em maiúsculas, números de destaque grandes em peso 800 ou 900.
- Formas: botões em pílula; cartões com 8px; capas com 4px (8px em tela grande); foto de artista circular. Essas são exceções ao guia de arredondamento do sistema e devem ser documentadas.
- A página é sempre escura, independente do tema claro ou escuro do sistema. Sidebar e Header continuam do sistema.
- Interações: hover dos cartões de `#1F1F1F` para `#252525`, foco visível e transições de cor, como exige o guia.
- Contraste conferido: todas as cores de texto passam de 5:1 sobre os fundos escuros, exceto o cinza desabilitado, que só serve para itens desabilitados.
- Wrapper `TemaSpotify` aplicado só na página. Registrar a exceção no `DESIGN.md`, explicando que a paleta é gerada e escopada.

**Não fazer:** hex fora do gerador, `className`, o logo do Spotify como se fosse do CirqueiraX, e imitar a identidade do Spotify no logo e no nome do sistema.

**A confirmar:** a página ser sempre escura (proposta) e o mecanismo exato de escopo de tema, olhando `web/config/theme/`.

---

### Tópico 181 — Frontend — vincular, retornar do Spotify, reconectar e desconectar

**O que existe hoje:** o Google Fotos usa um modal com copia-e-cola do código, feito para `localhost`.

**Por que importa:** com o sistema em HTTPS o retorno pode ser direto, e o vínculo vira um botão simples, igual ao de sites de estatísticas do Spotify.

**O que precisa acontecer:**
- Botão "Vincular ao Spotify" que chama `oauth/url` e redireciona a janela inteira para o Spotify. Depois do "Aceito", o Spotify devolve o usuário para `/spotify/callback?code=...&state=...`.
- Rota protegida `/spotify/callback` registrada em `App.tsx`, que conclui sozinha com `useMountEffect` (sem `useEffect`) chamando `oauth/concluir`, e então leva a `/spotify`, já conectada. Sem copiar nem colar nada.
- Tratamento de retorno com erro: o usuário clicou em "Cancelar" na tela do Spotify (parâmetro de erro na URL), `state` inválido ou expirado, e conta fora da lista de usuários do modo de desenvolvimento. Cada caso com mensagem clara e botão para tentar de novo.
- Estados da conexão: desconectada (só o botão), conectada (nome e foto da conta e data da conexão) e "reconectar" (aviso e botão). Reconectar usa o mesmo fluxo.
- Botão "Desconectar" com confirmação explicando que os dados coletados pela API serão apagados, que os importados do arquivo permanecem, e lembrando que o acesso também pode ser removido nas configurações da conta do Spotify.
- O botão e o estado de conexão seguem o visual da página (tópico 180). A referência de composição do botão verde com brilho vem do site de estatísticas que o usuário mostrou, só como inspiração.

**Não fazer:** modal de copia-e-cola. Pedir escopos além dos do tópico 161.

---

### Tópico 182 — Frontend — importação do arquivo de histórico

**O que existe hoje:** não há tela para enviar o histórico exportado.

**Por que importa:** é o que traz os meses passados para dentro do sistema, e é a única forma de corrigir os minutos estimados pela API.

**O que precisa acontecer:**
- Modal de upload (arrastar ou escolher o ZIP ou JSON), no padrão do `ModalUploadLivro`, que vira Drawer no celular.
- Instruções de como pedir os dados na conta do Spotify: em Privacidade da conta, "Dados da conta" (prazo de cerca de 5 dias, inclui o histórico do último ano) e, se quiser a vida toda da conta, "Histórico ampliado de streams" (prazo de até 30 dias). Informar que as "Informações técnicas de registro" não são necessárias.
- Aviso de privacidade: o ZIP contém outros dados pessoais, e o sistema lê só o histórico de streams e descarta o resto.
- Barra de progresso e resumo do resultado quando concluir: lidos, novos, ignorados e substituídos. Se houver erro, mostrar o motivo.
- Aviso de que o arquivo pode repetir meses já importados e que isso não duplica.
- Lembrete discreto de que os dias entre o pedido do arquivo e a conexão da coleta só se fecham com um segundo pedido depois.

---

### Tópico 183 — Frontend — página /spotify com Hoje, Semana e Curiosidades

**O que existe hoje:** não há página nem item no menu para o Spotify.

**Por que importa:** é a porta de entrada da funcionalidade e a parte que muda todo dia.

**O que precisa acontecer:**
- `Spotify.tsx` em `web/features/spotify/`, com rota lazy em `App.tsx` (via `lazyWithRetry`), item "Spotify" na `Sidebar.tsx` e título da rota no `Header.tsx`. A página usa o `AppContainer` e não monta Header nem Footer próprios.
- Estrutura da página, de cima para baixo: estado da conexão e ações (vincular, importar, desconectar); Hoje e Semana; Curiosidades; seção "Cápsula Sonora" (tópico 184).
- Hoje e Semana: alternância "Hoje | Semana" e abas "Músicas | Artistas" (sem "Gêneros"), com lista de posição, capa ou foto, nome, artista e valor (minutos ou reproduções), mais o gráfico de minutos por dia em Recharts nas cores da paleta.
- Curiosidades em cartões pequenos, com os itens do tópico 176.
- Cartão "Tocando agora" só se o escopo opcional for ativado no tópico 161.
- Estados de carregamento com `Subflow` que replica a estrutura do conteúdo (nunca spinner isolado). Estado vazio quando não conectada ou sem dados, com o botão de vincular e de importar.
- Rodapé de atribuição com o logo do Spotify, em tamanho e área de respiro conforme as diretrizes de marca, e o link "Abrir no Spotify". As capas aparecem inteiras, sem texto nem controles por cima.
- Mobile-first: uma coluna no celular.
- Nenhuma lógica de cálculo ou parsing dentro do `.tsx`: tudo em `utils/`.

---

### Tópico 184 — Frontend — seção Cápsula Sonora com seletor de mês

**O que existe hoje:** a Cápsula não existe mais no aplicativo do Spotify. Só restam os prints do usuário, que servem de modelo visual.

**Por que importa:** é o objetivo central da funcionalidade: rever o mês atual e os anteriores como antes, inclusive meses que o usuário perdeu.

**O que precisa acontecer:**
- Título "Sua Cápsula sonora", com o mês em destaque e o ano em cinza (por exemplo, "junho 2026"), e um seletor de mês com o mês atual e os anteriores. O mês escolhido fica na URL (tópico 179). O mês atual aparece como "em andamento".
- Cartões como nos prints:
  - Tempo ouvindo: o número de minutos em verde e grande (por exemplo, "10.956 minutos").
  - Artista mais ouvido: o nome em azul, com a foto do artista em círculo e o selo de movimento quando existir.
  - Música mais ouvida: o título em amarelo, com a capa inteira.
  - Um cartão visual com as capas do top ou a foto grande do artista, como nos prints de maio e junho.
- Cada cartão leva a um detalhe, como a Cápsula original (a seta no canto do cartão): "Músicas mais ouvidas" com o título "Você ouviu N músicas diferentes esse mês" e a comparação com o mês anterior (por exemplo, "em comparação a 1.303 músicas em maio, +29%"), o ranking com posição em amarelo, capa, nome, artistas e número de streams, a seta de subida ou descida e "N meses no top 5"; a lista de artistas; e o tempo ouvindo com os minutos por dia em gráfico.
- Capas sem recorte, sem texto, logo ou controles por cima, com cantos de 4px (8px em tela grande). Link "Abrir no Spotify" em cada faixa e artista.
- Botão para exportar o resumo do mês em CSV (mês, minutos, músicas diferentes, top músicas com streams e top artistas), gerado no frontend por utilitário.
- Mobile-first. Estado vazio para mês sem dados. Imagens que ainda estão sendo buscadas aparecem com placeholder e atualizam sozinhas.
- Segue os tokens e as exceções do tópico 180.

**Não fazer:** o botão de compartilhar da Cápsula original (fora do escopo). Alterar as capas de qualquer forma.

---

### Tópico 185 — Calibração com os prints, teste end-to-end e documentação atualizada

**O que existe hoje:** os cálculos não foram comparados com nenhum número real.

**Por que importa:** os prints da Cápsula são o gabarito. Se o cálculo reproduzir esses números, os meses sem print (agosto em diante) merecem confiança.

**O que precisa acontecer:**
- Importar os arquivos do usuário e comparar com os prints:
  - Abril de 2026: 15.387 minutos; 1.824 músicas diferentes (março teve 1.555, +17%); artista mais ouvido Yasuharu Takanashi. Top 5: "You're Somebody Else - Nikodem Milewski Remix" (flora cash) 56 streams; "Ao Vivo E A Cores" (Matheus & Kauan, Anitta) 35; "Fourth of July" (Sufjan Stevens) 30, com "1 mês no top 5"; "Her" (The American Dawn) 30; "Hot Blooded" (New Constellations) 29.
  - Maio de 2026: 10.766 minutos; artista mais ouvido Alan Walker (com o selo de subida de 2 posições); música mais ouvida "Friends" (Chase Atlantic).
  - Junho de 2026: 10.956 minutos; 1.677 músicas diferentes (maio teve 1.303, +29%); artista mais ouvido Hans Zimmer. Top 5: "You Don't Own Me (feat. G-Eazy)" (SAYGRACE, G-Eazy) 43 streams; "You Are Not Alone" (Michael Jackson) 19; "All For Us" (Labrinth, Zendaya) 19; "Nostalgia - Slowed" (plenka) 18; "Heaven Can Wait" (Michael Jackson) 18.
- Critério de aceite proposto: minutos e contagens iguais ou com diferença pequena e explicada (por exemplo, até 1%), mesmo top 5 (empates podem trocar de ordem até a regra de desempate estar definida) e mesmos artistas mais ouvidos.
- Ajustar o corte de stream (30 s), o fuso, o desempate, a contagem de artistas e a janela de tolerância da deduplicação se divergir, registrando o motivo de cada ajuste no tópico 174.
- Validar os fluxos de ponta a ponta: vincular, voltar do Spotify, coleta de 30 em 30 minutos, importação do arquivo básico, reimportação sem duplicar, substituição das estimativas pelos tempos exatos, reconectar, desconectar com limpeza dos dados da API, capas e fotos, página e exportação em CSV, no desktop e no celular.
- Rodar `make lint-all`, `make doctrine-validate` e o build do frontend sem erros.
- Documentar: `documentation/funcionalidades/SPOTIFY.md` (novo: o que faz, como conectar, como pedir e importar os dados, limitações, regras do Spotify e calibração), `FUNCIONALIDADES_DO_SISTEMA.md` (descrição para o usuário final), `CIRQUEIRAX.md` (185 tópicos concluídos), `BACKEND.md` (rotas, entidades, enums e comandos), `FRONTEND.md` (rotas `/spotify` e `/spotify/callback`), `MESSENGER.md` (novas mensagens e fila), `AUTH.md` (OAuth do Spotify na tabela de mecanismos), `DOCUMENTACAO_TECNICA.md` (variáveis de ambiente) e `DESIGN.md` (a exceção da página do Spotify).