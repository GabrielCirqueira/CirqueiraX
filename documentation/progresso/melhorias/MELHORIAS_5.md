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
