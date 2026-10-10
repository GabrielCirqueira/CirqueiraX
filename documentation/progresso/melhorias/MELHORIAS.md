# Registro de Melhorias e Correções

> Histórico de melhorias pontuais, refinamentos de UI/UX e correções do cirqueiraX.

> [!IMPORTANT]
> Para registrar uma nova melhoria, siga o fluxo descrito em [README.md](README.md).
> Alterações de frontend → [FRONTEND.md](../../stack/FRONTEND.md). Alterações de backend → [BACKEND.md](../../stack/BACKEND.md).

> Os detalhes de cada melhoria estão nos arquivos desta pasta:
> - **M1–M20** → [MELHORIAS_1.md](MELHORIAS_1.md)
> - **M21–M40** → [MELHORIAS_2.md](MELHORIAS_2.md)

| ID | Melhoria / Tarefa | Status | Data | Detalhes |
|---|---|---|---|---|
| M1 | Autenticação por Email/Senha, Tela de Login e Comando CLI (`app:usuario:criar`) | ✅ Concluído | 28/09/2026 | [ver](MELHORIAS_1.md#melhoria-1--autenticação-com-emailsenha-e-comando-cli-para-criação-de-usuários) |
| M2 | Correção de Erro 500 no Dashboard e Resiliência de Status do Daemon Syncthing | ✅ Concluído | 28/09/2026 | [ver](MELHORIAS_1.md#melhoria-2--correção-de-erro-500-no-dashboard-e-status-syncthing) |
| M3 | Unicidade de Keys no Mapeamento de Categorias do Dashboard | ✅ Concluído | 28/09/2026 | [ver](MELHORIAS_1.md#melhoria-3--unicidade-de-keys-na-listagem-de-categorias) |
| M4 | Correção de Prop `isDisabled` e Variantes de Botão em `CampoNovoLink` | ✅ Concluído | 28/09/2026 | [ver](MELHORIAS_1.md#melhoria-4--adequação-de-propriedades-dom-em-camponovolink) |
| M5 | Reestruturação de Modais HeroUI / React Aria (`PressResponder`) em Downloads | ✅ Concluído | 28/09/2026 | [ver](MELHORIAS_1.md#melhoria-5--reestruturação-de-modais-heroui-em-downloads-de-vídeo) |
| M6 | Instalação e Habilitação de `yt-dlp` e `ffmpeg` no Container para Download de Vídeos | ✅ Concluído | 28/09/2026 | [ver](MELHORIAS_1.md#melhoria-6--instalação-de-yt-dlp-e-ffmpeg-para-extração-e-download-de-vídeos) |
| M7 | Migração completa de HeroUI + Tailwind CSS para Chakra UI v3 | ✅ Concluído | 29/09/2026 | [ver](MELHORIAS_1.md#melhoria-7--migração-de-heroui--tailwind-css-para-chakra-ui-v3) |
| M8 | Visualização de Vídeo, Streaming com Range Headers, Prévia de Thumbnails e Download Direto | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-8--visualização-de-vídeo-streaming-com-range-headers-prévia-de-thumbnails-e-download-direto) |
| M9 | Correção do Componente Toaster e Layout de Notificações Chakra UI v3 | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-9--correção-do-componente-toaster-e-layout-de-notificações-chakra-ui-v3) |
| M10 | Campo Dedicado de Thumbnail na Entidade MediaItem e Migração de Banco | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-10--campo-dedicado-de-thumbnail-na-entidade-mediaitem-e-migração-de-banco) |
| M11 | Ajuste do `.gitignore` para Ignorar Mídias Baixadas e Storage em `devops/var/` | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-11--ajuste-do-gitignore-para-ignorar-mídias-baixadas-e-storage-em-devopsvar) |
| M12 | Refatoração de `MediaItemController` e `BaixarVideoDownloadService` com Clean Code e Use Case Dedicado | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-12--refatoração-de-mediaitemcontroller-e-baixarvideodownloadservice-com-clean-code-e-use-case-dedicado) |
| M13 | Modal Avançado de Edição de Metadados com Data, Horário, Duração, Thumbnail e Atalhos Rápidos | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-13--modal-avançado-de-edição-de-metadados-com-data-horário-duração-thumbnail-e-atalhos-rápidos) |
| M14 | Migração de Schema via Makefile, Backfill de Thumbnails e Correção de Erro 500 | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-14--migração-de-schema-via-makefile-backfill-de-thumbnails-e-correção-de-erro-500) |
| M15 | Detalhamento Completo dos Cards de Vídeo (Data, Horário, Tamanho e Extensão) | ✅ Concluído | 03/10/2026 | [ver](MELHORIAS_1.md#melhoria-15--detalhamento-completo-dos-cards-de-vídeo-data-horário-tamanho-e-extensão) |
| M16 | Extração Automática de Código OAuth2 no Comando de Autorização Google Fotos | ✅ Concluído | 04/10/2026 | [ver](MELHORIAS_1.md#melhoria-16--extração-automática-de-código-oauth2-no-comando-de-autorização-google-fotos) |
| M17 | Padronização de Importações Explícitas de Classes PHP (Zero FQCN Inline) | ✅ Concluído | 04/10/2026 | [ver](MELHORIAS_1.md#melhoria-17--padronização-de-importações-explícitas-de-classes-php-zero-fqcn-inline) |
| M18 | Padronização de Métodos de Verificação de Estado em Entidades e Enums (`is...`) | ✅ Concluído | 05/10/2026 | [ver](MELHORIAS_1.md#melhoria-18--padronização-de-métodos-de-verificação-de-estado-em-entidades-e-enums-is) |
| M19 | Execução Automática em Background dos Workers do Messenger e Scheduler via Supervisord | ✅ Concluído | 05/10/2026 | [ver](MELHORIAS_1.md#melhoria-19--execução-automática-em-background-dos-workers-do-messenger-e-scheduler-via-supervisord) |
| M20 | Correção de Erro 500 no Dashboard (`TypeError: Cannot access offset of type App\Enum\StatusMediaItem on array`) | ✅ Concluído | 05/10/2026 | [ver](MELHORIAS_1.md#melhoria-20--correção-de-erro-500-no-dashboard-typeerror-cannot-access-offset-of-type-appenumstatusmediaitem-on-array) |
| M21 | Status Explícito `sem_categoria` para Mídias Baixadas sem Categoria/Álbum | ✅ Concluído | 05/10/2026 | [ver](MELHORIAS_2.md#melhoria-21--status-explícito-sem_categoria-para-mídias-baixadas-sem-categoriaálbum) |
| M22 | Port do Sistema de Paleta OKLCH Brand, Tokens de Tema e Documentação Técnica | ✅ Concluído | 09/10/2026 | [ver](MELHORIAS_2.md#melhoria-22--port-do-sistema-de-paleta-oklch-brand-tokens-de-tema-e-documentação-técnica) |
| M23 | Redesenho da Central de Downloads com Alternador Grid/Lista e Componente Tabela | ✅ Concluído | 09/10/2026 | [ver](MELHORIAS_2.md#melhoria-23--redesenho-da-central-de-downloads-com-alternador-gridlista-e-componente-tabela) |
| M24 | Padronização da Paleta Cirqueira, Refinamento de UI de Autenticação e Sidebar Global | ✅ Concluído | 09/10/2026 | [ver](MELHORIAS_2.md#melhoria-24--padronização-da-paleta-cirqueira-refinamento-de-ui-de-autenticação-e-sidebar-global) |
| M25 | Ingestão Instantânea via Clipboard Global (Ctrl+V) e Detecção Automática de Mídias | ✅ Concluído | 10/10/2026 | [ver](MELHORIAS_2.md#melhoria-25--ingestão-instantânea-via-clipboard-global-ctrlv-e-detecção-automática-de-mídias) |
| M26 | Separação de Lógica no Frontend, Utilitários Declarativos e Regra de Componentes Limpos | ✅ Concluído | 10/10/2026 | [ver](MELHORIAS_2.md#melhoria-26--separação-de-lógica-no-frontend-utilitários-declarativos-e-regra-de-componentes-limpos) |
| M27 | Refatoração Global de Componentes com Lógica Extrema e Remoção de Dependência Externa | ✅ Concluído | 10/10/2026 | [ver](MELHORIAS_2.md#melhoria-27--refatoração-global-de-componentes-com-lógica-extrema-e-remoção-de-dependência-externa) |






