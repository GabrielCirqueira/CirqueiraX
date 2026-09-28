# Progresso do Roadmap

> [!IMPORTANT]
> Sempre que detalhar um tópico concluído, atualize também [FRONTEND.md](../stack/FRONTEND.md) e/ou [BACKEND.md](../stack/BACKEND.md) conforme o lado alterado.
> Melhorias pontuais ficam em [MELHORIAS.md](melhorias/MELHORIAS.md).

> Os detalhes de cada tópico estão nos arquivos paginados desta pasta:
> - **Tópicos 1+** → [PROGRESSO_ROADMAP_1.md](PROGRESSO_ROADMAP_1.md)
> - **Tópicos 21+** → [PROGRESSO_ROADMAP_2.md](PROGRESSO_ROADMAP_2.md)
> - **Tópicos 41+** → [PROGRESSO_ROADMAP_3.md](PROGRESSO_ROADMAP_3.md)
> - **Tópicos 61+** → [PROGRESSO_ROADMAP_4.md](PROGRESSO_ROADMAP_4.md)
> - **Tópicos 81+** → [PROGRESSO_ROADMAP_5.md](PROGRESSO_ROADMAP_5.md)
> - **Tópicos 101+** → [PROGRESSO_ROADMAP_6.md](PROGRESSO_ROADMAP_6.md)

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
| 52 | DistribuirLocalMessageHandler e DistribuirLocalService | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 53 | GoogleFotosOAuthService — renovação automática de access token | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 54 | GoogleFotosAlbumService — criarOuObter() via albums.create | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 55 | EnviarGoogleFotosMessageHandler e EnviarGoogleFotosService | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 56 | Gravação do google_photos_media_id após upload | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 57 | Captura de exceção nos handlers — erro_motivo e status erro | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 58 | Comando CLI app:media:retentar | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 59 | Endpoint de retry — individual e em lote | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 60 | Teste end-to-end do motor completo e documentação atualizada | ✅ Concluído | [ver](PROGRESSO_ROADMAP_3.md) |
| 61 | DTO BaixarVideoDTO e validação de URL | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 62 | ValidadorUrlPlataforma (YouTube/TikTok/Twitter/Instagram + fallback) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 63 | BaixarVideoService — validação e dispatch da mensagem de download | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 64 | Mensagem BaixarVideoMessage e roteamento no Messenger | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 65 | BaixarVideoMessageHandler — execução do yt-dlp via Process | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 66 | Extração de metadata do vídeo (título, uploader, thumbnail, duração) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 67 | Integração do handler de download com IngestarMediaService | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 68 | Endpoint POST /api/v1/downloads (criação de pedido de download) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 69 | Status de download em tempo real | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 70 | MediaItemRepository::paginarComFiltros() | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 71 | Endpoint GET /api/v1/media-itens paginado com filtros | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 72 | Endpoint de ações em lote — categorizar | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 73 | Endpoint de ações em lote — rebaixar (redownload) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 74 | Endpoint de ações em lote — apagar arquivos | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 75 | Endpoint PATCH /api/v1/media-itens/{id} — edição de metadados | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 76 | Frontend — estrutura da feature downloads-video | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 77 | Frontend — componentes CardVideo e GridVideos | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 78 | Frontend — CampoNovoLink e BarraAcoesEmLote | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 79 | Frontend — página DownloadsVideo.tsx completa | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 80 | Teste end-to-end do fluxo de download e documentação atualizada | ✅ Concluído | [ver](PROGRESSO_ROADMAP_4.md) |
| 81 | Endpoint de ingestão via agente — POST /api/v1/ingestao/print | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 82 | DTO IngestarPrintDTO e upload multipart do agente | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 83 | IngestarPrintService — aplica OrigemRegra e delega ao motor | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 84 | Script agente — estrutura base | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 85 | Watcher de pasta com debounce (agente) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 86 | Cliente HTTP do agente — envio autenticado e retry | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 87 | Configuração do agente PC empresa | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 88 | Configuração do agente PC pessoal | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 89 | Persistência local do agente — evitar reenvio | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 90 | Execução do agente como serviço do SO | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 91 | Cadastro das OrigemRegra para print_empresa e print_pessoal | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 92 | Endpoint POST /api/v1/media-itens/upload (upload manual) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 93 | UploadManualDTO e validação de tipo de arquivo | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 94 | UploadManualService — checagem de duplicidade por hash | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 95 | Resposta de duplicidade (aviso, não bloqueio) | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 96 | Frontend — estrutura da feature upload-manual | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 97 | Frontend — componente de dropzone | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 98 | Frontend — fila de triagem pós-upload | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 99 | Frontend — página UploadManual.tsx completa | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 100 | Teste end-to-end de agentes e upload manual, documentação atualizada | ✅ Concluído | [ver](PROGRESSO_ROADMAP_5.md) |
| 101 | Endpoint GET /api/v1/dashboard/resumo — totais por status | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 102 | Endpoint GET /api/v1/dashboard/resumo — totais por origem | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 103 | DashboardService — agregações via QueryBuilder | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 104 | Endpoint GET /api/v1/dashboard/categorias — contagem e tamanho | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 105 | Cálculo de tamanho total (bytes) por categoria/origem | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 106 | SyncthingClient — cliente HTTP para a REST API do Syncthing | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 107 | Endpoint proxy GET /api/v1/sync/pastas | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 108 | Endpoint proxy POST /api/v1/sync/pastas/{id}/sincronizar | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 109 | Configuração de credenciais da API do Syncthing | ✅ Concluído | [ver](PROGRESSO_ROADMAP_6.md) |
| 110 | Endpoint de fila de erros (status=erro) com motivo | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 111 | Ação de retry em lote na fila de erros | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 112 | Reclassificação manual — mover pasta local | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 113 | Reclassificação manual — trocar álbum no Google Fotos | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 114 | Frontend — estrutura da feature dashboard | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 115 | Frontend — cards de visão geral | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 116 | Frontend — visão por categoria com edição de mapeamento | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 117 | Frontend — painel de status de sincronização | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 118 | Frontend — fila de erros com ação de retry | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 119 | Frontend — gráficos Recharts | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
| 120 | Página Dashboard.tsx completa, teste end-to-end geral e documentação final | ⏳ Pendente | [ver](PROGRESSO_ROADMAP_6.md) |
