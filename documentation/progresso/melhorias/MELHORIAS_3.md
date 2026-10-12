# Melhorias e Correções (M41–M60)

> Detalhamento das melhorias M41 a M60 do cirqueiraX.
> Retorne ao [índice central](MELHORIAS.md) para visão geral de todas as melhorias.

---

### ✅ Melhoria 41 — Redesign Completo da Central de Upload Manual & Triagem com Layout Amplo, Prévia em Grade/Tabela e Ingestão via Clipboard

- **Status**: Concluído
- **Data**: 11 de outubro de 2026
- **Problema**:
  - A tela de Upload Manual & Triagem (`UploadManual.tsx`) encontrava-se visualmente defasada e restrita a um container estreito (`maxW="6xl"`), com um badge estático `Feature 4`, ausência de métricas dinâmicas, dropzone simplória com `<select>` nativo e estilização inline, e uma grade de triagem básica sem suporte a alternador de visualização (grade/tabela), sem filtros por tipo/categoria e sem modal de prévia ampliada para imagens e vídeos locais.
- **Solução**:
  - **Layout Imersivo e Cabeçalho Moderno (`UploadManual.tsx`)**:
    - Expandido o layout para container amplo `maxW="1680px"` no padrão das telas de Downloads de Vídeo e Prints.
    - Implementado cabeçalho rico com título estilizado, botão de retorno suave, pílula de monitoramento do pipeline (`Pipeline de Upload • Multi-arquivo Ativo`), botão de atualização com rotação contínua e badges de métricas dinâmicas da triagem (`total`, `sem categoria`, `classificadas`, `erros`).
    - Adicionado suporte a **Ctrl+V global** com captura automática de arquivos de imagem e prints copiados na área de transferência diretamente para a fila de upload com feedback via toast.
  - **Dropzone de Alta Estética e Fila Prévia (`DropzoneUpload.tsx`)**:
    - Redesenhada a caixa de dropzone com borda tracejada de 2px, cantos arredondados `2xl`, hover suave e feedback visual reativo a drag-over com a cor da marca `cirqueira.brand`.
    - Adicionadas pílulas com badges visuais dos formatos suportados (Imagens: PNG, JPG, WEBP, GIF; Vídeos: MP4, MKV, WEBM, MOV) e indicação do atalho Ctrl+V.
    - Seletor de categoria pré-definida modernizado com `NativeSelect` oficial do Chakra UI v3 e ícone de pasta (`FolderPlus`), eliminando tags HTML brutas e inline styles.
    - Painel da fila de upload com prévia instantânea em miniatura gerada por `URL.createObjectURL`, barras de progresso animadas durante o envio, seletor de categoria individual e ações rápidas.
  - **Toolbar de Triagem Avançada com Alternador Grade / Tabela (`FilaTriagemUpload.tsx`)**:
    - Abas de status estilizadas (`Todas`, `Sem Categoria`, `Classificadas`, `Com Erro`).
    - Filtro por categoria (dropdown integrado ao banco de dados).
    - Filtro por tipo de mídia (`Todos os Tipos`, `Apenas Fotos`, `Apenas Vídeos`).
    - Campo de busca com ícone e botão de limpeza instantânea (`X`).
    - Alternador de visualização permitindo alternar entre **Grade de Cards** e **Tabela Compacta**.
  - **Cards Cinematográficos 16:9 da Triagem (`CardItemTriagem.tsx`)**:
    - Proporção 16:9 com miniatura em alta resolução e zoom suave no hover.
    - Checkbox para seleção no canto superior esquerdo e badges de tipo/duplicado no canto superior direito.
    - Botão central de visualização/zoom com efeito glassmorphism translúcido ao passar o mouse.
    - Seletor de categoria inline para classificação rápida com 1 clique.
    - Rodapé com data formatada no padrão brasileiro (`formatarDataMidia`), tamanho em MB/KB e ações de forçar Google Fotos, retentar falhas ou apagar.
  - **Tabela Compacta de Triagem (`TabelaTriagemUpload.tsx`)**:
    - Modo lista com miniatura redonda/quadrada clicável, nome da mídia com hash curto, tipo, tamanho, seletor de categoria inline e ações rápidas.
  - **Modal de Prévia Ampliada (`ModalVisualizarMidiaManual.tsx`)**:
    - Modal amplo com visualização em tamanho real de imagens e player HTML5 com controles nativos para vídeos, metadados detalhados, download direto e atalho para reatribuir categoria.
  - **Conformidade Estrita com o Design System**:
    - Varredura e eliminação completa de cores hexadecimais, `rgba(...)` avulsos e referências cruas a variáveis CSS, utilizando 100% tokens de `web/config/theme/theme.ts`.
- **Arquivos**:
  - `web/features/upload-manual/UploadManual.tsx`
  - `web/features/upload-manual/components/DropzoneUpload.tsx`
  - `web/features/upload-manual/components/FilaTriagemUpload.tsx`
  - `web/features/upload-manual/components/CardItemTriagem.tsx`
  - `web/features/upload-manual/components/TabelaTriagemUpload.tsx`
  - `web/features/upload-manual/components/ModalVisualizarMidiaManual.tsx`

---

### ✅ Melhoria 42 — Atalhos Ágeis de Categorização em Lote (Fila e Triagem), Detecção Inteligente de Capturas e Garantia Estrita Anti-Duplicação

- **Status**: Concluído
- **Data**: 11 de outubro de 2026
- **Problema**:
  - Ao fazer upload manual de dezenas de imagens (ex.: 50 capturas de tela), classificar item a item era um processo demorado e repetitivo.
  - Existia o risco de duplicar mídias que o sistema já havia coletado previamente por outros canais (agente de prints em Python, Syncthing ou uploads anteriores), sobrecarregando o banco de dados, o armazenamento e a cota do Google Fotos.
  - A fila de upload e a triagem não possuíam atalhos de teclado nem botões de 1 clique para classificar mídias sem categoria em massa.
- **Solução**:
  - **Garantia Estrita Anti-Duplicação no Backend (`UploadManualService.php`)**:
    - Verificação rigorosa pré-ingestão através de SHA-256 (`hash`), MD5 e hash visual (`buscarDuplicado`).
    - Ao detectar que a imagem já foi coletada anteriormente, o arquivo temporário em `/tmp` é sumariamente excluído para poupar disco.
    - Nenhum novo registro é persistido no banco de dados e **nenhuma mensagem para o Google Fotos é despachada**.
    - Se o usuário selecionou uma categoria no upload manual, o registro existente tem sua categoria atualizada (`$existente->setCategoriaId(...)`).
    - Retorno com flag explícita `duplicado: true` e status `_warning: item_duplicado_existente`.
  - **Atalhos de Categorização Rápida na Fila de Upload (`DropzoneUpload.tsx` & `useUploadManual.ts`)**:
    - Botões tipo pílula de 1 clique para aplicar qualquer categoria a todos os itens da fila ou apenas aos selecionados.
    - Detecção inteligente de capturas de tela: identifica arquivos com padrão de nome "Captura de tela", "screenshot" ou "print" e exibe botão contextual para definir todas com 1 clique (ex.: `Definir todas como Print Empresa`).
    - Checkboxes individuais na fila com alternador "Selecionar todos / Desmarcar todos".
    - Envio em lote com notificação consolidada transparente: informa a quantidade exata de mídias novas enviadas e quantas mídias já existiam e foram preservadas sem duplicar.
  - **Atalhos Ágeis na Triagem de Mídias Recebidas (`UploadManual.tsx` & `FilaTriagemUpload.tsx`)**:
    - Painel contextual no topo da triagem quando houver mídias sem categoria (`semCategoriaCount > 0`): botões de 1 clique para atribuir todas as mídias pendentes de uma só vez para qualquer categoria cadastrada.
    - Atalho de teclado `Ctrl + A` (ou `Cmd + A`) para selecionar todas as mídias filtradas da triagem.
    - Atalhos de teclado numéricos `1` a `9`: ao selecionar mídias, pressionar a tecla numérica atribui imediatamente a categoria correspondente sem abrir modais.
    - Barra flutuante de ações em lote com botões rápidos das categorias e badges indicativas do atalho do teclado (`[1]`, `[2]`).
  - **Resolução do Erro 413 (Request Entity Too Large) e Elevação dos Limites de Upload para 500MB**:
    - O Nginx (`cirqueirax_nginx`) possuía a diretiva padrão de 1MB (`client_max_body_size 1M`), bloqueando imagens e vídeos com tamanho superior (ex.: prints em PNG de 1.3MB, 2.5MB, 4.2MB).
    - Configurado `client_max_body_size 500M;` em `devops/nginx/dev.conf`, `devops/nginx/prod.conf` e `devops/php/nginx-internal.conf`, com timeouts e buffers ampliados (`fastcgi_read_timeout 300s`, `fastcgi_buffers 16 16k`).
    - Elevados os limites do PHP-FPM (`devops/php/php.dev.ini` e `php.prod.ini`) para `upload_max_filesize = 500M`, `post_max_size = 500M`, `max_execution_time = 300` e volume mapeado no `docker-compose.yaml`.
    - Atualizado o validador `UploadManualDTO.php` com `maxSize: '500M'`.
    - Adicionado tratamento humanizado no frontend para mensagens de erro HTTP 413 e botão `Retentar Falhas ({errosCount})` na barra de controle da fila para reenviar falhas com 1 clique.
  - **Conformidade de Design**:
    - Utilização rigorosa dos tokens do sistema de design `cirqueira.*` de `web/config/theme/theme.ts`, com zero cores hexadecimais ou RGBA soltos.
- **Arquivos**:
  - `devops/nginx/dev.conf`
  - `devops/nginx/prod.conf`
  - `devops/php/nginx-internal.conf`
  - `devops/php/php.dev.ini`
  - `devops/php/php.prod.ini`
  - `devops/docker-compose.yaml`
  - `src/DataObject/UploadManualDTO.php`
  - `src/Service/MediaItem/UploadManualService.php`
  - `web/features/upload-manual/UploadManual.tsx`
  - `web/features/upload-manual/hooks/useUploadManual.ts`
  - `web/features/upload-manual/components/DropzoneUpload.tsx`
  - `web/features/upload-manual/components/FilaTriagemUpload.tsx`


