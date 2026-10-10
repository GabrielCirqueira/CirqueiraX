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

---

### ✅ Melhoria 23 — Redesenho da Central de Downloads com Alternador Grid/Lista e Componente Tabela

- **Status**: Concluído
- **Data**: 09 de outubro de 2026
- **Problema**:
  - A tela de downloads de vídeos exibia apenas cards em grid sem visão consolidada de listagem, dificultando a visualização rápida e a gestão em lote de grandes volumes de mídias baixadas. Além disso, faltavam métricas visuais no cabeçalho sobre o estado atual dos downloads.
- **Solução**:
  - Implementado o seletor de modo de visualização (`modoVisualizacao: 'grid' | 'lista'`) persistido e integrado com a barra de ferramentas.
  - Criado o componente dedicado `TabelaVideos.tsx`, com ordenação, seleção individual/geral por checkboxes, formatação de status, data, horário, canal e tamanho.
  - Adicionados contadores visuais de status (concluídos, em fila/processamento e erros) com filtro rápido por clique no cabeçalho.
  - Inclusão do botão de reset de filtros ativos e melhorias de responsividade mobile/desktop.
- **Arquivos**:
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `web/features/downloads-video/components/TabelaVideos.tsx`
  - `web/features/downloads-video/components/GridVideos.tsx`
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/downloads-video/components/BarraAcoesEmLote.tsx`

---

### ✅ Melhoria 24 — Padronização da Paleta Cirqueira, Refinamento de UI de Autenticação e Sidebar Global

- **Status**: Concluído
- **Data**: 09 de outubro de 2026
- **Problema**:
  - O prefixo temporário da paleta OKLCH (`catalist`) precisava ser padronizado para a marca do projeto (`cirqueira.*`). A tela de Login e a navegação principal careciam de polimento visual, apresentando problemas de alinhamento, mensagens de validação genéricas e contraste de cores inconsistente.
- **Solução**:
  - Renomeação completa do prefixo de tokens de tema para `cirqueira.*` em `scripts/gerar-paleta-brand.mjs`, `web/config/theme/theme.ts` e em todos os componentes da aplicação.
  - Refinamento visual da tela de Login (`web/features/auth/Login.tsx`), implementando gradientes suaves em modo dark, tipografia Poppins e Lato, validação Zod aprimorada e feedback explícito de erros por campo.
  - Criação da `Sidebar.tsx` modular com navegação fluida, ícones Lucide consistentes e suporte a visualização mobile via drawer responsivo.
  - Atualização dos guias de design em `DESIGN.md`, `FRONTEND.md` e `PARA-IA.md`.
- **Arquivos**:
  - `scripts/gerar-paleta-brand.mjs`
  - `web/config/theme/theme.ts`
  - `web/features/auth/Login.tsx`
  - `web/features/auth/ModalAuth.tsx`
  - `web/layouts/Sidebar.tsx`
  - `web/layouts/Header.tsx`
  - `web/layouts/MainLayout.tsx`
  - `documentation/guias/DESIGN.md`
  - `documentation/stack/FRONTEND.md`
  - `documentation/guias/PARA-IA.md`

---

### ✅ Melhoria 25 — Ingestão Instantânea via Clipboard Global (Ctrl+V) e Detecção Automática de Mídias

- **Status**: Concluído
- **Data**: 10 de outubro de 2026
- **Problema**:
  - Para baixar um vídeo, o usuário precisava clicar manualmente no campo de input, colar a URL e clicar no botão de submissão. Não havia detecção em nível de página quando o usuário copiava links de plataformas populares (YouTube, TikTok, Instagram, X/Twitter, Vimeo, etc.).
- **Solução**:
  - Adicionado listener de evento global de área de transferência (`window.addEventListener('paste')`) no componente `CampoNovoLink.tsx`.
  - Ao pressionar `Ctrl+V` em qualquer lugar da tela (fora de campos de busca), o sistema valida a URL: se for de uma plataforma de mídia reconhecida, dispara automaticamente o download sem necessidade de cliques adicionais.
  - Se a URL for genérica, preenche o campo e transfere o foco automaticamente para facilitar a conferência pelo usuário.
  - Adicionado botão interativo "Colar e Baixar" com indicador visual de atalho `Ctrl+V` e leitura da API `navigator.clipboard.readText()`.
- **Arquivos**:
  - `web/features/downloads-video/components/CampoNovoLink.tsx`
  - `web/features/downloads-video/DownloadsVideo.tsx`

---

### ✅ Melhoria 26 — Separação de Lógica no Frontend, Utilitários Declarativos e Regra de Componentes Limpos

- **Status**: Concluído
- **Data**: 10 de outubro de 2026
- **Problema**:
  - O componente `CampoNovoLink.tsx` continha mais de 40 linhas com um encadeamento gigantesco de `if/else` para identificar domínios de plataformas de vídeo. Da mesma forma, `CardVideo.tsx` e `TabelaVideos.tsx` tinham mais de 100 linhas duplicadas de funções de formatação de datas, durações e bytes no corpo do arquivo JSX.
- **Solução**:
  - Criado o utilitário `web/features/downloads-video/utils/plataformaVideo.ts`, substituindo o encadeamento de `if`s por uma tabela declarativa `PLATAFORMAS_REGISTRADAS` com regex, domínios, ícones e esquemas de cores.
  - Criado `web/features/downloads-video/utils/formatadores.ts`, unificando a formatação de data, horário, duração em segundos, bytes e mapeamento de status.
  - Refatorados `CampoNovoLink.tsx`, `CardVideo.tsx` e `TabelaVideos.tsx` para consumirem os utilitários, deixando os componentes puramente focados na apresentação.
  - Instituída e documentada a **Regra 10** em `documentation/guias/PARA-IA.md` e a **Regra de Ouro #2** em `documentation/stack/FRONTEND.md`, proibindo a inserção de parsers, cadeias longas de `if/else` ou regras de domínio dentro de arquivos `.tsx`.
- **Arquivos**:
  - `web/features/downloads-video/utils/plataformaVideo.ts`
  - `web/features/downloads-video/utils/formatadores.ts`
  - `web/features/downloads-video/components/CampoNovoLink.tsx`
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/downloads-video/components/TabelaVideos.tsx`
  - `documentation/guias/PARA-IA.md`
  - `documentation/stack/FRONTEND.md`

---

### ✅ Melhoria 27 — Refatoração Global de Componentes com Lógica Extrema e Remoção de Dependência Externa

- **Status**: Concluído
- **Data**: 10 de outubro de 2026
- **Problema**:
  - Múltiplos componentes acumulavam lógica pesada inline: `ModalEditarMetadata.tsx` realizava parsing complexo de ISO e regex de datas; `FilaTriagemUpload.tsx` fazia regex inline de extensões, parsing de caminhos e usava tags `<select>` e `<img>` com estilos crus; `PainelSync.tsx` possuía encadeamento de `if`s para badges; `FilaErros.tsx` e `GateConexaoGoogle.tsx` tinham formatações de data e título inline; e `formatarData.ts` continha dependência ausente (`date-fns`) que quebrava o build de produção do Vite.
- **Solução**:
  - Criado `web/features/downloads-video/utils/metadataEdicao.ts` para abstrair toda a manipulação e parsing temporal do `ModalEditarMetadata.tsx`.
  - Criado `web/features/upload-manual/utils/arquivosUpload.ts` com identificadores de tipo de mídia, extração de nomes de exibição e formatação de bytes, refatorando `FilaTriagemUpload.tsx` e `DropzoneUpload.tsx` com `NativeSelect` do Chakra v3.
  - Criado `web/features/dashboard/utils/statusSync.ts` com dicionário de estados e `formatadoresDashboard.ts` para títulos de erro e datas, refatorando `PainelSync.tsx` e `FilaErros.tsx`.
  - Refatorado `ModalVisualizarMidia.tsx` para reutilizar `formatadores.ts`.
  - Reescreveu-se `web/shared/utils/formatarData.ts` usando exclusivamente `Intl.DateTimeFormat` nativo do JavaScript, eliminando a dependência do `date-fns` e garantindo build 100% limpo no Vite e Docker.
- **Arquivos**:
  - `web/features/downloads-video/utils/metadataEdicao.ts`
  - `web/features/upload-manual/utils/arquivosUpload.ts`
  - `web/features/dashboard/utils/statusSync.ts`
  - `web/features/dashboard/utils/formatadoresDashboard.ts`
  - `web/features/downloads-video/components/ModalEditarMetadata.tsx`
  - `web/features/downloads-video/components/ModalVisualizarMidia.tsx`
  - `web/features/upload-manual/components/FilaTriagemUpload.tsx`
  - `web/features/upload-manual/components/DropzoneUpload.tsx`
  - `web/features/dashboard/components/PainelSync.tsx`
  - `web/features/dashboard/components/FilaErros.tsx`
  - `web/features/google-fotos/components/GateConexaoGoogle.tsx`
  - `web/shared/utils/formatarData.ts`
