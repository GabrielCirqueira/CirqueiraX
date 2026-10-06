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
