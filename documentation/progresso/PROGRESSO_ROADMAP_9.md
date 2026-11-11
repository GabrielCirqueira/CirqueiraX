# Progresso do Roadmap — Feature 9 (Spotify e Cápsula Sonora)

> Detalhamento dos tópicos 161 ao 185.

---

### ✅ Tópico 161 — Preparação do app no painel do Spotify e variáveis de ambiente
- **Status**: Concluído
- **Data**: 04 de novembro de 2026
- **O que foi feito**:
  - Definidas as especificações para criação do aplicativo no Spotify Developer Dashboard sob o nome `CirqueiraX Stats`, tipo Web API, respeitando as diretrizes de marca (sem uso da palavra Spotify como prefixo ou destaque do app).
  - Configuradas as URLs de callback para autorização OAuth 2.0:
    - Desenvolvimento: `http://127.0.0.1:4012/spotify/callback`
    - Produção: `https://x.cirqueira.com/spotify/callback`
  - Documentados os escopos estritos de permissão:
    - `user-read-recently-played` (obrigatório para leitura das últimas 50 reproduções recentes).
    - `user-read-currently-playing` (para exibição de faixa tocando agora nos cartões da página).
    - `user-top-read` (para consultas eventuais de preferências).
  - Registradas as decisões de política e termos de uso do Spotify:
    - (a) Armazenamento apenas de URLs diretas de capas e fotos de artistas no banco de dados, sem cópia persistente de arquivos protegidos em disco.
    - (b) Cálculos agregados privados (minutos ouvidos, rankings mensais e comparações da Cápsula) restritos ao próprio usuário autenticado para visualização pessoal.
    - (c) Atribuição de marca obrigatória com links "Abrir no Spotify" e logotipos sem distorção.
  - Adicionadas as variáveis de ambiente `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` e `SPOTIFY_REDIRECT_URI` no arquivo `.env`.
  - Injetados os parâmetros `%env(SPOTIFY_CLIENT_ID)%`, `%env(SPOTIFY_CLIENT_SECRET)%` e `%env(SPOTIFY_REDIRECT_URI)%` no `config/services.yaml`.
- **Arquivos**:
  - `.env`
  - `config/services.yaml`
  - `ROADMAP.md`

### ✅ Tópico 162 — Infra — SpotifyClient com tratamento de limite de requisições
- **Status**: Concluído
- **Data**: 04 de novembro de 2026
- **O que foi feito**:
  - Criada a exceção personalizada de contexto `SpotifyException` em `src/Exception/Spotify/` com mensagens em português para limite de requisições excedido, tokens inválidos/expirados, conta não autorizada no modo de desenvolvimento, falhas na troca de código ou renovação de tokens e erros de serviço do Spotify.
  - Criados os DTOs de transporte e mapeamento tipados em `src/DataObject/Spotify/`:
    - `TokensSpotifyDTO`: access token, refresh token, expiração e escopos.
    - `PerfilSpotifyDTO`: id, nome de exibição e foto do perfil.
    - `ItemReproducaoRecenteDTO`: código da faixa, nome, artista principal, código do artista principal, demais artistas, álbum, URL da capa, duração em milissegundos e data/hora em UTC.
    - `ListaReproducoesRecentesSpotifyDTO`: itens mapeados e cursor `after` em milissegundos.
    - `FaixaSpotifyDTO`: metadados completos de faixas individuais.
    - `ArtistaSpotifyDTO`: código, nome, URL da foto e gêneros.
    - `BuscaFaixasSpotifyDTO`: lista de faixas localizadas por consulta de texto.
  - Criada a interface de contrato `SpotifyInterface` em `src/Interface/`.
  - Implementado o cliente de infraestrutura `SpotifyClient` em `src/Infra/Spotify/`, estendendo `App\Infra\Client`:
    - Tratamento resiliente de rate limit (HTTP 429) com leitura do cabeçalho `Retry-After`, espera progressiva e até 3 tentativas automáticas.
    - Tratamento de status 401, 403 e 5xx com mapeamento para exceções de domínio.
    - Métodos para geração da URL de autorização (`gerarUrlAutorizacao`), troca de código por tokens (`trocarCodigoPorTokens`), renovação (`renovarToken`), obtenção de perfil (`buscarPerfil`), leitura do histórico recente (`listarReproducoesRecentes`), busca de faixas e artistas (`obterFaixa`, `obterArtista`, `buscarFaixas`).
  - Registrado o serviço e o cliente Guzzle dedicado `guzzle.spotify` no `config/services.yaml` com injeção de parâmetros via DI.
  - Validado com PHPStan nível máximo (`[OK] No errors`) e lint de container Symfony com 100% de conformidade.
- **Arquivos**:
  - `src/Exception/Spotify/SpotifyException.php`
  - `src/DataObject/Spotify/TokensSpotifyDTO.php`
  - `src/DataObject/Spotify/PerfilSpotifyDTO.php`
  - `src/DataObject/Spotify/ItemReproducaoRecenteDTO.php`
  - `src/DataObject/Spotify/ListaReproducoesRecentesSpotifyDTO.php`
  - `src/DataObject/Spotify/FaixaSpotifyDTO.php`
  - `src/DataObject/Spotify/ArtistaSpotifyDTO.php`
  - `src/DataObject/Spotify/BuscaFaixasSpotifyDTO.php`
  - `src/Interface/SpotifyInterface.php`
  - `src/Infra/Spotify/SpotifyClient.php`
  - `config/services.yaml`

### ✅ Tópico 163 — Entidade ContaSpotify, enum de status e migration
- **Status**: Concluído
- **Data**: 04 de novembro de 2026
- **O que foi feito**:
  - Criado o enum `StatusContaSpotify` em `src/Enum/` com os casos `conectada`, `reconectar` e `desconectada`, com métodos descritivos e predicados booleanos `isConectada()`, `isReconectar()` e `isDesconectada()`.
  - Criada a entidade `ContaSpotify` em `src/Entity/` com UUID v7 binário, chave única por `Usuario` (onDelete: CASCADE), campos para `spotifyId`, `nomeExibicao`, `urlFoto`, `accessTokenCriptografado`, `refreshTokenCriptografado`, `expiraEm`, `escopos`, `status`, `conectadoEm`, `ultimaColetaEm`, `cursorUltimaReproducaoMs` (bigint), `erroMotivo` e timestamps `criadoEm` / `atualizadoEm`.
  - Definidos métodos de intenção de domínio (`conectar`, `renovarTokens`, `marcarComoReconectar`, `desconectar`, `registrarColeta`) e predicado `isTokenExpirado` utilizando margem de segurança de 300 segundos (`MARGEM_EXPIRACAO_SEGUNDOS`). Getters sem prefixo `get`.
  - Criado o repositório `ContaSpotifyRepository` em `src/Repository/` com métodos `salvar`, `remover`, `flush`, `buscarDoUsuario`, `buscarPorSpotifyId` e `listarConectadas`.
  - Gerada a migration `Version20261105025527.php` via `make doctrine-diff` e aplicada com `make migrate`.
  - Validado o schema ORM sincronizado via `make doctrine-validate` (100% em sincronia).
- **Arquivos**:
  - `src/Enum/StatusContaSpotify.php`
  - `src/Entity/ContaSpotify.php`
  - `src/Repository/ContaSpotifyRepository.php`
  - `migrations/Version20261105025527.php`

### ✅ Tópico 164 — Serviço de tokens — troca do code e renovação com lock
- **Status**: Concluído
- **Data**: 04 de novembro de 2026
- **O que foi feito**:
  - Adicionadas novas exceções estáticas em `SpotifyException` para validação de `state` (`stateInvalidoOuExpirado`), recusa de acesso (`autorizacaoNegada`), conflito de vínculo com outra conta (`contaJaVinculadaOutroUsuario`), conta ausente (`contaNaoConectada`), conta exigindo reconexão (`contaRequerReconexao`) e falha de bloqueio concorrente (`falhaAoObterLockRenovacao`).
  - Implementado o serviço `GerarUrlAutorizacaoSpotifyService` em `src/Service/Spotify/`:
    - Gera parâmetro `state` criptograficamente seguro e armazena em cache atômico (`CacheItemPoolInterface`) com validade de 10 minutos (600s), atrelado ao ID do usuário autenticado.
    - Monta a URL de consentimento OAuth 2.0 com escopos `user-read-recently-played`, `user-read-currently-playing` e `user-top-read`.
  - Implementado o serviço `ConcluirAutorizacaoSpotifyService` em `src/Service/Spotify/`:
    - Valida o `state` de uso único, consumindo-o imediatamente do cache para impedir ataques de repetição.
    - Realiza a troca do código de autorização pelos tokens de acesso via `SpotifyInterface`.
    - Consulta o perfil do usuário no Spotify e valida regras de integridade (bloqueia se outra conta no sistema já estiver vinculada ao mesmo `spotifyId` ou se o usuário tentar conectar uma conta externa diferente sem desconectar previamente).
    - Criptografa o access token e o refresh token através da `CriptografiaInterface`.
    - Persiste a `ContaSpotify` conectada via `ContaSpotifyRepository`.
  - Implementado o serviço `ObterTokenValidoSpotifyService` em `src/Service/Spotify/`:
    - Garante um access token válido para chamadas à API, retornando o token descriptografado se ainda estiver dentro do prazo de validade.
    - Gerencia concorrência com arquivo de bloqueio exclusivo (`flock` em `sys_get_temp_dir()`) para impedir renovações duplicadas por múltiplos workers simultâneos.
    - Executa a renovação via `SpotifyInterface::renovarToken` e atualiza tanto o access token quanto novo refresh token se retornado.
    - Em caso de falha definitiva de autenticação (ex: revogação de permissão, `invalid_grant`), transiciona a conta para o status `reconectar` com registro do motivo do erro no banco.
  - Validado com PHPStan nível máximo (`[OK] No errors`) e lint de container Symfony.
- **Arquivos**:
  - `src/Exception/Spotify/SpotifyException.php`
  - `src/Service/Spotify/GerarUrlAutorizacaoSpotifyService.php`
  - `src/Service/Spotify/ConcluirAutorizacaoSpotifyService.php`
  - `src/Service/Spotify/ObterTokenValidoSpotifyService.php`

### ✅ Tópico 165 — Endpoints de conexão — url, concluir, status e desconectar
- **Status**: Concluído
- **O que foi feito**:
  - Criação do DTO `ConcluirAutorizacaoSpotifyDTO` com validações `#[Assert\NotBlank]` para os campos `code` e `state`.
  - Implementação do Serializer `ContaSpotifySerializer` garantindo a sanitização completa da resposta (zero exposição de `accessToken` e `refreshToken` para a interface web).
  - Criação do Service `ObterStatusSpotifyService` para consulta do estado de conexão da conta do usuário autenticado.
  - Criação do Service `DesconectarSpotifyService` com revogação e limpeza segura de tokens da conta, além de expurgo imediato das reproduções coletadas via API (`fonte = api`) conforme diretrizes de retenção e privacidade (LGPD).
  - Implementação do `SpotifyController` em `src/Controller/Spotify/SpotifyController.php` estendendo `DefaultController` com os 4 endpoints REST:
    - `GET /api/v1/spotify/oauth/url` (geração de state e URL de autorização)
    - `POST /api/v1/spotify/oauth/concluir` (troca de código por tokens e persistência)
    - `GET /api/v1/spotify/status` (obtenção do status da conexão do usuário)
    - `POST /api/v1/spotify/desconectar` (desconexão da conta e limpeza de dados de API)
- **Arquivos**:
  - `src/DataObject/Spotify/ConcluirAutorizacaoSpotifyDTO.php`
  - `src/Serializer/ContaSpotifySerializer.php`
  - `src/Service/Spotify/ObterStatusSpotifyService.php`
  - `src/Service/Spotify/DesconectarSpotifyService.php`
  - `src/Controller/Spotify/SpotifyController.php`

### ✅ Tópico 166 — Entidade ReproducaoSpotify, enum de fonte e migration
- **Status**: Concluído
- **O que foi feito**:
  - Criação do Enum `FonteReproducaoSpotify` (`api`, `importacao_basica`, `importacao_estendida`) com métodos de domínio `isTempoExato()`, `prioridade()` e predicados booleanos (`isApi()`, `isImportacaoBasica()`, `isImportacaoEstendida()`).
  - Criação da Entidade `ReproducaoSpotify` mapeada via Doctrine ORM com chave primária UUID v7, relacionamento com `Usuario` (CASCADE delete), índice único composto para deduplicação `(usuario, chaveDeduplicacao)`, e índices de consulta em `(usuario, tocadaEm)`, `(usuario, artistaPrincipal)`, `(usuario, nomeFaixa)` e `(fonte)`.
  - Implementação do método estático auxiliar de domínio `ReproducaoSpotify::gerarChaveDeduplicacao()` combinando código de faixa ou hash determinístico de normalização de strings quando o ID de faixa for ausente.
  - Criação do Repository `ReproducaoSpotifyRepository` implementando métodos otimizados `salvar()`, `remover()`, `flush()`, `apagarPorUsuarioEFonte()` e `buscarChavesExistentesDoUsuario()`.
  - Geração e aplicação da migration de banco de dados (`migrations/Version20261105030816.php`) via `make doctrine-diff` e `make migrate`.
  - Validação de 100% de sincronismo no Schema ORM com `make doctrine-validate`.
- **Arquivos**:
  - `src/Enum/FonteReproducaoSpotify.php`
  - `src/Entity/ReproducaoSpotify.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`
  - `migrations/Version20261105030816.php`

### ✅ Tópico 167 — Coleta do histórico recente com cursor e deduplicação
- **Status**: Concluído
- **O que foi feito**:
  - Criação do DTO de saída `ResultadoColetaHistoricoSpotifyDTO` com as contagens de faixas coletadas, novas persistidas, duplicadas ignoradas e o cursor atualizado em milissegundos.
  - Implementação do Service `ColetarHistoricoRecenteSpotifyService` com método `executarParaConta()` e `executarParaTodasContasConectadas()`.
  - Tratamento de tokens com renovação concorrente segura via `ObterTokenValidoSpotifyService`.
  - Coleta paginada via cursor `after` em milissegundos, buscando até 50 faixas mais recentes.
  - Verificação de duplicidade em lote otimizada por meio de uma única consulta SQL (`buscarChavesExistentesDoUsuario`) e gravação em lote com um único `flush()`.
  - Tratamento resiliente de falhas com logs estruturados via `LoggerInterface` sem `catch (\Throwable)` genérico, permitindo que falhas em uma conta não interrompam a sincronização das demais.
- **Arquivos**:
  - `src/DataObject/Spotify/ResultadoColetaHistoricoSpotifyDTO.php`
  - `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`

### ✅ Tópico 168 — Rotina de coleta no Scheduler a cada 30 minutos
- **Status**: Concluído
- **O que foi feito**:
  - Criação da mensagem Messenger `SincronizarHistoricoSpotifyMessage` com suporte opcional a sincronização individual por UUID da conta ou coletiva para todas as contas conectadas.
  - Implementação do handler `SincronizarHistoricoSpotifyMessageHandler` com atributo `#[AsMessageHandler]`, delegando a execução ao service `ColetarHistoricoRecenteSpotifyService`.
  - Configuração do agendamento recorrente `RecurringMessage::every('30 minutes', new SincronizarHistoricoSpotifyMessage())` em `src/Schedule.php`.
  - Atualização do `ConcluirAutorizacaoSpotifyService` para despachar `SincronizarHistoricoSpotifyMessage` imediatamente ao concluir a autorização OAuth, disparando a primeira coleta sem esperar o ciclo do cron.
  - Validação da rotina no Symfony Messenger e Scheduler via `php bin/console debug:scheduler`.
- **Arquivos**:
  - `src/Message/SincronizarHistoricoSpotifyMessage.php`
  - `src/MessageHandler/SincronizarHistoricoSpotifyMessageHandler.php`
  - `src/Schedule.php`
  - `src/Service/Spotify/ConcluirAutorizacaoSpotifyService.php`

### ✅ Tópico 169 — Spotify no status das integrações e alerta de coleta parada
- **Status**: Concluído
- **O que foi feito**:
  - Inclusão dos dados de integração do Spotify no resumo do dashboard (`GET /api/v1/dashboard/resumo`), fornecendo estado da conexão (`conectada`, `reconectar`, `desconectada`), nome de exibição, datas de conexão e última coleta, e indicador de alerta de coleta parada (`coletaParada`).
  - Constante `LIMITE_ALERTA_COLETA_PARADA_SEGUNDOS` configurada para 3 horas (10.800 s) em `DashboardService`.
  - Atualização do componente frontend `StatusIntegracoes` e utilitário `montarServicosIntegracao` para renderizar a integração do Spotify de forma nativa e consistente com a paleta do sistema (verde para conectado, âmbar para alerta de coleta atrasada, vermelho para reconectar e neutro para desconectado).
  - Link de redirecionamento no card para a rota `/spotify`, facilitando a reconexão imediata quando o status exigir atenção do usuário.
- **Arquivos**:
  - `src/Service/Dashboard/DashboardService.php`
  - `src/Controller/Dashboard/DashboardController.php`
  - `web/features/dashboard/types.ts`
  - `web/features/dashboard/utils/metricasDashboard.ts`
  - `web/features/dashboard/components/StatusIntegracoes.tsx`

### ✅ Tópico 170 — Importação do histórico — leitura dos arquivos básico e estendido
- **Status**: Concluído
- **O que foi feito**:
  - Criação do DTO `ItemHistoricoImportadoDTO` para transportar os dados de cada stream importado de forma pura e imutável.
  - Definição do contrato `LeitorArquivoHistoricoSpotifyInterface` retornando um `\Generator` de alta performance.
  - Implementação da classe de infraestrutura `LeitorArquivoHistoricoSpotify` capaz de processar arquivos ZIP ("Dados da conta") e arquivos JSON avulsos.
  - Parser streaming de JSON com consumo constante de memória, lendo chunks do stream e decodificando objetos individuais sem carregar o arquivo completo na RAM.
  - Suporte completo ao formato básico (`StreamingHistory*.json` com `endTime`, `artistName`, `trackName`, `msPlayed`) e ao formato estendido (`endsong_*.json` com `ts`, `master_metadata_track_name`, `master_metadata_album_artist_name`, `master_metadata_album_album_name`, `spotify_track_uri`, `ms_played`).
  - Descarte estrito de podcasts (`episode_name` / `spotify_episode_uri`) e preservação estrita de privacidade (arquivos de pagamentos, buscas e dados pessoais dentro do ZIP são completamente ignorados, e IPs/user-agents nunca são lidos nem persistidos).
  - Métodos de exceção descritivos em `SpotifyException` para arquivos inexistentes, formatos inválidos ou ZIPs corrompidos.
- **Arquivos**:
  - `src/DataObject/Spotify/ItemHistoricoImportadoDTO.php`
  - `src/Interface/LeitorArquivoHistoricoSpotifyInterface.php`
  - `src/Infra/Spotify/LeitorArquivoHistoricoSpotify.php`
  - `src/Exception/Spotify/SpotifyException.php`
  - `config/services.yaml`

### ✅ Tópico 171 — Importação — deduplicação com tolerância e prioridade sobre a API
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Implementação do algoritmo de reconciliação e deduplicação no serviço `DeduplicarEImportarHistoricoSpotifyService` em `src/Service/Spotify/`.
  - Processamento em lotes (`TAMANHO_LOTE = 500`) com consumo em stream contínuo via `LeitorArquivoHistoricoSpotifyInterface`, garantindo pegada constante de memória mesmo para arquivos com centenas de milhares de linhas.
  - Janelas de tolerância temporal simétricas para equiparação de reproduções:
    - Formato estendido (`endsong_*.json`): 90 segundos (`JANELA_TOLERANCIA_ESTENDIDA_SEGUNDOS = 90`).
    - Formato básico (`StreamingHistory*.json`): 180 segundos (`JANELA_TOLERANCIA_BASICA_SEGUNDOS = 180`), cobrindo variações de precisão de minutos do histórico do Spotify.
  - Hierarquia estrita de prioridades: `ImportacaoEstendida (3)` > `ImportacaoBasica (2)` > `Api (1)`.
    - Quando um stream importado coincide com registro pré-existente coletado via API, substitui a estimativa de duração pelos milissegundos exatos ouvidos (`msReproduzidos`), atualiza a fonte e preenche metadados como álbum e código da faixa.
    - Se o registro do banco já for de prioridade igual ou superior (ex: importação anterior do mesmo arquivo ou de arquivo estendido), o item é ignorado de forma idempotente sem duplicar contagens.
  - Métodos de domínio na entidade `ReproducaoSpotify`:
    - `podeSerSubstituidaPor(FonteReproducaoSpotify $novaFonte): bool`
    - `atualizarDeImportacao(int $msReproduzidos, FonteReproducaoSpotify $novaFonte, ?string $codigoFaixa, ?string $album): self`
    - `isMesmaFaixa(?string $codigoFaixa, string $nomeFaixa, string $artistaPrincipal): bool` com normalização de acentuação e caixa.
  - Otimização de banco em `ReproducaoSpotifyRepository`:
    - `buscarPorIntervaloTempo(Usuario $usuario, DateTimeImmutable $inicio, DateTimeImmutable $fim)` para busca em lote das reproduções da janela temporal do lote atual.
    - `limparCache()` para desalocação de entidades gerenciadas após cada `flush()` do lote.
  - DTO de saída `ResultadoImportacaoHistoricoSpotifyDTO` contendo as contagens auditáveis de streams lidos, novos persistidos, ignorados e substituídos.
- **Arquivos**:
  - `src/DataObject/Spotify/ResultadoImportacaoHistoricoSpotifyDTO.php`
  - `src/Service/Spotify/DeduplicarEImportarHistoricoSpotifyService.php`
  - `src/Entity/ReproducaoSpotify.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`

### ✅ Tópico 172 — Endpoint e processamento assíncrono da importação
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Criação do Enum `StatusImportacaoSpotify` (`enviada`, `processando`, `concluida`, `erro`) com descrições amigáveis e predicados de estado (`isEnviada()`, `isProcessando()`, `isConcluida()`, `isErro()`, `isFinalizado()`).
  - Criação da Entidade `ImportacaoSpotify` com UUID v7, chave estrangeira para `Usuario` (CASCADE delete), status, caminho do arquivo temporário, nome original, tamanho em bytes, contadores (`totalLidos`, `totalNovos`, `totalIgnorados`, `totalSubstituidos`), motivo de erro e timestamps de auditoria (`criadoEm`, `iniciadoEm`, `concluidoEm`).
  - Criação do Repositório `ImportacaoSpotifyRepository` com métodos para persistência, busca por UUID e verificação de importações ativas por usuário (`buscarEmAndamentoPorUsuario`).
  - Geração da migration `Version20261105171514.php` via `make doctrine-diff` e execução com `make migrate`.
  - Contrato `ArmazenamentoImportacaoSpotifyInterface` e cliente de infraestrutura `ArmazenamentoImportacaoSpotifyClient` para salvamento isolado e remoção segura de arquivos temporários em `%kernel.project_dir%/var/tmp/spotify_importacoes`, sem operações diretas de filesystem (`mkdir`/`unlink`) nos serviços de domínio.
  - Criação da mensagem `ImportarHistoricoSpotifyMessage` e handler `ImportarHistoricoSpotifyMessageHandler` com injeção do service `ProcessarArquivoImportacaoSpotifyService`.
  - Configuração de fila dedicada `spotify_importacao` em `config/packages/messenger.yaml` e nos supervisores de desenvolvimento (`devops/supervisord.conf`) e produção (`devops/php/supervisord-prod.conf`), com limite de memória de 256 MB e reciclagem a cada 3.600 segundos.
  - Criação dos Use Cases:
    - `IniciarImportacaoSpotifyService`: validação de arquivos ZIP/JSON até 100 MB, trava de concorrência impedindo múltiplas importações simultâneas pelo mesmo usuário, gravação do arquivo temporário, persistência inicial da entidade e despacho assíncrono para o Messenger.
    - `ProcessarArquivoImportacaoSpotifyService`: transição para status `processando`, execução da importação/deduplicação e finalização garantida no bloco `finally` com remoção física do arquivo temporário do disco em caso de sucesso ou erro.
    - `ConsultarImportacaoSpotifyService`: consulta do status e progresso da importação pelo usuário autenticado.
  - Serializer `ImportacaoSpotifySerializer` para formatação da resposta JSON sem exposição de caminhos físicos de disco.
  - Endpoints REST em `src/Controller/Spotify/SpotifyController.php`:
    - `POST /api/v1/spotify/importacoes`: upload multipart de arquivos de histórico com retorno HTTP 201 Created.
    - `GET /api/v1/spotify/importacoes/{uuid}`: acompanhamento do status, contadores e timestamps da importação.
- **Arquivos**:
  - `src/Enum/StatusImportacaoSpotify.php`
  - `src/Entity/ImportacaoSpotify.php`
  - `src/Repository/ImportacaoSpotifyRepository.php`
  - `migrations/Version20261105171514.php`
  - `src/Interface/ArmazenamentoImportacaoSpotifyInterface.php`
  - `src/Infra/Spotify/ArmazenamentoImportacaoSpotifyClient.php`
  - `src/DataObject/Spotify/UploadImportacaoSpotifyDTO.php`
  - `src/Message/ImportarHistoricoSpotifyMessage.php`
  - `src/MessageHandler/ImportarHistoricoSpotifyMessageHandler.php`
  - `src/Service/Spotify/IniciarImportacaoSpotifyService.php`
  - `src/Service/Spotify/ProcessarArquivoImportacaoSpotifyService.php`
  - `src/Service/Spotify/ConsultarImportacaoSpotifyService.php`
  - `src/Serializer/ImportacaoSpotifySerializer.php`
  - `src/Controller/Spotify/SpotifyController.php`
  - `src/Exception/Spotify/SpotifyException.php`
  - `config/packages/messenger.yaml`
  - `config/services.yaml`
  - `devops/supervisord.conf`
  - `devops/php/supervisord-prod.conf`

### ✅ Tópico 173 — Agregações por mês no Repository
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Centralização de fuso horário e limites de intervalo no DTO imutável `PeriodoMesSpotifyDTO`, cortando o mês e os dias no fuso `America/Sao_Paulo` (UTC-3) e convertendo os marcos de início e fim para UTC, permitindo que as consultas Doctrine utilizem diretamente os índices compostos de `(usuario, tocadaEm)` sem degradação por funções de data no `WHERE`.
  - Implementação de consultas de agregação de alta performance diretamente no banco de dados via `ReproducaoSpotifyRepository`:
    - `listarMesesDisponiveis(Usuario $usuario)`: agrupamento por ano e mês com contagem total de reproduções e minutos totais ouvidos.
    - `calcularTotaisMes(Usuario $usuario, PeriodoMesSpotifyDTO $periodo, int $corteStreamMs)`: cálculo consolidado de minutos totais ouvidos, total de streams válidos e contagem de músicas distintas (`COUNT(DISTINCT)`).
    - `calcularMinutosPorDia(Usuario $usuario, PeriodoMesSpotifyDTO $periodo)`: agregação diária de minutos no fuso local preenchendo todos os dias do mês de forma contínua para renderização de gráficos.
    - `obterRankingMusicasMes(Usuario $usuario, PeriodoMesSpotifyDTO $periodo, int $corteStreamMs, int $limite)`: ranking de músicas agrupado por código de faixa ou identificador normalizado, ordenado por streams, minutos e momento mais recente.
    - `obterRankingArtistasMes(Usuario $usuario, PeriodoMesSpotifyDTO $periodo, int $corteStreamMs, int $limite)`: ranking de artistas principais ordenado por streams e minutos ouvidos.
  - Criação de DTOs de transporte puros em `src/DataObject/Spotify/`: `MesDisponivelDTO`, `MinutosPorDiaDTO`, `ItemRankingMusicaDTO`, `ItemRankingArtistaDTO` e `TotaisMesDTO`.
- **Arquivos**:
  - `src/DataObject/Spotify/PeriodoMesSpotifyDTO.php`
  - `src/DataObject/Spotify/MesDisponivelDTO.php`
  - `src/DataObject/Spotify/MinutosPorDiaDTO.php`
  - `src/DataObject/Spotify/ItemRankingMusicaDTO.php`
  - `src/DataObject/Spotify/ItemRankingArtistaDTO.php`
  - `src/DataObject/Spotify/TotaisMesDTO.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`

### ✅ Tópico 174 — Regras da Cápsula — streams, fuso de Brasília e comparação com o mês anterior
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Implementação das regras de negócio da Cápsula Sonora no serviço `CalcularCapsulaMensalService` em `src/Service/Spotify/`.
  - Definição da constante de corte de stream de 30 segundos (`30.000 ms`), desconsiderando pulos imediatos de faixas na contagem de streams oficiais.
  - Cálculo de variação percentual de músicas diferentes ouvidas em relação ao mês anterior (ex: "+17% sobre março").
  - Cálculo de movimento no ranking: comparação da posição de cada faixa e artista entre o mês atual e o mês anterior (indicando ganho de posições com valores positivos, quedas com valores negativos, estabilidade com zero e estreias).
  - Cálculo de permanência no Top 5 (`mesesNoTop5`): verificação retroativa mês a mês nos meses anteriores para apurar a sequência contínua de presença entre as 5 músicas mais ouvidas.
  - Regra determinística de desempate em caso de igualdade de streams: ordenação secundária por milissegundos totais ouvidos e terciária pela reprodução mais recente.
  - Sinalização de mês em andamento (`emAndamento = true`) quando o período consultado coincidir com o mês corrente no fuso de Brasília.
  - Criação dos DTOs de domínio da Cápsula: `ItemRankingMusicaCapsulaDTO`, `ItemRankingArtistaCapsulaDTO` e `CapsulaMensalSpotifyDTO` (com links automáticos de atribuição para abertura no Spotify).
- **Arquivos**:
  - `src/DataObject/Spotify/ItemRankingMusicaCapsulaDTO.php`
  - `src/DataObject/Spotify/ItemRankingArtistaCapsulaDTO.php`
  - `src/DataObject/Spotify/CapsulaMensalSpotifyDTO.php`
  - `src/Service/Spotify/CalcularCapsulaMensalService.php`

### ✅ Tópico 175 — Endpoints da Cápsula Sonora e Serializer
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Criação do DTO `ResumoMesCapsulaDTO` para listagem compacta dos meses disponíveis com totais, música e artista em destaque, e flag de mês em andamento.
  - Implementação do service `ListarMesesCapsulaService` em `src/Service/Spotify/`, agrupando os meses disponíveis de reprodução e destacando os números e líderes de cada período.
  - Implementação do service `ObterDetalheCapsulaService` em `src/Service/Spotify/`, integrando a orquestração do cálculo detalhado da cápsula para o mês e ano solicitados.
  - Criação do Serializer `SpotifyCapsulaSerializer` em `src/Serializer/`, estruturando respostas JSON padronizadas com chaves em camelCase (`serializarListaMeses` e `serializarCapsula`), incluindo rankings com movimentos de posição, permanência em Top 5, URLs oficiais de redirecionamento para o Spotify e série histórica contínua de minutos por dia (`minutosPorDia`).
  - Criação dos endpoints em `src/Controller/Spotify/SpotifyController.php`:
    - `GET /api/v1/spotify/capsula`: lista os meses disponíveis com dados consolidados.
    - `GET /api/v1/spotify/capsula/{ano}/{mes}`: detalhe completo da Cápsula Sonora do mês solicitado.

- **Arquivos**:
  - `src/DataObject/Spotify/ResumoMesCapsulaDTO.php`
  - `src/Service/Spotify/ListarMesesCapsulaService.php`
  - `src/Service/Spotify/ObterDetalheCapsulaService.php`
  - `src/Serializer/SpotifyCapsulaSerializer.php`
  - `src/Controller/Spotify/SpotifyController.php`

### ✅ Tópico 176 — Endpoints de Hoje, Semana e Curiosidades
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Criação dos DTOs de resumo e curiosidades em `src/DataObject/Spotify/`:
    - `ResumoIntervaloSpotifyDTO`: minutos totais, streams totais, variação percentual sobre o período anterior e rankings de Top 5 músicas e Top 5 artistas.
    - `CuriosidadesSpotifyDTO`: estatísticas profundas do mês corrente (horário de pico com minutos, dia da semana com mais reproduções, dia mais longo do mês, faixa mais repetida em um único dia com contagem, quantidade de artistas inéditos/descobertos no mês, média diária de minutos e variação percentual em relação ao mês anterior).
    - `ResumoGeralSpotifyDTO`: agregador contendo as seções `hoje`, `semana` e `curiosidades`.
  - Implementação de consultas SQL especializadas em `ReproducaoSpotifyRepository`:
    - `calcularTotaisIntervalo()`: consolida streams e minutos para qualquer intervalo de tempo UTC.
    - `obterRankingMusicasIntervalo()` e `obterRankingArtistasIntervalo()`: obtém os líderes de reproduções em intervalos dinâmicos.
    - `obterCuriosidadesMes()`: consultas otimizadas calculando horários de pico, dias mais ativos e contagem de artistas nunca antes ouvidos pelo usuário.
  - Implementação do service `ObterResumoHojeSemanaCuriosidadesService` em `src/Service/Spotify/`, calculando as métricas de Hoje (desde 00:00 do fuso de Brasília), Semana (últimos 7 dias comparados com os 7 anteriores) e Curiosidades do mês vigente.
  - Criação do Serializer `SpotifyResumoSerializer` em `src/Serializer/`, convertendo as estruturas para formato JSON padronizado com posições calculadas e chaves em camelCase.
  - Criação do endpoint em `src/Controller/Spotify/SpotifyController.php`:
    - `GET /api/v1/spotify/resumo`: retorna os blocos `hoje`, `semana` e `curiosidades`.

- **Arquivos**:
  - `src/DataObject/Spotify/ResumoIntervaloSpotifyDTO.php`
  - `src/DataObject/Spotify/CuriosidadesSpotifyDTO.php`
  - `src/DataObject/Spotify/ResumoGeralSpotifyDTO.php`
  - `src/Service/Spotify/ObterResumoHojeSemanaCuriosidadesService.php`
  - `src/Serializer/SpotifyResumoSerializer.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`
  - `src/Controller/Spotify/SpotifyController.php`

### ✅ Tópico 177 — Catálogo de capas e fotos — entidade e busca por código
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Criação dos Enums de domínio `TipoImagemSpotify` (`faixa`, `artista`) e `StatusImagemSpotify` (`pendente`, `encontrada`, `nao_encontrada`) com predicados de estado (`isFaixa()`, `isArtista()`, `isPendente()`, `isEncontrada()`, `isNaoEncontrada()`, `isFinalizado()`).
  - Criação da Entidade `ImagemSpotify` com UUID v7, chave única de busca normalizada (`chaveBusca`), código Spotify opcional indexado, nome, artista, URLs de imagem em três tamanhos (grande, média e pequena/miniatura), link oficial de atribuição "Abrir no Spotify" (`urlSpotify`), cor dominante opcional, contadores de tentativas, motivo de falha e timestamps de auditoria.
  - Implementação do Repositório `ImagemSpotifyRepository` com métodos para persistência, busca por chave de busca, busca por código e consultas em lote (`buscarMapeamentoPorChaves` e `buscarMapeamentoPorCodigos`).
  - Geração e execução da migration `Version20261105183721.php` via `make doctrine-diff` e `make migrate`, criando a tabela `imagem_spotify` com índices adequados.
  - Atualização do cliente `SpotifyClient` para extrair os 3 tamanhos de imagens de álbuns e fotos de artistas da API do Spotify, bem como o link oficial de redirecionamento `external_urls.spotify`.
  - Atualização de `FaixaSpotifyDTO` e `ArtistaSpotifyDTO` com suporte a múltiplas resoluções de capa/foto e URL oficial.
  - Integração em `ColetarHistoricoRecenteSpotifyService` para catalogar capas recebidas diretamente da API de reproduções recentes (`recently-played`) de forma imediata sem requisições adicionais.
  - Criação do serviço `EnriquecerImagensSpotifyService` e do DTO `MapaImagensSpotifyDTO`, buscando capas cacheadas no banco e disparando agendamento assíncrono para capas ainda não resolvidas.
- **Arquivos**:
  - `src/Enum/TipoImagemSpotify.php`
  - `src/Enum/StatusImagemSpotify.php`
  - `src/Entity/ImagemSpotify.php`
  - `src/Repository/ImagemSpotifyRepository.php`
  - `migrations/Version20261105183721.php`
  - `src/DataObject/Spotify/FaixaSpotifyDTO.php`
  - `src/DataObject/Spotify/ArtistaSpotifyDTO.php`
  - `src/DataObject/Spotify/MapaImagensSpotifyDTO.php`
  - `src/DataObject/Spotify/DetalheCapsulaComImagensDTO.php`
  - `src/DataObject/Spotify/ResumoComImagensDTO.php`
  - `src/DataObject/Spotify/ConsultarImagensSpotifyDTO.php`
  - `src/Service/Spotify/EnriquecerImagensSpotifyService.php`
  - `src/Infra/Spotify/SpotifyClient.php`

### ✅ Tópico 178 — Busca de capa por nome e preenchimento em segundo plano
- **Status**: Concluído
- **Data**: 05 de novembro de 2026
- **O que foi feito**:
  - Criação da mensagem `BuscarImagemSpotifyMessage` contendo identificador de usuário, tipo (faixa/artista), nome, artista, código opcional, duração esperada em ms e prioridade de busca.
  - Criação do message handler `BuscarImagemSpotifyMessageHandler` com atributo `#[AsMessageHandler]`, delegando a resolução para o service especializado.
  - Implementação do algoritmo de busca e resolução no service `ResolverImagemSpotifyService`:
    - Resolução direta por código Spotify para faixas e artistas quando o código estiver disponível.
    - Busca contextualizada por nome e artista na API do Spotify (`/search?type=track&q=...`) quando não houver código.
    - Sistema de pontuação e validação de correspondência (threshold de 70 pontos): comparação normalizada de strings de artista e música, complementada por tolerância de duração em milissegundos (±15s a ±30s) para evitar falsos positivos com remixes ou músicas homônimas.
    - Descarte e marcação explícita como `nao_encontrada` quando nenhum candidato atingir a pontuação mínima, evitando requisições repetidas.
    - Espaçamento controlado entre requisições (`usleep`) para preservação de cota no modo de desenvolvimento.
  - Integração nos use cases `ObterDetalheCapsulaService` e `ObterResumoHojeSemanaCuriosidadesService`, enriquecendo os itens exibidos em tela e enfileirando buscas assíncronas apenas para os itens em exibição (prioridade 1).
  - Atualização dos serializers `SpotifyCapsulaSerializer` e `SpotifyResumoSerializer` para incluir URLs de capa/foto e links de redirecionamento "Abrir no Spotify".
  - Novo endpoint em `SpotifyController`:
    - `POST /api/v1/spotify/imagens/consultar`: consulta em lote do status e URLs de imagens para suporte a polling reativo no frontend.
- **Arquivos**:
  - `src/Message/BuscarImagemSpotifyMessage.php`
  - `src/MessageHandler/BuscarImagemSpotifyMessageHandler.php`
  - `src/Service/Spotify/ResolverImagemSpotifyService.php`
  - `src/Service/Spotify/ObterDetalheCapsulaService.php`
  - `src/Service/Spotify/ObterResumoHojeSemanaCuriosidadesService.php`
  - `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`
  - `src/Serializer/SpotifyCapsulaSerializer.php`
  - `src/Serializer/SpotifyResumoSerializer.php`
  - `src/Controller/Spotify/SpotifyController.php`

### ✅ Tópico 179 — Frontend — estrutura da feature spotify (types, api, hooks)
- **Status**: Concluído
- **O que foi feito**:
  - Criação da pasta `web/features/spotify/` estruturada de acordo com o padrão do projeto.
  - Esquemas Zod e tipos TypeScript em `web/features/spotify/types.ts`:
    - `StatusContaSpotifySchema`, `UrlAutorizacaoSpotifySchema`, `ConcluirAutorizacaoSpotifyPayloadSchema`, `DesconectarSpotifySchema`.
    - `StatusImportacaoSpotifyEnum`, `ImportacaoSpotifySchema`.
    - `ItemRankingMusicaSchema`, `ItemRankingArtistaSchema`, `ResumoIntervaloSchema`, `CuriosidadesSpotifySchema`, `ResumoGeralSpotifySchema`.
    - `ItemRankingMusicaCapsulaSchema`, `ItemRankingArtistaCapsulaSchema`, `MinutosPorDiaCapsulaSchema`, `CapsulaMensalSchema`, `ResumoMesCapsulaSchema`.
    - `ItemConsultaImagemSchema`, `RespostaConsultaImagensSchema`.
  - Módulo de API em `web/features/spotify/api.ts` utilizando exclusivamente `@/config/api`:
    - `obterStatusSpotify`, `obterUrlAutorizacaoSpotify`, `concluirAutorizacaoSpotify`, `desconectarSpotify`.
    - `iniciarImportacaoSpotify` (multipart/form-data), `consultarImportacaoSpotify`.
    - `listarCapsulasSpotify`, `obterCapsulaSpotify`, `obterResumoSpotify`, `consultarImagensSpotify`.
  - Utilitários em `web/features/spotify/utils/`:
    - `formatarMinutosParaHorasEMinutos`: converte minutos para `Xh Ym` ou `X min`.
    - `formatarNomeMes`, `formatarNomeMesAbreviado`, `formatarRotuloMesAno`.
    - `formatarPercentualVariacao`, `formatarDataPtBr`, `formatarDataHoraPtBr`.
    - `exportarResumoCapsulaParaCsv` e `baixarArquivoCsv`: geração de CSV no frontend com escape e BOM UTF-8.
    - `extrairMensagemErroApi`: extração segura de mensagens de erro Axios.
  - Hooks TanStack Query em `web/features/spotify/hooks/`:
    - `useStatusSpotify`: consulta status da conta com cache de 30s.
    - `useAutorizacaoSpotify`: mutation para URL e conclusão da autorização com notificações via `addToast`.
    - `useDesconectarSpotify`: mutation de desconexão com invalidação das queries e feedback em toast.
    - `useResumoSpotify`: consulta do resumo de hoje, semana e curiosidades.
    - `useCapsulasSpotify`: listagem de meses disponíveis da Cápsula.
    - `useDetalheCapsulaSpotify`: consulta detalhada do mês selecionado com validação de parâmetros.
    - `useImportacaoSpotify`: mutation de upload e query de monitoramento com polling a cada 2,5s enquanto processa.
    - `useImagensSpotify`: consulta e polling a cada 4s para atualização de capas/fotos pendentes.
    - `useMesCapsulaUrl`: sincronização bidirecional do mês selecionado na URL (`?mes=AAAA-MM`).
  - Barril de exportação unificado em `web/features/spotify/index.ts`.
  - Conformidade estrita: zero comentários, nomenclatura 100% em português, zero `useEffect`, validação completa via Biome e build do Vite.
- **Arquivos**:
  - `web/features/spotify/types.ts`
  - `web/features/spotify/api.ts`
  - `web/features/spotify/utils/formatadoresSpotify.ts`
  - `web/features/spotify/utils/index.ts`
  - `web/features/spotify/hooks/chavesQuerySpotify.ts`
  - `web/features/spotify/hooks/useStatusSpotify.ts`
  - `web/features/spotify/hooks/useAutorizacaoSpotify.ts`
  - `web/features/spotify/hooks/useDesconectarSpotify.ts`
  - `web/features/spotify/hooks/useResumoSpotify.ts`
  - `web/features/spotify/hooks/useCapsulasSpotify.ts`
  - `web/features/spotify/hooks/useDetalheCapsulaSpotify.ts`
  - `web/features/spotify/hooks/useImportacaoSpotify.ts`
  - `web/features/spotify/hooks/useImagensSpotify.ts`
  - `web/features/spotify/hooks/useMesCapsulaUrl.ts`
  - `web/features/spotify/hooks/index.ts`
  - `web/features/spotify/index.ts`

### ✅ Tópico 180 — Frontend — paleta spotify, tokens e wrapper da página
- **Status**: Concluído
- **O que foi feito**:
  - Extensão do gerador de paleta de marca `scripts/gerar-paleta-brand.mjs` com a escala temática isolada `spotify`:
    - Fundo `#121212`, cartão `#1F1F1F`, cartão elevado / hover `#252525`.
    - Texto principal `#FFFFFF`, secundário `#B3B3B3`, desabilitado `#6A6A6A`.
    - Acentos autênticos: verde `#1ED760`, azul `#539DF5` e amarelo `#FEE44F`.
    - Garantia de que valores hexadecimais residem apenas no script de geração.
  - Atualização dos tokens de tema em `web/config/theme/theme.ts`:
    - Criação do grupo semântico `cirqueira.spotify.*` com referência aos tokens gerados.
    - Definição do token de fonte `inter` e mapeamento de contrastes auditados (todas as combinações texto-fundo acima de 5:1).
  - Documentação da exceção de design em `documentation/guias/DESIGN.md` (seção 24):
    - Escopo exclusivo da rota `/spotify` com dark mode forçado.
    - Preservação da Sidebar e Header globais nos temas do sistema.
    - Exceções de formas documentadas: botões em pílula, cartões com 8px, capas de faixas com 4px (8px em telas grandes) e fotos de artistas circulares.
  - Criação do wrapper `TemaSpotify` em `web/features/spotify/components/TemaSpotify.tsx`:
    - Aplicação de `data-theme="dark"`, `cirqueira.spotify.fundo`, `cirqueira.spotify.textoPrincipal` e `fontFamily="inter"` utilizando primitivos Chakra UI (`Box`), sem tags HTML brutas.
- **Arquivos**:
  - `scripts/gerar-paleta-brand.mjs`
  - `web/config/theme/theme.ts`
  - `documentation/guias/DESIGN.md`
  - `web/features/spotify/components/TemaSpotify.tsx`
  - `web/features/spotify/components/index.ts`

### ✅ Tópico 181 — Frontend — vincular, retornar do Spotify, reconectar e desconectar
- **Status**: Concluído (detalhes em [PROGRESSO_ROADMAP_10.md](PROGRESSO_ROADMAP_10.md))

### ✅ Tópico 182 — Frontend — importação do arquivo de histórico
- **Status**: Concluído (detalhes em [PROGRESSO_ROADMAP_10.md](PROGRESSO_ROADMAP_10.md))

### ✅ Tópico 183 — Frontend — página /spotify com Hoje, Semana e Curiosidades
- **Status**: Concluído (detalhes em [PROGRESSO_ROADMAP_10.md](PROGRESSO_ROADMAP_10.md))

### ✅ Tópico 184 — Frontend — seção Cápsula Sonora com seletor de mês
- **Status**: Concluído (detalhes em [PROGRESSO_ROADMAP_10.md](PROGRESSO_ROADMAP_10.md))

### ✅ Tópico 185 — Calibração com os prints, teste end-to-end e documentação atualizada
- **Status**: Concluído (detalhes em [PROGRESSO_ROADMAP_10.md](PROGRESSO_ROADMAP_10.md))
