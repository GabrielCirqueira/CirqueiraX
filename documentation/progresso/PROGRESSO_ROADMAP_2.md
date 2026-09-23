# Progresso do Roadmap — Feature 2 (Feature 1: Infraestrutura e Fundação do CirqueiraX)

> Detalhamento dos tópicos 21 ao 40.

---

### ✅ Tópico 21 — Ativação do módulo async (Messenger + Scheduler)
- **Status**: Concluído
- **O que foi feito**:
  - **Instalação de Pacotes**: Adicionados os pacotes `symfony/doctrine-messenger` (v7.3.11) e `symfony/scheduler` (v7.3.10) via Composer para viabilizar o processamento assíncrono e o agendamento nativo de tarefas.
  - **Configuração do Messenger (`config/packages/messenger.yaml`)**:
    - Definido o transport `async` apontando para o banco de dados (`MESSENGER_TRANSPORT_DSN`) com estratégia de retry (`max_retries: 3`, multiplicador 2).
    - Configurado o transport `failed` para isolamento de mensagens com falha (`queue_name=failed`).
    - Configurado o barramento padrão `messenger.bus.default` e roteamento assíncrono para e-mails (`SendEmailMessage`).
  - **Workers no Supervisord (`devops/php/supervisord-prod.conf`)**:
    - Configurado o serviço `[program:messenger]` para rodar 2 processos paralelos do consumidor (`messenger:consume async --time-limit=3600 --memory-limit=128M`).
    - Configurado o serviço `[program:scheduler]` com 1 processo para executar o consumidor de agendamentos (`scheduler:consume --time-limit=3600`).
  - **Ajustes de Infraestrutura e Tooling**:
    - Corrigidos os caminhos de ambiente (`devops/ports.env`) e compose em scripts CLI (`cache-clear.sh`, `phpcbf.sh`, `phpcbf-diff.sh`, `db-reset.sh`).
    - Atualizado o [`Makefile`](file:///home/gabriel/dev/pessoal/CirqueiraX/Makefile) para apontar para a configuração estrita do PHP-CS-Fixer (`.tooling/quality/.php-cs-fixer.dist.php`).
- **Arquivos modificados/criados**:
  - [`composer.json`](file:///home/gabriel/dev/pessoal/CirqueiraX/composer.json)
  - [`config/packages/messenger.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/messenger.yaml)
  - [`devops/php/supervisord-prod.conf`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/php/supervisord-prod.conf)
  - [`Makefile`](file:///home/gabriel/dev/pessoal/CirqueiraX/Makefile)
  - Scripts em `cli/` (`cache-clear.sh`, `phpcbf.sh`, `phpcbf-diff.sh`, `db-reset.sh`)

### ✅ Tópico 22 — Configuração do transport Doctrine e messenger.yaml
- **Status**: Concluído
- **O que foi feito**:
  - **Transporte Doctrine Criado**: Executado o comando `php bin/console messenger:setup-transports` no container do Symfony, gerando e preparando a estrutura física da tabela `messenger_messages` no banco MySQL.
  - **Validação do Schema no MySQL**: Confirmada a presença e prontidão da tabela `messenger_messages` via inspeção direta do banco (`SHOW TABLES;`).
  - **Roteamento e Retries**: Arquivo [`config/packages/messenger.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/messenger.yaml) configurado para direcionar mensagens para o transport `async` (Doctrine), com gerenciamento de falhas encaminhado para a fila `failed`.
- **Arquivos e Tabelas envolvidos**:
  - [`config/packages/messenger.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/messenger.yaml)
  - Tabela MySQL: `messenger_messages`

### ✅ Tópico 23 — Supervisor com workers dedicados do Messenger
- **Status**: Concluído
- **O que foi feito**:
  - **Workers do Messenger Configurados**: Criados os programas Supervisor `[program:messenger]` para consumo assíncrono paralelo com 2 processos dedicados (`php /var/www/html/bin/console messenger:consume async --time-limit=3600 --memory-limit=128M`), com reciclagem automática de memória e tempo limite.
  - **Worker de Agendamentos (Scheduler)**: Configurado o programa `[program:scheduler]` com 1 processo permanente para consumo de cronjobs/agendamentos nativos do Symfony (`php /var/www/html/bin/console scheduler:consume --time-limit=3600`).
  - **Sincronização de Configurações**: Configurações de workers padronizadas em ambos os arquivos de supervisão do projeto ([`devops/supervisord.conf`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/supervisord.conf) e [`devops/php/supervisord-prod.conf`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/php/supervisord-prod.conf)).
- **Arquivos envolvidos**:
  - [`devops/supervisord.conf`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/supervisord.conf)
  - [`devops/php/supervisord-prod.conf`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/php/supervisord-prod.conf)

### ✅ Tópico 24 — Ativação do módulo ui-extra (Recharts)
- **Status**: Concluído
- **O que foi feito**:
  - **Instalação do Recharts**: Garantida a biblioteca `recharts` (v2.15.4) nas dependências em [`package.json`](file:///home/gabriel/dev/pessoal/CirqueiraX/package.json) para suporte a gráficos interativos nos dashboards.
  - **Componente Base de Gráfico**: Disponibilizado o componente desacoplado [`web/shared/ui/chart.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/shared/ui/chart.tsx) contendo `ChartContainer`, `ChartTooltip`, `ChartLegend` e suporte a variáveis de tema CSS.
  - **Conformidade com a Stack**: Ativação focada exclusivamente na necessidade de gráficos (Recharts), mantendo o padrão oficial de UI com **HeroUI v3** e animações **tailwindcss-motion**.
- **Arquivos envolvidos**:
  - [`package.json`](file:///home/gabriel/dev/pessoal/CirqueiraX/package.json)
  - [`web/shared/ui/chart.tsx`](file:///home/gabriel/dev/pessoal/CirqueiraX/web/shared/ui/chart.tsx)

### ✅ Tópico 25 — Ativação do módulo observability (Sentry)
- **Status**: Concluído
- **O que foi feito**:
  - **Instalação do SDK Sentry**: Instalado o pacote `sentry/sentry-symfony` (v5.13.0) via Composer para suporte completo a observabilidade de exceções e erros no Symfony.
  - **Configuração da Integração (`sentry.yaml`)**: Criado e verificado o arquivo [`config/packages/sentry.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/sentry.yaml) dinamicamente configurado via `%env(SENTRY_DSN)%` no ambiente.
  - **Rastreamento de Falhas Externas**: Preparada a infraestrutura para capturar erros não tratados em segundo plano no pipeline de mídia (Syncthing, API do Google Fotos e automações).
- **Arquivos envolvidos**:
  - [`composer.json`](file:///home/gabriel/dev/pessoal/CirqueiraX/composer.json)
  - [`config/packages/sentry.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/sentry.yaml)
  - [`.env`](file:///home/gabriel/dev/pessoal/CirqueiraX/.env)

### ✅ Tópico 26 — Canais de log dedicados no Monolog
- **Status**: Concluído
- **O que foi feito**:
  - **Canais de Log Registrados**: Adicionados os canais dedicados `ingestao`, `google_fotos` e `syncthing` na seção `monolog.channels` de [`config/packages/monolog.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/monolog.yaml).
  - **Handlers em Ambiente Dev**: Configurados handlers de arquivo dedicados no ambiente `dev` (`var/log/ingestao.log`, `var/log/google_fotos.log`, `var/log/syncthing.log`), separando os registros de integrações externas do log padrão do Symfony (`dev.log`).
  - **Injeção de Loggers Específicos**: Habilitado o autowiring do Symfony para injeção direta de loggers direcionados (ex: `LoggerInterface $ingestaoLogger`, `LoggerInterface $googleFotosLogger`, `LoggerInterface $syncthingLogger`).
- **Arquivos envolvidos**:
  - [`config/packages/monolog.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/monolog.yaml)

### ✅ Tópico 27 — Volume Docker compartilhado com o Syncthing
- **Status**: Concluído
- **O que foi feito**:
  - **Mapeamento de Volume em Dev**: Configurado o bind mount do diretório de armazenamento no serviço `symfony` (`${MEDIA_STORAGE_PATH:-./var/storage}:/var/www/html/var/storage`) em [`devops/docker-compose.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/docker-compose.yaml).
  - **Mapeamento de Volume em Prod**: Adicionada a montagem equivalente para o ambiente de produção (`${MEDIA_STORAGE_PATH:-/var/syncthing/cirqueirax}:/var/www/html/var/storage`) em [`devops/docker-compose.prod.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/docker-compose.prod.yaml).
  - **Padronização de Variável de Ambiente**: Registrada a variável `MEDIA_STORAGE_PATH=./var/storage` nos arquivos [`.env`](file:///home/gabriel/dev/pessoal/CirqueiraX/.env) e [`.tooling/env/.env.example`](file:///home/gabriel/dev/pessoal/CirqueiraX/.tooling/env/.env.example), garantindo acesso direto da distribuição local às pastas do Syncthing.
- **Arquivos envolvidos**:
  - [`devops/docker-compose.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/docker-compose.yaml)
  - [`devops/docker-compose.prod.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/devops/docker-compose.prod.yaml)
  - [`.env`](file:///home/gabriel/dev/pessoal/CirqueiraX/.env)
  - [`.tooling/env/.env.example`](file:///home/gabriel/dev/pessoal/CirqueiraX/.tooling/env/.env.example)

### ✅ Tópico 28 — Enum TipoCliente e entidade TokenAgente
- **Status**: Concluído
- **O que foi feito**:
  - **Criação do Enum `TipoCliente`**: Desenvolvido o enum nativo PHP 8.4 [`src/Enum/TipoCliente.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/TipoCliente.php) (`enum TipoCliente: string`), encapsulando os tipos `USUARIO = 'usuario'` e `AGENTE = 'agente'`, além do método `descricao()` para legibilidade dos tipos de clientes da plataforma.
  - **Modelagem da Entidade `TokenAgente`**: Criada a entidade Doctrine [`src/Entity/TokenAgente.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/TokenAgente.php) em `token_agente` com chave primária UUID v7 gerada no construtor via `Symfony\Component\Uid\Uuid::v7()`, garantindo ordenação temporal e identificação única.
  - **Conformidade com Guia do Projeto**: Implementados getters sem prefixo `get` (`uuid()`, `nome()`, `tokenHash()`, `origem()`, `tipoCliente()`, `ativo()`, `criadoEm()`, `atualizadoEm()`, `revogadoEm()`), setters com proteção de invariante retornando `self`, e método de negócio `revogar()` para desativação com carimbo de data/hora (`revogadoEm`).
  - **Repositório de Persistência**: Criado o repositório [`src/Repository/TokenAgenteRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/TokenAgenteRepository.php) estendendo `ServiceEntityRepository`, contendo métodos de persistência e consultas otimizadas (`salvar()`, `remover()`, `buscarPorHash()`, `buscarPorUuid()`).
  - **Configuração DBAL do Doctrine**: Registrado o tipo customizado `uuid` (`Symfony\Bridge\Doctrine\Types\UuidType`) em [`config/packages/doctrine.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/doctrine.yaml) para mapeamento correto de colunas UUID.
- **Arquivos envolvidos**:
  - [`src/Enum/TipoCliente.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/TipoCliente.php)
  - [`src/Entity/TokenAgente.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/TokenAgente.php)
  - [`src/Repository/TokenAgenteRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/TokenAgenteRepository.php)
  - [`config/packages/doctrine.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/doctrine.yaml)

### ⏳ Tópico 29 — Authenticator customizado para tokens de agente
- **Status**: Pendente

### ⏳ Tópico 30 — Comando CLI de geração de token por agente
- **Status**: Pendente

### ⏳ Tópico 31 — Entidade ContaGoogleFotos
- **Status**: Pendente

### ⏳ Tópico 32 — Serviço de criptografia do refresh token
- **Status**: Pendente

### ⏳ Tópico 33 — Comando CLI de autorização OAuth por conta Google Fotos
- **Status**: Pendente

### ⏳ Tópico 34 — Entidade MediaItem (UUID v7)
- **Status**: Pendente

### ⏳ Tópico 35 — Entidade Categoria
- **Status**: Pendente

### ⏳ Tópico 36 — Entidade OrigemRegra
- **Status**: Pendente

### ⏳ Tópico 37 — Enums StatusMediaItem e OrigemMedia
- **Status**: Pendente

### ⏳ Tópico 38 — Migrations das entidades do motor de mídia
- **Status**: Pendente

### ⏳ Tópico 39 — Rate limiter dedicado para endpoints de ingestão
- **Status**: Pendente

### ⏳ Tópico 40 — Atualização do guia de padrões (decisão de UI HeroUI)
- **Status**: Pendente
