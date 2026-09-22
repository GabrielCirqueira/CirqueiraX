# 🚀 cirqueiraX v5.0.0 — Symfony 7.3 & React 19

# CirqueiraX

Hub central de organização digital do Gabriel Cirqueira.

Nasce resolvendo a gestão automatizada de mídia — download de vídeos de qualquer plataforma, captura de prints e uploads manuais, tudo classificado e distribuído sozinho entre pastas locais (via Syncthing) e álbuns do Google Fotos, com um dashboard único para acompanhar e controlar todo o processo.

A mídia é só o primeiro módulo. O CirqueiraX é pensado desde a base como uma plataforma que vai crescer: o mesmo hub, com o mesmo dashboard e a mesma infraestrutura, vai abrigar futuramente outras ferramentas e automações pessoais — tudo centralizado num único lugar, em vez de espalhado em bots e scripts soltos.

Construído sobre o [Catalyst Skeleton](https://github.com/GabrielCirqueira/Catalyst-Skeleton) (PHP 8.4 + Symfony 7.3 / React 19 + TypeScript).

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [`CIRQUEIRAX.md`](./documentation/funcionalidades/CIRQUEIRAX.md) | Documentação técnica completa do sistema: visão geral, arquitetura, módulos, modelo de dados, integrações externas, roadmap e achados da análise técnica do projeto já montado |

## Status atual

- Projeto criado a partir do skeleton, containers rodando (backend, frontend, banco)
- Módulos opcionais (`async`, `observability`, `ui-extra`) ainda **não ativados** — ver seção 9 de `CIRQUEIRAX.md` para o que isso bloqueia
- Design técnico do pipeline de mídia (v1) definido — pendências de decisão listadas em `CIRQUEIRAX.md`, seções 8 e 9

## Módulos planejados (v1)

1. **Downloads de vídeo** — link de qualquer plataforma → categorização → distribuição automática
2. **Prints automáticos** — agentes nos PCs (empresa e pessoal) capturando e classificando sozinhos
3. **Upload manual** — drag-and-drop para mídia que não passa pelos fluxos automáticos
4. **Motor de classificação e roteamento** — núcleo que decide pasta local + álbum Google Fotos por categoria
5. **Dashboard** — visão geral, por categoria, status de sincronização, erros/retry, reclassificação manual

Detalhamento completo de cada módulo em `CIRQUEIRAX.md`.

---

## Pré-requisitos

| Ferramenta | Verificação |
| :--- | :--- |
| Docker + Docker Compose v2 | `docker compose version` |
| Git | `git --version` |
| OpenSSL | `openssl version` |

> Node.js e PHP não precisam estar instalados na máquina host.

---

| Serviço | Porta (Host) | Destino |
| :--- | :--- | :--- |
| **API Symfony** | `BACKEND_PORT` | [http://localhost:4010](http://localhost:4010) |
| **Frontend Vite** | `FRONTEND_PORT` | [http://localhost:4012](http://localhost:4012) |
| **MySQL** | `DATABASE_PORT` | `localhost:4013` |
| **Supervisor** | `SUPERVISOR_PORT` | [http://localhost:4011](http://localhost:4011) |

> [!TIP]
> As portas são centralizadas no arquivo `ports.env`. O setup pergunta quais você deseja usar, mas você pode alterá-las a qualquer momento e rodar `make restart`.

---

## 🛠️ Comandos do dia a dia

| Comando | Descrição |
| :--- | :--- |
| `make up-d` | Sobe a stack completa em background |
| `make down` | Para todos os containers |
| `make restart` | Reinicia todos os serviços |
| `make install` | Instala dependências (Composer + NPM) |
| `make migrate` | Executa migrations pendentes |
| `make lint-all` | Valida estilo (PHP-CS-Fixer + Biome) |
| `make bash-backend` | Acessa shell do container Symfony |

---

## 🏗️ Arquitetura (Visão Rápida)

O cirqueiraX impõe uma separação rigorosa de interesses:

- **Backend**: Baseado em **Services Atômicos** e **DTOs**. A lógica de negócio nunca vaza para o Controller.
- **Frontend**: Organizado por **Features**. Cada funcionalidade (Auth, User, etc) é um módulo autossucedido.
- **Envelope da API**: Controllers de API extends `DefaultController` e respondem `{ success, data }` / `{ success, error }`.

---

> Índice da documentação: [documentation/README.md](documentation/README.md). Visão técnica global: [DOCUMENTACAO_TECNICA.md](documentation/referencia/DOCUMENTACAO_TECNICA.md).

---
## 📚 Documentação Detalhada

Para uma imersão profunda em cada área do projeto, consulte nossos guias específicos:

- [**Índice**](documentation/README.md): mapa de pastas (`guias/`, `stack/`, `ops/`, `referencia/`, `progresso/`).
- [**Progresso e Roadmap**](documentation/progresso/README.md): índices paginados e `make progresso`.
- [**Guia de Autenticação**](documentation/stack/AUTH.md): Fluxo JWT, RS256 e Auto-refresh.
- [**Guia de Frontend**](documentation/stack/FRONTEND.md): React 19, HeroUI v3 e primitivos de layout.
- [**Guia de Backend**](documentation/stack/BACKEND.md): Symfony 7.3, `DefaultController` e Early Return.
- [**Arquitetura e Padrões**](documentation/referencia/ARCHITECTURE_PATTERNS.md): DDD, Specifications e Value Objects.
- [**Mensageria (Async)**](documentation/stack/MESSENGER.md): Symfony Messenger e Workers.
- [**Docker e DevOps**](documentation/ops/DOCKER.md): Infraestrutura e multi-stage builds.
- [**Makefile e CLI**](documentation/ops/MAKEFILE.md): Comandos de produtividade e Scaffolding.
- [**Lint e Formatação**](documentation/ops/FORMATTING.md): Biome e PHP-CS-Fixer.

---

*Para uma visão técnica global e variáveis de ambiente, veja [DOCUMENTACAO_TECNICA.md](documentation/referencia/DOCUMENTACAO_TECNICA.md).*
