
## Roadmap de implementação — 5 features até o sistema ficar pronto
 
Cada feature é um bloco fechado de trabalho, com dependência sequencial na anterior. Dentro de cada uma há várias tarefas menores.
 
### Feature 1 — Infraestrutura e fundação técnica
 
Nada do resto funciona sem isso. É a feature que resolve as pendências levantadas na seção 9. Não entrega nenhuma tela visível ao usuário — é puramente base técnica.
 
**1.1 Ativação do módulo `async`**
- Rodar a ativação incremental do módulo (`composer require symfony/doctrine-messenger symfony/scheduler`, copiar configs de `.cirqueirax-modules/async/`)
- Configurar `config/packages/messenger.yaml`: transport Doctrine, roteamento de mensagens por tipo (ingestão, distribuição local, upload Google Fotos)
- Migration da tabela `messenger_messages`
- Configurar `supervisord.conf` com processos dedicados (2+ workers, `autorestart=true`)
- Criar `src/Schedule/` com tarefa recorrente inicial (ex: processar retries pendentes a cada N minutos)
**1.2 Biblioteca de UI — decisão fechada: HeroUI**
- Stack de UI: **HeroUI v3 + Tailwind CSS v4 + tailwindcss-motion** (o que já vem como core no setup atual)
- Guia de padrões do time deve ser atualizado pra remover a menção a Shadcn UI/Framer Motion como obrigatórios (ver seção 9.1) — evita builder confundir e instalar as duas bibliotecas
- Recharts continua necessário pros gráficos da Feature 5 — ativar módulo `ui-extra` só por esse motivo (Framer Motion do módulo não é necessário, já que a animação fica com tailwindcss-motion)
**1.3 Observabilidade**
- Ativar módulo `observability`, configurar `SENTRY_DSN`
- Definir canais de log dedicados no Monolog (`ingestao`, `google_fotos`, `syncthing`) para facilitar filtragem depois
**1.4 Volume compartilhado com o Syncthing**
- Adicionar bind mount no `docker-compose.yaml` (dev) e `docker-compose.prod.yaml` (prod) apontando pra pasta raiz observada pelo Syncthing na VPS
- Variável de ambiente `MEDIA_STORAGE_PATH` apontando pro path montado dentro do container
**1.5 Autenticação máquina-a-máquina**
- Enum `TipoCliente` (`usuario`, `agente`)
- Entidade `TokenAgente` (UUID v7, hash do token, `origem` vinculada, `criado_em`, `revogado_em`)
- Authenticator customizado do Symfony Security validando header `X-Agent-Token` nas rotas de ingestão
- Comando CLI `app:agente:gerar-token` para emitir token por agente (print-empresa, print-pessoal, bot)
**1.6 Armazenamento de credenciais OAuth (Google Fotos)**
- Entidade `ContaGoogleFotos` (`email`, `refresh_token` criptografado, `access_token_cache`, `expira_em`)
- Serviço de criptografia simétrica (ex: sodium) para o campo do refresh token
- Comando CLI `app:google-fotos:autorizar-conta` guiando o fluxo OAuth manual (uma vez por conta — empresa e pessoal)
**1.7 Modelagem de banco**
- Entidades `MediaItem`, `Categoria`, `OrigemRegra` com UUID v7, seguindo `fromDTO()` e getters sem prefixo
- Enums `StatusMediaItem` e `OrigemMedia` (`src/Enum/`)
- Migrations geradas via `make new-migration`
**1.8 Rate limiter dedicado**
- Novo limitador `ingestao` em `config/packages/rate_limiter.yaml`, separado do `api` genérico (60 req/min é pouco pra rajada de prints ou upload em lote)
---
 
### Feature 2 — Motor de classificação e roteamento (núcleo)
 
O core do sistema. Ainda sem interface de usuário além de um CRUD simples de categorias — o valor real é a orquestração por trás.
 
**2.1 CRUD de categorias**
- `CriarCategoriaDTO` / `AtualizarCategoriaDTO` (nome, pasta local, `album_id` do Google Fotos)
- `CategoriaService::executar()` (criar/atualizar/remover), `CategoriaRepository`, `CategoriaController` (extends `DefaultController`), `CategoriaSerializer`
**2.2 Serviço de ingestão**
- `IngestarMediaService::executar(IngestarMediaDTO $dto)`: calcula hash do arquivo, verifica duplicidade (early return se já existir), cria `MediaItem` com status `recebido`, despacha mensagem `ClassificarMediaMessage`
**2.3 Máquina de estados**
- Método `transicionarPara(StatusMediaItem $novoStatus)` na entidade `MediaItem`, validando transições permitidas (não deixa pular etapa)
- Timestamp de cada transição registrado (campo `historico_status` em JSON, ou tabela separada se precisar de auditoria mais rica)
**2.4 Classificação**
- `ClassificarMediaMessageHandler` → `ClassificarMediaService`: aplica `OrigemRegra` automática quando existe, ou deixa `categoria_id` nulo aguardando decisão manual
- Ao classificar, despacha `DistribuirLocalMessage` e `EnviarGoogleFotosMessage` em paralelo
**2.5 Worker de distribuição local**
- `DistribuirLocalMessageHandler` → `DistribuirLocalService`: copia/move o arquivo pra `categoria.pastaLocal`, atualiza status pra `distribuido_local`
**2.6 Integração OAuth Google Photos**
- `GoogleFotosOAuthService`: fluxo de authorization code, renovação automática de access token via refresh token
- `GoogleFotosAlbumService::criarOuObter()`: cria álbum via `albums.create` na primeira vez, reutiliza `album_id` salvo depois
**2.7 Worker de upload Google Fotos**
- `EnviarGoogleFotosMessageHandler` → `EnviarGoogleFotosService`: upload de bytes (`photoslibrary.appendonly`), `batchCreate`, adiciona ao álbum, grava `google_photos_media_id` no `MediaItem`
**2.8 Sistema de erro e retry**
- Captura de exceção em qualquer handler grava `erro_motivo` e status `erro`
- Comando CLI `app:media:retentar` + endpoint `POST /api/v1/media-itens/{id}/retentar` (individual e em lote)
---
 
### Feature 3 — Downloads de vídeo
 
Primeira fonte de mídia plugada no motor da Feature 2. Aqui já aparece a primeira tela real do dashboard.
 
**3.1 Endpoint de download**
- `BaixarVideoDTO` (url), validado com `Assert`
- `BaixarVideoService::executar()`: valida plataforma suportada, despacha `BaixarVideoMessage`
- `BaixarVideoMessageHandler`: executa `yt-dlp` via `symfony/process`, ao concluir chama `IngestarMediaService` (Feature 2.2)
**3.2 Validação de plataforma**
- `ValidadorUrlPlataforma`: whitelist/regex para YouTube, TikTok, Twitter/X, Instagram + fallback genérico do `yt-dlp`
**3.3 Listagem paginada com filtros**
- `GET /api/v1/media-itens` com filtros de `status`, `origem`, busca por título/uploader, ordenação
- `MediaItemRepository::paginarComFiltros()`
**3.4 Frontend — grid de downloads**
- `web/features/downloads-video/{api.ts, hooks/, components/}`
- Componentes: `CardVideo`, `GridVideos`, `BarraAcoesEmLote`, `CampoNovoLink`
- Página `web/pages/DownloadsVideo/DownloadsVideo.tsx`
**3.5 Ações em lote**
- `POST /api/v1/media-itens/lote/categorizar`, `/lote/rebaixar`, `/lote/apagar`
- Seleção múltipla no frontend (checkbox por card + "selecionar todos")
**3.6 Edição de metadados**
- `PATCH /api/v1/media-itens/{id}` (data, título) — mesmo padrão do "Alterar Data" que você já usa no bot atual
---
 
### Feature 4 — Prints automáticos e upload manual
 
As outras duas fontes de mídia, plugadas no mesmo motor da Feature 2 — podem ser feitas em paralelo entre si.
 
**4.1 Agente de print (script standalone)**
- Script leve (Python ou Node) rodando como serviço no SO, fora do Symfony
- Watcher de pasta (`watchdog` em Python ou `chokidar` em Node) com debounce pra não capturar arquivo ainda sendo escrito
- Envio via `POST` autenticado com `TokenAgente` (Feature 1.5) pro endpoint de ingestão
**4.2 Configuração dos dois agentes**
- Um agente no PC da empresa, outro no PC pessoal — cada um com token próprio e `origem` fixa diferente
**4.3 Endpoint de ingestão de agente**
- `POST /api/v1/ingestao/print` (autenticado via `X-Agent-Token`, não via JWT de usuário)
- Aplica `OrigemRegra` automaticamente — sem decisão manual no fluxo padrão
**4.4 Upload manual — backend**
- `POST /api/v1/media-itens/upload` (multipart), checa hash antes de aceitar (avisa se duplicado, não bloqueia silenciosamente)
**4.5 Upload manual — frontend**
- Página com dropzone (`web/pages/UploadManual/UploadManual.tsx`)
- Fila de triagem pós-upload reaproveitando `GridVideos`/`BarraAcoesEmLote` da Feature 3, mas sem categoria pré-definida
---
 
### Feature 5 — Dashboard completo
 
Consome o estado que as features anteriores já escrevem. Fecha o sistema v1.
 
**5.1 Endpoint de métricas agregadas**
- `GET /api/v1/dashboard/resumo`: totais por status e por origem
**5.2 Endpoint por categoria**
- `GET /api/v1/dashboard/categorias`: contagem, tamanho total, pasta/álbum mapeados
- Edição do mapeamento direto na UI (reusa `CategoriaService` da Feature 2.1)
**5.3 Integração com Syncthing**
- `SyncthingClient` (HTTP client pra REST API do Syncthing): status de pasta, pausar/retomar
- Endpoint proxy no backend (`GET /api/v1/sync/pastas`, `POST /api/v1/sync/pastas/{id}/sincronizar`) — o frontend nunca fala direto com o Syncthing
**5.4 Fila de erros**
- `GET /api/v1/media-itens?status=erro` com motivo exibido
- Ação de retry individual ou em lote (reusa endpoint da Feature 2.8)
**5.5 Reclassificação manual**
- `PATCH /api/v1/media-itens/{id}/categoria`: dispara mover arquivo de pasta local + `batchAddMediaItems`/`batchRemoveMediaItems` no Google Fotos usando o `media_id` já salvo
**5.6 Gráficos**
- Componentes Recharts (se essa for a decisão da Feature 1.2) consumindo os endpoints de resumo: volume por categoria/origem ao longo do tempo, espaço usado (VPS vs celular vs Google Fotos)
---
