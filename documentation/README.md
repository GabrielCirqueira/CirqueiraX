# Documentação

Índice da documentação do CirqueiraX. IA: comece por [guias/PARA-IA.md](guias/PARA-IA.md).

| Pasta | Para quê |
| :--- | :--- |
| [guias/](guias/) | Como o time (e a IA) deve escrever código: pastas, nomenclatura, UI, nova funcionalidade |
| [funcionalidades/](funcionalidades/) | Como funcionam os processos e regras de negócio de cada módulo do sistema |
| [stack/](stack/) | Arquitetura técnica: frontend, backend, autenticação, processamento assíncrono |
| [ops/](ops/) | Como operar o repositório: Docker, deploy, Makefile, CLI, lint |
| [progresso/](progresso/) | Roadmap, índice de tópicos e melhorias pontuais |

---

## Funcionalidades e Processos do Sistema

| Arquivo | Descrição |
| :--- | :--- |
| [funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md](funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md) | **Guia para o cliente**: todas as páginas e funcionalidades em linguagem simples |
| [funcionalidades/CIRQUEIRAX.md](funcionalidades/CIRQUEIRAX.md) | Visão técnica geral: arquitetura, páginas, ciclo da mídia e modelo de dados |
| [guias/GUIA_SINCRONIZACAO_ECOSSISTEMA.md](guias/GUIA_SINCRONIZACAO_ECOSSISTEMA.md) | **Manual do ecossistema**: sincronização, Google Fotos, Celular (Syncthing-Fork) e Agente PC |
| [funcionalidades/DASHBOARD.md](funcionalidades/DASHBOARD.md) | Painel inicial, métricas, categorias, sincronização e fila de erros |
| [funcionalidades/CENTRAL_MIDIAS.md](funcionalidades/CENTRAL_MIDIAS.md) | Biblioteca unificada, abas, filtros, ações em lote e atalhos |
| [funcionalidades/DOWNLOADS_VIDEOS.md](funcionalidades/DOWNLOADS_VIDEOS.md) | Download de vídeos, fila, estratégias por plataforma, triagem e horários em lote |
| [funcionalidades/DOWNLOADS_AUDIO.md](funcionalidades/DOWNLOADS_AUDIO.md) | Download de MP3, player, estados e retenção de 7 dias |
| [funcionalidades/PRINTS.md](funcionalidades/PRINTS.md) | Ingestão de screenshots e galeria de prints |
| [funcionalidades/EDITOR_IMAGEM.md](funcionalidades/EDITOR_IMAGEM.md) | Editor de imagem, ferramentas, atalhos e salvamento como nova mídia |
| [funcionalidades/UPLOAD_MANUAL.md](funcionalidades/UPLOAD_MANUAL.md) | Upload pela web, formatos, limites e duplicados |
| [funcionalidades/AGENTE.md](funcionalidades/AGENTE.md) | Agente de prints em Python, instalação por sistema e comandos |
| [funcionalidades/GOOGLE_FOTOS.md](funcionalidades/GOOGLE_FOTOS.md) | OAuth, envio, álbuns, duplicados e histórico de envios |
| [funcionalidades/SYNCTHING.md](funcionalidades/SYNCTHING.md) | Pasta sincronizada, integração e réplica no Android |
| [funcionalidades/CATEGORIAS_E_REGRAS.md](funcionalidades/CATEGORIAS_E_REGRAS.md) | Categorias, regras de origem, distribuição e troca de categoria |
| [funcionalidades/TRANSCRICOES.md](funcionalidades/TRANSCRICOES.md) | Transcrição de áudios e vídeos (até 2 GB) com Whisper local, fila ao vivo, correção com IA, exportação e áudio apagado em 7 dias |
| [funcionalidades/RETENCAO_E_LIMPEZA.md](funcionalidades/RETENCAO_E_LIMPEZA.md) | Limpeza de vídeos, expiração de áudios (MP3 e transcrições) e rebaixar |

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
| [ops/DEPLOY_PRODUCAO.md](ops/DEPLOY_PRODUCAO.md) | Arquitetura real de produção na VPS, Syncthing, migração segura e atualizações contínuas |
| [ops/MAKEFILE.md](ops/MAKEFILE.md) | Comandos `make …` disponíveis |
| [ops/CLI.md](ops/CLI.md) | Scripts de console e automação |
| [ops/FORMATTING.md](ops/FORMATTING.md) | Biome e PHP-CS-Fixer |

---

## Referência e Progresso

| Arquivo | Quando abrir |
| :--- | :--- |
| [stack/DOCUMENTACAO_TECNICA.md](stack/DOCUMENTACAO_TECNICA.md) | Enciclopédia: env, portas, versionamento e regras de arquitetura |
| [progresso/README.md](progresso/README.md) | Histórico de roadmap e melhorias pontuais |
