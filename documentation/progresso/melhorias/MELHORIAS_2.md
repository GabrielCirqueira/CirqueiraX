# Registro de Melhorias — Bloco 2 (M21 a M40)

> Detalhamento das melhorias M21 ao M40.

---

### ✅ Melhoria 21 — Status Explícito `sem_categoria` para Mídias Baixadas sem Categoria/Álbum

- **Status**: Concluído
- **Data**: 05 de outubro de 2026
- **Problema**:
  - Quando um vídeo era baixado sem categoria vinculada e sem regra de origem automática, o sistema o mantinha em `em_fila` ("Em Fila de Processamento"). O frontend exibia um spinner de carregamento ativo e efetuava polling a cada 3 segundos indefinidamente, passando a falsa impressão para o usuário de que o download estava travado em fila ou com erro.
- **Solução**:
  - Criado o novo status explícito `StatusMediaItem::SEM_CATEGORIA` (`sem_categoria`) no backend com descrição `"Sem Categoria"`.
  - Ajustado o `ClassificarMediaMessageHandler` para transicionar para `SEM_CATEGORIA` quando não houver regra de origem automática.
  - Atualizado o frontend (`CardVideo.tsx`, `DownloadsVideo.tsx`, `useDownloadsVideo.ts`) para renderizar a badge cinza estática, sem animação de pulso/spinner, e interromper o polling contínuo quando os itens não estão em processamento ativo.
  - Atualizados os registros existentes no banco de dados.
- **Arquivos**:
  - `src/Enum/StatusMediaItem.php`
  - `src/Entity/MediaItem.php`
  - `src/MessageHandler/ClassificarMediaMessageHandler.php`
  - `web/features/downloads-video/types.ts`
  - `web/features/dashboard/types.ts`
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `web/features/downloads-video/hooks/useDownloadsVideo.ts`

---

### ✅ Melhoria 22 — Port do Sistema de Paleta OKLCH Brand, Tokens de Tema e Documentação Técnica

- **Status**: Concluído
- **Data**: 09 de outubro de 2026
- **Problema**:
  - O sistema necessitava incorporar o pipeline de geração matemática de paletas de cor OKLCH (`gerar-paleta-brand`), padronizar tokens semânticos e estritos do Chakra UI v3 (`catalist.brand.*`, `catalist.grey.*`, etc.), sincronizar os fluxos de documentação (`doctrine-diff` e `doctrine-validate`) e atualizar os componentes de layout e autenticação.
- **Solução**:
  - Implementados os scripts `scripts/gerar-paleta-brand.mjs` e `scripts/gerar-paleta-brand.sh`, com script `"theme:brand"` no `package.json`.
  - Gerada a configuração completa de tema e paletas OKLCH em `web/config/theme/theme.ts`, preservando re-export em `web/theme.ts` para total retrocompatibilidade.
  - Criado `web/shared/ui/toaster.tsx` e atualizado `web/shared/components/ui/toaster.tsx` com tokens de paleta.
  - Atualizados os componentes de UI (`Header.tsx`, `Footer.tsx`, `AuthLayout.tsx`, `NotFound.tsx`, `ErrorBoundary.tsx`, `Login.tsx`, `ModalAuth.tsx`) para utilizarem `Center`, tokens `catalist.*` e remoção de polimorfismo inválido no Chakra UI v3.
  - Varredura e substituição completa em todas as features de `web/` (`Home`, `Dashboard`, `DownloadsVideo`, `GoogleFotos`, `UploadManual`) de cores hexadecimais brutas e tokens `brand.*` legados por tokens estritos da paleta gerada OKLCH (`catalist.brand.*`, `catalist.purple.*`, `catalist.blue.*`, `catalist.emerald.*`, `catalist.cyan.*`, `catalist.amber.*`, `catalist.red.*`, `catalist.green.*`, `catalist.grey.*`).
  - Resolução de polimorfismo quebra de tipagem do Chakra v3 (`Box as="select"`, `Box as="img"`, `Box as="video"`, `Box as="a"`, `Box as={Link}`) para elementos nativos estilizados ou wrappers tipados.
  - Atualizadas as documentações técnicas (`DESIGN.md`, `Estruturação.md`, `PARA-IA.md`, `MAKEFILE.md`, `DOCUMENTACAO_TECNICA.md`, `BACKEND.md`).
- **Arquivos**:
  - `scripts/gerar-paleta-brand.mjs`
  - `scripts/gerar-paleta-brand.sh`
  - `package.json`
  - `web/config/theme/theme.ts`
  - `web/theme.ts`
  - `web/shared/ui/toaster.tsx`
  - `web/shared/components/ui/toaster.tsx`
  - `web/layouts/Header.tsx`
  - `web/layouts/Footer.tsx`
  - `web/layouts/AuthLayout.tsx`
  - `web/features/not-found/NotFound.tsx`
  - `web/features/auth/Login.tsx`
  - `web/features/auth/ModalAuth.tsx`
  - `web/features/home/Home.tsx`
  - `web/features/dashboard/components/CardsResumo.tsx`
  - `web/features/dashboard/components/GraficosDashboard.tsx`
  - `web/features/dashboard/components/ModalCriarCategoria.tsx`
  - `web/features/dashboard/components/PainelSync.tsx`
  - `web/features/dashboard/components/TabelaCategorias.tsx`
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `web/features/downloads-video/components/BarraAcoesEmLote.tsx`
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/downloads-video/components/GridVideos.tsx`
  - `web/features/downloads-video/components/ModalEditarMetadata.tsx`
  - `web/features/downloads-video/components/ModalVisualizarMidia.tsx`
  - `web/features/google-fotos/components/AvisoMigracaoAlbuns.tsx`
  - `web/features/upload-manual/UploadManual.tsx`
  - `web/features/upload-manual/components/DropzoneUpload.tsx`
  - `web/features/upload-manual/components/FilaTriagemUpload.tsx`
  - `web/shared/components/ErrorBoundary.tsx`
  - `documentation/guias/DESIGN.md`
  - `documentation/guias/Estruturação.md`
  - `documentation/guias/PARA-IA.md`
  - `documentation/ops/MAKEFILE.md`
  - `documentation/referencia/DOCUMENTACAO_TECNICA.md`
  - `documentation/stack/BACKEND.md`
  - `documentation/progresso/melhorias/MELHORIAS.md`
  - `documentation/progresso/melhorias/MELHORIAS_2.md`
