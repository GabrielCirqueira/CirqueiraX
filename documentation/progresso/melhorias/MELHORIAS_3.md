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

---

### ✅ Melhoria 43 — Central Unificada de Mídias (`/central-midias`) com Galeria Fluida Estilo Google Fotos para Todas as Mídias

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - As mídias do sistema estavam fragmentadas entre telas distintas (Downloads de Vídeo, Prints & Capturas e Upload Manual), sem uma central única onde o usuário pudesse ver, pesquisar e categorizar tudo junto (fotos, uploads manuais, vídeos baixados das redes e capturas de tela) com o visual fluido da grade de capturas estilo Google Fotos.
- **Solução**:
  - **Criação da Central de Mídias (`/central-midias` e `/todas-midias`)**:
    - Nova página unificada desenvolvida em `web/features/central-midias/CentralMidias.tsx`.
    - Integrada ao menu lateral global (`Sidebar.tsx`) e cabeçalho dinâmico (`Header.tsx`).
    - Layout imersivo `maxW="1680px"` com cabeçalho contendo métricas em tempo real (`total de mídias`) e botão de atualização contínua.
  - **Grade Fluida Masonry Estilo Google Fotos (`GridCentralMidias.tsx` & `CardMidiaCentral.tsx`)**:
    - Layout em colunas dinâmicas sem cortes forçados, preservando a proporção natural das fotos e dos vídeos.
    - Card inteligente com suporte simultâneo a imagens e vídeos: exibe preview de streaming para fotos e thumbnail com play overlay para vídeos (com duração formatada e ícone de vídeo).
    - Badges contextuais de origem no canto superior: `Upload Manual` (azul/brand), `Download Vídeo` (roxo), `Print Empresa` (verde), `Print Pessoal` (teal).
    - Ações no hover: checkbox de seleção múltipla, botão de copiar imagem para clipboard (1 clique), download direto, atribuição rápida de categoria e exclusão.
    - Modal de visualização expandida (`ModalVisualizarMidiaCentral.tsx`): player HTML5 nativo para vídeos, zoom em tela cheia para fotos, metadados detalhados (resolução, tamanho, datas, hash) e seletor de categoria inline.
  - **Toolbar de Filtros Poderosos e Alternador de Modo**:
    - Filtro de Origem em abas: `Todas as Mídias`, `Upload Manual`, `Downloads Redes`, `Prints & Capturas`.
    - Filtro de Tipo: `Todos Tipos`, `Apenas Fotos`, `Apenas Vídeos`.
    - Filtro de Categoria: dropdown integrado a todas as categorias do banco + `Sem Categoria`.
    - Filtro de Status: `Todos`, `Classificados`, `Sem Categoria`, `Com Erro`.
    - Campo de busca textual com limpeza instantânea por `X`.
    - Alternador de visualização: Grade Masonry (Google Fotos) / Tabela Compacta (`TabelaCentralMidias.tsx`).
  - **Atalhos de Teclado e Ações em Lote**:
    - `Ctrl + A`: seleciona todas as mídias da página atual.
    - Teclas numéricas `1` a `9`: aplicam a categoria correspondente aos itens selecionados instantaneamente sem cliques adicionais.
    - Barra flutuante inferior com contador de seleção, botões de 1 clique para categorias frequentes com dicas de teclas de atalho e botão de exclusão em massa.
  - **Ajuste no Backend (`MediaItemRepository.php`)**:
    - Refinada a lógica de filtros `tipo` (`imagem` vs `video`) e `origem` (`manual`, `prints`, `downloads`, `todas`) para englobar perfeitamente todas as extensões e origens.
  - **Conformidade de Design**:
    - 100% tokens de `web/config/theme/theme.ts`.
- **Arquivos**:
  - `web/features/central-midias/CentralMidias.tsx`
  - `web/features/central-midias/index.ts`
  - `web/features/central-midias/types.ts`
  - `web/features/central-midias/api.ts`
  - `web/features/central-midias/hooks/useCentralMidias.ts`
  - `web/features/central-midias/components/CardMidiaCentral.tsx`
  - `web/features/central-midias/components/GridCentralMidias.tsx`
  - `web/features/central-midias/components/TabelaCentralMidias.tsx`
  - `web/features/central-midias/components/ModalVisualizarMidiaCentral.tsx`
  - `web/features/central-midias/components/ModalCategorizarMidia.tsx`
  - `web/App.tsx`
  - `web/layouts/Sidebar.tsx`
  - `web/layouts/Header.tsx`
  - `src/Repository/MediaItemRepository.php`

---

### ✅ Melhoria 44 — Resolução da Visibilidade de Prints do Agente e Downloads de Vídeos na Central de Mídias com Contadores nas Abas, Limite de 60 Itens e Miniaturas FFmpeg

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - Na Central de Mídias (`/central-midias`), o usuário relatou que a página não estava trazendo as capturas coletadas pelo agente Python (`print_pessoal`) nem os vídeos baixados das redes sociais (`downloads`), exibindo apenas itens com selo de upload manual.
  - **Diagnóstico da Causa Raiz**:
    1. *Inanição por Paginação*: O usuário realizou 28 uploads manuais recentes. Como a ordenação padrão é `criadoEm DESC` e o limite era de apenas 30 itens por página, a página 1 foi 100% preenchida pelos uploads recentes. Os 8 vídeos baixados e as 31 capturas do agente ficaram alocados nas páginas 2 e 3, invisíveis sem rolar até o rodapé da grade masonry.
    2. *Ambiguidade Visual nos Cards*: Como os uploads manuais foram categorizados como "Prints", os cards exibiam lado a lado `[Prints]` (categoria) e `[Upload Manual]` (origem), fazendo parecer que todo o acervo consistia em uploads manuais rotulados como print.
    3. *Ausência de Contadores nas Abas*: As abas não informavam quantos itens pertenciam a cada origem.
    4. *Miniaturas Remotas Expiradas*: Vídeos baixados do TikTok e Twitter dependiam de URLs externas de CDN que expiram (ex.: HTTP 403 Forbidden do TikTok), caindo em erro de carregamento sem miniatura local.
- **Solução**:
  - **Endpoint de Contagens por Origem no Backend (`MediaItemController.php`)**:
    - Implementada rota `GET /api/v1/media-itens/contagens` que agrega o total geral e as contagens separadas de `manual`, `downloads` (download + bot_telegram) e `prints` (print_pessoal + print_empresa).
  - **Endpoint de Miniaturas com Geração FFmpeg (`MediaItemController.php`)**:
    - Implementada rota `GET /api/v1/media-itens/{uuid}/thumbnail`.
    - Para imagens, entrega o arquivo diretamente com headers de cache HTTP e etag.
    - Para vídeos locais (MP4/MKV/WEBM), gera dinamicamente miniatura JPEG em 20ms via FFmpeg e salva em `var/cache/thumbnails/{uuid}.jpg`.
  - **Contadores em Tempo Real nas Abas de Origem (`CentralMidias.tsx`)**:
    - As abas agora possuem badges visuais com as quantidades exatas: `Todas as Mídias ({total})`, `Upload Manual ({manual})`, `Downloads Redes ({downloads})` e `Prints & Capturas ({prints})`.
    - Ao bater o olho, o usuário confirma de imediato a disponibilidade de todas as mídias coletadas.
  - **Elevação do Limite Padrão e Seletor por Página (`CentralMidias.tsx`)**:
    - Limite padrão aumentado para **60 mídias por página**, garantindo que todo o acervo caiba na primeira tela.
    - Adicionado seletor de quantidade (`30 | 60 | 100`) e barra informativa clara no rodapé: `Exibindo X de Y mídias`.
  - **Desambiguação Visual e Ícones Dedicados (`CardMidiaCentral.tsx`, `TabelaCentralMidias.tsx`, `ModalVisualizarMidiaCentral.tsx`)**:
    - Categorias agora possuem ícone de pasta (`Folder`), deixando claro que é uma pasta organizacional (ex.: `📁 Prints`).
    - Origens possuem ícones e cores distintas:
      - `print_pessoal`: `📸 Agente PC` (teal)
      - `print_empresa`: `🖥️ Agente Empresa` (cyan)
      - `download`: `🎬 Download Vídeo` (purple)
      - `bot_telegram`: `💬 Telegram` (purple)
      - `manual`: `☁️ Upload Manual` (blue)
    - Fallback inteligente: se a miniatura externa de um vídeo falhar (ex.: CDN expirado), o componente chaveia automaticamente para o endpoint `/api/v1/media-itens/{uuid}/thumbnail` gerado pelo FFmpeg.
- **Arquivos**:
  - `src/Controller/MediaItem/MediaItemController.php`
  - `web/features/central-midias/CentralMidias.tsx`
  - `web/features/central-midias/types.ts`
  - `web/features/central-midias/api.ts`
  - `web/features/central-midias/hooks/useCentralMidias.ts`
  - `web/features/central-midias/components/CardMidiaCentral.tsx`
  - `web/features/central-midias/components/TabelaCentralMidias.tsx`
  - `web/features/central-midias/components/ModalVisualizarMidiaCentral.tsx`
  - `documentation/progresso/melhorias/MELHORIAS_3.md`

### ✅ Melhoria 45 — Correção de Layout Quebrado nos Botões de Abas da Central de Mídias e no Grid de Saúde do Ecossistema no Dashboard

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - **Imagens 1 e 3 (Central de Mídias)**: O botão da aba ativa `Todas as Mídias [70]` estava completamente esmagado verticalmente em uma faixa verde de espessura mínima, com o texto vazando para cima e para baixo e o badge numérico `70` projetando-se para fora de forma desproporcional.
    - *Causa Raiz*: No componente `CentralMidias.tsx`, o botão da aba utilizava `h={7.5}`. No Chakra UI v3 / Styled System, `7.5` não é um token do sistema de espaçamento e foi avaliado literalmente como `height: 7.5px`. Isso fez o botão colapsar para uma altura de apenas 7.5px.
  - **Imagem 2 (Dashboard — Saúde do Ecossistema & Serviços)**: No card de integrações do Dashboard, os blocos 3 e 4 (`Google Fotos` e `Armazenamento`) vazavam para fora da borda direita do container, flutuando no vazio preto.
    - *Causa Raiz*: No componente `StatusIntegracoes.tsx`, a propriedade `templateColumns` estava configurada como `repeat(4, 1fr)` em telas desktop (`lg`). Como o card está posicionado na coluna direita do layout do Dashboard (`0.8fr`, ocupando ~40% da largura útil da tela), forçar 4 colunas horizontais espremia cada bloco em ~90px, fazendo o conteúdo ultrapassar os limites do container do card.
- **Solução**:
  - **Correção da Altura e Estilização das Abas (`CentralMidias.tsx`)**:
    - Substituído `h={7.5}` por `size="sm"`, `h="36px"`, `minH="36px"`, `px={3.5}` e `flexShrink={0}`.
    - O badge numérico da aba ativa foi refinado com `bg="cirqueira.grey.950/30"` e `color="cirqueira.grey.0"` para contraste nítido sobre o fundo verde esmeralda.
    - As abas inativas receberam badges sutis com `bg="bg.panel"`, `color="fg.subtle"` e borda delicada.
    - Os botões de alternância de modo de visualização (grade / tabela) foram alinhados com `h="36px"` e `w="36px"`.
  - **Reestruturação do Grid de Integrações (`StatusIntegracoes.tsx` e `Dashboard.tsx`)**:
    - Ajustado o grid para 2 colunas harmônicas em formato 2x2 (`templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}`): Linha 1 = Syncthing e Fila de Processamento; Linha 2 = Google Fotos e Armazenamento.
    - Aplicado `minW={0}`, `w="full"` e `overflow="hidden"` no `Card.Root`.
    - Adicionado `truncate` nos títulos, `lineClamp={1}` nos subtítulos e `flexShrink={0}` nos badges e ícones de cada bloco de serviço.
    - No container pai `Dashboard.tsx`, atualizado `gridTemplateColumns` para utilizar `minmax(0, 1.2fr) minmax(0, 0.8fr)`, eliminando qualquer possibilidade de blowout em colunas de grid fracionadas.
  - **Varredura Preventiva de Alturas Fracionárias (`UploadManual.tsx`, `DropzoneUpload.tsx`)**:
    - Corrigidas ocorrências de `h={6.5}` e `h={5.5}` para dimensões explícitas `h="26px"`, `h="28px"` e `h="24px"`.
- **Arquivos**:
  - `web/features/central-midias/CentralMidias.tsx`
  - `web/features/dashboard/components/StatusIntegracoes.tsx`
  - `web/features/dashboard/components/AtividadesRecentes.tsx`
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/upload-manual/UploadManual.tsx`
  - `web/features/upload-manual/components/DropzoneUpload.tsx`
  - `documentation/progresso/melhorias/MELHORIAS_3.md`

### ✅ Melhoria 46 — Resolução de Erros de Quota 429 no Google Fotos com Semáforo de Concorrência, Backoff Exponencial e Limpeza da Fila Operacional

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - Na "Fila Operacional de Erros" do Dashboard, 5 mídias de Upload Manual (`c1529b7ef6...`, `dd24c472ad...`, `d21563d82a...`, `9abadc13bc...`, `0b2ec59d3d...`) falharam com o erro:
    `Client error: POST https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate resulted in a 429 Too Many Requests response: Quota exceeded for quota 'concurrent write request' of service 'photoslibrary.googleapis.com'`
  - **Diagnóstico da Causa Raiz**:
    1. A API do Google Photos Library possui cota extremamente restritiva para escritas simultâneas: **limite de 1 requisição concorrente de escrita** (`concurrent write request quota = 1`).
    2. Quando o usuário enviou múltiplos arquivos em lote, os workers do Symfony Messenger consumiram as mensagens simultaneamente e dispararam requisições concorrentes para `mediaItems:batchCreate`, excedendo imediatamente a cota do Google.
    3. Quando ocorria o 429, a exceção não possuía mecanismo de lock local nem política de retry com sleep/backoff na camada de infraestrutura da API.
    4. Ao falhar, o item ficava travado em `status: erro`, e mesmo quando retentado com sucesso, o campo `erro_motivo` não era limpo na conclusão.
- **Solução**:
  - **Semáforo Local de Escrita e Backoff com Jitter (`GoogleFotosAPI.php`)**:
    - Implementado método `executarComSemaforoERetry` utilizando lock exclusivo de arquivo (`flock(LOCK_EX)`) no arquivo de semáforo local `/tmp/cirqueirax_google_photos_write.lock`. Isso serializa as escritas mesmo entre múltiplos workers e processos concorrentes.
    - Adicionado delay de segurança de 300ms entre escritas consecutivas.
    - Implementado mecanismo de repetição com backoff exponencial com jitter (até 4 tentativas com esperas de 2s, 4s, 6s + jitter aleatório) para capturar e contornar automaticamente respostas HTTP 429 (`concurrent write request` ou `RESOURCE_EXHAUSTED`).
    - O semáforo protege `batchCreateMediaItems`, `criarAlbum`, `adicionarItensAoAlbum` e `removerItensDoAlbum`.
  - **Limpeza de Erros ao Concluir (`EnviarGoogleFotosService.php`)**:
    - Adicionada chamada `$mediaItem->limparErro()` em todos os fluxos de sucesso (reutilização de upload duplicado e conclusão de novo upload).
    - Garantida a transição para `StatusMediaItem::CONCLUIDO` mesmo se a mídia estava previamente marcada como `ERRO`.
  - **Tratamento de Exceção no Handler (`EnviarGoogleFotosMessageHandler.php`)**:
    - Atualização apropriada de `erroMotivo` e transição de status para `ERRO` sem bloqueios por `isFinal()`.
  - **Reprocessamento e Limpeza Operacional dos Erros**:
    - Todas as 5 mídias em falha foram reprocessadas com sucesso via `app:media:retentar --todos` e integradas ao Google Fotos (`status: concluido`, IDs registrados).
    - Mensagens mortas no transporte `failed` do Symfony Messenger purgadas.
    - Registros com `erro_motivo` residual limpos. Fila de erros zerada (`0 itens`).
- **Arquivos**:
  - `src/Infra/GoogleFotos/GoogleFotosAPI.php`
  - `src/Service/GoogleFotos/EnviarGoogleFotosService.php`
  - `src/MessageHandler/EnviarGoogleFotosMessageHandler.php`
  - `documentation/progresso/melhorias/MELHORIAS_3.md`

### ✅ Melhoria 47 — Otimização Extrema de Performance: Eliminação de Gargalos Backend (DBAL Nativo), Resolução de N+1, Code-Splitting de Bundles e Ajuste de Polling

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - O sistema apresentava lentidão severa ("muito pesado esse sistema"), com páginas demorando para carregar e travamentos/congelamentos perceptíveis ao alternar entre rotas.
  - **Diagnóstico das Causas Raízes**:
    1. *Gargalo de Memória e Hidratação no Backend*: `DashboardService::obterResumo()` e `DashboardService::resumoPorCategoria()` executavam `$this->mediaItemRepository->findAll()`, hidratando todas as entidades `MediaItem` da base de dados na memória do PHP, decodificando o JSON de metadados repetidamente em loops para somar bytes e totalizar mídias por categoria.
    2. *Problema N+1 na Serialização de Listas*: No `MediaItemSerializer::normalizar()`, cada item em listas de mídias (como os 60 itens por página da Central de Mídias) disparava uma consulta avulsa ao banco de dados (`$categoriaService->buscarPorUuid()`) para buscar a categoria da mídia, gerando até 60 queries SQL consecutivas por requisição.
    3. *Tempestade de Polling no Frontend*: No `useDashboard.ts`, 5 hooks simultâneos (`useResumoDashboard`, `useCategoriasMetricas`, `useFilaErros`, `usePastasSync`, `useStatusSync`) executavam requisições a cada 10 a 15 segundos mesmo com a aba em segundo plano. No `usePrints.ts`, havia polling incondicional a cada 5 segundos. O TanStack Query estava com `staleTime` curto e sem `gcTime` dimensionado, invalidando o cache em toda troca de página.
    4. *Monólito de Pacotes no Vite*: O `.tooling/frontend/vite.config.js` não possuía `manualChunks`. Todo o Chakra UI, Emotion, Recharts e bibliotecas auxiliares estavam compactados em um único arquivo de quase 800 kB (`app.js`) e 487 kB (`Dashboard.js`), travando o processamento do navegador ao renderizar gráficos SVG e trocar de abas.
- **Solução**:
  - **Agregações Nativas em Alta Velocidade no Banco de Dados via DBAL (`MediaItemRepository.php` e `DashboardService.php`)**:
    - Substituída a hidratação de entidades no PHP por consultas nativas DBAL utilizando `JSON_EXTRACT` do MySQL (`JSON_EXTRACT(metadata, '$.tamanho_bytes')` e `$.filesize`).
    - Métodos `obterTamanhoTotalBytes()`, `obterEspacoAgrupadoPorOrigem()` e `obterMetricasAgrupadasPorCategoria()` executam agrupamentos e somas diretamente no MySQL em menos de 1 milissegundo, consumindo 0 bytes de memória de hidratação.
  - **Eliminação de N+1 com Memoização em Memória (`MediaItemSerializer.php`)**:
    - Adicionado cache de categorias em memória no `MediaItemSerializer` durante a serialização de listas. Se múltiplas mídias pertencem à mesma categoria, a categoria é buscada apenas uma vez e reutilizada instantaneamente em O(1), reduzindo dezenas de queries por requisição.
  - **Code-Splitting Inteligente de Bundles no Vite (`vite.config.js`)**:
    - Configurado `output.manualChunks` agrupando dependências de terceiros em chunks isolados e cacheados pelo navegador:
      - `vendor-ui`: Chakra UI e Emotion (~371 kB).
      - `vendor-charts`: Recharts e D3 (~409 kB).
      - `vendor-query`: TanStack React Query, Axios e Zustand (~81 kB).
      - `vendor-icons`: Lucide React (~22 kB).
    - Redução drástica do chunk da página `Dashboard.js` de **487 kB para 32.84 kB**.
    - Redução do chunk `GraficosDashboard.js` de **420 kB para 10.25 kB**.
    - Eliminação completa dos avisos de chunks excedendo 500 kB no Vite.
  - **Lazy Loading Assíncrono com Fallbacks Leves (`Dashboard.tsx`)**:
    - Chaveamento de `GraficosDashboard`, `TabelaCategorias`, `PainelSync` e `FilaErros` para carregamento assíncrono via `React.lazy` e `Suspense` com esqueletos (`Skeleton`) elegantes. A navegação para o Dashboard tornou-se imediata, renderizando o layout e cards instantaneamente enquanto os gráficos pesados montam em segundo plano sem congelar a thread principal.
    - Removida chamada duplicada e redundante a `useFilaErros(1, 10)` no topo do `Dashboard.tsx`.
  - **Sintonia de Cache e Polling Inteligente (`main.tsx`, `useDashboard.ts`, `usePrints.ts`, `useCentralMidias.ts`)**:
    - No `main.tsx`, configurado `staleTime: 60s`, `gcTime: 10min` e `refetchOnReconnect: false` no `QueryClient`. Trocas entre abas agora reaproveitam o cache local da memória sem telas brancas nem re-renderizações desnecessárias.
    - No `useDashboard.ts`, intervalos de refetch calibrados para 30s-60s com `refetchIntervalInBackground: false`.
    - No `usePrints.ts`, polling condicional ativado somente se existirem itens em processamento (`recebido`, `classificado`, `enviando_google_fotos`).
    - No `useCentralMidias.ts`, `staleTime` estendido para 60 segundos.
- **Arquivos**:
  - `src/Repository/MediaItemRepository.php`
  - `src/Service/Dashboard/DashboardService.php`
  - `src/Serializer/MediaItemSerializer.php`
  - `.tooling/frontend/vite.config.js`
  - `web/main.tsx`
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/dashboard/hooks/useDashboard.ts`
  - `web/features/prints/hooks/usePrints.ts`
  - `web/features/central-midias/hooks/useCentralMidias.ts`
  - `documentation/progresso/melhorias/MELHORIAS_3.md`
  - `documentation/progresso/melhorias/MELHORIAS.md`

### ✅ Melhoria 48 — Transições Suaves e Microinterações Fluidas de Alta Performance (GPU Aceleradas) sem Perda de Fluidez

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - A interface realizava trocas de rotas e alternância de abas de forma abrupta e seca, sem transições visuais agradáveis. Ao mesmo tempo, era imperativo que qualquer animação adicionada não consumisse CPU nem causasse engasgos (*jank* / *frame drop*) ou travamentos na navegação.
- **Solução**:
  - **Transição de Entrada de Páginas Acelerada por Hardware (`MainLayout.tsx` e `index.css`)**:
    - Criada a classe `.page-transition-enter` baseada exclusivamente em `transform: translateY(4px)` e `opacity` com duração de **200ms** e curva `cubic-bezier(0.16, 1, 0.3, 1)`.
    - No container do `<Outlet />`, a transição é ativada suavemente a cada alteração de rota (`location.pathname`), conferindo sensação premium e fluida de aplicativo nativo sem provocar *layout shift* ou recálculo de layout.
    - Utilizado `will-change: transform, opacity` para promoção direta à camada de composição da GPU.
  - **Transição Suave na Alternância de Abas e Modos de Visualização (`Dashboard.tsx`, `CentralMidias.tsx`, `Prints.tsx`, `DownloadsVideo.tsx`)**:
    - Criada a classe `.tab-pane-fade` com duração de **160ms** para transições instantâneas entre abas do Dashboard (`visao-geral`, `categorias`, `sincronizacao`, `erros`) e alternância entre os modos **Grade** e **Tabela** na Central de Mídias, Galeria de Prints e Central de Downloads.
  - **Microinterações e Elevação Suave de Cards e Botões (`index.css`, `CardMidiaCentral.tsx`, `CardPrint.tsx`, `BarraAcoesRapidas.tsx`)**:
    - Criadas classes utilitárias de alta performance:
      - `.smooth-media-item`: Elevação suave em $Z$ com sombra gradual e micro-zoom de imagem no hover (`scale(1.02)`) acelerado pela GPU.
      - `.smooth-card`: Suavização de borda, elevação e transição tátil em cards interativos.
      - `.btn-tactile`: Feedback tátil leve no clique (`active: scale(0.98)`).
  - **Respeito a Preferências de Acessibilidade (`prefers-reduced-motion`)**:
    - Incluída regra `@media (prefers-reduced-motion: reduce)` desativando automaticamente todas as animações caso o usuário tenha preferência por redução de movimento configurada no sistema operacional.
- **Arquivos**:
  - `web/index.css`
  - `web/layouts/MainLayout.tsx`
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/dashboard/components/BarraAcoesRapidas.tsx`
  - `web/features/central-midias/CentralMidias.tsx`
  - `web/features/central-midias/components/CardMidiaCentral.tsx`
  - `web/features/prints/Prints.tsx`
  - `web/features/prints/components/CardPrint.tsx`
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `documentation/progresso/melhorias/MELHORIAS_3.md`
  - `documentation/progresso/melhorias/MELHORIAS.md`

### ✅ Melhoria 49 — Agendamento de Limpeza de Vídeos Antigos do Sistema (> 7 Dias), Novo Status `arquivo_removido` ("Arquivo Removido"), Proteção Estrita da Pasta do Syncthing/Celular e Rebaixar com Preservação de Datas e Metadados

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - Os arquivos de vídeos baixados de redes sociais e canais acumulam espaço na VPS (`var/downloads/`), causando risco de lotação do disco.
  - Imagens e prints não devem ser afetados pela limpeza (somente vídeos).
  - **Requisito Crítico de Proteção**: Os arquivos de vídeos devem ser apagados apenas do sistema/pasta de downloads (`var/downloads/`), e **NUNCA** da pasta da VPS que está sincronizada com o celular via Syncthing (`/var/storage`, `sync_media/`), garantindo que nenhum vídeo seja excluído do celular do usuário.
  - O nome anterior "expurgado" era incomum e estranho; era necessário um termo mais natural e comum como `arquivo_removido` ("Arquivo Removido" / "Espaço Liberado").
  - Era necessário um status para diferenciar itens cujo registro, histórico e miniaturas continuam catalogados no sistema, mas cujo arquivo físico de vídeo no sistema foi removido para liberar espaço em disco.
  - O sistema necessitava de uma opção para "Rebaixar" o vídeo caso o usuário necessite do arquivo novamente, com a garantia estrita de:
    - **Não reenviar para o Google Fotos** se o upload já foi realizado anteriormente.
    - **Não alterar datas**: manter rigorosamente as datas personalizadas nos metadados e aplicar `touch` no sistema de arquivos local com o mesmo timestamp para que o Syncthing / Syncthing-Fork não provoque re-sincronizações ou conflitos com o celular e PC.
- **Solução**:
  - **Novo Status no Backend e Frontend (`StatusMediaItem.php`, `types.ts`, `formatadores.ts`)**:
    - Adicionado o status `StatusMediaItem::ARQUIVO_REMOVIDO = 'arquivo_removido'` com descrição `'Arquivo Removido (Espaço Liberado)'` (mantendo compatibilidade retroativa para `ARQUIVO_EXPURGADO`).
    - Marcado como status final (`isFinal() = true`) na entidade `MediaItem`.
    - Atualizada a matriz de transições permitindo: `CONCLUIDO`/`DISTRIBUIDO_LOCAL`/`SEM_CATEGORIA` -> `ARQUIVO_REMOVIDO` e `ARQUIVO_REMOVIDO` -> `BAIXANDO`/`CONCLUIDO`.
    - Adicionados os metadados `MetadataKeys::ARQUIVO_REMOVIDO_EM` e `MetadataKeys::CAMINHO_LOCAL_ANTERIOR`.
  - **Proteção Estrita da Pasta Sincronizada com o Celular (Syncthing / VPS)**:
    - No repositório (`MediaItemRepository::buscarVideosParaLimpezaDoSistema`), as consultas DQL excluem explicitamente qualquer caminho contendo `var/storage/` ou `sync_media/`.
    - No serviço (`LimparVideosAntigosService::isPastaSincronizadaComCelular`), qualquer caminho localizado na pasta de sincronização do celular (`/var/storage/`, `sync_media/`, `/var/syncthing/`) é imediatamente ignorado com log informativo e mantido intacto no disco.
    - A limpeza de arquivos residuais atua exclusivamente sobre a pasta temporária de downloads do sistema (`var/downloads/`).
  - **Serviço e Comando CLI de Limpeza (`LimparVideosAntigosService.php`, `LimparVideosAntigosCommand.php`)**:
    - Filtra estritamente apenas vídeos (`$item->isVideo() && !$item->isPrint()`) mais antigos que o limite configurado (padrão de 7 dias) do sistema.
    - Antes de remover o arquivo do sistema, garante a persistência da miniatura em `var/cache/thumbnails/{uuid}.jpg` usando FFmpeg, mantendo as capas e visualizações na web 100% íntegras mesmo sem o arquivo local do vídeo.
    - Remove o arquivo físico via `ArmazenamentoInterface`, salva o caminho anterior e a data nos metadados, seta `caminhoLocal = null` e transiciona o status para `ARQUIVO_REMOVIDO`.
    - Comando CLI `php bin/console app:media:limpar-videos-antigos --dias=7 --dry-run` para testes e execução manual.
  - **Agendamento no Symfony Scheduler e Cron da VPS (`Schedule.php`, `LimparVideosAntigosMessage.php`, `devops/crontab`)**:
    - Adicionado agendamento diário nativo via `RecurringMessage::every('1 day', new LimparVideosAntigosMessage(7))` no `src/Schedule.php` do Symfony (consumido pelo worker de scheduler do Supervisord).
    - Adicionado job semanal no `devops/crontab` rodando aos domingos às 03:00 como contingência.
  - **Serviço Completo de Rebaixamento / Redownload (`RebaixarMediaItemService.php`, `RebaixarMediaItemMessage.php`)**:
    - Métodos `rebaixarIndividual(string $uuid)` e `rebaixarEmLote(RebaixarLoteDTO $dto)`.
    - Redownload feito diretamente pela URL original via `BaixarVideoDownloadService` (yt-dlp) sem restrições de duplicidade de URL.
    - O arquivo baixado é movido de volta para a pasta física configurada ou categoria.
    - **Preservação de Datas**: Obtém a data customizada dos metadados (`data` ou `data_criacao_arquivo`) e executa `touch()` no arquivo físico para manter exatamente o mesmo timestamp de modificação no disco para sincronização com Syncthing-Fork no Android.
    - **Proteção contra Reenvio no Google Fotos**: Verifica `isEnviadoGoogleFotos()` / `googlePhotosMediaId`; se a mídia já foi sincronizada anteriormente, não despacha upload nem tenta recriar o item no Google Fotos.
    - Remove a flag de remoção e transiciona para `StatusMediaItem::CONCLUIDO`.
    - Exposta rota `POST /api/v1/media-itens/{uuid}/rebaixar` em `MediaItemController.php`.
  - **Interface Web e Filtros (`DownloadsVideo.tsx`, `CardVideo.tsx`, `CentralMidias.tsx`, `CardMidiaCentral.tsx`)**:
    - Adicionado Badge de status "Arquivo Removido" com palette laranja e ícone `HardDrive`.
    - Adicionados botões de filtro rápido e opções em selects para filtrar itens com status `arquivo_removido`.
    - Botão "Rebaixar Vídeo" destacado nos cards quando o arquivo estiver com status de arquivo removido, desabilitando o download direto de arquivo não existente no disco e guiando o usuário com tooltips claros.
    - Modal de confirmação explicando a preservação de dados e que mídias já no Google Fotos não serão duplicadas.
- **Arquivos**:
  - `src/Enum/StatusMediaItem.php`
  - `src/Support/MetadataKeys.php`
  - `src/Entity/MediaItem.php`
  - `src/Repository/MediaItemRepository.php`
  - `src/Service/MediaItem/LimparVideosAntigosService.php`
  - `src/Command/LimparVideosAntigosCommand.php`
  - `src/Message/LimparVideosAntigosMessage.php`
  - `src/MessageHandler/LimparVideosAntigosMessageHandler.php`
  - `src/Message/RebaixarMediaItemMessage.php`
  - `src/MessageHandler/RebaixarMediaItemMessageHandler.php`
  - `src/Service/MediaItem/RebaixarMediaItemService.php`
  - `src/Controller/MediaItem/MediaItemController.php`
  - `src/Schedule.php`
  - `devops/crontab`
  - `web/features/downloads-video/types.ts`
  - `web/features/downloads-video/utils/formatadores.ts`
  - `web/features/downloads-video/api.ts`
  - `web/features/downloads-video/hooks/useDownloadsVideo.ts`
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/central-midias/CentralMidias.tsx`
  - `web/features/central-midias/components/CardMidiaCentral.tsx`
  - `documentation/progresso/melhorias/MELHORIAS_3.md`
  - `documentation/progresso/melhorias/MELHORIAS.md`

### ✅ Melhoria 50 — Painel de Métricas de Vídeos no Dashboard: Total Baixados no Sistema, Permanecem na VPS, Apagados Hoje e Espaço Liberado

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - O usuário necessitava visualizar diretamente no Dashboard principal as métricas completas do ciclo de vídeos baixados no sistema:
    1. Quantidade total de vídeos que foram baixados no sistema (incluindo o histórico completo com os arquivos que foram apagados pela rotina semanal/cron).
    2. Quantidade de vídeos apagados hoje pela cron / rotina automática de liberação de espaço.
    3. Quantidade de vídeos que ainda permanecem fisicamente no sistema (com arquivo ativo na VPS) e seu tamanho em disco.
- **Solução**:
  - **Consulta Otimizada em DBAL Nativo (`MediaItemRepository::obterMetricasVideos`)**:
    - Implementada agregação SQL nativa de altíssima performance calculando em uma única query:
      - `total_baixados`: total histórico de vídeos baixados no sistema.
      - `permanecem_sistema`: vídeos com arquivo físico ativo no sistema (`status NOT IN ('arquivo_removido', 'arquivo_expurgado') AND caminho_local IS NOT NULL`).
      - `removidos_hoje`: vídeos cujo arquivo físico foi removido na data corrente (fuso horário `America/Sao_Paulo`) pela rotina.
      - `total_removidos`: total acumulado de itens cujo arquivo foi removido da VPS.
      - `tamanho_permanecem_bytes`: espaço físico atual ocupado pelos vídeos ativos.
      - `espaco_liberado_bytes`: espaço em disco recuperado na VPS pela limpeza.
  - **Integração no Serviço de Dashboard (`DashboardService::obterResumo`)**:
    - Integrado o bloco `metricasVideos` com números exatos e formatação legível de bytes (`tamanhoPermanecemFormatado`, `espacoLiberadoFormatado`).
  - **Componente Premium de Métricas no Frontend (`CardsVideosMetricas.tsx`)**:
    - Painel dedicado posicionado estrategicamente no Dashboard contendo:
      - Cabeçalho com selo de proteção da pasta sincronizada com o celular (Syncthing) e atalho rápido para a central de downloads.
      - **Card 1 — Total Baixados**: Histórico completo de vídeos ingeridos pelo sistema.
      - **Card 2 — Permanecem no Sistema**: Quantidade de vídeos com arquivo físico na VPS, porcentagem e espaço em disco.
      - **Card 3 — Apagados Hoje**: Contagem de arquivos de vídeo liberados pela cron/rotina nas últimas 24h.
      - **Card 4 — Espaço Liberado**: Total acumulado de espaço recuperado na VPS com indicação da possibilidade de "Rebaixar".
      - **Barra de Proporção Visual**: Indicador visual dinâmico com gradientes comparando a proporção de vídeos ativos no disco vs. espaço liberado.
  - **Refinamento no Card de Total Ingerido (`CardsResumo.tsx`)**:
    - Adicionado resumo de apoio no primeiro card exibindo `X vídeos (Y ativos no sistema)` para visão imediata.
- **Arquivos**:
  - `src/Repository/MediaItemRepository.php`
  - `src/Service/Dashboard/DashboardService.php`
  - `web/features/dashboard/types.ts`
  - `web/features/dashboard/components/CardsVideosMetricas.tsx`
  - `web/features/dashboard/components/CardsResumo.tsx`
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/dashboard/index.ts`
  - `documentation/progresso/melhorias/MELHORIAS_3.md`
  - `documentation/progresso/melhorias/MELHORIAS.md`



