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
