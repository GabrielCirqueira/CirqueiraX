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
