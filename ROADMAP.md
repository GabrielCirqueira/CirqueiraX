# Roadmap — Feature 1: Infraestrutura e Fundação do CirqueiraX

> Backlog e planejamento do projeto. Cada tópico descreve o que existe (ou faltava), por que importa e o que precisa acontecer. Marque `[x]` no checklist ao concluir.

**Numeração:** tópicos 21–40.

**Índice visual:** [PROGRESSO_ROADMAP.md](documentation/progresso/PROGRESSO_ROADMAP.md) · **Detalhamento:** [PROGRESSO_ROADMAP_2.md](documentation/progresso/PROGRESSO_ROADMAP_2.md)

---

## Índice

| # | Tópico |
|---|---|
| 21 | Ativação do módulo async (Messenger + Scheduler) |
| 22 | Configuração do transport Doctrine e messenger.yaml |
| 23 | Supervisor com workers dedicados do Messenger |
| 24 | Ativação do módulo ui-extra (Recharts) |
| 25 | Ativação do módulo observability (Sentry) |
| 26 | Canais de log dedicados no Monolog |
| 27 | Volume Docker compartilhado com o Syncthing |
| 28 | Enum TipoCliente e entidade TokenAgente |
| 29 | Authenticator customizado para tokens de agente |
| 30 | Comando CLI de geração de token por agente |
| 31 | Entidade ContaGoogleFotos |
| 32 | Serviço de criptografia do refresh token |
| 33 | Comando CLI de autorização OAuth por conta Google Fotos |
| 34 | Entidade MediaItem (UUID v7) |
| 35 | Entidade Categoria |
| 36 | Entidade OrigemRegra |
| 37 | Enums StatusMediaItem e OrigemMedia |
| 38 | Migrations das entidades do motor de mídia |
| 39 | Rate limiter dedicado para endpoints de ingestão |
| 40 | Atualização do guia de padrões (decisão de UI HeroUI) |

---

## Checklist

- [ ] **21. Ativação do módulo async (Messenger + Scheduler)**
- [ ] **22. Configuração do transport Doctrine e messenger.yaml**
- [ ] **23. Supervisor com workers dedicados do Messenger**
- [ ] **24. Ativação do módulo ui-extra (Recharts)**
- [ ] **25. Ativação do módulo observability (Sentry)**
- [ ] **26. Canais de log dedicados no Monolog**
- [ ] **27. Volume Docker compartilhado com o Syncthing**
- [ ] **28. Enum TipoCliente e entidade TokenAgente**
- [ ] **29. Authenticator customizado para tokens de agente**
- [ ] **30. Comando CLI de geração de token por agente**
- [ ] **31. Entidade ContaGoogleFotos**
- [ ] **32. Serviço de criptografia do refresh token**
- [ ] **33. Comando CLI de autorização OAuth por conta Google Fotos**
- [ ] **34. Entidade MediaItem (UUID v7)**
- [ ] **35. Entidade Categoria**
- [ ] **36. Entidade OrigemRegra**
- [ ] **37. Enums StatusMediaItem e OrigemMedia**
- [ ] **38. Migrations das entidades do motor de mídia**
- [ ] **39. Rate limiter dedicado para endpoints de ingestão**
- [ ] **40. Atualização do guia de padrões (decisão de UI HeroUI)**

---

## Detalhamento

### Tópico 21 — Ativação do módulo async (Messenger + Scheduler)

**O que existe hoje:** módulo `async` ignorado no setup (`async=0` no log de instalação). Nenhuma fila, nenhum worker.

**Por que importa:** todo o motor de classificação e roteamento (Feature 2) depende de processamento assíncrono. Sem isso, download/upload/distribuição rodam de forma síncrona no request HTTP.

**O que precisa acontecer:** rodar `composer require symfony/doctrine-messenger symfony/scheduler`, copiar as configs de `.cirqueirax-modules/async/` pro projeto.

---

### Tópico 22 — Configuração do transport Doctrine e messenger.yaml

**O que existe hoje:** sem `config/packages/messenger.yaml`, sem tabela `messenger_messages`.

**Por que importa:** o roteamento de cada tipo de mensagem (ingestão, distribuição local, upload Google Fotos) precisa estar definido antes de qualquer handler existir.

**O que precisa acontecer:** transport padrão Doctrine configurado, roteamento por classe de mensagem, migration da tabela `messenger_messages` aplicada.

---

### Tópico 23 — Supervisor com workers dedicados do Messenger

**O que existe hoje:** Supervisor instalado na stack (porta documentada), mas sem processo de worker configurado.

**Por que importa:** sem worker rodando, mensagens ficam na fila e nunca são consumidas.

**O que precisa acontecer:** `supervisord.conf` com processo `messenger:consume async`, `autostart=true`, `autorestart=true`, 2+ processos.

---

### Tópico 24 — Ativação do módulo ui-extra (Recharts)

**O que existe hoje:** módulo `ui-extra` ignorado no setup (`ui-extra=0`). Sem Recharts disponível.

**Por que importa:** o dashboard (Feature 5) precisa de gráficos por categoria/origem — decidido usar HeroUI + tailwindcss-motion pra UI/animação, mas Recharts continua necessário só pra gráficos.

**O que precisa acontecer:** ativar o módulo pontualmente, sem adotar o Framer Motion que vem junto (ver tópico 40).

---

### Tópico 25 — Ativação do módulo observability (Sentry)

**O que existe hoje:** módulo `observability` ignorado no setup (`observability=0`). Só Monolog em arquivo/stderr.

**Por que importa:** o pipeline depende de três integrações externas com falha possível (Syncthing, Google Photos API, yt-dlp) — sem rastreamento estruturado, falha silenciosa passa despercebida.

**O que precisa acontecer:** ativar o módulo, configurar `SENTRY_DSN` em produção.

---

### Tópico 26 — Canais de log dedicados no Monolog

**O que existe hoje:** configuração padrão do Monolog (`dev`/`prod`), sem canais específicos do domínio de mídia.

**Por que importa:** facilita filtrar e depurar cada integração externa separadamente.

**O que precisa acontecer:** canais `ingestao`, `google_fotos` e `syncthing` configurados em `config/packages/monolog.yaml`.

---

### Tópico 27 — Volume Docker compartilhado com o Syncthing

**O que existe hoje:** nenhum bind mount entre o container Symfony e a pasta observada pelo Syncthing na VPS.

**Por que importa:** o worker de distribuição local (Feature 2) precisa escrever arquivos exatamente onde o Syncthing lê, senão a sincronização com o celular nunca acontece.

**O que precisa acontecer:** volume adicionado em `docker-compose.yaml` (dev) e `docker-compose.prod.yaml`, variável `MEDIA_STORAGE_PATH` apontando pro path montado.

---

### Tópico 28 — Enum TipoCliente e entidade TokenAgente

**O que existe hoje:** `security.yaml` só cobre login humano via JWT. Nenhum conceito de cliente-máquina.

**Por que importa:** agentes de print e o bot de download não são usuários logando — são processos automatizados que precisam de credencial própria.

**O que precisa acontecer:** enum `TipoCliente` (`usuario`, `agente`), entidade `TokenAgente` (UUID v7, hash do token, `origem`, `criado_em`, `revogado_em`).

---

### Tópico 29 — Authenticator customizado para tokens de agente

**O que existe hoje:** nenhum mecanismo de autenticação além do firewall JWT de usuário.

**Por que importa:** os endpoints de ingestão (Feature 3 e 4) precisam aceitar chamadas autenticadas por token de serviço, sem depender do fluxo de refresh token de 30 dias pensado pro usuário humano.

**O que precisa acontecer:** Authenticator do Symfony Security validando o header `X-Agent-Token` contra `TokenAgente`.

---

### Tópico 30 — Comando CLI de geração de token por agente

**O que existe hoje:** nenhuma forma de emitir token pra um agente novo.

**Por que importa:** cada agente (print-empresa, print-pessoal, bot) precisa do próprio token, gerado uma vez e configurado no agente.

**O que precisa acontecer:** comando `app:agente:gerar-token` que cria o `TokenAgente` e imprime o valor uma única vez.

---

### Tópico 31 — Entidade ContaGoogleFotos

**O que existe hoje:** nenhuma estrutura pra guardar credenciais OAuth do Google Fotos.

**Por que importa:** PC empresa e PC pessoal usam contas Google diferentes — cada uma precisa de credencial própria, renovável.

**O que precisa acontecer:** entidade `ContaGoogleFotos` (`email`, `refresh_token` criptografado, `access_token_cache`, `expira_em`).

---

### Tópico 32 — Serviço de criptografia do refresh token

**O que existe hoje:** nenhuma estratégia de criptografia de dado sensível no banco.

**Por que importa:** refresh token do Google Fotos é uma credencial de longa duração — não pode ficar em texto plano no banco.

**O que precisa acontecer:** serviço de criptografia simétrica (ex: sodium) usado ao persistir/ler o campo `refresh_token`.

---

### Tópico 33 — Comando CLI de autorização OAuth por conta Google Fotos

**O que existe hoje:** nenhum fluxo de autorização OAuth implementado.

**Por que importa:** autorizar uma conta Google Fotos é uma ação manual feita uma vez por conta (empresa e pessoal), não algo que passa por tela de usuário final.

**O que precisa acontecer:** comando `app:google-fotos:autorizar-conta` guiando o fluxo authorization code e salvando o resultado via `ContaGoogleFotos`.

---

### Tópico 34 — Entidade MediaItem (UUID v7)

**O que existe hoje:** nenhuma entidade de domínio de mídia — só o desenho no `CIRQUEIRAX.md`.

**Por que importa:** é a entidade central de todo o sistema — representa cada vídeo, print ou upload passando pelo pipeline.

**O que precisa acontecer:** entidade com UUID v7, campos de `hash`, `origem`, `status`, `categoria_id`, `caminho_local`, `google_photos_media_id`, `metadata`, `erro_motivo`, seguindo `fromDTO()` e getters sem prefixo.

---

### Tópico 35 — Entidade Categoria

**O que existe hoje:** nenhuma entidade — categorias hoje só existem como conceito no bot atual.

**Por que importa:** é o que carrega o mapeamento pasta local + álbum Google Fotos usado pelo motor de roteamento.

**O que precisa acontecer:** entidade `Categoria` (`nome`, `pasta_local`, `google_photos_album_id`).

---

### Tópico 36 — Entidade OrigemRegra

**O que existe hoje:** nenhuma entidade — regra de categoria automática por origem ainda não existe.

**Por que importa:** os agentes de print (Feature 4) precisam de categoria automática sem decisão manual a cada captura.

**O que precisa acontecer:** entidade `OrigemRegra` mapeando origem fixa (`print_empresa`, `print_pessoal`) → `categoria_id`.

---

### Tópico 37 — Enums StatusMediaItem e OrigemMedia

**O que existe hoje:** nenhum enum de domínio criado — estados descritos só em texto no `CIRQUEIRAX.md`.

**Por que importa:** garante que só os valores válidos (`recebido`, `em_fila`, `classificado`, `distribuindo`, `distribuido_local`, `enviando_google_fotos`, `concluido`, `erro`) sejam usados em `MediaItem.status`.

**O que precisa acontecer:** dois enums PHP em `src/Enum/`, tipados na entidade e nos DTOs.

---

### Tópico 38 — Migrations das entidades do motor de mídia

**O que existe hoje:** banco só com o schema padrão do skeleton (usuário/auth).

**Por que importa:** sem migration, nenhuma das entidades acima existe de fato no banco.

**O que precisa acontecer:** `make new-migration` gerando o diff de `MediaItem`, `Categoria`, `OrigemRegra`, `TokenAgente`, `ContaGoogleFotos`; revisão manual antes de `make migrate`.

---

### Tópico 39 — Rate limiter dedicado para endpoints de ingestão

**O que existe hoje:** só os limitadores `login` (5/min) e `api` (60/min) genéricos.

**Por que importa:** uma rajada de screenshots dos agentes ou um upload manual em lote pode ultrapassar 60 req/min e ser bloqueado sem necessidade.

**O que precisa acontecer:** limitador `ingestao` próprio em `config/packages/rate_limiter.yaml`, aplicado só nas rotas de ingestão.

---

### Tópico 40 — Atualização do guia de padrões (decisão de UI HeroUI)

**O que existe hoje:** o guia de padrões do time ainda descreve Shadcn UI + Framer Motion como stack "oficial obrigatória", conflitando com o `DOCUMENTACAO_TECNICA.md` (HeroUI v3 + tailwindcss-motion).

**Por que importa:** decisão já fechada em favor de HeroUI — deixar o guia desatualizado é abrir espaço pra alguém instalar as duas bibliotecas por engano.

**O que precisa acontecer:** guia de padrões corrigido: HeroUI v3 + tailwindcss-motion como UI/animação oficiais; Recharts (tópico 24) citado como única peça do `ui-extra` em uso.
