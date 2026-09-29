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
