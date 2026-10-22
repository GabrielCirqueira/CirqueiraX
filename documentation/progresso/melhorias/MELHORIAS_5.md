# Melhorias 81–100

> Detalhamento das melhorias **M81** a **M100**.
> Índice completo em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 81 — Remoção da Janela de CMD que Abria a Cada Minuto no Agente de Prints

- **Status**: Concluído
- **Data**: 18 de outubro de 2026
- **Problema**:
  - Uma tarefa do Windows rodava o vigia a cada minuto.
  - Esse vigia abria o CMD para consultar se o agente ainda estava vivo, e a janela aparecia e sumia na tela.
- **Solução**:
  - A tarefa de todo minuto foi removida.
  - O agente continua em segundo plano, sem console, e o vigia do login não chama mais o CMD.
- **Arquivos**:
  - `agente/servico/instalar-servico-windows.ps1`

---

### ✅ Melhoria 82 — Um Print Deixa de Ser Enviado Três Vezes pelo Agente

- **Status**: Concluído
- **Data**: 18 de outubro de 2026
- **Problema**:
  - O Windows avisava criação e alteração do mesmo arquivo várias vezes.
  - Cada aviso disparava um envio, e o mesmo print chegava três vezes no site.
- **Solução**:
  - O mesmo arquivo só entra numa fila de envio por vez.
  - O histórico por hash continua ignorando o que já foi enviado.
- **Arquivos**:
  - `agente/core/watcher.py`

---

### ✅ Melhoria 83 — Fila de Downloads Remove Itens Concluídos e Mantém Só Pendentes, em Download e com Erro

- **Status**: Concluído
- **Data**: 19 de outubro de 2026
- **Problema**:
  - Ao terminar, cada download era marcado como `concluido` e continuava no painel da fila e no `localStorage`. A lista crescia a cada vídeo baixado e só diminuía clicando em "Limpar Concluídos".
- **Solução**:
  - **`useFilaDownloadsStore`**:
    - O download concluído sai da fila na hora. O vídeo já aparece na lista de downloads, e o toast "Download concluído" continua.
    - A fila passa a ter só três estados: `pendente`, `baixando` e `erro`. O status `concluido` deixou de existir.
    - O novo contador `concluidosLote` guarda quantos vídeos terminaram no lote atual, só para a barra de progresso. Ele zera quando um link é adicionado com a fila parada.
    - Um `merge` no `persist` descarta os itens `concluido` que versões anteriores deixaram salvos no navegador.
    - `limparConcluidos` foi substituído por `limparErros`.
  - **`PainelFilaDownloads`**:
    - O progresso e o "X/Y concluídos" somam os concluídos do lote com os itens que ainda estão na fila.
    - Quando sobram só itens com erro, o cabeçalho fica vermelho e mostra "N download(s) com erro. Tente de novo ou remova da fila."
    - O botão "Limpar Concluídos" virou "Limpar Erros". O painel some sozinho quando a fila esvazia.
- **Arquivos**:
  - `web/features/downloads-video/stores/useFilaDownloadsStore.ts`
  - `web/features/downloads-video/components/PainelFilaDownloads.tsx`

---

### ✅ Melhoria 84 — Prints Enviados ao Google Fotos com a Data de Captura e o Nome Real do Arquivo

- **Status**: Concluído
- **Data**: 21 de outubro de 2026
- **Problema**:
  - Com a conta do Google desconectada (`invalid_grant`), os envios falharam por dias. Depois de reconectar e retentar, 27 mídias subiram de uma vez.
  - Os prints em PNG não têm data dentro do arquivo, e a API não permite informar a data. Por isso o Google Fotos registrou cada print com o horário do upload, e prints de 12/10 e 20/10 apareceram como sendo de 21/10.
  - Sem `fileName` no `batchCreate`, todo item ganhava como nome a data do upload (ex.: `2026-10-21.png`).
  - Os vídeos já tinham a data certa, porque o `creation_time` é gravado via FFmpeg. Nenhuma mídia foi enviada duas vezes: isso foi conferido no banco e na API do Google.
- **Solução**:
  - **`MetadataImagemClient::gerarCopiaPngComData()`** (`src/Infra/Imagem/`, via `MetadataImagemInterface`): gera uma cópia temporária do PNG com um chunk `eXIf` (DateTime, DateTimeOriginal, DateTimeDigitized e OffsetTimeOriginal) e um XMP (`xmp:CreateDate`) com a data de exibição da mídia. O arquivo original não muda, para manter o hash usado na detecção de duplicados.
  - **`EnviarGoogleFotosService`**: PNGs sobem a partir dessa cópia, que é apagada logo depois do upload.
  - **`GoogleFotosAPI::batchCreateMediaItems()`**: passa a enviar `fileName` com o nome real do arquivo.
- **Observação**: a API do Google Fotos não permite alterar a data nem apagar itens já enviados. Os prints que subiram com a data errada precisam ser corrigidos no app ("Editar data e hora") ou apagados e reenviados.
- **Arquivos**:
  - `src/Infra/Imagem/MetadataImagemClient.php`
  - `src/Interface/MetadataImagemInterface.php`
  - `src/Service/GoogleFotos/EnviarGoogleFotosService.php`
  - `src/Infra/GoogleFotos/GoogleFotosAPI.php`

---

### ✅ Melhoria 85 — Histórico de Envios ao Google Fotos com Status, Conta, Tentativa e Erro

- **Status**: Concluído
- **Data**: 21 de outubro de 2026
- **Problema**:
  - Não existia registro das tentativas de envio ao Google Fotos. Quando a conta caiu (`invalid_grant`), a única pista era o `erro_motivo` da mídia, sobrescrito a cada tentativa, e os logs do Messenger. Não dava para saber o que subiu, quando, para qual conta, em qual tentativa ou por que falhou.
- **Solução**:
  - **Entidade `RegistroEnvioGoogleFotos`** (tabela `registro_envio_google_fotos`): uma linha por tentativa. Guarda a mídia (uuid, origem, nome, tipo, tamanho e data da mídia), o destino (categoria, álbum e e-mail da conta), o status, a origem do envio, o número da tentativa, o id e o link no Google Fotos, o erro, o início, o fim e a duração.
  - **Enums**:
    - `StatusEnvioGoogleFotos`: `enviando`, `enviado`, `reaproveitado` e `falha`.
    - `OrigemEnvioGoogleFotos`: `automatico`, `retentativa`, `reenvio_manual` e `forcado`. A tentativa é contada pelos registros anteriores da mesma mídia, então as retentativas automáticas do Messenger também aparecem.
  - **`EnviarGoogleFotosService`**:
    - Abre o registro antes do envio e marca o resultado: enviado, reaproveitado (o arquivo já existia no Google por duplicidade) ou falha com a mensagem do erro.
    - Mídias já enviadas e as vindas da Franky continuam sendo ignoradas sem gerar registro.
  - **`RegistrarEnvioGoogleFotosService`**: cria e finaliza os registros.
  - **`ListarEnviosGoogleFotosService`**: listagem paginada com filtro por status e resumo das últimas 24h.
  - **`ReenviarGoogleFotosService`**: recoloca a mídia na fila (`EnviarGoogleFotosMessage` com `reenvioManual`). Recusa a mídia que já está no Google.
  - **API**: `GET /api/v1/google-fotos/envios`, `GET /api/v1/google-fotos/envios/resumo` e `POST /api/v1/google-fotos/envios/{uuid}/reenviar` (`EnviosGoogleFotosController`).
  - **Frontend**:
    - A página do Google Fotos ganhou a seção "Histórico de Envios": tabela com status, mídia, data da mídia, destino e conta, tentativa e origem, execução e duração, e o erro resumido (o `invalid_grant` vira "reconecte a conta").
    - Tem filtros por status, contadores das últimas 24h, link "abrir no Google Fotos" e botão "Reenviar" nas falhas.
    - Atualiza a cada 15s e aparece mesmo com a conta desconectada.
- **Arquivos**:
  - `src/Entity/RegistroEnvioGoogleFotos.php`, `src/Repository/RegistroEnvioGoogleFotosRepository.php`, `migrations/Version20261021112252.php`
  - `src/Enum/StatusEnvioGoogleFotos.php`, `src/Enum/OrigemEnvioGoogleFotos.php`
  - `src/Service/GoogleFotos/RegistrarEnvioGoogleFotosService.php`, `ListarEnviosGoogleFotosService.php`, `ReenviarGoogleFotosService.php`, `EnviarGoogleFotosService.php`
  - `src/Controller/GoogleFotos/EnviosGoogleFotosController.php`, `src/Serializer/RegistroEnvioGoogleFotosSerializer.php`
  - `src/DataObject/FiltroEnviosGoogleFotosDTO.php`, `src/DataObject/PaginaRegistrosEnvioGoogleFotosDTO.php`
  - `src/Exception/GoogleFotos/RegistroEnvioGoogleFotosException.php`
  - `src/Message/EnviarGoogleFotosMessage.php`, `src/MessageHandler/EnviarGoogleFotosMessageHandler.php`
  - `web/features/google-fotos/components/TabelaEnviosGoogleFotos.tsx`, `LinhaEnvioGoogleFotos.tsx`, `utils/enviosGoogleFotos.ts`, `hooks/useGoogleFotos.ts`, `api.ts`, `types.ts`, `GoogleFotos.tsx`

---

### ✅ Melhoria 86 — Dashboard Redesenhado em Estilo Minimalista, sem Gradientes

- **Status**: Concluído
- **Data**: 21 de outubro de 2026
- **Problema**:
  - O Dashboard tinha excesso de efeitos:
    - halos em `radial-gradient` em cada card;
    - barras e gráficos em `linear-gradient`;
    - cores hex fixas e sombras;
    - cards que subiam no hover;
    - ícones em caixas coloridas e uma cor diferente para cada métrica.
  - As abas usavam cards dentro de cards. O status do Google Fotos aparecia fixo como "Pronto", mesmo com a conta desconectada.
- **Solução**:
  - **Base visual**:
    - `PainelDashboard`: superfície única com borda fina, sem sombra, título e ação opcionais.
    - `IndicadorMetrica`: rótulo, número e detalhe, em cor neutra; vermelho só para erro e âmbar só para pendência.
    - `BarraProporcao`: barra fina de cor sólida.
  - **Indicadores**: os dois blocos (resumo e vídeos) viraram uma grade com divisórias de 1px, sem um card por número.
  - **Topo da página**: as ações rápidas viraram uma linha de botões neutros, e o cabeçalho mostra só o título e o estado ("Tudo funcionando" ou "N erros pendentes").
  - **Abas**: estilo linha.
  - **Gráficos**: cores sólidas tiradas dos tokens do tema (`var(--chakra-colors-…)`). Eixos, grade e tooltip seguem o tema claro e o escuro.
  - **Listas**: últimas mídias, serviços, categorias, sincronização e erros viraram listas com divisórias.
  - **Serviços**: mostra o status real da conta do Google Fotos.
  - **Código**: cálculos e mapas de rótulo saíram dos componentes para `utils/metricasDashboard.ts`.
- **Arquivos**:
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/dashboard/components/PainelDashboard.tsx`, `CardsResumo.tsx`, `CardsVideosMetricas.tsx`, `BarraAcoesRapidas.tsx`, `GraficosDashboard.tsx`, `AtividadesRecentes.tsx`, `StatusIntegracoes.tsx`, `TabelaCategorias.tsx`, `PainelSync.tsx`, `FilaErros.tsx`
  - `web/features/dashboard/utils/metricasDashboard.ts`

---

### ✅ Melhoria 87 — Remover Categoria em Lote na Tela de Downloads

- **Status**: Concluído
- **Data**: 21 de outubro de 2026
- **Problema**:
  - Vídeos categorizados antes de ajustar a data e o horário iam para o Google Fotos com a data errada.
  - Não havia como desfazer a categoria. Recategorizar não reenviava, porque a mídia já tinha `googlePhotosMediaId`.
- **Solução**:
  - **Backend**:
    - `POST /api/v1/media-itens/lote/remover-categoria` (`RemoverCategoriaLoteDTO`) chama `RemoverCategoriaMediaItemService::removerEmLote`, com um único flush ao final.
    - `MediaItem::removerCategoria()`:
      - guarda a categoria antiga em `MetadataKeys::CATEGORIA_REMOVIDA_ID`;
      - limpa a categoria, o `googlePhotosMediaId` e as chaves `google_photos_*`;
      - volta o status para `sem_categoria`.
    - Só vale para `classificado`, `distribuido_local`, `concluido` e `erro` (`StatusMediaItem::isRemocaoCategoriaPermitida`). Itens fora disso são ignorados e registrados no log.
    - O arquivo continua na pasta da categoria; mandá-lo para `var/downloads` faria a limpeza semanal apagá-lo. Ao recategorizar uma mídia com categoria removida, `ClassificarMediaItemService` move o arquivo para a pasta nova. A distribuição regrava a data no arquivo e o envio ao Google Fotos acontece de novo.
    - `classificarComo()` limpa a marca `categoria_removida_id`.
  - **Frontend**:
    - Botão "Remover categoria" na barra de seleção em lote.
    - `ModalRemoverCategoriaLote` explica o fluxo: apagar manualmente no Google Fotos (a API não permite), ajustar data e horário, categorizar de novo.
    - A seleção é mantida para usar "Distribuir horários" em seguida.
    - O aviso é montado em `utils/remocaoCategoria.ts`.
- **Arquivos**:
  - `src/Controller/MediaItem/MediaItemController.php`
  - `src/DataObject/RemoverCategoriaLoteDTO.php`
  - `src/Service/MediaItem/RemoverCategoriaMediaItemService.php`, `ClassificarMediaItemService.php`
  - `src/Entity/MediaItem.php`, `src/Enum/StatusMediaItem.php`, `src/Exception/MediaItem/MediaItemException.php`, `src/Support/MetadataKeys.php`
  - `web/features/downloads-video/DownloadsVideo.tsx`, `api.ts`, `types.ts`, `hooks/useDownloadsVideo.ts`
  - `web/features/downloads-video/components/BarraAcoesEmLote.tsx`, `ModalRemoverCategoriaLote.tsx`
  - `web/features/downloads-video/utils/remocaoCategoria.ts`

---

### ✅ Melhoria 88 — Seleção em Intervalo com Shift na Tela de Downloads

- **Status**: Concluído
- **Data**: 21 de outubro de 2026
- **Problema**: para agir em lote era preciso marcar card por card.
- **Solução**:
  - Igual ao Google Fotos: o clique normal no seletor marca o card e vira o ponto de partida. **Shift + clique** em outro card seleciona todos os cards entre os dois, para frente ou para trás.
  - Funciona nos modos grade, compacto, galeria e lista. Na tabela, Shift + clique vale na linha inteira.
  - Se o ponto de partida estiver desmarcado, o intervalo é desmarcado. Sem ponto de partida, o Shift + clique só alterna o card.
  - Com Shift, o clique não abre o visualizador e o navegador não seleciona texto.
  - A lógica fica em `utils/selecaoIntervalo.ts`. `GridVideos` e `TabelaVideos` só interceptam o clique com Shift (`onClickCapture`) e chamam `onSelecionarIntervalo`.
- **Arquivos**:
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `web/features/downloads-video/components/GridVideos.tsx`, `TabelaVideos.tsx`
  - `web/features/downloads-video/utils/selecaoIntervalo.ts`

---

### ✅ Melhoria 89 — Editor de Imagem para Anotar Prints (Setas, Formas, Texto, Marcadores)

- **Status**: Concluído
- **Data**: 22 de outubro de 2026
- **Problema**: para apontar campos e valores em prints e mostrar a outras pessoas, era preciso abrir um editor externo a cada vez.
- **Solução**:
  - **Nova tela `/editor-imagem`** (menu "Editor de Imagem"):
    - **Ctrl + V** em qualquer lugar da tela abre a imagem colada. Também dá para arrastar um arquivo ou escolher do computador.
    - **Ferramentas**: seta, retângulo, círculo, linha, pincel, marca-texto, texto, marcador numerado (1, 2, 3…), pixelar (esconde dados sensíveis) e recorte.
    - **Opções**: 8 cores e 3 espessuras. Espessura e fonte acompanham a resolução da imagem.
    - **Shift**: deixa linhas e setas retas (passos de 45°) e retângulos e círculos com proporção de quadrado.
    - **Atalhos de ferramenta**: A seta, R retângulo, E círculo, L linha, B pincel, H marca-texto, T texto, N número, D pixelar, C recorte.
    - **Atalhos gerais**: Ctrl + Z desfazer, Ctrl + Y ou Ctrl + Shift + Z refazer, Ctrl + C copiar, Ctrl + S salvar, Esc cancelar.
    - **Copiar**: o PNG editado vai para a área de transferência, na resolução original. Sem HTTPS, a imagem é baixada no lugar.
    - **Baixar**: baixa o PNG editado.
    - **Salvar**: grava a imagem no CirqueiraX, sem categoria ou numa categoria. Se a categoria tiver álbum do Google Fotos, a imagem segue o fluxo normal de distribuição e envio.
  - **Desempenho**: duas camadas de canvas.
    - A base (imagem + anotações) só é redesenhada quando uma anotação entra ou sai.
    - O traço em andamento fica numa camada de rascunho desenhada com `requestAnimationFrame`, sem re-render do React a cada movimento.
    - O pincel usa `getCoalescedEvents` para um traço suave.
  - **Editar mídias existentes**: botão "Editar" nos cards e nos modais da **Central de Mídias** e de **Prints & Capturas**. Ele abre `/editor-imagem?midia=<uuid>` com a imagem original.
    - Ao salvar, é criada uma **nova mídia**. A original não muda.
    - A nova mídia herda a origem e a **data/hora** da original, então vai para o Google Fotos no dia certo.
  - **Backend**: `POST /api/v1/media-itens/edicoes` (`EdicaoImagemController` → `SalvarEdicaoImagemService`).
    - Recebe `arquivo` (PNG/JPEG/WebP, até 50 MB), `nomeArquivo`, `categoriaId` e `mediaItemOrigemUuid` (opcional), validados em `SalvarEdicaoImagemDTO`.
    - Ingere a imagem por `IngestarMediaService` e classifica se houver categoria.
    - Com mídia de origem: grava `editado_de_uuid`, `data` e `horario` (`MetadataKeys::EDITADO_DE_UUID` e `HORARIO`).
    - `MediaItem::isEditavelComoImagem()` bloqueia vídeos e mídias sem arquivo. Os erros vêm de `EdicaoImagemException`.
  - **Testado** num Chrome headless com a página real e a API simulada: colar, todas as ferramentas, desfazer/refazer, recorte e salvamento (sem origem e com mídia de origem, conferindo o PNG e os campos enviados).
- **Arquivos**:
  - `src/Controller/MediaItem/EdicaoImagemController.php`
  - `src/Service/MediaItem/SalvarEdicaoImagemService.php`
  - `src/DataObject/SalvarEdicaoImagemDTO.php`
  - `src/Exception/MediaItem/EdicaoImagemException.php`
  - `src/Entity/MediaItem.php`, `src/Support/MetadataKeys.php`
  - `web/features/editor-imagem/` (página, `api.ts`, `types.ts`, hooks `useEditorImagem`, `useAtalhosEditor`, `useExportacaoEdicao`, `useEditorImagemApi`, componentes e `utils/`)
  - `web/App.tsx`, `web/layouts/Sidebar.tsx`, `web/layouts/Header.tsx`
  - `web/features/prints/components/CardPrint.tsx`, `ModalVisualizarPrint.tsx`
  - `web/features/central-midias/components/CardMidiaCentral.tsx`, `ModalVisualizarMidiaCentral.tsx`
