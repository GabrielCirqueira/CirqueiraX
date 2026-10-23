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

---

### ✅ Melhoria 90 — Editor de Imagem: Selecionar, Mover, Redimensionar e Ajustar Propriedades das Formas

- **Status**: Concluído
- **Data**: 22 de outubro de 2026
- **Problema**: depois de desenhada, uma forma não podia ser movida, redimensionada nem ajustada (borda, arredondamento, preenchimento). Só restava desfazer e desenhar de novo.
- **Solução** (no editor da M89):
  - **Ferramenta Selecionar** (tecla **V**): clicar numa anotação seleciona e arrastar move. Toda forma recém-criada já fica selecionada.
    - Com outra ferramenta ativa, arrastar a borda da forma selecionada também move.
  - **Alças**:
    - Retângulo, círculo e área pixelada têm 8 alças. As dos cantos mudam largura e altura; as dos lados, só a horizontal ou só a vertical.
    - Seta e linha têm alças nas duas pontas.
    - O cursor muda conforme a alça.
  - **Painel de propriedades** (aparece com uma forma selecionada):
    - **Borda/Espessura** (deslizante) e **Arredondamento** dos cantos, só no retângulo.
    - **Traço** sólido ou tracejado, em seta, linha, retângulo e círculo.
    - **Preenchimento** vazio, translúcido ou sólido, em retângulo e círculo.
    - **Texto**: tamanho e estilo (contorno ou etiqueta com fundo). **Marcador numerado**: tamanho.
    - Trazer para frente, duplicar e excluir.
    - A cor e a espessura da barra de ferramentas também se aplicam à forma selecionada.
  - **Teclado**: Delete/Backspace exclui, Ctrl + D duplica, as setas movem 1px (com Shift, 10px) e Esc tira a seleção.
  - **Duplo clique num texto** edita o conteúdo. Apagar todo o texto remove a anotação.
  - **Histórico**:
    - Virou snapshots (`passado`/`presente`/`futuro`, até 100 passos).
    - Mover, redimensionar, mudar propriedade e excluir entram no desfazer/refazer.
    - Arrastar e deslizantes mostram uma prévia ao vivo e geram um único passo no histórico, ao soltar.
  - **Desempenho**: durante o arraste, a cena é redesenhada no `requestAnimationFrame`, sem re-render do React. A moldura e as alças ficam numa camada de sobreposição que não entra na imagem exportada.
  - **Código**:
    - `useCanvasEditor`: histórico, seleção e renderização. `useEditorImagem`: ponteiro, texto e ações.
    - `utils/selecaoAnotacoes.ts`: caixas, acerto no clique e alças. `utils/transformacaoAnotacoes.ts`: mover, redimensionar, alterar e duplicar.
    - `utils/desenhoSelecao.ts`: sobreposição. `utils/propriedadesPainel.ts`: quais controles cada tipo tem.
  - **Testado** num Chrome headless (página real com a API simulada): esticar pelas alças, mover, deslizante de borda, tracejado, translúcido, mover a ponta da seta, duplicar, excluir, texto em etiqueta, edição com duplo clique, desfazer/refazer e salvar. Sem erros no console.
- **Arquivos**:
  - `web/features/editor-imagem/EditorImagem.tsx`, `types.ts`
  - `web/features/editor-imagem/hooks/useCanvasEditor.ts`, `useEditorImagem.ts`
  - `web/features/editor-imagem/components/PainelPropriedades.tsx`, `AreaEdicaoCanvas.tsx`, `BarraFerramentasEditor.tsx`
  - `web/features/editor-imagem/utils/selecaoAnotacoes.ts`, `transformacaoAnotacoes.ts`, `desenhoSelecao.ts`, `propriedadesPainel.ts`, `desenhoCanvas.ts`, `historicoAnotacoes.ts`, `fabricaAnotacoes.ts`, `atalhosTeclado.ts`, `constantesEditor.ts`

---

### ✅ Melhoria 91 — Editor de Imagem Lembra as Últimas Configurações de Cada Ferramenta

- **Status**: Concluído
- **Data**: 22 de outubro de 2026
- **Problema**: a cada imagem nova era preciso reconfigurar cor, borda, arredondamento, traço e preenchimento.
- **Solução**:
  - **Preferências por ferramenta no localStorage** (`cirqueirax:editor-imagem:preferencias`). Cada tipo guarda as suas: retângulo, círculo, seta, linha, pincel, marca-texto, texto, marcador e pixelar.
    - Os valores salvos são a cor, a espessura, o arredondamento, o traço (sólido/tracejado), o preenchimento, o tamanho e o estilo do texto, e o tamanho do marcador.
  - **Quando salva**:
    - ao mudar uma propriedade da forma selecionada (painel ou cor/espessura da barra), a configuração final vale para aquele tipo;
    - sem nada selecionado, a cor e a espessura da barra valem para a ferramenta ativa.
  - **Quando usa**: toda forma nova sai com as preferências do seu tipo. A barra mostra a cor e a espessura da ferramenta ativa ou da forma selecionada.
  - **Última ferramenta usada** também é lembrada (`cirqueirax:editor-imagem:ferramenta`). O recorte não é restaurado.
  - **Tamanhos relativos à resolução**: espessura, arredondamento e tamanhos são salvos divididos pelo fator de escala da imagem. Assim, a mesma configuração fica proporcional num print pequeno ou num 4K.
  - **Robustez**: o que vem do storage passa por validação campo a campo (cor hexadecimal, números finitos, enums conhecidos). Valor inválido volta ao padrão.
  - Usa o `useLocalStorageState`/`localStorageService` que já existiam (chaves em `CHAVES_STORAGE`).
  - **Testado** num Chrome headless: retângulo configurado como azul, tracejado, translúcido e borda 30, e seta em verde. Depois de recarregar a página e colar outra imagem, o retângulo e a seta novos vieram com essas configurações e o círculo, nunca configurado, veio com o padrão. A última ferramenta foi restaurada.
- **Arquivos**:
  - `web/features/editor-imagem/utils/preferenciasEditor.ts` (novo)
  - `web/features/editor-imagem/hooks/useEditorImagem.ts`, `utils/fabricaAnotacoes.ts`, `utils/constantesEditor.ts`, `types.ts`
  - `web/features/editor-imagem/components/AreaEdicaoCanvas.tsx`, `BarraFerramentasEditor.tsx`, `EditorImagem.tsx`
  - `web/shared/utils/localStorageService.ts`

---

### ✅ Melhoria 92 — Página de Downloads MP3 (Áudio Atrelado à Conta, Expira em 7 Dias)

- **Status**: Concluído
- **Data**: 22 de outubro de 2026
- **Problema**: para pegar só o áudio de um vídeo era preciso baixar o vídeo e converter por fora. A tela de Downloads carrega fluxos que não fazem sentido para áudio (categoria, horário, Google Fotos).
- **Solução**:
  - **Entidade nova `Audio`** (tabela `audio`), separada do `MediaItem` e ligada ao `Usuario` (`ON DELETE CASCADE`). Cada usuário só vê e baixa os próprios áudios.
    - Status em `StatusAudio`: `pendente` → `baixando` → `disponivel`, ou `erro`; depois de 7 dias vira `expirado`.
    - Métodos de intenção: `iniciarDownload`, `concluirDownload`, `registrarFalha`, `expirar`, `prepararParaRebaixar`. Predicados: `isDisponivel`, `isRebaixavel`, `isEmProcessamento`.
  - **Download assíncrono**: `POST /api/v1/audios` cria o registro e despacha `BaixarAudioMessage` no Messenger. A resposta é imediata e a tela acompanha o progresso.
  - **Extração com yt-dlp** (`YtDlpClient::baixarAudio`, porta `ExtratorAudioInterface`):
    - gera MP3 na melhor qualidade, com título, artista e capa embutidos;
    - os metadados (título, autor, duração, capa) vêm na mesma execução via `--print after_move`;
    - TikTok e X caem no download de vídeo já existente (TikWM/FxTwitter) e convertem com ffmpeg quando o yt-dlp falha;
    - aceita os mesmos links da tela de Downloads, agora também `music.youtube.com` e `m.youtube.com`.
  - **Armazenamento**: arquivos em `var/audios/{uuid}.mp3`, num volume próprio (`audios_prod`), fora da pasta do Syncthing. O bootstrap cria a pasta com dono `www-data`.
  - **Expiração em 7 dias** (`ExpirarAudiosAntigosService`, no Scheduler a cada 1 dia):
    - remove o arquivo e marca o áudio como expirado, mantendo o registro;
    - "Baixar de novo" (`POST /api/v1/audios/{uuid}/rebaixar`) gera o MP3 outra vez e renova os 7 dias;
    - downloads presos há mais de 1 hora (worker reiniciado no meio) viram erro e também podem ser baixados de novo.
  - **Rotas** (`AudioController`): `GET /api/v1/audios` (paginado), `POST /api/v1/audios`, `POST /{uuid}/rebaixar`, `DELETE /{uuid}`, `GET /{uuid}/arquivo` (download) e `GET /{uuid}/stream` (player).
  - **Tela `/downloads-mp3`** (item "Downloads MP3" na sidebar):
    - campo de link aceita vários links de uma vez; Ctrl + V em qualquer lugar da página já enfileira;
    - lista com capa, título, autor, duração, tamanho, status e quanto falta para expirar;
    - ações: ouvir no player, baixar o MP3, baixar de novo (expirado/erro), abrir o link original e remover (com confirmação);
    - atualiza sozinha a cada 2,5 s enquanto houver áudio na fila ou convertendo, e para quando termina.
  - **Correção de navegação**: o item ativo da sidebar e o título do header passaram a comparar o caminho exato. Antes, `/downloads-mp3` também acenderia "Downloads".
  - **Testado**:
    - o `YtDlpClient` real, na imagem de produção, baixou MP3 do YouTube, do YouTube Music e do TikTok com metadados e capa;
    - a tela num Chrome headless com API simulada: fila, conversão, erro, baixar de novo, player, download, remoção, link recusado e layout no celular, sem erros no console.
- **Arquivos**:
  - `src/Entity/Audio.php`, `src/Enum/StatusAudio.php`, `src/Repository/AudioRepository.php`, `migrations/Version20261022232201.php`
  - `src/Controller/Audio/AudioController.php`, `src/Serializer/AudioSerializer.php`, `src/Exception/Audio/AudioException.php`
  - `src/Service/Audio/` (`SolicitarDownloadAudioService`, `BaixarAudioService`, `ConsultarAudiosService`, `ApagarAudioService`, `ExpirarAudiosAntigosService`)
  - `src/Interface/ExtratorAudioInterface.php`, `src/Infra/YtDlp/YtDlpClient.php`, `src/Exception/Video/YtDlpException.php`
  - `src/Message/BaixarAudioMessage.php`, `src/Message/ExpirarAudiosAntigosMessage.php` e handlers, `src/Schedule.php`
  - `src/DataObject/` (`AudioBaixadoDTO`, `SolicitarDownloadAudioDTO`, `PaginaAudiosDTO`, `ResultadoExpiracaoAudiosDTO`)
  - `config/services.yaml`, `devops/bootstrap.sh`, `devops/docker-compose.prod.yaml`, `src/Service/Video/ValidadorUrlPlataforma.php`
  - `web/features/downloads-audio/` (página, componentes, hooks, utils), `web/App.tsx`, `web/layouts/Sidebar.tsx`, `web/layouts/Header.tsx`

---

### ✅ Melhoria 93 — Página de Downloads MP3 Redesenhada (Grade de Capas, Player Fixo, Cabeçalho com Contadores)

- **Status**: Concluído
- **Data**: 23 de outubro de 2026
- **Problema**: a página de Downloads MP3 (M92) era uma lista simples, visualmente pobre perto das outras telas, sobretudo da de Downloads de Vídeo.
- **Solução**:
  - **Cabeçalho** no mesmo padrão da tela de vídeos: ícone, título, contadores (total, prontos, convertendo, erros), o aviso "Arquivos guardados por 7 dias" e o botão Atualizar.
  - **Campo de link** em card próprio:
    - mostra o ícone da plataforma detectada e um botão para limpar o campo;
    - com o campo vazio, "Colar e baixar" lê a área de transferência e já enfileira; com link digitado, aparece "Baixar MP3" (ou "Baixar N MP3");
    - indicador de quantos áudios estão convertendo e chips das plataformas suportadas.
  - **Grade de cards** (1 a 6 colunas conforme a largura):
    - capa 16:10, selo da plataforma e duração sobre a capa;
    - botão de play no centro, que aparece no hover (sempre visível no celular);
    - capas de áudios na fila, com erro ou expirados ficam em cinza, com ícone e rótulo do estado;
    - título, autor, status e tamanho;
    - barra de validade com os dias restantes, que fica âmbar quando falta menos de 30% do prazo;
    - ações: MP3, Baixar de novo, link original e remover.
  - **Player fixo** no rodapé da página ("Tocando agora"), com capa, título e autor, controles, download e fechar. Ele continua tocando ao trocar de página da grade e fecha sozinho se o áudio for removido.
  - **Carregamento com skeleton** e estado vazio ilustrado.
  - Sem gradientes, seguindo o padrão minimalista da M86.
  - **Testado** num Chrome headless com API simulada: tema claro e escuro, desktop e celular (sem rolagem horizontal), fila, erro, expirado, player e campo com link. Nenhum erro no console.
- **Arquivos**:
  - `web/features/downloads-audio/DownloadsAudio.tsx`, `types.ts`, `utils/audios.ts`
  - `web/features/downloads-audio/components/CabecalhoDownloadsAudio.tsx`, `CardAudio.tsx`, `GradeAudios.tsx`, `PlayerAudio.tsx` (novos)
  - `web/features/downloads-audio/components/CampoLinkAudio.tsx`, `CapaAudio.tsx`
  - removidos: `ItemAudio.tsx`, `ListaAudios.tsx`

---

### ✅ Melhoria 94 — Vídeos do YouTube Voltam a Baixar na Melhor Qualidade (Não Mais 360p)

- **Status**: Concluído
- **Data**: 23 de outubro de 2026
- **Problema**: vídeos do YouTube passaram a chegar em 640x360. O `YtDlpClient` forçava `--extractor-args youtube:player_client=web` quando havia cookies, e o YouTube deixou de entregar os formatos separados (DASH) para esse cliente sem PO token. Sobrava só o formato 18 (360p com áudio AAC de 96 kbps), que também deixava ruins os MP3 da M92.
- **Diagnóstico** (`yt-dlp -F` em produção, yt-dlp 2026.10.21, com cookies):
  - `player_client=web`: só o formato 18 (360p);
  - `mweb`: só 360p;
  - `web_safari`: até 1080p;
  - **sem forçar cliente**: todos os formatos, até 4K (2160p).
- **Solução**: com cookies, o comando não força mais nenhum cliente e deixa o yt-dlp escolher (mantendo `--cookies` e `--remote-components ejs:github`). Sem cookies continua o `android`.
- **Testado** em produção: o mesmo vídeo que tinha vindo em 640x360 (`omG1VuyA92w`) baixou em 3840x2160.
- **Arquivos**: `src/Infra/YtDlp/YtDlpClient.php`
