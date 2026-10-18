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
