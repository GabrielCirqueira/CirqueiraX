# Documentação

Índice da documentação do CirqueiraX. IA: comece por [guias/PARA-IA.md](guias/PARA-IA.md).

| Pasta | Para quê |
| :--- | :--- |
| [guias/](guias/) | Como o time (e a IA) deve escrever código: pastas, nomenclatura, UI, nova funcionalidade |
| [funcionalidades/](funcionalidades/) | Como funcionam os processos e regras de negócio de cada módulo do sistema |
| [stack/](stack/) | Arquitetura técnica: frontend, backend, autenticação, processamento assíncrono |
| [ops/](ops/) | Como operar o repositório: Docker, deploy, Makefile, CLI, lint |
| [referencia/](referencia/) | Visão global, árvore de pastas e padrões de arquitetura |
| [progresso/](progresso/) | Roadmap, índice de tópicos e melhorias pontuais |

---

## Funcionalidades e Processos do Sistema

| Arquivo | Descrição |
| :--- | :--- |
| [funcionalidades/CIRQUEIRAX.md](funcionalidades/CIRQUEIRAX.md) | Visão geral do hub, princípios de design e arquitetura macro |
| [funcionalidades/PRINTS.md](funcionalidades/PRINTS.md) | Captura de screenshots, deduplicação SHA-256 e galeria minimalista (Google Fotos) |
| [funcionalidades/AGENTE.md](funcionalidades/AGENTE.md) | Agente cliente Python (`agente.py`), daemons (WSL/Linux/Windows) e comandos do terminal |
| [funcionalidades/DOWNLOADS_VIDEOS.md](funcionalidades/DOWNLOADS_VIDEOS.md) | Download yt-dlp, extração de metadados, player, triagem e escalonamento de horários em lote |
| [funcionalidades/GOOGLE_FOTOS.md](funcionalidades/GOOGLE_FOTOS.md) | Backup OAuth2, upload append-only, criação e vinculação de álbuns |
| [funcionalidades/SYNCTHING.md](funcionalidades/SYNCTHING.md) | Sincronização via pasta raiz única (`cirqueirax-media`), `.stignore` e réplica no Android |
| [funcionalidades/UPLOAD_MANUAL.md](funcionalidades/UPLOAD_MANUAL.md) | Upload manual via dropzone na web, barra de progresso e validação MIME |
| [funcionalidades/CATEGORIAS_E_REGRAS.md](funcionalidades/CATEGORIAS_E_REGRAS.md) | Motor de regras de origem (`OrigemRegra`), categorias e distribuição física em disco |

---

## Stack Técnica

| Arquivo | Quando abrir |
| :--- | :--- |
| [stack/FRONTEND.md](stack/FRONTEND.md) | React 19, Chakra UI v3, paleta cirqueira, TanStack Query, Zustand e rotas |
| [stack/BACKEND.md](stack/BACKEND.md) | Symfony 7.3, PHP 8.4, DefaultController, services, DTOs e serializers |
| [stack/AUTH.md](stack/AUTH.md) | Autenticação dupla: JWT RS256 para usuários web e TokenAgenteAuthenticator para agentes |
| [stack/MESSENGER.md](stack/MESSENGER.md) | Filas assíncronas do Messenger, mensagens, handlers e workers no Supervisor |

---

## Guias e Padrões de Código

| Arquivo | Quando abrir |
| :--- | :--- |
| [guias/PARA-IA.md](guias/PARA-IA.md) | **Comece aqui.** Passo a passo de como escrever código neste repo |
| [guias/Estruturação.md](guias/Estruturação.md) | Detalhe: pastas, layout (`Box`/`Text`), checklist de PR |
| [guias/DESIGN.md](guias/DESIGN.md) | Tokens visuais e componentes de UI |
| [guias/NOVA-FUNCIONALIDADE.md](guias/NOVA-FUNCIONALIDADE.md) | Passo a passo para uma tela/feature nova |
| [guias/GUIA-GERAL.md](guias/GUIA-GERAL.md) | Compêndio longo de padrões (consulta) |

---

## Ops e Infraestrutura

| Arquivo | Quando abrir |
| :--- | :--- |
| [ops/DOCKER.md](ops/DOCKER.md) | Compose, imagens, portas (`ports.env`) e storage externo |
| [ops/DEPLOY.md](ops/DEPLOY.md) | Produção, Nginx reverse proxy, SSL e deploy automático |
| [ops/MAKEFILE.md](ops/MAKEFILE.md) | Comandos `make …` disponíveis |
| [ops/CLI.md](ops/CLI.md) | Scripts de console e automação |
| [ops/FORMATTING.md](ops/FORMATTING.md) | Biome e PHP-CS-Fixer |

---

## Referência e Progresso

| Arquivo | Quando abrir |
| :--- | :--- |
| [stack/DOCUMENTACAO_TECNICA.md](stack/DOCUMENTACAO_TECNICA.md) | Enciclopédia: env, portas, versionamento e regras de arquitetura |
| [progresso/README.md](progresso/README.md) | Histórico de roadmap e melhorias pontuais |
