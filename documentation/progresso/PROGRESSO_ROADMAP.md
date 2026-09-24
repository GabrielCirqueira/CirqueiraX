# Progresso do Roadmap

> [!IMPORTANT]
> Sempre que detalhar um tópico concluído, atualize também [FRONTEND.md](../stack/FRONTEND.md) e/ou [BACKEND.md](../stack/BACKEND.md) conforme o lado alterado.
> Melhorias pontuais ficam em [MELHORIAS.md](melhorias/MELHORIAS.md).

> Os detalhes de cada tópico estão nos arquivos paginados desta pasta:
> - **Tópicos 1+** → [PROGRESSO_ROADMAP_1.md](PROGRESSO_ROADMAP_1.md)
> - **Tópicos 21+** → [PROGRESSO_ROADMAP_2.md](PROGRESSO_ROADMAP_2.md)
> - **Tópicos 41+** → [PROGRESSO_ROADMAP_3.md](PROGRESSO_ROADMAP_3.md)

| ID | Tarefa | Status | Documentação |
|---|---|---|---|
| 1 | Stack núcleo PHP 8.4 + Symfony 7.3 + Docker Compose | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 2 | Autenticação JWT RS256 com refresh token | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 3 | Entidade Usuario, Repository e migration | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 4 | AuthController — login, registro, me e refresh | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 5 | Frontend React 19 + TypeScript 5.9 + Vite 7 | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 6 | HeroUI v3 + Tailwind CSS 4 + cor brand | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 7 | ThemeProvider (claro / escuro) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 8 | Primitivos de layout e texto | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 9 | Header e Footer globais no MainLayout | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 10 | Landing Home com showcase de componentes | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 11 | Modal de autenticação (login / cadastro) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 12 | Páginas Login e Cadastro | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 13 | RotaProtegida e store Zustand de auth | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 14 | TanStack Query + Axios com interceptores JWT | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 15 | ErrorBoundary e página 404 | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 16 | Documentação técnica do cirqueirax | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 17 | Makefile, Biome, PHPStan e PHP-CS-Fixer | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 18 | Módulos opt-in (async, observability, ui-extra) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 19 | PHPUnit e pasta tests/ removidos | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 20 | Sistema de progresso, roadmap e melhorias | ✅ Concluído | [ver](PROGRESSO_ROADMAP_1.md) |
| 21 | Ativação do módulo async (Messenger + Scheduler) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 22 | Configuração do transport Doctrine e messenger.yaml | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 23 | Supervisor com workers dedicados do Messenger | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 24 | Ativação do módulo ui-extra (Recharts) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 25 | Ativação do módulo observability (Sentry) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 26 | Canais de log dedicados no Monolog | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 27 | Volume Docker compartilhado com o Syncthing | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 28 | Enum TipoCliente e entidade TokenAgente | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 29 | Authenticator customizado para tokens de agente | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 30 | Comando CLI de geração de token por agente | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 31 | Entidade ContaGoogleFotos | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 32 | Serviço de criptografia do refresh token | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 33 | Comando CLI de autorização OAuth por conta Google Fotos | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 34 | Entidade MediaItem (UUID v7) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 35 | Entidade Categoria | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 36 | Entidade OrigemRegra | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 37 | Enums StatusMediaItem e OrigemMedia | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 38 | Migrations das entidades do motor de mídia | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 39 | Rate limiter dedicado para endpoints de ingestão | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 40 | Atualização do guia de padrões (decisão de UI HeroUI) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_2.md) |
| 41 | CRUD completo de Categoria (Service, Controller, Serializer) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 42 | Endpoints REST de Categoria (`/api/v1/categorias`) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 43 | CRUD completo de OrigemRegra (Service, Controller, Serializer) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 44 | DTO de ingestão e cálculo de hash do arquivo | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 45 | IngestarMediaService — deduplicação e criação do MediaItem | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 46 | Mensagem ClassificarMediaMessage e dispatch da ingestão | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 47 | Máquina de estados — método transicionarPara() no MediaItem | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 48 | Histórico de transições de status (auditoria) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 49 | ClassificarMediaMessageHandler — aplicação de OrigemRegra automática | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 50 | Fluxo de classificação manual (categoria pendente) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 51 | Dispatch paralelo — DistribuirLocalMessage e EnviarGoogleFotosMessage | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 52 | DistribuirLocalMessageHandler e DistribuirLocalService | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 53 | GoogleFotosOAuthService — renovação automática de access token | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 54 | GoogleFotosAlbumService — criarOuObter() via albums.create | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 55 | EnviarGoogleFotosMessageHandler e EnviarGoogleFotosService | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 56 | Gravação do google_photos_media_id após upload | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 57 | Captura de exceção nos handlers — erro_motivo e status erro | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 58 | Comando CLI app:media:retentar | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 59 | Endpoint de retry — individual e em lote | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
| 60 | Teste end-to-end do motor completo e documentação atualizada | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_3.md) |
