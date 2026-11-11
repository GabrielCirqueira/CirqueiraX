# Roadmap — Música unificada, YouTube Music e importação do passado

> Substitua este arquivo na raiz (`ROADMAP.md`) a cada novo lote.
> O histórico concluído não fica aqui — ele vive em `documentation/progresso/`.
> Lote anterior: Spotify e Cápsula Sonora (tópicos 161–185), concluído. O roadmap da extensão de navegador para o YouTube Music (186–200) foi descartado e este o substitui.
> Spec: [documentation/progresso/README.md](documentation/progresso/README.md) · depois de preencher: `make progresso`
> Leia primeiro a seção "Premissas e decisões da conversa" no início do Detalhamento. Ela vale para todos os tópicos.

**Numeração:** tópicos 186–205.

## Índice

| # | Tópico |
|---|---|
| 186 | Preparação — decisões, limpeza do teste e verificações antes de construir |
| 187 | Spotify — proteger a coleta dos bloqueios 429 e remover o que sobrou do teste do player |
| 188 | Infra — cliente do YouTube Music com ytmusicapi por processo |
| 189 | Entidade ContaYoutubeMusic, enum de status, credenciais criptografadas e migration |
| 190 | Conexão do YouTube Music — serviços, endpoints e status no Dashboard |
| 191 | Entidades — vídeo, reprodução, catálogo canônico e regra de canal |
| 192 | Coleta do histórico do YouTube Music — novas reproduções, intervalo adaptativo e Scheduler |
| 193 | Infra — YouTube Data API em lote para categoria, duração e descrição |
| 194 | Infra — identificador de músicas por IA com resposta estruturada e registro de custo |
| 195 | Serviço de identificação — música, mashup, compilação, confirmação pela busca e revisão |
| 196 | Ligação entre Spotify e catálogo, e correções manuais — serviços e endpoints |
| 197 | Importação do Takeout — leitura, filtros, fila e deduplicação com a coleta |
| 198 | Importação do Takeout — enriquecimento, prévia de custo, classificação e tempo ouvido |
| 199 | Leitura unificada — projeção das reproduções e paridade com os números do Spotify |
| 200 | Endpoints unificados /api/v1/musica com filtro de fonte |
| 201 | Frontend — renomear a página, tema, seletor de fonte e ícones de origem |
| 202 | Frontend — conexão do YouTube Music, importação do Takeout e status no Dashboard |
| 203 | Frontend — rankings, Cápsula e detalhes unificados com versões e mashups |
| 204 | Frontend — tela de revisão e correções do catálogo |
| 205 | Teste end-to-end com dados reais, calibração e documentação |

## Checklist

- [x] **186. Preparação — decisões, limpeza do teste e verificações antes de construir**
- [x] **187. Spotify — proteger a coleta dos bloqueios 429 e remover o que sobrou do teste do player**
- [x] **188. Infra — cliente do YouTube Music com ytmusicapi por processo**
- [x] **189. Entidade ContaYoutubeMusic, enum de status, credenciais criptografadas e migration**
- [x] **190. Conexão do YouTube Music — serviços, endpoints e status no Dashboard**
- [x] **191. Entidades — vídeo, reprodução, catálogo canônico e regra de canal**
- [ ] **192. Coleta do histórico do YouTube Music — novas reproduções, intervalo adaptativo e Scheduler**
- [ ] **193. Infra — YouTube Data API em lote para categoria, duração e descrição**
- [ ] **194. Infra — identificador de músicas por IA com resposta estruturada e registro de custo**
- [ ] **195. Serviço de identificação — música, mashup, compilação, confirmação pela busca e revisão**
- [ ] **196. Ligação entre Spotify e catálogo, e correções manuais — serviços e endpoints**
- [ ] **197. Importação do Takeout — leitura, filtros, fila e deduplicação com a coleta**
- [ ] **198. Importação do Takeout — enriquecimento, prévia de custo, classificação e tempo ouvido**
- [ ] **199. Leitura unificada — projeção das reproduções e paridade com os números do Spotify**
- [ ] **200. Endpoints unificados /api/v1/musica com filtro de fonte**
- [ ] **201. Frontend — renomear a página, tema, seletor de fonte e ícones de origem**
- [ ] **202. Frontend — conexão do YouTube Music, importação do Takeout e status no Dashboard**
- [ ] **203. Frontend — rankings, Cápsula e detalhes unificados com versões e mashups**
- [ ] **204. Frontend — tela de revisão e correções do catálogo**
- [ ] **205. Teste end-to-end com dados reais, calibração e documentação**

## Detalhamento

### Premissas e decisões da conversa (valem para todos os tópicos)

**Objetivo do lote.** Transformar a página do Spotify em uma página de música que reúne **Spotify e YouTube Music**. O Gabriel passa a ver tudo junto (padrão) ou filtrado por serviço. O YouTube Music passa a ser coletado automaticamente pelo servidor, o passado do YouTube vem do Google Takeout, e uma IA identifica a música, o artista e as versões de cada vídeo para que tudo se combine com o que já existe do Spotify.

**Decisões já tomadas pelo Gabriel (não reabrir).**
- A página ganha um nome mais abrangente e **mantém o visual do Spotify** (fundo `#121212`, verde, cartões, formas), porque é o visual que ele prefere para ler os dados.
- Um seletor escolhe a fonte: Spotify, YouTube Music ou Todos. O padrão é **Todos**, combinando as duas plataformas. Cada música ou artista mostra um ícone pequeno da origem. Uma música ouvida nos dois serviços aparece **uma vez**, com os dois ícones.
- O YouTube Music é coletado **pelo servidor, sem extensão de navegador** (instalar extensão no navegador do trabalho é ruim). Isso cobre também o celular, porque o histórico pertence à conta. Daqui para frente o Gabriel ouve só no YouTube Music. O passado dele foi no **YouTube comum**, misturado com vídeos que não são música.
- **Versões da mesma música ficam juntas** na música principal: slowed, reverb, sped up, 8D, nightcore, lyrics, vídeo oficial, tradução, **remix, cover e instrumental**. No Dashboard aparece o título principal e a capa, como no Spotify. Ao abrir, mostra as versões ouvidas no período filtrado.
- **Mashup é uma música própria.** Aparece no Dashboard como ele mesmo (ex.: "renegade x under the influence x i was never there"), e não como três músicas separadas. Mas **cada artista dos componentes recebe o crédito completo**.
- **Músicas com vários artistas** (colaborações) contam para todos eles, como já vale no Spotify (M128).
- A identificação dos títulos é feita por **IA** (modelo `gpt-5.4-mini`, o mesmo já usado na M129, com a chave `OPENAI_API_KEY` do `.env`). Os dados originais (título, canal) são sempre guardados.

**Evidências dos testes (fundamentam as decisões).**
- A biblioteca `ytmusicapi` com login pelo código de TV deu erro 400 em tudo. Com os **dados de sessão do navegador (cookie e cabeçalhos)** funcionou: 197 músicas no histórico, 47 playlists e 149 curtidas.
- O histórico do YouTube Music **não tem horário** (só "Today", "Yesterday" e o mês), **não tem tempo ouvido**, mostra cada música uma vez (repetição seguida conta como uma; repetição não seguida sobe a música ao topo) e em cerca de 64% dos itens o "artista" é o canal que postou o upload (slowed e semelhantes), não o artista real.
- Coletor de teste consultando a cada 60 s funcionou. Cada consulta leva cerca de 0,8 s e devolve uns 1,9 MB sem compactar. O primeiro cookie durou **menos de um dia** e o coletor só mostrou `YTMusicServerError: None`, sem dizer que era o cookie.
- Teste da IA com 9 títulos reais: todos separados corretamente (mashups de 2 e de 4 músicas, colaboração de 3 artistas, título com letras espaçadas, "+ Choir" tratado como modificador). Média de 155 tokens de entrada e 102 de saída, de 2 a 4 s por chamada, cerca de US$ 0,0006 por vídeo pelo preço de tabela (preço tirado de sites agregadores, **não confirmado** na página oficial). Ponto fraco: título ambíguo ("Renegade" foi atribuído a Big Red Machine e Taylor Swift, mas em edits slowed costuma ser outra música). A IA não avisou da dúvida.
- Spotify hoje: o app é bloqueado (429) depois de cerca de 600 consultas de artistas, com esperas de 6h43 e 22h53, mesmo com 6 s entre consultas. O bloqueio é do app inteiro e **para também a coleta das músicas recentes**, que só guarda as últimas 50.

**Regras de dados (valem para todos os tópicos).**
- **Identidade da música.** Chave normalizada = título normalizado + artista principal normalizado (a mesma regra do Spotify, `SPOTIFY.md` seção 7). Mashup: chave = conjunto ordenado das chaves dos componentes. Nunca depender do código de faixa do Spotify nem do `videoId`.
- **Horário.** `tocadaEm` em UTC. No YouTube Music coletado, é o momento em que o coletor viu a música aparecer (erro de até um intervalo de consulta). No Takeout, é o horário do arquivo. Nada disso é horário exato, e as reproduções do YouTube ficam marcadas com `tempoExato = false`.
- **Tempo ouvido estimado.** Para cada reprodução do YouTube: `min(intervalo até o início da reprodução seguinte, duração do vídeo)`. Pausas e intervalos longos acabam limitados à duração. É a mesma filosofia do `EstimarTempoReproduzidoSpotifyService`. Tudo que vem do YouTube é "estimado" na tela.
- **Stream.** Continua 30 s ou mais, constante `30.000 ms`, aplicado na leitura, nunca na gravação. No YouTube vale sobre o tempo estimado.
- **Contagem.** Cada reprodução conta 1 para a música. Minutos totais contam uma vez só. Cada artista recebe stream e minutos completos. Mês e ano em UTC, "Hoje", hora do dia e "Últimos N dias" no horário de Brasília (`America/Sao_Paulo`), igual ao Spotify (M120).
- **Compilações.** Vídeo com mais de `LIMITE_COMPONENTES_MASHUP` (padrão 5) músicas é "compilação" e **não credita artistas** sem confirmação manual.
- **Ordem dos rankings.** Músicas, artistas e álbuns por streams, com minutos como desempate (M128).

**Segurança da credencial do YouTube Music.** O cookie é a sessão inteira da conta Google (Gmail e Drive incluídos). Regras: fica **criptografado** no banco com a `CriptografiaInterface` que o projeto já tem; entra no script Python **pela entrada padrão**, nunca por argumento nem variável de ambiente; nunca vai para log, Sentry, resposta de API, repositório ou chat; ao desconectar, é apagado. A sessão pode ser invalidada pelo Google a qualquer momento, e o sistema tem que perceber isso e avisar (tópicos 192 e 202).

**Multiusuário (M131).** Toda tabela nova tem dono (`usuario_id`). Todas as rotas filtram pela conta logada; item de outra pessoa responde 404. O catálogo (músicas, artistas, regras de canal) é **por usuário**.

**Fora do escopo deste lote.** Player próprio dentro do CirqueiraX (a M134 mostrou que o player embutido do YouTube abre e toca no trabalho, falta testar músicas reais; fica para um lote seguinte); extensão de navegador (descartada, pode voltar como complemento); "tocando agora" do YouTube Music (não existe na biblioteca); gêneros; podcasts; YouTube comum depois da troca de hábito; relatórios de TV e outros aparelhos.

**Regras do projeto que valem em todos os tópicos (PARA-IA.md).** Nomes em português. Zero comentários no código. O Controller é criado primeiro e só chama Service, estendendo `DefaultController` com o envelope `{ success, data }`. Services atômicos com `executar()`. Toda consulta fica no Repository. Clientes externos em `src/Infra/` com interface em `src/Interface/`. DTO só carrega dados. Exceções por contexto em `src/Exception/{Contexto}/`, com métodos estáticos e mensagens completas em português. Constantes em vez de valores soltos. Dependências por injeção no `services.yaml`, sem `$_ENV` no código. Migration só via `make doctrine-diff` e `make migrate`, validada com `make doctrine-validate`. Serializer sempre, nunca entidade crua. No frontend: sem `useEffect` (usar `useMountEffect`), sem `<div>` cru, sem hex fora do script de paleta, sem `any`, primitivos Chakra, filtros na URL com `useFiltrosUrl` e `useSEO` nas páginas. Rodar `make lint-all` antes de fechar cada tópico. Commit e push só com `make push`, sem assinatura de IA.

---

### Tópico 186 — Preparação — decisões, limpeza do teste e verificações antes de construir

**O que existe hoje:** o coletor de teste roda num contêiner chamado `ytmusic_teste_coletor` (reinicia sozinho) e grava um log em `/root/ytmusic_teste`, onde também está o cookie do Gabriel. O Client ID e o Client secret do teste anterior (OAuth do Google) estão no `.env` do servidor como `YTMUSIC_CLIENT_ID` e `YTMUSIC_CLIENT_SECRET`, e o secret chegou a ser colado numa conversa. Existe um cliente OAuth criado no Google Cloud só para esse teste. Nada disso entra no sistema.

**Por que importa:** o lote depende de dados que ainda não foram medidos (atraso do histórico, volume do Takeout, quanto da história antiga ainda existe) e de quatro decisões que ficaram abertas. Credenciais de teste espalhadas são risco sem benefício.

**O que precisa acontecer:**
- Criar o esqueleto de `documentation/funcionalidades/MUSICA.md` com as premissas desta seção (objetivo, decisões, regras de dados, fora do escopo).
- **Tarefas do Gabriel, registradas num bloco "Pendências do Gabriel" no documento:**
  1. Pedir o Google Takeout: em `takeout.google.com`, desmarcar tudo, marcar só YouTube e YouTube Music, em "Todos os dados do YouTube incluídos" deixar só o **histórico**, trocar o formato do histórico para **JSON** e exportar uma vez. Opcional: agendar a exportação a cada 2 meses por 1 ano.
  2. Conferir em `myactivity.google.com` se o histórico do YouTube estava ligado e se há **exclusão automática**. Se o prazo for menor que 13 meses, outubro de 2025 já foi apagado e o Takeout não o traz.
  3. Ler as diretrizes de marca e a política de desenvolvedor do Spotify para confirmar se dados do Spotify podem aparecer misturados com os de outro serviço sob o visual do Spotify. Registrar a conclusão no documento.
- **Medir o atraso real do coletor de teste:** o Gabriel dá play em 5 músicas novas anotando o horário de cada play, e o Claude Code compara com a hora em que o coletor viu cada uma. Registrar a mediana e o máximo. Esse número define se `tocadaEm` precisa de correção (tópico 192).
- **Limpar o que é só do teste**, mas **só depois do tópico 192** estar em produção coletando: parar e remover o contêiner `ytmusic_teste_coletor`, apagar `/root/ytmusic_teste`. **Já agora:** remover `YTMUSIC_CLIENT_ID` e `YTMUSIC_CLIENT_SECRET` do `.env`, apagar o cliente OAuth do teste no Google Cloud e revogar o acesso em myaccount.google.com, Segurança, Apps de terceiros.
- Obter e registrar as **quatro decisões abertas**, com as propostas abaixo como padrão:
  1. Tempo ouvido no modo "Todos": **somar** medido e estimado, com a marca "inclui estimativas" e um tooltip que separa os dois.
  2. Limite de componentes para uma compilação: **5**.
  3. A Cápsula Sonora **acompanha o seletor** de fonte, com um aviso de que a calibração é do Spotify.
  4. Ao desconectar o YouTube Music: apagar só a credencial e **manter as reproduções** (não há exigência de apagar como no Spotify).
- Registrar o nome da página. Proposta: **Música**, na rota `/musica`.

**Não fazer:** apagar o contêiner de teste antes de o tópico 192 estar coletando. Colar qualquer cookie, token ou chave em conversa, issue ou repositório.

**A confirmar:** as quatro decisões e o nome da página com o Gabriel.

---

### Tópico 187 — Spotify — proteger a coleta dos bloqueios 429 e remover o que sobrou do teste do player

**O que existe hoje:** a tabela `bloqueio_spotify` registra cada 429 (espera, hora de liberação, origem, consultas feitas desde o bloqueio anterior, ritmo). Houve dois bloqueios em 10/11: 24.179 s (13h33) e 82.402 s (21h25, libera em 11/11 às 20h20), ambos perto de 600 consultas de artistas, com 6 s entre elas no segundo. Enquanto o app está bloqueado, a coleta das músicas recentes também não roda, e o recently-played só guarda as últimas 50 músicas. A tela mostrou "Última coleta: 10/11, 21:24" horas depois, sem aviso claro do motivo. A busca de artistas (M133) só considera músicas com 3 ou mais streams (3.522) e tem 2.140 músicas mapeadas no total. A conexão pede, desde a M130, permissões de reprodução (`streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state`, `user-modify-playback-state`) só para a página `/spotify/player-teste`, que não virou player.

**Por que importa:** a busca de artistas é opcional; a coleta das músicas novas é o dado principal. Hoje a primeira pode derrubar a segunda por quase um dia. Além disso, o limite pode estar somando **todas** as chamadas do app, e a tabela só mede as de artistas.

**O que precisa acontecer:**
- **Medir tudo antes de ajustar:** `ControleLimiteSpotifyService` passa a contar cada chamada ao Spotify por origem (coleta, tocando agora, capas, artistas, player) em janela móvel, e cada novo bloqueio grava o total por origem. Nova coluna ou tabela filha de `bloqueio_spotify`, com migration via `make doctrine-diff`.
- **Orçamento da busca de artistas:** constante `LIMITE_CONSULTAS_ARTISTAS_POR_DIA` (proposta: 400), contada no banco (não no cache, para sobreviver a deploy). Ao atingir, a busca para até o dia seguinte. A busca nunca roda se a última coleta das músicas recentes falhou. Qualquer 429 continua parando a busca na hora.
- **Aviso na tela e no Dashboard:** `GET /api/v1/spotify/status` e o resumo do Dashboard passam a devolver `bloqueadoAte` e o motivo. O painel do Spotify mostra "O Spotify bloqueou o app até HH:mm (horário de Brasília). A coleta está pausada. O Spotify só guarda as últimas 50 músicas, então o que passar disso nesse período pode não ser coletado." O `StatusIntegracoes` ganha o estado âmbar `bloqueado`, distinto de `coletaParada`.
- **Limpeza do teste do player (decisão do Gabriel, ver "A confirmar"):** remover `PlayerSpotifyController`, `PlayerTesteSpotifyService`, a rota `/spotify/player-teste`, `PlayerTesteSpotify.tsx`, `usePlayerTesteSpotify.ts` e as permissões extras em `GerarUrlAutorizacaoSpotifyService`. A conta conectada continua funcionando com o token antigo; reconectar uma vez é opcional. Condensar o resultado do teste (proxy do trabalho bloqueia o Spotify) numa nota curta no `SPOTIFY.md`.
- **Corrigir a documentação:** o arquivo de progresso dos tópicos 161–185 ainda mostra 183, 184 e 185 como pendentes, enquanto o de 181–200 os mostra concluídos.

**Não fazer:** acelerar a busca de artistas. Consultar o Spotify enquanto houver janela de bloqueio ativa.

**A confirmar:** se a página de teste do player sai agora ou fica até o lote do player; o valor de `LIMITE_CONSULTAS_ARTISTAS_POR_DIA` depois de ver a medição por origem.

---

### Tópico 188 — Infra — cliente do YouTube Music com ytmusicapi por processo

**O que existe hoje:** nada do YouTube Music no código do projeto. Há precedente de Python chamado pelo PHP: `bin/sintetizar-voz.py` e `bin/sintetizar-voz-piper.py`, usados por `SintetizadorVozPorProcesso`, e a imagem de produção já tem Python. A `ytmusicapi` só existe no ambiente do teste, fora do repositório.

**Por que importa:** a biblioteca é Python e o sistema é Symfony. A integração precisa seguir as regras do projeto (interface mais cliente de Infra) e manter o cookie fora de linha de comando, log e variável de ambiente.

**O que precisa acontecer:**
- Interface `YoutubeMusicInterface` em `src/Interface/` com `validarCredenciais`, `listarHistorico` e `buscarMusica`.
- Script `bin/ytmusic.py` com três subcomandos (`validar`, `historico`, `buscar`). As credenciais chegam **por entrada padrão em JSON**. A saída é JSON na saída padrão. Códigos de saída distintos: 0 sucesso, 2 credenciais inválidas, 3 serviço indisponível ou limite, 4 formato inesperado.
- Fixar a versão da `ytmusicapi` no `Dockerfile.prod` e no ambiente de desenvolvimento, para uma atualização da biblioteca não quebrar a coleta sem aviso.
- Cliente `YoutubeMusicClient` em `src/Infra/YoutubeMusic/`, chamando o script com o componente Process do Symfony, com tempo limite de 30 s e mapeamento dos códigos de saída para exceções.
- DTOs em `src/DataObject/YoutubeMusic/`: `CredenciaisYoutubeMusicDTO`, `ItemHistoricoYoutubeMusicDTO` (`videoId`, `titulo`, `textoArtistas` como veio, `album`, `urlCapa`, `duracaoMs`, `secao`, `posicao`), `ListaHistoricoYoutubeMusicDTO` e `ResultadoBuscaYoutubeMusicDTO`.
- `YoutubeMusicException` em `src/Exception/YoutubeMusic/` com `credenciaisInvalidas()`, `servicoIndisponivel()` e `respostaInesperada()`.
- Tratar o caso visto no teste: quando o cookie morre, a biblioteca devolve `YTMusicServerError: None` em todas as chamadas. O script deve, ao receber esse erro, rodar uma chamada de validação e então decidir entre "credencial inválida" e "falha passageira".
- Testes do parsing em PHP com respostas reais **anonimizadas** gravadas como fixtures, para não depender de rede.

**Não fazer:** passar cookie por argumento, variável de ambiente ou arquivo temporário. Registrar a saída bruta do script (ela contém o histórico do usuário).

**A confirmar:** a versão da `ytmusicapi` a fixar e o formato mínimo de cabeçalhos que ela aceita.

---

### Tópico 189 — Entidade ContaYoutubeMusic, enum de status, credenciais criptografadas e migration

**O que existe hoje:** `ContaSpotify` é o modelo de conta externa do projeto (status, tokens criptografados, última coleta). Não existe equivalente para o YouTube Music, e a `CriptografiaInterface` já está disponível.

**Por que importa:** a credencial precisa de um lugar seguro, e o estado da coleta (quando consultar de novo, quantos erros seguidos, o que foi visto da última vez) precisa persistir entre execuções.

**O que precisa acontecer:**
- Enum `StatusContaYoutubeMusic` em `src/Enum/` com `conectada`, `reconectar` e `desconectada`, com os predicados `isConectada()`, `isReconectar()` e `isDesconectada()`.
- Entidade `ContaYoutubeMusic` em `src/Entity/`, UUID v7, única por `Usuario` (exclusão em cascata). Campos: `credenciaisCriptografadas`, `status`, `conectadoEm`, `ultimaConsultaEm`, `ultimaNovidadeEm`, `proximaConsultaEm`, `errosSeguidos`, `erroMotivo`, `snapshotTopo` (JSON com os `videoId` do topo do histórico, na ordem, usados para comparar a consulta seguinte), `criadoEm` e `atualizadoEm`.
- Métodos de intenção: `conectar`, `registrarConsulta`, `registrarErro`, `marcarComoReconectar`, `desconectar` (apaga as credenciais e o snapshot) e `definirProximaConsulta`. Getters sem o prefixo `get`.
- `ContaYoutubeMusicRepository` com `salvar`, `remover`, `flush`, `buscarDoUsuario` e `listarComConsultaVencida` (conectadas com `proximaConsultaEm` no passado).
- Migration via `make doctrine-diff`, aplicada com `make migrate`, validada com `make doctrine-validate`.

**Não fazer:** expor as credenciais em qualquer Serializer. Guardar o cookie fora do campo criptografado.

---

### Tópico 190 — Conexão do YouTube Music — serviços, endpoints e status no Dashboard

**O que existe hoje:** o Spotify conecta por OAuth, com `SpotifyController`. O YouTube Music não tem conexão: o teste usou cookies colados à mão numa pasta do servidor.

**Por que importa:** é por aqui que o Gabriel entrega ao sistema a sessão do YouTube Music (e a troca quando ela expira). A entrada precisa ser tolerante (ele cola o texto copiado do navegador) e a saída nunca pode revelar a credencial.

**O que precisa acontecer:**
- Controller criado primeiro: `YoutubeMusicController` em `src/Controller/YoutubeMusic/`, estendendo `DefaultController`, todas as rotas com JWT:
  - `POST /api/v1/youtube-music/conectar` com `{ cabecalhos }`, o texto bruto dos cabeçalhos copiados do navegador (tamanho máximo em constante).
  - `GET /api/v1/youtube-music/status`.
  - `POST /api/v1/youtube-music/desconectar`.
- `ConectarYoutubeMusicDTO` com `#[Assert]`. `InterpretadorCabecalhosNavegadorService` converte o texto colado na estrutura mínima aceita pela biblioteca e recusa o que não tiver o cookie essencial, com mensagem clara em português.
- `ConectarYoutubeMusicService`: interpreta, valida chamando `YoutubeMusicInterface::validarCredenciais`, criptografa, grava, tira o primeiro snapshot do histórico (sem gerar reproduções) e agenda a coleta. Limite de 5 tentativas por minuto com o rate limiter do projeto.
- `ObterStatusYoutubeMusicService` e `DesconectarYoutubeMusicService` (apaga a credencial; **mantém as reproduções**, salvo outra decisão do tópico 186).
- `ContaYoutubeMusicSerializer`: `status`, `conectadoEm`, `ultimaConsultaEm`, `ultimaNovidadeEm`, `erroMotivo` e `totalReproducoesColetadas`. Nunca credenciais.
- Documentar o passo a passo de obter os cabeçalhos (abrir `music.youtube.com` numa **janela anônima**, entrar na conta, copiar os cabeçalhos de uma requisição `browse` no DevTools e **fechar a janela sem clicar em Sair**). A dica da janela anônima é prática comum com outras ferramentas e precisa ser confirmada aqui medindo quanto o cookie dura.
- **Dashboard:** `DashboardService` e `GET /api/v1/dashboard/resumo` ganham o bloco `youtubeMusic` com os estados `nao_configurado`, `conectado` e `reconectar`, a data da última novidade e o link para `/musica`.

**Não fazer:** devolver, registrar ou guardar o texto colado depois de interpretado. Aceitar cookie por URL.

**A confirmar:** quanto dura o cookie obtido pela janela anônima, comparado ao obtido na janela normal.

---

### Tópico 191 — Entidades — vídeo, reprodução, catálogo canônico e regra de canal

**O que existe hoje:** as reproduções do Spotify vivem em `reproducao_spotify`, identificadas por nome e artista principal, com os artistas extras em `artista_faixa_spotify`. Não há conceito de "música principal" com versões, nem de mashup, nem de artista único entre serviços.

**Por que importa:** é o modelo que permite juntar versões, separar mashups e combinar Spotify com YouTube Music. Sem ele, cada serviço continua sendo uma ilha. As tabelas do Spotify **não mudam**.

**O que precisa acontecer:**
- Enums em `src/Enum/`:
  - `FonteReproducaoYoutube` (`coletor`, `takeout`).
  - `StatusClassificacaoVideo` (`pendente`, `musica`, `mashup`, `compilacao`, `nao_musica`, `revisar`, `indisponivel`).
  - `OrigemClassificacao` (`regra`, `regra_canal`, `ia`, `manual`).
  - `TipoVersaoMusica` (`original`, `slowed`, `sped_up`, `reverb`, `oito_d`, `nightcore`, `lyrics`, `video_oficial`, `traducao`, `remix`, `cover`, `instrumental`, `ao_vivo`, `outro`).
  - `TipoMusicaCatalogo` (`original`, `mashup`).
  - `ClassificacaoCanal` (`musica`, `nao_musica`).
- `VideoYoutube`: `videoId`, `titulo`, `canal`, `canalId` (opcional), `duracaoMs` (opcional), `urlCapa`, `categoriaYoutube` (opcional), `descricaoResumo` (até 1.000 caracteres), `disponivel`, `status`, `origemClassificacao`, `confianca` (0 a 100), `respostaIa` (JSON), `classificadoEm`, `tipoVersao`, vínculo opcional com `MusicaCatalogo`. Único por usuário e `videoId`.
- `ReproducaoYoutube`: vínculo com `VideoYoutube`, `tocadaEm` (UTC), `msReproduzidos`, `tempoExato` (sempre falso no YouTube), `fonte`, `chaveDeduplicacao`. Único por usuário e chave. Índices em `(usuario, tocadaEm)` e `(video)`.
- `MusicaCatalogo`: `titulo`, `tipo`, `chaveNormalizada`, `album` e `urlCapa` (opcionais), `videoOficialId` (opcional), `confirmadaManualmente`. Única por usuário e chave.
- `ArtistaCatalogo`: `nome`, `nomeNormalizado`, `urlFoto` (opcional). Único por usuário e nome normalizado. `AliasArtistaCatalogo` (`aliasNormalizado` único por usuário) para casos como "lana", "Lana Del Rey" e "JENNIE" e "Jennie".
- `MusicaArtistaCatalogo` (música, artista, `posicao`, 0 = principal). `ComponenteMashup` (mashup, texto do componente, música componente opcional, `posicao`), porque o segundo componente pode ficar sem identificação.
- `VinculoMusicaSpotify`: liga a identidade do Spotify (nome e artista principal normalizados) a uma `MusicaCatalogo`.
- `RegraCanalYoutube`: `canalNormalizado`, `classificacao`. Única por usuário e canal.
- Repositórios para cada entidade com `salvar`, `remover`, `flush` e as buscas usadas nos tópicos seguintes (por chave normalizada, por `videoId`, pendentes em lote, por canal).
- Duas migrations geradas por `make doctrine-diff` (vídeos e reproduções; catálogo), aplicadas e validadas com `make doctrine-validate`.

**Não fazer:** alterar `reproducao_spotify` ou `artista_faixa_spotify`. Fazer o catálogo depender do `videoId` ou do código de faixa do Spotify.

**A confirmar:** índices adicionais depois de medir as consultas dos tópicos 199 e 200.

---

### Tópico 192 — Coleta do histórico do YouTube Music — novas reproduções, intervalo adaptativo e Scheduler

**O que existe hoje:** o coletor de teste (Python, fora do repositório) consulta o histórico a cada 60 s e só grava um log. Ele mostrou que o histórico traz as músicas em ordem, sem horário.

**Por que importa:** é o coração da coleta contínua. Os erros aqui são silenciosos: perder uma reprodução, contar a mesma duas vezes ou deixar a coleta parar com o cookie vencido sem ninguém notar.

**O que precisa acontecer:**
- **Detectar reproduções novas** comparando a consulta com o `snapshotTopo` da conta:
  - Itens que aparecem **antes** do antigo primeiro item da lista são reproduções novas.
  - Itens que não existiam no snapshot também são novos.
  - Repetição **seguida** da mesma música não aparece e é perdida (limite conhecido, documentar).
  - Repetição não seguida sobe a música ao topo e conta como nova.
  - A **primeira** consulta só grava o snapshot e não gera reproduções.
  - Cobrir com testes: música nova, várias de uma vez, repetição não seguida, repetição seguida, lista vazia, snapshot vazio, mudança de rótulo das seções ("Today", "Yesterday" e meses).
- **Gravação:** para cada item novo, criar ou atualizar o `VideoYoutube` com título, canal (o "artista" que o YouTube Music mostra em uploads é o canal), duração e capa, e criar a `ReproducaoYoutube` com `tocadaEm` = momento em que foi vista, `fonte = coletor`. Se o tópico 186 medir um atraso estável, aplicar a correção medida. Disparar a identificação dos vídeos ainda sem classificação (tópico 195) e invalidar o cache das análises do usuário.
- **Tempo ouvido estimado:** `EstimarTempoReproduzidoYoutubeService` (atômico). Ao criar, `msReproduzidos` provisório = duração. Quando a próxima reprodução chega, ajustar a anterior para `min(intervalo, duração)`. A reprodução sem seguinte, depois de 20 min, fica com a duração.
- **Intervalo adaptativo:** `RecurringMessage::every('30 seconds', ...)` em `src/Schedule.php` dispara `ColetarHistoricoYoutubeMusicMessage`. O handler só consulta contas com `proximaConsultaEm` vencido. Constantes: `INTERVALO_ATIVO_SEGUNDOS = 30` enquanto houve novidade nos últimos 10 minutos, `INTERVALO_OCIOSO_SEGUNDOS = 120` caso contrário, e um mínimo absoluto de 15 s que nunca é quebrado. Um bloqueio por conta evita duas consultas sobrepostas.
- **Erros:** falha passageira → espera 1, 2, 5 e 15 minutos. Três erros seguidos → rodar a validação de credenciais. Se inválidas, marcar `reconectar`, parar de consultar e gravar o motivo. Registrar o contador `errosSeguidos` e logs estruturados sem dados do usuário.
- Fila própria `youtube_coleta` com 1 worker no `messenger.yaml`, em `devops/supervisord.conf` e `devops/php/supervisord-prod.conf`, com limite de memória.
- Quando esta coleta estiver em produção e confirmada, desligar o coletor de teste (tópico 186).

**Não fazer:** gerar reproduções na primeira consulta. Consultar com menos de 15 s de intervalo. Registrar o conteúdo das respostas.

**A confirmar:** o atraso entre tocar e aparecer no histórico (medido no tópico 186), e se 30 s é suficiente ou se vale 20 s enquanto ativo.

---

### Tópico 193 — Infra — YouTube Data API em lote para categoria, duração e descrição

**O que existe hoje:** o Takeout só traz título, canal e horário, sem duração, categoria ou descrição. A coleta pela `ytmusicapi` traz duração e capa, mas não a categoria. O projeto já usa a API do YouTube só no teste do player.

**Por que importa:** a duração é necessária para estimar o tempo ouvido e para separar uma música de uma compilação de uma hora. A categoria "Música" e a descrição (onde quem posta mashup costuma listar as músicas usadas) melhoram muito a identificação. A API aceita 50 vídeos por chamada, então enriquecer milhares custa quase nada.

**O que precisa acontecer:**
- Interface `YoutubeDataInterface` e cliente `YoutubeDataClient` em `src/Infra/YoutubeData/`, com um cliente Guzzle dedicado no `services.yaml`.
- Nova chave `YOUTUBE_API_KEY` (restrita à YouTube Data API v3, **separada** do cliente OAuth do teste que será apagado), no `.env`, injetada por parâmetro.
- `buscarVideos(array $videoIds)` com `videos.list` (`snippet` e `contentDetails`), em lotes de 50. Devolve `VideoYoutubeDataDTO`: `videoId`, `titulo`, `canal`, `canalId`, `categoriaId`, `duracaoMs` (convertendo o formato `PT#M#S`), `descricao` (cortada em 1.000 caracteres) e `urlCapa`. Os `videoId` que não voltam são marcados como indisponíveis.
- Controle de cota: constante de orçamento diário (proposta: 5.000 unidades, cada chamada custa 1) contada no banco. Ao receber `quotaExceeded`, pausar o enriquecimento até o dia seguinte. `YoutubeDataException` com `cotaExcedida()`, `chaveInvalida()` e `respostaInesperada()`.
- Testes de conversão de duração e do parsing com fixtures.
- Registrar no documento a **política de dados** da API do YouTube: pelo que sei, dados vindos da API não podem ficar guardados sem atualização por muito tempo. Ler a política e decidir se o catálogo precisa de reatualização periódica.

**Não fazer:** usar o cliente OAuth do teste. Enviar a chave em URL de log.

**A confirmar:** a regra exata de retenção da API do YouTube e o horário em que a cota diária reinicia.

---

### Tópico 194 — Infra — identificador de músicas por IA com resposta estruturada e registro de custo

**O que existe hoje:** a M129 criou `OpenAiCorretorTextoClient` (modelo `gpt-5.4-mini` por `OPENAI_MODELO_TEXTO`, chave `OPENAI_API_KEY`). O teste de identificação mostrou que o modelo separa mashups, colaborações e títulos bagunçados com boa qualidade, gastando em média 155 tokens de entrada e 102 de saída por título, cerca de 60% da saída sendo raciocínio.

**Por que importa:** a IA é a primeira etapa da identificação. A resposta precisa ser estruturada e validada, nunca texto solto, e o custo precisa ser visível, porque o Takeout pode ter milhares de vídeos.

**O que precisa acontecer:**
- Interface `IdentificadorMusicaInterface` e cliente `OpenAiIdentificadorMusicaClient` em `src/Infra/OpenAi/`, reaproveitando a configuração HTTP do cliente existente (extrair uma base comum se houver duplicação).
- Entrada por vídeo (`EntradaIdentificacaoDTO`): `id`, `titulo`, `canal`, `duracaoMs`, `categoriaId` e `descricao` cortada em 500 caracteres. Lotes de até `TAMANHO_LOTE_IDENTIFICACAO` (proposta: 10), cada item com seu `id`.
- Saída por **resposta estruturada** (esquema JSON): `id`, `tipo` (`musica`, `mashup`, `compilacao`, `nao_musica`), `confianca` (0 a 100), `versao` (valores de `TipoVersaoMusica`), `componentes` (lista de `{ titulo, artistas[] }`; um componente para música, dois ou mais para mashup), `ambiguo` e `alternativas` (até 2 interpretações quando o título é ambíguo, como "Renegade").
- Instruções do modelo numa classe de constantes `InstrucoesIdentificacaoMusica`: remover rótulos (slowed, reverb, sped up, 8D, lyrics, tradução, TikTok version e semelhantes); remix, cover e instrumental são versões da **mesma** música; distinguir colaboração (uma música, vários artistas) de mashup (várias músicas); aceitar "Artista - Título" e "Título - Artista"; entender letras espaçadas, caixa baixa e títulos em português; **não inventar**: na dúvida, baixar a confiança e marcar `ambiguo`.
- Validar a resposta com o Validator do Symfony num `ResultadoIdentificacaoDTO`. JSON inválido ou item faltando → `IdentificacaoException::respostaInvalida()`, tratado como `revisar`.
- **Registro de custo:** entidade `ConsumoIa` (`finalidade`, `modelo`, `tokensEntrada`, `tokensSaida`, `criadoEm`, usuário) com migration, gravada a cada chamada. Parâmetros de preço por milhão de tokens no `services.yaml`. A M129 pode passar a gravar também.
- Tempo limite de 30 s, 2 tentativas com espera crescente, tratamento de 429.
- **Comparar esforço de raciocínio:** rodar os mesmos 100 títulos reais com esforço "low" e "minimal", medir custo e acertos, e registrar a escolha no `MUSICA.md`.

**Não fazer:** mandar a descrição inteira ou dados do usuário além do necessário. Registrar a chave ou o conteúdo completo das respostas em log.

**A confirmar:** os preços oficiais por milhão de tokens, o tamanho de lote e o nível de esforço.

---

### Tópico 195 — Serviço de identificação — música, mashup, compilação, confirmação pela busca e revisão

**O que existe hoje:** nada classifica vídeos nem vincula versões a uma música. Os testes mostraram que 64% do histórico do YouTube Music são edits de canais pequenos, e que o "artista" desses itens é o canal.

**Por que importa:** é o serviço que decide o que aparece no Dashboard: qual é a música principal, quais são as versões, quando é mashup e quem recebe crédito. A IA sozinha chuta com confiança, então a confirmação por busca e a fila de revisão são parte do serviço, não enfeite.

**O que precisa acontecer:**
- `IdentificarVideoYoutubeService::executar` (atômico), na ordem:
  1. **Regra de canal:** se `RegraCanalYoutube` existe, `nao_musica` encerra; `musica` segue para identificar. Decisões `manual` nunca são sobrescritas.
  2. **Atalho de canal "- Topic":** canal oficial gerado pelo YouTube vale como música original, com título e artista tirados do próprio item, sem chamar a IA.
  3. **Enriquecimento** pelo `YoutubeDataInterface` quando faltar duração ou categoria.
  4. **IA** (tópico 194).
  5. **Música (um componente):** confirmar com `YoutubeMusicInterface::buscarMusica` com título e artista. Aceitar o resultado oficial só com similaridade mínima (mesma abordagem e limiar 70 de `ResolverImagemSpotifyService`) e duração dentro da tolerância. Confirmada, usar título, artistas, álbum, capa e `videoOficialId` oficiais. Não confirmada, ou confiança abaixo de `LIMITE_CONFIANCA_REVISAO` (proposta: 70), ou `ambiguo` → status `revisar`, guardando as alternativas da IA.
  6. **Colaboração:** um componente com vários artistas é uma música só, com os artistas em ordem de posição.
  7. **Mashup (2 a `LIMITE_COMPONENTES_MASHUP`):** criar ou achar a `MusicaCatalogo` do tipo `mashup` pela chave do conjunto de componentes (assim a mesma mistura postada por outro canal cai na mesma música), com `ComponenteMashup`, artistas = união dos artistas dos componentes e capa = miniatura do vídeo. Artistas incertos → `revisar`.
  8. **Compilação** (mais componentes que o limite, ou a IA assim indica): status `compilacao`, sem crédito de artista, aparece na fila de revisão.
  9. **Agrupar versões:** achar ou criar a `MusicaCatalogo` por `chaveNormalizada`, vincular o `VideoYoutube` e gravar o `tipoVersao`.
- Fila Messenger `youtube_identificacao` (1 worker, com pausa entre chamadas). Um handler agendado a cada minuto pega até 50 vídeos pendentes e os manda para a IA em lotes. Comando `app:youtube:identificar --pendentes|--todos --limite=N`.
- Depois de classificar, avisar a projeção (tópico 199) para criar, atualizar ou apagar as linhas das reproduções daquele vídeo.
- Testes com os casos reais: as 5 versões de "Little Dark Age" caindo na mesma música; `Let Down + Choir` como música única; "one of the girls" como colaboração de 3 artistas; os mashups de 2 e de 4 músicas; "Renegade" indo para `revisar`; um canal "- Topic" sem chamada à IA.

**Não fazer:** sobrescrever decisão manual. Creditar artistas de compilação sem confirmação. Chamar a IA de novo para vídeo já classificado, salvo reclassificação pedida.

**A confirmar:** o limiar de confiança, o limite de componentes e o limiar de similaridade, ajustados com dados reais no tópico 205.

---

### Tópico 196 — Ligação entre Spotify e catálogo, e correções manuais — serviços e endpoints

**O que existe hoje:** as 9.907 músicas distintas do Spotify (62.851 streams de 30 s ou mais) existem só como linhas de `reproducao_spotify`, identificadas por nome e artista principal, com 2.140 músicas tendo todos os artistas em `artista_faixa_spotify`. Não há como corrigir uma identificação, unir duas músicas ou dizer que um canal nunca é música.

**Por que importa:** é aqui que Spotify e YouTube Music passam a falar do mesmo catálogo. E, como a identificação automática erra, as correções manuais têm que existir desde o início e valer para sempre.

**O que precisa acontecer:**
- `NormalizadorTextoMusicaService`: minúsculas, sem acentos, sem pontuação, juntando letras espaçadas (`s t e r e o` → `stereo`), `&` e `and` iguais, hífen interno tratado (`Lily-Rose`), sem rótulos de versão. Usado pelas chaves e pelos aliases. Testes com casos reais.
- `VincularFaixasSpotifyAoCatalogoService`: para cada música distinta do Spotify, cria ou acha a `MusicaCatalogo` (título, artista principal, álbum e capa de `imagem_spotify`), cria os `ArtistaCatalogo` a partir de `artista_faixa_spotify` (todos os creditados; só o principal quando ainda não houver), e grava o `VinculoMusicaSpotify`. Comando `app:musica:vincular-spotify` em lotes, com progresso e idempotente. Depois, a coleta e a importação do Spotify chamam o vínculo para cada música nova.
- Quando a busca de artistas (M133) gravar mais artistas de uma música já vinculada, atualizar os `MusicaArtistaCatalogo`.
- `SugerirDuplicatasCatalogoService`: sugere (sem aplicar) músicas com título normalizado igual e artista parecido, ou título igual e duração próxima. As sugestões entram na fila de revisão como "possível duplicata".
- **Serviços de correção atômicos:** `UnirMusicasCatalogoService`, `SepararVideoDaMusicaService`, `DefinirMusicaDoVideoService`, `DefinirComponentesMashupService`, `ClassificarCanalYoutubeService` (cria a regra e aplica em todos os vídeos pendentes ou em revisão daquele canal), `ResolverCompilacaoService`, `UnirArtistasCatalogoService` e `DefinirArtistasMusicaService`. Toda correção marca `confirmadaManualmente`, nunca apaga os dados originais e dispara a atualização da projeção e do cache.
- **Controller primeiro:** `MusicaCorrecaoController` em `src/Controller/Musica/`:
  - `GET /api/v1/musica/revisao` (paginado, filtro por `tipo`: `sem_vinculo`, `ambiguo`, `compilacao`, `canal_novo`, `possivel_duplicata`, `indisponivel`).
  - `POST /api/v1/musica/revisao/videos/{uuid}/musica`.
  - `POST /api/v1/musica/catalogo/unir` e `POST /api/v1/musica/catalogo/separar`.
  - `POST /api/v1/musica/canais/classificar`.
  - `POST /api/v1/musica/artistas/unir`.
  - `PUT /api/v1/musica/mashups/{uuid}/componentes`.
  - Item de outro usuário responde 404.
- Serializers para a fila (com a sugestão da IA, as alternativas, a confiança e a miniatura) e para o catálogo.

**Não fazer:** apagar títulos, canais ou respostas da IA ao corrigir. Aplicar sugestão de duplicata sozinho. Unir de forma que não dê para separar depois.

**A confirmar:** quão agressiva é a sugestão de duplicatas, medida na amostra de 30 músicas do tópico 205.

---

### Tópico 197 — Importação do Takeout — leitura, filtros, fila e deduplicação com a coleta

**O que existe hoje:** o passado do YouTube não está no sistema. A importação do Spotify (`ImportacaoSpotify`, fila `spotify_importacao`, leitor em streaming, deduplicação) é o modelo, e a M118 deixou lições: reanexar o usuário a cada lote, comparar horários em UTC e reabrir o EntityManager para gravar o motivo do erro.

**Por que importa:** o Gabriel ouvia no YouTube comum, então o Takeout tem anos de dados misturados com tudo o que ele assistiu. A leitura precisa ser robusta, não pode depender do nome dos arquivos (que o Google traduz) e não pode duplicar o que a coleta já guardou.

**O que precisa acontecer:**
- Enum `StatusImportacaoYoutube` (`enviada`, `processando`, `aguardando_confirmacao`, `classificando`, `concluida`, `erro`) e entidade `ImportacaoYoutube` (arquivo temporário, nome original, tamanho, contadores, motivo do erro, datas), com migration.
- **Leitor** `LeitorArquivoTakeoutYoutube` em `src/Infra/YoutubeMusic/`, com interface em `src/Interface/`, em streaming (um objeto por vez, memória constante, como o do Spotify). Aceita ZIP ou JSON. **Localiza o arquivo do histórico pelo conteúdo** (lista de objetos com `header`, `title`, `titleUrl` e `time`), nunca pelo nome, porque o Takeout em português traduz pastas e arquivos.
- Campos lidos: `header` ("YouTube Music" ou "YouTube"), `title` (removendo o prefixo no idioma da conta, como "Assistiu a "), `titleUrl` (extrai o `videoId` do `v=` ou de `youtu.be`), `subtitles[0].name` (canal) e `time` (UTC). Entradas sem `videoId` (posts e semelhantes) e anúncios (`details` de anúncio) são ignoradas. Vídeos apagados vêm só com o endereço, viram candidatos a `indisponivel`.
- **Privacidade:** ler só o histórico de exibição. Buscas, comentários, inscrições e o resto do ZIP são ignorados. Nada de endereço IP.
- **Gravação em lotes de 500:** cria `VideoYoutube` (pendente) para cada `videoId` novo e `ReproducaoYoutube` com `fonte = takeout` e chave de deduplicação = hash de usuário, `videoId` e `tocadaEm` ao segundo. Reimportar o mesmo arquivo não cria nada.
- **Deduplicação com a coleta:** se existir reprodução da coleta do mesmo `videoId` dentro de `JANELA_TOLERANCIA_TAKEOUT_SEGUNDOS` (proposta: 600), mantém **uma** só, com o horário do Takeout, e a fonte passa a `takeout`. Só entre fontes diferentes; dentro do Takeout, só a chave exata conta como repetida.
- Fila `youtube_importacao`, `ImportarHistoricoYoutubeMessage` e handler, em `messenger.yaml` e nos dois supervisores. `IniciarImportacaoYoutubeService` valida o arquivo (ZIP ou JSON, limite em constante, proposta 200 MB), impede duas importações simultâneas do mesmo usuário, grava em `var/tmp/youtube_importacoes` por um cliente de armazenamento (sem `mkdir` ou `unlink` nos services) e remove o arquivo no `finally`.
- **Controller primeiro:** `YoutubeImportacaoController` com `POST /api/v1/youtube-music/importacoes` (multipart, 201) e `GET /api/v1/youtube-music/importacoes/{uuid}`.

**Não fazer:** ler arquivos fora do histórico de exibição. Decidir o arquivo pelo nome. Deduplicar por título.

**A confirmar:** o formato real do arquivo, assim que o Takeout chegar. O Gabriel deve enviar uma amostra das primeiras entradas, e as regras de leitura são ajustadas antes de seguir. Também o valor da janela de 600 s.

---

### Tópico 198 — Importação do Takeout — enriquecimento, prévia de custo, classificação e tempo ouvido

**O que existe hoje:** depois da leitura (tópico 197), os vídeos ficam `pendente`, sem duração, categoria ou classificação, e as reproduções ficam sem tempo ouvido. Misturados com músicas há vídeos de todo tipo.

**Por que importa:** é aqui que se descobre, em meio a todos os vídeos assistidos, quais são música, e se evita gastar IA à toa. O Gabriel precisa ver o tamanho e o custo estimado **antes** de a IA rodar.

**O que precisa acontecer:**
- **Etapa 1 — enriquecer** todos os `VideoYoutube` pendentes pelo `YoutubeDataInterface` em lotes de 50, respeitando o orçamento de cota. Os que não voltam viram `indisponivel`.
- **Etapa 2 — descartar o que claramente não é música, sem IA**, com regras em constantes:
  - Categoria em `CATEGORIAS_NAO_MUSICA_DIRETAS` (Gaming 20, News 25, Howto e Style 26, Education 27, Science e Tech 28).
  - Duração acima de `DURACAO_MAXIMA_SEM_CATEGORIA_MUSICA_MS` (proposta: 20 min) quando a categoria não é Música (10).
  - `RegraCanalYoutube` existente.
  - Vídeo descartado fica guardado como `nao_musica` (nunca apagado). Categorias de upload de edits como Entretenimento (24) e Pessoas e Blogs (22) **vão para a IA**.
- **Etapa 3 — prévia:** a importação vai para `aguardando_confirmacao` com os números: reproduções lidas, vídeos únicos, descartados por regra, indisponíveis e **quantos irão para a IA com o custo estimado** (preços do tópico 194). Abaixo de `LIMITE_CUSTO_AUTOMATICO_USD` (proposta: 2) segue sozinha. Acima, espera `POST /api/v1/youtube-music/importacoes/{uuid}/confirmar`.
- **Etapa 4 — classificar** em lotes pelo `IdentificarVideoYoutubeService` (tópico 195), com progresso gravado e retomável. Comando `app:youtube:continuar-importacao {uuid}`.
- **Etapa 5 — tempo ouvido:** estimar para todas as reproduções do Takeout com `EstimarTempoReproduzidoYoutubeService`, ordenando **todas** as reproduções do usuário (inclusive as de vídeos que não são música), porque o intervalo até o próximo vídeo assistido é o que limita o tempo. Em blocos por mês.
- **Relatório final** no retorno da importação: reproduções lidas, vídeos únicos, músicas, mashups, compilações, não música, a revisar, indisponíveis, período coberto, meses com dados, tokens e custo estimado versus real.
- Cada etapa é idempotente, para continuar de onde parou depois de um erro ou reinício.

**Não fazer:** chamar a IA antes da prévia quando acima do limite. Apagar vídeo classificado como `nao_musica`.

**A confirmar:** as categorias e a regra dos 20 minutos, com a distribuição real do arquivo; o limite de custo automático.

---

### Tópico 199 — Leitura unificada — projeção das reproduções e paridade com os números do Spotify

**O que existe hoje:** as análises do Spotify (cerca de 16 endpoints, `ReproducaoSpotifyRepository` e `AnaliseReproducaoSpotifyRepository`) leem `reproducao_spotify`, agrupam por nome e artista principal e usam `artista_faixa_spotify` para os artistas extras. Os números estão calibrados contra o app do Spotify (abril, maio e junho de 2026: 15.392, 10.786 e 10.957 minutos contra 15.387, 10.766 e 10.956 do Spotify).

**Por que importa:** colocar o YouTube Music dentro de cada uma dessas consultas, uma a uma, duplicaria regras e arriscaria quebrar a calibração. Uma camada de leitura única resolve uma vez só. O risco real é mudar os números do Spotify sem perceber.

**O que precisa acontecer:**
- **Decisão técnica, medida antes de implementar:** comparar (a) tabela de projeção `reproducao_musical` e (b) view com UNION, num banco descartável com 100 mil reproduções do Spotify e uma amostra grande de YouTube. Registrar a escolha no `MUSICA.md`. A recomendação é a tabela.
- **Tabela `reproducao_musical`:** usuário, `musica` (catálogo), `fonte` (`spotify`, `youtube_music`), `tocadaEm`, `msReproduzidos`, `tempoExato`, `pulada` e `aleatorio` (só Spotify, nulos no YouTube), `origemId` e `criadoEm`. Única por fonte e origem. Índices em `(usuario, tocadaEm)`, `(usuario, musica)` e `(usuario, fonte, tocadaEm)`. Migration pelo fluxo padrão.
- **Alimentação:**
  - Spotify: comando `app:musica:projetar-spotify` (carga inicial, em lotes) mais uma mensagem após cada coleta e importação, respeitando a regra de substituição da M118 (quando o arquivo substitui uma reprodução da API, a linha da projeção acompanha).
  - YouTube: quando um vídeo vira `musica` ou `mashup`, todas as suas reproduções entram; `nao_musica`, `compilacao`, `revisar` e `indisponivel` não entram (e saem, se já estavam).
  - Qualquer correção manual ou unificação reprojeta só as músicas afetadas.
- **Repository unificado** (`ReproducaoMusicalRepository` e `AnaliseReproducaoMusicalRepository`), com as mesmas regras do `SPOTIFY.md` seção 3: stream a partir de 30 s sobre `msReproduzidos`; minutos somando tudo; mês e ano em UTC; hora, dia da semana e "Hoje" em Brasília; artistas creditados pela música inteira via `MusicaArtistaCatalogo`; mashup conta 1 para a música mashup e crédito completo para cada artista dos componentes; totais nunca duplicam.
- **Dimensão de fonte:** toda agregação aceita `fontes` e devolve a divisão por fonte (streams, minutos e a parte estimada), para os tooltips.
- **Prova de paridade:** comando `app:musica:comparar-paridade` roda as consultas antigas e as novas para `fonte = spotify` e imprime as diferenças. Deve dar **zero diferença** em: minutos de abril, maio e junho de 2026, streams e músicas distintas por mês, top 20 de músicas e de artistas em cinco períodos diferentes, e o resumo do ano. Só depois disso as consultas antigas são removidas.
- Desempenho: manter o cache por usuário (6 h, virando no dia seguinte) com a chave incluindo a fonte, e medir a primeira consulta contra os 0,5 a 6 s de hoje.

**Não fazer:** alterar `reproducao_spotify` ou as regras de cálculo. Apagar as consultas antigas antes de a paridade dar zero.

**A confirmar:** tabela de projeção ou view, depois da medição.

---

### Tópico 200 — Endpoints unificados /api/v1/musica com filtro de fonte

**O que existe hoje:** as análises estão sob `/api/v1/spotify/` (`capsula`, `resumo`, `artistas/top-musicas`, as rotas de `SpotifyAnaliseController` e os detalhes de artista e de música por nome). O frontend lê essas rotas e todas as telas assumem uma fonte só.

**Por que importa:** é a API que a página unificada passa a consumir. Manter os números iguais para `fonte = spotify` e acrescentar a fonte, as versões e os mashups sem duplicar serviços é o que evita retrabalho.

**O que precisa acontecer:**
- **Controllers primeiro**, em `src/Controller/Musica/`: `MusicaController` (resumo, Cápsula, rankings) e `MusicaAnaliseController` (recordes, evolução, hábitos, descobertas, retrospectiva, detalhes). Rotas sob `/api/v1/musica/`, espelhando as atuais, com o parâmetro `fonte` (`todas` padrão, `spotify`, `youtube_music`) validado pelo enum `FiltroFonteMusica`.
- Os Services existentes (`ObterDetalheCapsulaService`, `ObterResumoHojeSemanaCuriosidadesService`, `ObterRetrospectivaAnualSpotifyService` e os demais) passam a depender do repositório unificado, renomeados para nomes neutros. **Sem duplicar** serviços.
- Itens dos rankings passam a trazer: `fontes` (de onde veio), `mashup`, `estimado`, capa, artistas e o link externo (`urlSpotify` para itens do Spotify e `urlYoutubeMusic`, no formato `https://music.youtube.com/watch?v=<videoId>`, da versão mais ouvida ou do vídeo oficial).
- **Detalhe da música:** lista de `variantes` (vídeo, título, canal, `tipoVersao`, streams e minutos no período) e, em mashups, os `componentes`. **Detalhe do artista:** inclui os mashups em que ele aparece, marcados como tal. Ambos com a divisão por fonte e a primeira e a última vez de cada fonte. Os detalhes passam a usar o `uuid` do catálogo.
- **Capas e fotos:** capas de músicas do YouTube vêm do catálogo (capa oficial confirmada ou miniatura do vídeo). Fotos de artistas: reaproveitar as de `imagem_spotify` quando existirem e, para artistas só do YouTube, buscar uma única vez pela `ytmusicapi`, em fila, gravando em `ArtistaCatalogo.urlFoto`. Sem usar o Spotify para isso, para não gastar a cota.
- `GET /api/v1/musica/identificacao/resumo` (contagem por status: pendentes, em revisão, compilações) e `GET /api/v1/musica/identificacao/consumo` (tokens e custo estimado por dia e total, usando `ConsumoIa`).
- As rotas de **conexão, importação, status, sincronizar, desconectar e imagens** do Spotify continuam em `/api/v1/spotify/`, sem mudar. As rotas antigas de análise ficam como alias por um período e são removidas quando o frontend estiver migrado (tópico 203).
- Cache com a fonte na chave, invalidado por novas reproduções, importações, correções e reclassificações.
- Serializers estendem os existentes, sem duplicar.

**Não fazer:** mudar as regras de cálculo. Criar serviços paralelos por fonte.

**A confirmar:** nomes exatos das rotas novas.

---

### Tópico 201 — Frontend — renomear a página, tema, seletor de fonte e ícones de origem

**O que existe hoje:** a página `/spotify` (`web/features/spotify/`) tem o visual do Spotify isolado no wrapper `TemaSpotify` e nos tokens `cirqueira.spotify.*`, gerados por `scripts/gerar-paleta-brand.mjs`. O menu, o cabeçalho e o Dashboard apontam para "Spotify". Os textos, o rodapé e a imagem da Cápsula falam só do Spotify. A rota `/spotify/callback` está cadastrada no painel do Spotify e no `.env` (`SPOTIFY_REDIRECT_URI`).

**Por que importa:** a página passa a ser de música, não do Spotify. A aparência não muda, mas o nome, a organização e a identificação da fonte precisam mudar, sem quebrar o retorno do login do Spotify.

**O que precisa acontecer:**
- **Nome e rota:** a página vira **Música** em `/musica` (nome a confirmar). `/spotify` redireciona para `/musica`. As rotas de detalhe passam para `/musica/artista` e `/musica/faixa`, com redirecionamento das antigas. **A rota `/spotify/callback` NÃO muda**, porque o Spotify devolve o login para esse endereço.
- **Organização do código:** criar `web/features/musica/` com a página e as seções compartilhadas. `web/features/spotify/` mantém a conexão, a importação e o callback do Spotify. Ajustar `App.tsx`, `Sidebar.tsx` (ícone e rótulo), `Header.tsx` e o atalho "Spotify" da `BarraAcoesRapidas` do Dashboard.
- **Tema:** `TemaSpotify` → `TemaMusica`, tokens `cirqueira.spotify.*` → `cirqueira.musica.*`, atualizando `gerar-paleta-brand.mjs`, `theme.ts` e a seção 24 do `DESIGN.md` ("visual inspirado no Spotify aplicado à página de música"). **Os valores das cores não mudam.** Acrescentar tokens de marca para os ícones de origem (`cirqueira.musica.fonteSpotify` e `cirqueira.musica.fonteYoutubeMusic`), com os hexadecimais só no script.
- **Seletor de fonte:** `SeletorFonteMusica` em pílulas (Todos, Spotify, YouTube Music), ao lado do seletor de período, com o estado na URL por `useFiltrosUrl` (`?fonte=`), padrão `todas`, mantido ao navegar para os detalhes. Hook `useFonteMusica`; todas as chaves de query passam a incluir a fonte.
- **Ícones de origem:** `IconeFonteMusica` e `GrupoIconesFonte` (um ou dois ícones, com tooltip "Spotify" e "YouTube Music" e rótulo acessível), cada um na cor da própria marca, dentro das regras de marca.
- **Marca de estimado:** `MarcaEstimado` ("est." com tooltip "inclui tempo estimado do YouTube Music") e `MinutosSpotify` → `MinutosMusica`, cujo tooltip, além das horas por extenso, separa "Spotify X min · YouTube Music Y min (estimado)".
- **Textos neutros:** `RodapeSpotify` → `RodapeMusica` creditando os dois serviços, "Abrir no Spotify" só em itens do Spotify e "Abrir no YouTube Music" nos do YouTube, `EstadoVazioMusica` com os dois caminhos (conectar o Spotify, conectar o YouTube Music), esqueletos adaptados, e a atribuição da imagem PNG da Cápsula citando os dois serviços.
- `useSEO` com o novo título. `make lint-all`, `tsc` e o build do Vite sem erros.

**Não fazer:** mudar valores de cor, forma ou tipografia. Renomear `/spotify/callback`. Usar `useEffect`.

**A confirmar:** o nome "Música" e a rota `/musica`.

---

### Tópico 202 — Frontend — conexão do YouTube Music, importação do Takeout e status no Dashboard

**O que existe hoje:** o painel do Spotify (`PainelConexaoSpotify`) tem três estados (desconectada, conectada, reconectar), o modal de importação (`ModalUploadHistoricoSpotify`, com polling a cada 2,5 s) e o `StatusIntegracoes` do Dashboard mostra o Spotify. Nada disso existe para o YouTube Music.

**Por que importa:** é a porta de entrada do usuário para o novo serviço. Como a sessão do YouTube Music expira, a tela precisa deixar muito claro quando é preciso colar de novo, senão a coleta para sem aviso.

**O que precisa acontecer:**
- **Painéis de conexão lado a lado:** dois cartões compactos no topo da página (Spotify e YouTube Music), mais o aviso de bloqueio do Spotify (tópico 187).
- `PainelConexaoYoutubeMusic`:
  - **Não conectado:** passo a passo para obter os cabeçalhos (janela anônima, entrar, copiar de uma requisição `browse`, fechar sem clicar em Sair), um campo grande de texto para colar e o aviso "Isto dá acesso à sua conta Google. Fica criptografado no servidor e não aparece de novo. Sair da conta no navegador invalida."
  - **Conectado:** status, última consulta, última novidade e uma nota sobre a margem de erro do horário.
  - **Reconectar:** alerta em destaque explicando que a sessão expirou, com o campo para colar uma nova.
  - **Desconectar** com modal de confirmação dizendo o que é apagado (credencial) e o que fica (reproduções).
- O campo colado **não é guardado** no navegador (nem em `localStorage`) e é limpo depois do envio.
- **Modal do Takeout** (`ModalImportarTakeoutYoutube`, Dialog no desktop e Drawer no celular, via `useMediaQuery`): instruções em acordeão (como pedir só o histórico em JSON, quanto demora, conferir a exclusão automática), área de soltar `.zip` ou `.json`, aviso de privacidade (só o histórico é lido) e o acompanhamento por etapas: Lendo → **Aguardando confirmação** (números e custo estimado, botões Confirmar e Cancelar) → Classificando (progresso) → Concluída (relatório com músicas, mashups, compilações, não música, a revisar, período coberto e custo). Reaproveitar o aprendizado da M119: ao concluir, invalidar as consultas da página **menos** a de status da importação.
- **Dashboard:** `StatusIntegracoes`, `types.ts` e `metricasDashboard.ts` ganham o item YouTube Music (neutro `nao_configurado`, verde `conectado`, vermelho `reconectar`) e o estado âmbar `bloqueado` do Spotify, com link para `/musica`.
- **Selo de revisão:** na página, um selo "N itens para revisar" levando à tela do tópico 204, alimentado por `GET /api/v1/musica/identificacao/resumo`.
- Hooks `useStatusYoutubeMusic`, `useConectarYoutubeMusic`, `useDesconectarYoutubeMusic`, `useImportacaoYoutube` e `useConfirmarImportacaoYoutube`, com funções em `api.ts`, esquemas Zod, toasts por `addToast` e erros por `extrairMensagemErroApi`.

**Não fazer:** mostrar ou guardar o cookie. Disparar a IA sem a confirmação quando o custo passar do limite.

---

### Tópico 203 — Frontend — rankings, Cápsula e detalhes unificados com versões e mashups

**O que existe hoje:** as seções da página (`SecaoHojeSemana`, `SecaoCapsulaSonora`, `SecaoRecordes`, `SecaoEvolucaoMensal`, `SecaoHabitos`, `SecaoDescobertas`, `SecaoRetrospectiva`, `ItensRankingSpotify`) e as páginas de detalhe leem `/api/v1/spotify/...`. Cada linha do ranking mostra capa, título, artista, minutos e streams, e abre as músicas do artista ou do álbum.

**Por que importa:** é aqui que o Gabriel vê o resultado: uma lista só, com o visual que ele gosta, onde cada música mostra de onde veio e, ao abrir, quais versões ouviu.

**O que precisa acontecer:**
- Todas as seções passam a ler `/api/v1/musica/...` com a fonte do seletor. As rotas antigas de análise do Spotify são removidas do front.
- **Linha do ranking** (`ItensRankingMusica`): capa, título principal, artistas, `GrupoIconesFonte`, minutos com `MinutosMusica` e streams, etiqueta "Mashup" quando for o caso. **Linha expansível** (`Collapsible`):
  - Músicas: "Versões ouvidas neste período", cada uma com o tipo (slowed, lyrics, vídeo oficial e outros), o canal, streams, minutos e link para abrir.
  - Mashups: "Contém", com os componentes, e os artistas creditados.
  - Artistas e álbuns: as músicas mais ouvidas, como hoje, com o popup "Ver todas as músicas".
- **Páginas de detalhe** de artista e de música (`DetalheArtistaMusica`, `DetalheMusicaMusica`), por `uuid`: gráfico de evolução mensal **empilhado por fonte**, lista de versões, mashups em que o artista aparece, e primeira e última vez por fonte.
- **Efeito do seletor:** com `fonte = spotify` nada do YouTube aparece. Com `youtube_music`, o que só existe no Spotify (pulos e aleatório em Hábitos, "Tocando agora") mostra "indisponível para o YouTube Music". Com Todos, "Tocando agora" continua do Spotify e o YouTube Music ganha uma linha "Última detectada: título, há X min", sem prometer tempo real.
- **Cápsula Sonora:** acompanha o seletor (padrão Todos), com a nota "Calibrada com o Spotify. Os minutos do YouTube Music são estimados." quando incluir o YouTube. O CSV e a imagem PNG seguem a mesma regra.
- **Estados vazios por fonte:** por exemplo, "Nenhuma música do YouTube Music neste período" com o caminho para conectar ou importar.
- **Imagens:** o polling de capas e fotos (`useImagensItensSpotify`) passa a aceitar URLs do catálogo para o YouTube e as fotos de artistas em fila.
- Conferir no celular (390×844) sem rolagem horizontal. `make lint-all`, `tsc` e o build sem erros.

**Não fazer:** cores fora da paleta nos gráficos. Prometer horário ou tempo exatos para o YouTube Music.

---

### Tópico 204 — Frontend — tela de revisão e correções do catálogo

**O que existe hoje:** nenhuma tela de correção. Se a IA errar uma música, um artista ou uma versão, o dado errado fica nos relatórios.

**Por que importa:** a identificação automática vai errar em alguns itens (músicas obscuras, mashups ambíguos, canais novos). Sem uma forma simples de corrigir, a confiança nos números cai. O trabalho manual precisa ser pequeno e valer para sempre.

**O que precisa acontecer:**
- Rota `/musica/revisao` (com link na página e o selo do tópico 202), página `RevisaoMusica` com abas: **Sem vínculo**, **Ambíguos**, **Compilações**, **Canais novos**, **Possíveis duplicadas** e **Indisponíveis**, cada uma com a contagem.
- **Cartão de item:** miniatura, título e canal originais, duração, link "Abrir no YouTube", a sugestão da IA com a confiança e as alternativas (por exemplo, as duas leituras de "Renegade"). Ações: **Confirmar sugestão**, **Escolher música** (busca no catálogo ou criar nova com título e artista), **Marcar como mashup** (editor de componentes com título e artistas), **Não é música**, e **Este canal é sempre música / nunca é música**.
- **Aba Canais novos:** lista de canais ainda sem regra, em ordem de quantas reproduções têm ("37 reproduções neste canal"), para que um clique resolva muitos vídeos.
- **Compilações:** escolher entre tratar como "não é música", como mashup ou informar os artistas.
- **Unir e separar:** a partir do detalhe da música, as ações "Unir com outra música…" (com busca) e "Separar esta versão". Nos artistas, "Unir com outro artista" (cria o alias).
- **Ação em lote:** selecionar vários itens e definir a mesma música.
- Atualização otimista e invalidação das consultas de música depois de cada correção. Teclado e foco tratados. No celular, os modais viram `Drawer`, sem modal dentro de modal.
- Visual do tema da página de música. Hooks de revisão com TanStack Query e esquemas Zod.

**Não fazer:** apagar dados originais. Abrir modal sobre modal.

---

### Tópico 205 — Teste end-to-end com dados reais, calibração e documentação

**O que existe hoje:** o lote inteiro só foi validado com fixtures e bancos descartáveis. Muitas constantes (janela de 600 s, limiar de confiança, limite de componentes, categorias, regra dos 20 minutos, intervalo da coleta) são propostas.

**Por que importa:** todos os números do lote dependem do comportamento real do YouTube e dos dados do Gabriel. Fechar sem testar com dados reais seria entregar um relatório bonito com números sem prova.

**O que precisa acontecer:**
- **Coleta ao vivo:** o Gabriel toca de 5 a 10 músicas, incluindo versões slowed da mesma música, um mashup, uma repetição e uma pulada. Conferir o que entrou, a margem do horário, o agrupamento das versões, o mashup como música própria e os artistas creditados.
- **Takeout real:** importar o arquivo, conferir o relatório (lidos, únicos, músicas, mashups, compilações, não música, a revisar, indisponíveis), o tamanho da fila de revisão, o custo real contra o estimado, e ajustar as constantes. Registrar a taxa de acerto da IA numa amostra de **100 títulos reais** (inclusive português e gospel) e a de confirmação pela busca.
- **Mistura entre serviços:** amostra de 30 músicas ouvidas nos dois serviços, verificando duplicatas falsas e uniões erradas.
- **Paridade:** com `fonte = spotify`, os números do Spotify permanecem idênticos aos de antes (abril, maio e junho de 2026 e o comando de paridade do tópico 199 com zero diferença).
- **Outubro de 2025:** ver o mês combinado (Spotify mais YouTube), se o histórico do Google ainda o tiver.
- **Rede do trabalho:** a página abre e a coleta do YouTube Music continua sendo do servidor.
- **Cookie vencido:** invalidar a sessão de propósito e conferir que o estado `reconectar` aparece no painel e no Dashboard em poucos minutos, e que colar uma nova retoma a coleta sem perder reproduções.
- **Bloqueio do Spotify:** simular um bloqueio e conferir o aviso e a pausa da coleta e da busca de artistas.
- **Celular:** a página, o seletor, o modal do Takeout e a revisão.
- **Documentação:** `MUSICA.md` (página unificada, fontes, regras, estimativas, revisão) e `YOUTUBE_MUSIC.md` (coleta, cookie, Takeout, limites); atualizar `SPOTIFY.md`, `FUNCIONALIDADES_DO_SISTEMA.md`, `CIRQUEIRAX.md`, `DASHBOARD.md`, `MULTIUSUARIO.md`, `DESIGN.md` (seção 24), `stack/BACKEND.md`, `stack/FRONTEND.md`, `stack/MESSENGER.md`, `stack/AUTH.md` e `stack/DOCUMENTACAO_TECNICA.md` (`YOUTUBE_API_KEY` e os parâmetros de preço). Depois, `make progresso`.
- **Fechamento:** `make lint-all`, `make doctrine-validate`, `tsc`, Biome e o build. Confirmar que o coletor de teste, a pasta `/root/ytmusic_teste` e as credenciais do teste (`.env`, Google Cloud e acesso de terceiros) foram removidos.

**Não fazer:** marcar o lote como concluído sem as verificações com dados reais. Alterar constantes sem registrar o motivo no `MUSICA.md`.
