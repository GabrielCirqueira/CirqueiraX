# Melhorias 1–20

> Detalhamento das melhorias **M1–M20**. Cada bloco tem no máximo 20 itens.

### ✅ Melhoria 1 — Autenticação com Email/Senha e Comando CLI para Criação de Usuários

- **Status**: Concluído
- **Data**: 28 de setembro de 2026
- **Problema**: O frontend acessava o painel sem exigência de login prévio por e-mail/senha, sem proteção global de rotas autenticadas e sem comando seguro para provisionar administradores/usuários no banco de dados.
- **Solução**:
  - Adicionada coluna `email` única na entidade `Usuario` com índice `UNIQ_USUARIO_EMAIL` e migration aplicada.
  - Implementado `UserLoaderInterface` no repositório para login híbrido (usuário ou e-mail).
  - Desenvolvido o comando Symfony interativo `app:usuario:criar` (com alias `app:user:create`) com prompt seguro de senha oculta.
  - Redesenhada a tela de Login no frontend em HeroUI com suporte a alternância de visibilidade de senha, sem cadastro público.
  - Protegidas todas as rotas internas com o componente `<RotaProtegida />`.
- **Arquivos**: `src/Entity/Usuario.php`, `src/Repository/UsuarioRepository.php`, `src/Command/CriarUsuarioCommand.php`, `src/Service/Usuario/CriarUsuarioService.php`, `src/DataObject/CriarUsuarioDTO.php`, `config/packages/security.yaml`, `web/App.tsx`, `web/features/auth/Login.tsx`, `web/features/auth/hooks.ts`, `web/layouts/Header.tsx`

---

### ✅ Melhoria 2 — Correção de Erro 500 no Dashboard e Status Syncthing

- **Status**: Concluído
- **Data**: 28 de setembro de 2026
- **Problema**: Endpoints `/api/v1/dashboard/*` e `/api/v1/sync/pastas` retornavam HTTP 500 no backend devido à falta do pacote `guzzlehttp/guzzle` no container e payload de status do Syncthing não tipado no frontend.
- **Solução**:
  - Executado `composer install` dentro do container `symfony` e limpo o cache.
  - Criado o tipo `StatusSyncthing` e ajustado o consumo em `api.ts` e `useDashboard.ts` para tratar `{ online, versao, pastas }`.
  - Atualizado `PainelSync.tsx` com indicador dinâmico e amigável de status do daemon Syncthing.
- **Arquivos**: `web/features/dashboard/api.ts`, `web/features/dashboard/types.ts`, `web/features/dashboard/hooks/useDashboard.ts`, `web/features/dashboard/components/PainelSync.tsx`

---

### ✅ Melhoria 3 — Unicidade de Keys na Listagem de Categorias

- **Status**: Concluído
- **Data**: 28 de setembro de 2026
- **Problema**: O React emitia warning `Encountered two children with the same key, sem-categoria` ao renderizar múltiplos itens sem UUID ou não categorizados no Dashboard.
- **Solução**: Atualizada a chave no mapeamento para `key={cat.uuid ? `cat-${cat.uuid}` : `cat-item-${cat.nome || idx}`}`, garantindo unicidade absoluta na árvore do React.
- **Arquivos**: `web/features/dashboard/components/TabelaCategorias.tsx`

---

### ✅ Melhoria 4 — Adequação de Propriedades DOM em CampoNovoLink

- **Status**: Concluído
- **Data**: 28 de setembro de 2026
- **Problema**: React exibia aviso `React does not recognize the isDisabled prop on a DOM element` no `<Input>`, e botões continham variante não suportada (`variant="quiet"`).
- **Solução**: Corrigido para `disabled={isPending}` no input e botões ajustados para a variante `ghost`.
- **Arquivos**: `web/features/downloads-video/components/CampoNovoLink.tsx`

---

### ✅ Melhoria 5 — Reestruturação de Modais HeroUI em Downloads de Vídeo

- **Status**: Concluído
- **Data**: 28 de setembro de 2026
- **Problema**: Modais na tela de Downloads emitiam `A PressResponder was rendered without a pressable child` devido ao `<ModalBackdrop />` autofechado como irmão de `<ModalContainer>`.
- **Solução**: Reestruturados todos os 4 modais (`itemEditarMetadata`, `modalCategorizarAberto`, `modalConfirmarApagar`, `modalConfirmarRebaixar`) aninhando `<ModalContainer>` dentro de `<ModalBackdrop isDismissable>`.
- **Arquivos**: `web/features/downloads-video/DownloadsVideo.tsx`

---

### ✅ Melhoria 6 — Instalação de yt-dlp e ffmpeg para Extração e Download de Vídeos

- **Status**: Concluído
- **Data**: 28 de setembro de 2026
- **Problema**: Chamadas ao endpoint `POST /api/v1/downloads` falhavam com erro 400 (`Falha ao extrair os metadados do vídeo utilizando o yt-dlp`) pois os utilitários CLI não estavam instalados no ambiente Symfony.
- **Solução**: Instalados os pacotes `yt-dlp`, `ffmpeg` e `python3` no container. Validado download e ingestão end-to-end de vídeo do TikTok com status `HTTP 201 Created`.
- **Arquivos**: `devops/php/Dockerfile`, container `symfony`, `src/Infra/YtDlp/YtDlpClient.php`

---

### ✅ Melhoria 7 — Migração de HeroUI + Tailwind CSS para Chakra UI v3

- **Status**: Concluído
- **Data**: 29 de setembro de 2026
- **Problema**: O frontend misturava três camadas de estilo distintas — componentes do **HeroUI**, classes utilitárias do **Tailwind CSS** e props nativas do **Chakra UI** — gerando conflitos de especificidade, duplicação de tokens de design e dificuldade de manutenção. O arquivo `shared/ui/layout.tsx` reexportava wrappers desnecessários e a configuração de tema era inexistente.
- **Solução**:
  - Removida a dependência `@heroui/react` e toda referência a seus componentes.
  - Removido o Tailwind CSS (`tailwind.config.js`, classes `className="..."` de utilitários Tailwind) de todos os arquivos refatorados.
  - Instalado e configurado o **Chakra UI v3** (`@chakra-ui/react`) com `createSystem` e tokens de tema customizados (cor brand, semântica de cores, espaçamentos).
  - O provider `<ChakraProvider value={system}>` foi centralizado em `main.tsx`.
  - Esvaziado `web/shared/ui/layout.tsx`: os componentes de layout passaram a ser importados diretamente de `@chakra-ui/react`.
  - Refatorados 9 componentes para usar exclusivamente primitivos do Chakra UI v3 (`Box`, `Flex`, `Grid`, `Stack`, `Text`, `Badge`, `Button`, `Table`, `Modal`, `Spinner`, `Icon` etc.).
  - Comentários obsoletos e código legado removidos via script `cli/remove-comments.sh` em 11 arquivos.
  - Build de produção (`npm run build`) executado com sucesso após todas as alterações (exit code 0).
- **Arquivos**:
  - `web/main.tsx`
  - `web/theme.ts` *(novo — tokens e sistema de tema)*
  - `web/shared/ui/layout.tsx` *(esvaziado)*
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/dashboard/components/CardsResumo.tsx`
  - `web/features/dashboard/components/GraficosDashboard.tsx`
  - `web/features/dashboard/components/TabelaCategorias.tsx`
  - `web/features/dashboard/components/PainelSync.tsx`
  - `web/features/dashboard/components/FilaErros.tsx`
  - `web/features/dashboard/components/ModalEditarCategoria.tsx`
  - `web/features/upload-manual/components/FilaTriagemUpload.tsx`

---

### ✅ Melhoria 8 — Visualização de Vídeo, Streaming com Range Headers, Prévia de Thumbnails e Download Direto

- **Status**: Concluído
- **Data**: 03 de outubro de 2026
- **Problema**: 
  - Cards de mídia mostravam "Sem prévia" porque a extração do `yt-dlp` não gravava a URL da thumbnail no metadados do item.
  - Não havia endpoint para streaming do arquivo de vídeo salvo no backend, impedindo reprodução direta no navegador.
  - Não existia modal para visualização e reprodução de vídeos, nem opção rápida para download direto do arquivo MP4 salvo.
  - Os arquivos eram armazenados em `/tmp` em vez de um diretório persistente configurável.
- **Solução**:
  - Atualizado `BaixarVideoDownloadService` para capturar a URL da melhor thumbnail extraída pelo `yt-dlp` e salvar vídeos em `var/storage/downloads` persistente.
  - Implementados os endpoints `GET /api/v1/media-itens/{uuid}/stream` e `GET /api/v1/media-itens/{uuid}/download` com suporte a `BinaryFileResponse`, `Accept-Ranges: bytes` (HTTP 206 para seek de vídeo) e autenticação JWT via query parameter (`token=...`).
  - Desenvolvido o componente `ModalVisualizarMidia.tsx` com player HTML5 responsivo, metadados detalhados (duração, tamanho formatado, uploader), botão para baixar arquivo MP4 e link para a postagem original.
  - Adicionado botão de Play com efeito hover nos cards de vídeo (`CardVideo.tsx`) e botão de download direto nos cards e modal.
  - Integrado o modal no `DownloadsVideo.tsx`.
- **Arquivos**:
  - `src/Service/Video/BaixarVideoDownloadService.php`
  - `src/Controller/MediaItem/MediaItemController.php`
  - `config/services.yaml`
  - `config/packages/lexik_jwt_authentication.yaml`
  - `web/features/downloads-video/api.ts`
  - `web/features/downloads-video/components/ModalVisualizarMidia.tsx` *(novo)*
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/downloads-video/components/GridVideos.tsx`
  - `web/features/downloads-video/DownloadsVideo.tsx`

---

### ✅ Melhoria 9 — Correção do Componente Toaster e Layout de Notificações Chakra UI v3

- **Status**: Concluído
- **Data**: 03 de outubro de 2026
- **Problema**:
  - As notificações Toast apareciam comprimidas lateralmente em formato de coluna fina vertical, com quebra de palavras letra por letra e visual verde opaco desalinhado.
  - A estrutura do `Toast.Root` não continha dimensões mínimas/máximas responsivas nem flexbox horizontal adequado para ícones, título, descrição e botão de fechar.
  - Havia mistura residual de tags HTML em layouts e componentes auxiliares.
- **Solução**:
  - Refatorado completamente `web/shared/components/ui/toaster.tsx` com base nas primitivas nativas do Chakra UI v3 (`Toast.Root`, `Toast.Title`, `Toast.Description`, `Toast.CloseTrigger`).
  - Definida largura responsiva fixa (`w={{ base: 'calc(100vw - 32px)', sm: '380px' }}`, `minW="300px"` e `maxW="420px"`), padding adequado (`p={3.5}`) e visual glassmorphism refinado (`bg="bg.panel"`, `shadow="2xl"`, `borderColor="border.subtle"`).
  - Implementado `renderizarIconeToast` com ícones Lucide para cada status (`success`, `error`, `warning`, `info`, `loading`).
  - Padronizada a API `addToast` com mapeamento unificado de tipos e compatibilidade retroativa para hooks e componentes.
- **Arquivos**:
  - `web/shared/components/ui/toaster.tsx`

