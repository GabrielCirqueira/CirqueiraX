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

### ✅ Tópico 29 — Authenticator customizado para tokens de agente
- **Status**: Concluído
- **O que foi feito**:
  - **Authenticator de Serviço (`TokenAgenteAuthenticator`)**: Desenvolvido o authenticator customizado [`src/Security/TokenAgenteAuthenticator.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Security/TokenAgenteAuthenticator.php) estendendo `AbstractAuthenticator`, responsável por interceptar chamadas HTTP contendo o cabeçalho `X-Agent-Token`.
  - **Validação de Hash e Estado**: O authenticator calcula o hash SHA-256 (`hash('sha256', $token)`) do valor informado e consulta o repositório [`TokenAgenteRepository`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/TokenAgenteRepository.php). Caso o token seja inexistente ou desativado (`ativo === false`), lança `CustomUserMessageAuthenticationException`.
  - **Objeto de Usuário Agente (`AgenteUser`)**: Criado a classe de representação de segurança [`src/Security/AgenteUser.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Security/AgenteUser.php) implementando `UserInterface`, retornando a role `ROLE_AGENTE` e encapsulando o `TokenAgente` autenticado.
  - **Integração no Firewall API (`security.yaml`)**: Configurada a chave `custom_authenticators` no firewall `api` em [`config/packages/security.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/security.yaml), permitindo convivência transparente entre autenticação por JWT humano (`Authorization: Bearer`) e tokens de serviço (`X-Agent-Token`).
- **Arquivos envolvidos**:
  - [`src/Security/TokenAgenteAuthenticator.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Security/TokenAgenteAuthenticator.php)
  - [`src/Security/AgenteUser.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Security/AgenteUser.php)
  - [`config/packages/security.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/security.yaml)

### ✅ Tópico 30 — Comando CLI de geração de token por agente
- **Status**: Concluído
- **O que foi feito**:
  - **Comando Console (`GerarTokenAgenteCommand`)**: Criado o comando Symfony Console [`src/Command/GerarTokenAgenteCommand.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Command/GerarTokenAgenteCommand.php) registrado com a assinatura `app:agente:gerar-token`.
  - **Interface Interativa e Parâmetros CLI**: Suporte a passagem direta dos argumentos `nome` e `origem`, além da opção `--tipo` (`agente` ou `usuario`). Se não informados via argumentos CLI, o comando solicita os dados de forma interativa com atalhos e validações.
  - **Geração Segura e Persistência**: Gera uma chave aleatória com prefixo de domínio (`cx_ag_` + 48 caracteres hexadecimais), calcula o hash SHA-256 e o persiste no banco via [`TokenAgenteRepository`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/TokenAgenteRepository.php).
  - **Exibição Única de Chave Secreta**: Exibe no terminal os metadados do agente (UUID, Nome, Origem, Tipo e data de criação) e a chave secreta formatada em destaque com aviso de segurança.
  - **Atalho no Makefile**: Adicionada a regra `agente-token` em [`Makefile`](file:///home/gabriel/dev/pessoal/CirqueiraX/Makefile) facilitando a invocação rápida (`make agente-token ARGS='"Nome Agente" "origem_agente"'`).
- **Arquivos envolvidos**:
  - [`src/Command/GerarTokenAgenteCommand.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Command/GerarTokenAgenteCommand.php)
  - [`Makefile`](file:///home/gabriel/dev/pessoal/CirqueiraX/Makefile)

### ✅ Tópico 31 — Entidade ContaGoogleFotos
- **Status**: Concluído
- **O que foi feito**:
  - **Modelagem da Entidade `ContaGoogleFotos`**: Criada a entidade Doctrine [`src/Entity/ContaGoogleFotos.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/ContaGoogleFotos.php) mapeando a tabela `conta_google_fotos` com chave primária UUID v7 gerada no construtor via `Symfony\Component\Uid\Uuid::v7()`.
  - **Campos e Atributos de Segurança**: Mapeados os campos `email` (único), `refreshTokenCriptografado` (texto para credencial sensível), `accessTokenCache` (cache de token de acesso), `expiraEm` (timestamp de expiração do cache), `criadoEm` e `atualizadoEm`.
  - **Métodos de Domínio e Standard Getters**: Implementados getters sem prefixo `get` (`uuid()`, `email()`, `refreshTokenCriptografado()`, `accessTokenCache()`, `expiraEm()`, `criadoEm()`, `atualizadoEm()`), setters encadeáveis (`self`), e o método utilitário `accessTokenEstaValido()` para verificação rápida de expiração de token.
  - **Repositório de Persistência**: Criado o repositório [`src/Repository/ContaGoogleFotosRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/ContaGoogleFotosRepository.php) estendendo `ServiceEntityRepository`, contendo métodos `salvar()`, `remover()`, `buscarPorEmail()` e `buscarPorUuid()`.
- **Arquivos envolvidos**:
  - [`src/Entity/ContaGoogleFotos.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/ContaGoogleFotos.php)
  - [`src/Repository/ContaGoogleFotosRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/ContaGoogleFotosRepository.php)

### ✅ Tópico 32 — Serviço de criptografia do refresh token
- **Status**: Concluído
- **O que foi feito**:
  - **Interface de Contrato (`CriptografiaInterface`)**: Criada a interface [`src/Interface/CriptografiaInterface.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Interface/CriptografiaInterface.php) definindo o contrato de criptografia simétrica (`criptografar` e `descriptografar`) para desacoplamento de camadas.
  - **Serviço de Criptografia Simétrica (`CriptografiaService`)**: Implementado o serviço [`src/Service/Seguranca/CriptografiaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/Seguranca/CriptografiaService.php) utilizando a extensão nativa C Sodium do PHP 8.4 (`sodium_crypto_secretbox` e `sodium_crypto_secretbox_open`).
  - **Vetor de Inicialização (Nonce) e Autenticação de Conteúdo**: Para cada criptografia, gera um nonce aleatório seguro de 24 bytes (`SODIUM_CRYPTO_SECRETBOX_NONCEBYTES`). O resultado é concatenado e codificado em Base64 para armazenamento seguro em campos texto do MySQL.
  - **Injeção de Dependência e Configuração (`services.yaml`)**: Configurado o parâmetro `$chaveSecreta` apontando para `%env(APP_SECRET)%` em [`config/services.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/services.yaml), injetando a chave mestre do ambiente dev/prod via container DI.
- **Arquivos envolvidos**:
  - [`src/Interface/CriptografiaInterface.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Interface/CriptografiaInterface.php)
  - [`src/Service/Seguranca/CriptografiaService.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Service/Seguranca/CriptografiaService.php)
  - [`config/services.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/services.yaml)

### ✅ Tópico 33 — Comando CLI de autorização OAuth por conta Google Fotos
- **Status**: Concluído
- **O que foi feito**:
  - **Comando Console (`AutorizarContaGoogleFotosCommand`)**: Criado o comando Symfony Console [`src/Command/AutorizarContaGoogleFotosCommand.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Command/AutorizarContaGoogleFotosCommand.php) sob a assinatura `app:google-fotos:autorizar-conta`.
  - **Guias do Fluxo OAuth2**: Constrói a URL de autorização OAuth2 do Google (`https://accounts.google.com/o/oauth2/v2/auth`) solicitando acesso offline (`access_type=offline`), consentimento explícito (`prompt=consent`) e escopo da API Google Photos (`photoslibrary` + `userinfo.email`).
  - **Troca de Tokens e Leitura de E-mail**: Realiza requisição POST via `HttpClientInterface` para a API de tokens do Google (`https://oauth2.googleapis.com/token`), obtendo `refresh_token`, `access_token` e tempo de expiração. Coleta automaticamente o e-mail da conta via API UserInfo (`https://www.googleapis.com/oauth2/v2/userinfo`).
  - **Criptografia e Persistência**: Criptografa o `refresh_token` utilizando [`CriptografiaInterface`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Interface/CriptografiaInterface.php) antes de persisti-lo no banco de dados através da entidade [`ContaGoogleFotos`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/ContaGoogleFotos.php) e repositório [`ContaGoogleFotosRepository`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/ContaGoogleFotosRepository.php).
  - **Atalho no Makefile**: Adicionada a regra `google-fotos-autorizar` no [`Makefile`](file:///home/gabriel/dev/pessoal/CirqueiraX/Makefile) (`make google-fotos-autorizar`).
- **Arquivos envolvidos**:
  - [`src/Command/AutorizarContaGoogleFotosCommand.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Command/AutorizarContaGoogleFotosCommand.php)
  - [`Makefile`](file:///home/gabriel/dev/pessoal/CirqueiraX/Makefile)

### ✅ Tópico 34 — Entidade MediaItem (UUID v7)
- **Status**: Concluído
- **O que foi feito**:
  - **Modelagem Central do Domínio de Mídia (`MediaItem`)**: Criada a entidade central [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php) em `media_item` com chave primária UUID v7 gerada no construtor via `Symfony\Component\Uid\Uuid::v7()`.
  - **Data Transfer Object (`CriarMediaItemDTO`)**: Desenvolvido o DTO imutável [`src/DataObject/CriarMediaItemDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarMediaItemDTO.php) com validações Symfony (`Assert\NotBlank`, `Assert\Length`) para entrada estruturada de novos itens no pipeline de mídia.
  - **Atributos do Pipeline e Métodos de Domínio**: Mapeados os campos `hash` (SHA-256 único do arquivo), `origem`, `status`, `caminhoLocal`, `googlePhotosMediaId`, `categoriaId`, `metadata` (JSON) e `erroMotivo`. Implementada fábrica estática `MediaItem::fromDTO()`, getters sem prefixo `get` e setters encadeáveis (`self`).
  - **Repositório de Persistência (`MediaItemRepository`)**: Criado o repositório [`src/Repository/MediaItemRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/MediaItemRepository.php) estendendo `ServiceEntityRepository`, contendo métodos `salvar()`, `remover()`, `buscarPorHash()`, `buscarPorUuid()` e `buscarPorStatus()`.
- **Arquivos envolvidos**:
  - [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php)
  - [`src/DataObject/CriarMediaItemDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarMediaItemDTO.php)
  - [`src/Repository/MediaItemRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/MediaItemRepository.php)

### ✅ Tópico 35 — Entidade Categoria
- **Status**: Concluído
- **O que foi feito**:
  - **Modelagem da Entidade `Categoria`**: Criada a entidade Doctrine [`src/Entity/Categoria.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/Categoria.php) em `categoria` com chave primária UUID v7 gerada no construtor via `Symfony\Component\Uid\Uuid::v7()`.
  - **Mapeamento de Roteamento de Mídia**: Mapeia a associação entre `nome` (único), `pastaLocal` (diretório físico no volume do Syncthing) e `googlePhotosAlbumId` (identificador do álbum no Google Fotos).
  - **Data Transfer Object (`CriarCategoriaDTO`)**: Desenvolvido o DTO imutável [`src/DataObject/CriarCategoriaDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarCategoriaDTO.php) com validações Symfony (`Assert\NotBlank`, `Assert\Length`).
  - **Métodos de Domínio e Standard Getters**: Fábrica estática `Categoria::fromDTO()`, getters sem prefixo `get` (`uuid()`, `nome()`, `pastaLocal()`, `googlePhotosAlbumId()`, `criadoEm()`, `atualizadoEm()`) e setters fluidores encadeáveis (`self`).
  - **Repositório de Persistência (`CategoriaRepository`)**: Criado o repositório [`src/Repository/CategoriaRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/CategoriaRepository.php) estendendo `ServiceEntityRepository`, com métodos `salvar()`, `remover()`, `buscarPorNome()` e `buscarPorUuid()`.
- **Arquivos envolvidos**:
  - [`src/Entity/Categoria.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/Categoria.php)
  - [`src/DataObject/CriarCategoriaDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarCategoriaDTO.php)
  - [`src/Repository/CategoriaRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/CategoriaRepository.php)

### ✅ Tópico 36 — Entidade OrigemRegra
- **Status**: Concluído
- **O que foi feito**:
  - **Modelagem da Entidade `OrigemRegra`**: Criada a entidade Doctrine [`src/Entity/OrigemRegra.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/OrigemRegra.php) na tabela `origem_regra` com chave primária UUID v7 gerada via `Symfony\Component\Uid\Uuid::v7()`.
  - **Mapeamento de Regras Automáticas por Origem**: Mapeia o vínculo direto entre a origem do agente (ex: `print_empresa`, `print_pessoal`) e a categoria padrão (`categoriaId`), permitindo classificação automatizada sem intervenção manual.
  - **Data Transfer Object (`CriarOrigemRegraDTO`)**: Criado o DTO imutável [`src/DataObject/CriarOrigemRegraDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarOrigemRegraDTO.php) com validações Symfony (`Assert\NotBlank`, `Assert\Length`).
  - **Métodos de Domínio e Standard Getters**: Fábrica estática `OrigemRegra::fromDTO()`, getters sem prefixo `get` (`uuid()`, `origem()`, `categoriaId()`, `criadoEm()`, `atualizadoEm()`) e setters encadeáveis (`self`).
  - **Repositório de Persistência (`OrigemRegraRepository`)**: Criado o repositório [`src/Repository/OrigemRegraRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/OrigemRegraRepository.php) estendendo `ServiceEntityRepository`, contendo métodos `salvar()`, `remover()`, `buscarPorOrigem()` e `buscarPorUuid()`.
- **Arquivos envolvidos**:
  - [`src/Entity/OrigemRegra.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/OrigemRegra.php)
  - [`src/DataObject/CriarOrigemRegraDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarOrigemRegraDTO.php)
  - [`src/Repository/OrigemRegraRepository.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Repository/OrigemRegraRepository.php)

### ✅ Tópico 37 — Enums StatusMediaItem e OrigemMedia
- **Status**: Concluído
- **O que foi feito**:
  - **Enum `StatusMediaItem`**: Criado o enum fortemente tipado [`src/Enum/StatusMediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/StatusMediaItem.php) (`enum StatusMediaItem: string`), cobrindo os estados do ciclo de vida de mídia: `RECEBIDO`, `EM_FILA`, `CLASSIFICADO`, `DISTRIBUINDO`, `DISTRIBUIDO_LOCAL`, `ENVIANDO_GOOGLE_FOTOS`, `CONCLUIDO` e `ERRO`. Inclui métodos `descricao()` e `isFinal()`.
  - **Enum `OrigemMedia`**: Criado o enum fortemente tipado [`src/Enum/OrigemMedia.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/OrigemMedia.php) (`enum OrigemMedia: string`), encapsulando as origens válidas: `PRINT_EMPRESA`, `PRINT_PESSOAL`, `BOT_TELEGRAM` e `MANUAL`, com método helper `descricao()`.
  - **Refatoração de Entidades e DTOs**: Atualizadas as entidades [`MediaItem`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php) e [`OrigemRegra`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/OrigemRegra.php) e os DTOs [`CriarMediaItemDTO`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarMediaItemDTO.php) e [`CriarOrigemRegraDTO`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarOrigemRegraDTO.php) para utilizarem os novos enums via atributo Doctrine `enumType`, eliminando strings puras e garantindo integridade de tipos.
- **Arquivos envolvidos**:
  - [`src/Enum/StatusMediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/StatusMediaItem.php)
  - [`src/Enum/OrigemMedia.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Enum/OrigemMedia.php)
  - [`src/Entity/MediaItem.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/MediaItem.php)
  - [`src/Entity/OrigemRegra.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/Entity/OrigemRegra.php)
  - [`src/DataObject/CriarMediaItemDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarMediaItemDTO.php)
  - [`src/DataObject/CriarOrigemRegraDTO.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/DataObject/CriarOrigemRegraDTO.php)

### ✅ Tópico 38 — Migrations das entidades do motor de mídia
- **Status**: Concluído
- **O que foi feito**:
  - **Geração de Migrations do Motor de Mídia**: Geradas e validadas as classes de migration via `doctrine:migrations:diff` para estruturação física das tabelas do motor de mídia no MySQL.
  - **Estruturação de Tabelas**: Criadas as tabelas `token_agente` ([`Version20260923104631.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260923104631.php)), `conta_google_fotos` e `media_item` ([`Version20260924103732.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924103732.php)), `categoria` e `origem_regra` ([`Version20260924105230.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924105230.php)), além do ajuste de tipos enum ([`Version20260924113344.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924113344.php)).
  - **Execução e Sincronização do Banco**: Executadas as migrations via `make migrate`, garantindo 100% de sincronismo entre o mapeamento ORM e o esquema do banco (`doctrine:schema:validate`).
- **Arquivos envolvidos**:
  - [`migrations/Version20260923104631.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260923104631.php)
  - [`migrations/Version20260924103732.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924103732.php)
  - [`migrations/Version20260924105230.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924105230.php)
  - [`migrations/Version20260924113344.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/migrations/Version20260924113344.php)

### ✅ Tópico 39 — Rate limiter dedicado para endpoints de ingestão
- **Status**: Concluído
- **O que foi feito**:
  - **Configuração do Limitador `ingestao`**: Adicionada a política `token_bucket` com limite de 300 requisições por minuto (`limit: 300`, `rate: { interval: '1 minute' }`) no arquivo [`config/packages/rate_limiter.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/rate_limiter.yaml).
  - **Criação do Listener `IngestaoRateLimiterListener`**: Implementado o listener de evento [`src/EventListener/IngestaoRateLimiterListener.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/EventListener/IngestaoRateLimiterListener.php) escutando `KernelEvents::REQUEST` com prioridade 10.
  - **Filtro por Rota e Identificador**: O listener intercepta apenas requisições para rotas de ingestão (`/api/v1/ingestao` e `/api/v1/midia/ingestao`), extraindo a chave de rate limit via header `X-Agent-Token` ou IP do cliente.
  - **Tratamento de Excesso de Requisições**: Ao exceder o limite (`$limiter->consume(1)` não aceito), dispara resposta HTTP `429 Too Many Requests` estruturada em JSON com headers `Retry-After` e `X-RateLimit-Reset`.
- **Arquivos envolvidos**:
  - [`config/packages/rate_limiter.yaml`](file:///home/gabriel/dev/pessoal/CirqueiraX/config/packages/rate_limiter.yaml)
  - [`src/EventListener/IngestaoRateLimiterListener.php`](file:///home/gabriel/dev/pessoal/CirqueiraX/src/EventListener/IngestaoRateLimiterListener.php)

### ✅ Tópico 40 — Atualização do guia de padrões (decisão de UI HeroUI)
- **Status**: Concluído
- **O que foi feito**:
  - **Alinhamento do Guia de Padrões**: Atualizada a documentação de arquitetura e funcionalidades em [`documentation/funcionalidades/CIRQUEIRAX.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/funcionalidades/CIRQUEIRAX.md) e [`documentation/funcionalidades/CIRQUEIRAX_FEATURES.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/funcionalidades/CIRQUEIRAX_FEATURES.md) para confirmar HeroUI v3 + Tailwind CSS v4 + `tailwindcss-motion` como a stack oficial de UI e animação.
  - **Eliminação de Conflitos**: Removidas e marcadas como resolvidas as ambiguidades que citavam Shadcn UI ou Framer Motion como componentes obrigatórios do core.
  - **Esclarecimento do Módulo `ui-extra`**: Documentado explicitamente que a ativação do módulo `ui-extra` tem como único propósito o uso da biblioteca Recharts para gráficos no Dashboard (Feature 5), permanecendo o Framer Motion opcional apenas para `AnimatePresence`.
- **Arquivos envolvidos**:
  - [`documentation/funcionalidades/CIRQUEIRAX.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/funcionalidades/CIRQUEIRAX.md)
  - [`documentation/funcionalidades/CIRQUEIRAX_FEATURES.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/funcionalidades/CIRQUEIRAX_FEATURES.md)
  - [`documentation/stack/FRONTEND.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/stack/FRONTEND.md)
  - [`documentation/guias/PARA-IA.md`](file:///home/gabriel/dev/pessoal/CirqueiraX/documentation/guias/PARA-IA.md)
