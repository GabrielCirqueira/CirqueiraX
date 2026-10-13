# Melhorias e Correções (M61–M80)

> Detalhamento das melhorias M61 a M80 do cirqueiraX.
> Retorne ao [índice central](MELHORIAS.md) para visão geral de todas as melhorias.

---

### ✅ Melhoria 61 — Deploy Automatizado Não-Bloqueante em `scripts/update.sh` com Detecção de TTY para Execuções Remotas

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - Ao rodar o script de atualização `scripts/update.sh` de forma remota via SSH, tarefas cron ou ferramentas de automação sem terminal interativo (pseudo-tty alocado), a instrução `read -rp "Pressione Enter para continuar..."` bloqueava a execução indefinidamente, travando o processo de deploy e exigindo cancelamento manual via kill.
- **Solução**:
  - Adicionada verificação de descritor de terminal interativo `[ -t 0 ]` antes de acionar comandos de leitura de prompt.
  - Caso o script detecte que está executando em modo headless/não-interativo, ele avança automaticamente sem pausar, mantendo total compatibilidade com rotinas de CI/CD e deploys remotos via SSH.
- **Arquivos**:
  - `scripts/update.sh`

---

### ✅ Melhoria 62 — Persistência do Volume de Downloads no Docker, Auto-Recuperação de Mídias Ausentes e Comando `app:media:rebaixar`

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - A pasta temporária `/var/www/html/var/downloads` não estava montada como volume persistente no Docker de produção. Sempre que os containers eram recriados ou atualizados via deploy, todos os arquivos de vídeo em processamento eram perdidos do disco da VPS.
  - Se um envio para o Google Fotos falhasse temporariamente (ex: cota 429 ou token expirado) e o arquivo local fosse apagado, o sistema ficava incapacitado de reenviar a mídia, mesmo possuindo a URL original salva no banco de dados.
- **Solução**:
  - **Volume Persistente no Docker Compose**:
    - Declarado o volume `downloads_prod:/var/www/html/var/downloads` em `devops/docker-compose.prod.yaml` e garantida a criação com permissões corretas (`www-data:www-data`) no `devops/bootstrap.sh`.
  - **Auto-Recuperação Transparente no Envio ao Google Fotos**:
    - Modificado `EnviarGoogleFotosService.php`: caso o arquivo físico local não exista no disco mas a mídia possua `urlOriginal`, o serviço aciona automaticamente o `RebaixarMediaItemService` para re-baixar o vídeo antes de tentar o upload, recuperando o pipeline sem intervenção manual.
  - **Disparo de Mensagem Assíncrona no Rebaixamento**:
    - Ao concluir um rebaixamento com sucesso em `RebaixarMediaItemService.php`, o sistema despacha automaticamente a `EnviarGoogleFotosMessage` se a mídia estiver vinculada ao Google Fotos.
  - **Comando CLI `app:media:rebaixar`**:
    - Criado comando Symfony `src/Command/RebaixarMediaCommand.php` com suporte a rebaixamento por ID, `--todos-erros` (para reprocessar mídias que falharam) e `--sem-arquivo` (para recuperar itens cujo arquivo físico foi removido).
- **Arquivos**:
  - `devops/bootstrap.sh`
  - `devops/docker-compose.prod.yaml`
  - `src/Command/RebaixarMediaCommand.php`
  - `src/Service/GoogleFotos/EnviarGoogleFotosService.php`
  - `src/Service/MediaItem/RebaixarMediaItemService.php`

---

### ✅ Melhoria 63 — Comando CLI `app:google-fotos:enviar` para Sincronização Direta, Operação em Lote e Diagnóstico com Google Photos

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - Quando ocorriam erros na integração com o Google Photos (como tokens OAuth revogados/expirados ou limite de quota atingido), era complexo diagnosticar a falha exata da API via logs do Messenger e não havia como forçar o reenvio manual imediato pela linha de comando sem reiniciar o worker assíncrono.
- **Solução**:
  - Criado o comando de console Symfony `php bin/console app:google-fotos:enviar` (`src/Command/EnviarGoogleFotosCommand.php`).
  - Suporte completo a argumentos e opções flexíveis:
    - Envio de mídia específica via argumento `<id>`.
    - Opção `--todos-pendentes` para sincronizar em lote mídias aprovadas que aguardam envio.
    - Opção `--com-erro` para tentar reenvio de mídias que falharam anteriormente.
    - Opção `--limite=<n>` para restringir a quantidade processada em lote.
  - Interface rica no terminal com barra de progresso, tabela de resumo de status e captura detalhada de exceções (como `invalid_grant` de token OAuth), fornecendo diagnósticos imediatos ao administrador do sistema.
- **Arquivos**:
  - `src/Command/EnviarGoogleFotosCommand.php`

---
