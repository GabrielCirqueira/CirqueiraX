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

### ✅ Melhoria 64 — Resiliência na Exclusão de Mídias, Correção de Permissões de Storage e Resolução do Erro React #130 na Fila de Downloads

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - Ao tentar apagar itens que falharam ou foram rebaixados pela CLI, a operação retornava `0 arquivos apagados com sucesso!` porque a pasta física no container estava com dono `root:root`, impedindo que o processo `www-data` do PHP fizesse `unlink()`. A falha no disco bloqueava a exclusão do registro no banco de dados.
  - Na tela de downloads, ocorria crash total com `Unexpected Application Error! Minified React error #130; args[]=object` devido à serialização JSON do store Zustand (`cirqueirax-fila-downloads-v1`), que transformava componentes de ícones Lucide em objetos vazios `{}` no `localStorage`. Ao recarregar a página, a tentativa de renderizar `<{}>` como componente JSX derrubava o React.
  - `RebaixarMediaItemService` não recebia `%kernel.project_dir%` configurado em `config/services.yaml`, provocando caminhos de gravação inconsistentes.
- **Solução**:
  - **Resiliência na Exclusão de Mídias**:
    - Ajustado `src/Service/MediaItem/ApagarMediaItemService.php` para registrar warning caso o arquivo físico falhe em ser removido no disco (ex: permissões ou arquivo ausente), mas nunca abortar a remoção do registro no banco de dados solicitada pelo usuário.
    - Corrigidas permissões dos diretórios `/var/storage` e `/var/www/html/var/storage` para `www-data:www-data` na VPS.
  - **Resolução do Erro React #130 no Frontend**:
    - Criada a função utilitária `obterIconePlataforma(idOuUrl)` em `web/features/downloads-video/utils/plataformaVideo.ts`, garantindo retorno estrito de componentes Lucide válidos imune a objetos corrompidos de JSON.
    - Em `useFilaDownloadsStore.ts`, sanitizado o `partialize` para omitir referências a componentes React na serialização de `localStorage` e elevada a versão para `cirqueirax-fila-downloads-v2`.
    - Em `PainelFilaDownloads.tsx`, garantida a validação de tipo de função antes da renderização de ícones de plataforma.
  - **Injeção de Parâmetros em Services**:
    - Declarado explicitamente `RebaixarMediaItemService` em `config/services.yaml` com `$mediaStoragePath: '%env(MEDIA_STORAGE_PATH)%'` e `$projectDir: '%kernel.project_dir%'`.
- **Arquivos**:
  - `config/services.yaml`
  - `src/Service/MediaItem/ApagarMediaItemService.php`
  - `web/features/downloads-video/components/PainelFilaDownloads.tsx`
  - `web/features/downloads-video/stores/useFilaDownloadsStore.ts`
  - `web/features/downloads-video/utils/plataformaVideo.ts`

---

### ✅ Melhoria 65 — Fluxo Web Interativo de Autorização e Reconexão OAuth do Google Fotos com Alerta de Token Expirado e Modal Direto

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - A interface de sincronização com o Google Fotos exibia o status como "Ativo" mesmo quando o token de acesso/refresh do OAuth expirava ou era revogado no Google, sem nenhum botão ou mecanismo na interface web para reconectar a conta.
  - Para autorizar ou renovar o token, o usuário era obrigado a abrir um terminal SSH na máquina host e rodar comandos CLI interativos (`make google-fotos-autorizar`), gerando atrito e quebra de fluxo em uma aplicação web moderna.
  - O endpoint de status não realizava verificação ativa de expiração nem tentava auto-renovar tokens válidos, mascarando falhas de conexão nos envios para o Google Photos.
- **Solução**:
  - **Detecção de Expiração e Auto-Renovação no Backend**:
    - Criado o serviço `App\Service\GoogleFotos\AutorizarContaGoogleFotosService.php` para orquestrar a geração da URL de consentimento OAuth, troca de códigos por tokens, extração de e-mail e persistência criptografada.
    - Atualizado `ObterStatusContaGoogleFotosService.php` e `StatusContaGoogleFotosDTO.php` com o campo `tokenExpirado`. Se o access token estiver expirado, tenta renová-lo transparentemente via `GoogleFotosOAuthService`; caso o refresh token também tenha expirado/sido revogado, sinaliza `tokenExpirado = true` para a interface.
    - Adicionados novos endpoints REST em `GoogleFotosController.php`:
      - `GET /api/v1/google-fotos/oauth/url`: gera a URL oficial de consentimento do Google.
      - `POST /api/v1/google-fotos/oauth/concluir`: recebe o código retornado ou URL de redirecionamento, valida os tokens e conclui a autenticação.
      - `POST /api/v1/google-fotos/desconectar`: remove com segurança a associação da conta.
  - **Interface Web Interativa de Autorização e Reconexão**:
    - Criado o componente `ModalConectarGoogleFotos.tsx` integrado via `<Portal>` global, permitindo ao usuário abrir a página de autorização oficial do Google com 1 clique e colar o retorno diretamente no navegador.
    - Atualizado `GateConexaoGoogle.tsx` com banner dinâmico: destaca visualmente em âmbar quando o token está expirado, inclui botões com destaque ("Reconectar Conta", "Desconectar", "Conectar Conta Google Fotos") e orienta claramente sobre a situação da conta.
    - Criados hooks React Query (`useUrlOAuthGoogleFotos`, `useConectarGoogleFotos`, `useDesconectarGoogleFotos`) com invalidação automática de cache e toasts informativos.
- **Arquivos**:
  - `config/services.yaml`
  - `src/Controller/GoogleFotos/GoogleFotosController.php`
  - `src/DataObject/StatusContaGoogleFotosDTO.php`
  - `src/Service/GoogleFotos/AutorizarContaGoogleFotosService.php`
  - `src/Service/GoogleFotos/ObterStatusContaGoogleFotosService.php`
  - `web/features/google-fotos/api.ts`
  - `web/features/google-fotos/components/GateConexaoGoogle.tsx`
  - `web/features/google-fotos/components/ModalConectarGoogleFotos.tsx`
  - `web/features/google-fotos/hooks/useGoogleFotos.ts`
  - `web/features/google-fotos/types.ts`

---

### ✅ Melhoria 66 — Bloqueio de Reenvio de Mídias Históricas da Franky para o Google Fotos e Comando de Limpeza

- **Status**: Concluído
- **Data**: 12 de outubro de 2026
- **Problema**:
  - No banco de dados, centenas de mídias históricas importadas do bot Franky possuíam metadados com `franky_id`, mas `google_photos_media_id` como `NULL`.
  - Ao rodar sincronizações em lote ou auto-recuperação (`app:google-fotos:enviar --pendentes` e `RebaixarMediaItemService`), o sistema interpretava esses vídeos da Franky como itens novos que ainda não tinham sido enviados ao Google Fotos.
  - Isso disparava o download via `yt-dlp` e re-upload para os álbuns do Google Fotos, gerando duplicatas desnecessárias de vídeos que o bot Franky já havia enviado anteriormente para a nuvem.
- **Solução**:
  - **Filtro Estrito em Serviços e Mensageria**:
    - Em `src/Service/GoogleFotos/EnviarGoogleFotosService.php`, adicionada trava de segurança: se a mídia possuir `franky_id` ou `importado_franky` nos metadados, o upload é abortado e registrado em log, impedindo qualquer duplicação.
    - Em `src/Service/MediaItem/RebaixarMediaItemService.php`, mídias originárias da Franky não despacham mais `EnviarGoogleFotosMessage` após o download.
    - Em `src/MessageHandler/ClassificarMediaMessageHandler.php`, bloqueado o despacho assíncrono de envio para o Google Fotos de itens com `franky_id`.
    - Em `src/Command/EnviarGoogleFotosCommand.php`, a consulta de `--pendentes` exclui explicitamente registros contendo `"franky_id"` nos metadados (`NOT LIKE '%"franky_id"%'`).
  - **Comando de Limpeza e Reversão (`app:google-fotos:limpar-duplicados-franky`)**:
    - Criado comando Symfony `src/Command/LimparDuplicadosFrankyCommand.php` que localiza itens da Franky que receberam upload recente, limpa os campos de Google Fotos no banco de dados, remove eventuais arquivos físicos baixados e restaura o status da entidade para `arquivo_removido`.
    - Executada a higienização de 37 mídias afetadas em produção, restabelecendo 100% da integridade da base e do armazenamento.
- **Arquivos**:
  - `src/Command/EnviarGoogleFotosCommand.php`
  - `src/Command/LimparDuplicadosFrankyCommand.php`
  - `src/MessageHandler/ClassificarMediaMessageHandler.php`
  - `src/Service/GoogleFotos/EnviarGoogleFotosService.php`
  - `src/Service/MediaItem/RebaixarMediaItemService.php`

---

### ✅ Melhoria 67 — Inversão de Ordem e Reordenação Manual no Modal de Distribuição de Horários em Lote de Downloads

- **Status**: Concluído
- **Data**: 13 de outubro de 2026
- **Problema**:
  - No modal de distribuição de horários em lote (`ModalDistribuirHorariosLote`), os horários calculados (Uniforme, Retroativo ou Orgânico) eram atribuídos rigidamente na sequência em que os vídeos foram selecionados/baixados.
  - O usuário não tinha como inverter a ordem de atribuição (por exemplo, fazer o vídeo mais recente receber o horário mais cedo ou vice-versa), nem como trocar individualmente a posição de vídeos na grade de horários sem ter que digitar a data e hora manualmente linha por linha.
- **Solução**:
  - **Inversão de Ordem em Lote**:
    - Adicionado botão no cabeçalho da pré-visualização: `Ordem: 1º Baixado 1º` / `Ordem: Mais Recente 1º`.
    - Ao alternar a ordem, o cálculo redistribui automaticamente os slots de horários com base na sequência invertida dos itens selecionados, preservando eventuais regras do modo escolhido.
  - **Reordenação Fina por Item (Subir / Descer)**:
    - Adicionados botões de seta micro-interativos (`ChevronUp` e `ChevronDown`) ao lado do identificador `#{index + 1}` de cada vídeo na lista.
    - Permite subir ou descer qualquer vídeo na sequência com 1 clique, trocando automaticamente os horários com o item vizinho.
  - **Restaurar e Ajustes**:
    - O botão de restaurar cálculo limpa tanto ajustes manuais pontuais quanto reordenações, voltando com segurança ao estado padrão calculado.
- **Arquivos**:
  - `web/features/downloads-video/components/ModalDistribuirHorariosLote.tsx`

---

### ✅ Melhoria 68 — Injeção Automática de Metadados de Criação via FFmpeg (`creation_time`) e Timestamps no Arquivo Físico para Google Fotos

- **Status**: Concluído
- **Data**: 13 de outubro de 2026
- **Problema**:
  - Ao editar a data e hora de vídeos (individualmente no modal de metadados ou em lote no modal de distribuição de horários), o sistema salvava as informações exclusivamente no banco de dados (`metadata.data` e `metadata.horario`).
  - Os arquivos físicos no sistema de arquivos permaneciam com timestamps desatualizados e os containers de vídeo (`.mp4`, `.mov`) não continham a tag de cabeçalho `creation_time` gravada.
  - Como a API do Google Photos (`photoslibrary.googleapis.com`) não aceita parâmetro de data no payload REST de criação e extrai a data unicamente dos átomos internos do container binário do vídeo, a ausência de `creation_time` fazia o Google Fotos aplicar o fallback para o momento exato do upload.
  - Com isso, envios em lote chegavam ao Google Fotos agrupados sequencialmente no segundo em que o worker executou, desrespeitando as datas retroativas ou personalizadas configuradas pelo usuário.
- **Solução**:
  - **Serviço Centralizado `AplicarMetadataArquivoService`**:
    - Criado serviço em `src/Service/MediaItem/AplicarMetadataArquivoService.php` para interpretar datas e horários em múltiplos formatos (`YYYYMMDD`, `YYYY-MM-DD HH:MM:SS`, ISO 8601) convertendo com precisão para o fuso horário oficial (`America/Sao_Paulo`).
    - Para arquivos de vídeo (`.mp4`, `.mov`, `.m4v`, `.mkv`, `.webm`), executa o FFmpeg com `-c copy` (sem reencodamento, operação quase instantânea em ~0.4s) injetando `-metadata creation_time=...`, `-metadata:s:v creation_time=...` e `-metadata:s:a creation_time=...`, além de título e autor.
    - **Ajuste Fino de Fuso Nominal**: Como a API do Google Photos não possui metadados de fuso nem tags GPS em vídeos web e interpreta o valor de `creation_time` diretamente como hora local de exibição, a injeção foi refinada para gravar a hora nominal configurada pelo usuário (ex: 19:00:00Z), impedindo que o Google Photos adicione 3 horas a mais (ex: 22h) na galeria.
    - Sincroniza atime e mtime do sistema de arquivos via `touch()`, garantindo que exploradores de arquivos, Syncthing e players nativos exibam a data e hora exatas da mídia.
  - **Injeção Automática na Edição e Distribuição de Horários**:
    - Integrado a `AtualizarMetadataMediaItemService`: ao salvar edições pontuais ou ao aplicar cálculo de distribuição em lote (`distribuirHorarios`), os arquivos físicos são atualizados imediatamente.
  - **Injeção na Distribuição Local**:
    - Integrado a `DistribuirLocalService`: ao mover/copiar arquivos para as pastas das categorias, os metadados e timestamps são reaplicados no arquivo de destino.
  - **Salvaguarda Pré-Upload no Google Fotos**:
    - Integrado a `EnviarGoogleFotosService`: antes da leitura de bytes para o endpoint `/v1/uploads`, o serviço revalida e garante que o arquivo binário possua a tag `creation_time` injetada.
  - **Reenvio dos Vídeos Afetados**:
    - Executado reprocessamento dos 17 vídeos históricos que haviam sido agrupados indevidamente no upload anterior, carimbando seus arquivos físicos e reenviando para o Google Fotos com os timestamps originais e horários nominais exatos.
- **Arquivos**:
  - `src/Service/MediaItem/AplicarMetadataArquivoService.php`
  - `src/Service/MediaItem/AtualizarMetadataMediaItemService.php`
  - `src/Service/Distribuicao/DistribuirLocalService.php`
  - `src/Service/GoogleFotos/EnviarGoogleFotosService.php`

---

### ✅ Melhoria 69 — Remoção de Blur e Animações de Página que Travavam Carregamento, Navegação e Popups

- **Status**: Concluído
- **Data**: 13 de outubro de 2026
- **Problema**:
  - A interface travava ao carregar, ao trocar de página e ao abrir popups.
  - Cada card de mídia aplicava vários `backdrop-filter: blur`, o header e as barras flutuantes também, e o backdrop dos diálogos desfocava a tela inteira por cima dessa grade.
  - A troca de rota animava a página inteira com `will-change: transform, opacity`, e a troca de aba, filtro ou página remontava a grade só para repetir a animação.
- **Solução**:
  - Removido o blur de diálogos, cards, header, login e barras de ação. O fundo dos popups ficou só com a camada escura.
  - Desligadas as animações de entrada de página, de aba e de elevação dos cards (`page-transition-enter`, `tab-pane-fade`, `smooth-card`, `smooth-media-item`, `smooth-thumb-zoom`).
  - A navegação deixou de remontar o `<Outlet />` a cada rota, e as grades de downloads, prints, central de mídias e dashboard deixaram de remontar ao mudar filtro ou página.
  - Diálogos passaram a usar `lazyMount` e `unmountOnExit`, e os cards da grade usam `content-visibility: auto` para não pintar o que está fora da tela.
- **Arquivos**:
  - `web/index.css`
  - `web/layouts/MainLayout.tsx`
  - `web/layouts/Header.tsx`
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `web/features/downloads-video/components/CardVideo.tsx`
  - `web/features/central-midias/CentralMidias.tsx`
  - `web/features/central-midias/components/CardMidiaCentral.tsx`
  - `web/features/prints/Prints.tsx`
  - `web/features/prints/components/CardPrint.tsx`
  - `web/features/upload-manual/components/CardItemTriagem.tsx`
  - `web/shared/components/responsive/DialogOuDrawer.tsx`

---

### ✅ Melhoria 70 — Ordenação da Central de Downloads pela Data de Exibição do Vídeo (Download ou Edição)

- **Status**: Concluído
- **Data**: 13 de outubro de 2026
- **Problema**:
  - A Central de Downloads listava os vídeos pela data em que o registro entrou no sistema (`criadoEm`), sempre do mais novo para o mais antigo.
  - A data mostrada no card é outra: a data editada (`metadata.data` + `metadata.horario`) ou, se ninguém editou, a data do download.
  - Ao alterar a data de um vídeo, individualmente ou na distribuição de horários em lote, a posição dele na grade não mudava.
- **Solução**:
  - Criado o campo `dataExibicao` em `MediaItem`, preenchido com a data e hora de exibição do vídeo. Sem data editada, o valor fica igual ao do download.
  - Toda gravação de metadados recalcula esse campo, inclusive a distribuição de horários em lote.
  - A listagem da Central de Downloads pede `ordenacao=dataExibicao` em ordem decrescente, então o vídeo editado passa a ocupar o lugar correspondente em relação aos demais.
  - Migration `Version20261014030100` cria a coluna, preenche os vídeos já existentes e indexa a ordenação.
- **Arquivos**:
  - `src/Entity/MediaItem.php`
  - `src/Repository/MediaItemRepository.php`
  - `web/features/downloads-video/DownloadsVideo.tsx`
  - `migrations/Version20261014030100.php`

---

### ✅ Melhoria 71 — Data de Criação do Download no Momento do Download, e não na Data de Publicação da Plataforma

- **Status**: Concluído
- **Data**: 14 de outubro de 2026
- **Problema**:
  - Ao baixar um vídeo, o sistema gravava em `metadata.data` o `upload_date` do yt-dlp, que é a data em que o vídeo foi publicado no TikTok, YouTube ou outra plataforma.
  - Um vídeo baixado em 14/10 aparecia como 05/10, 08/10 ou 12/10. O horário do card ainda vinha do momento do download, então a data e a hora não batiam.
  - Quem queria a data real do download precisava abrir o modal e editar um por um.
- **Solução**:
  - O download passa a gravar `data` e `horario` com o instante atual em `America/Sao_Paulo`, e carimba esse instante no arquivo.
  - O yt-dlp baixa com `--no-mtime`, para não herdar a data de publicação no arquivo.
  - Uma edição manual continua sobrescrevendo essa data, e a ordem da lista acompanha a data nova.
  - Vídeos já baixados que ainda estavam só com a data `YYYYMMDD` da plataforma, e que não foram editados nem vieram da Franky, voltam para a data em que foram baixados.
- **Arquivos**:
  - `src/Service/Video/BaixarVideoDownloadService.php`
  - `src/Service/Video/BaixarVideoService.php`
  - `src/Service/Video/ExtrairMetadataVideoService.php`
  - `src/Infra/YtDlp/YtDlpClient.php`
  - `migrations/Version20261014223000.php`

### ✅ Melhoria 72 — Suporte Nativo a Cookies para yt-dlp, Diagnóstico de Bloqueio Anti-Bot e Exibição de Mensagens Claras de Erro

- **Status**: Concluído
- **Data**: 15 de outubro de 2026
- **Problema**:
  - Ao tentar baixar certos vídeos do YouTube (como trailers restritos e vídeos musicais com proteção estrita, ex: trailer oficial do GTA VI `rz1B4B2yBZY`), o download falhava e a interface exibia apenas uma mensagem genérica opaca: `Request failed with status code 400`.
  - O YouTube responde a requisições de IPs de data center (VPS) com `LOGIN_REQUIRED` e a mensagem de anti-bot `Sign in to confirm you’re not a bot. Use --cookies-from-browser or --cookies for the authentication`.
  - O backend (`YtDlpClient`) descartava a saída de erro (`stderr`) do `Process`, disparando uma exceção com mensagem estática sem detalhes.
  - O frontend (`useFilaDownloadsStore`) procurava mensagens em `error?.response?.data?.message`, enquanto o listener de erro do Symfony devolvia a chave `error`, provocando fallback para a mensagem padrão do Axios (`Request failed with status code 400`).
  - O sistema não possuía suporte nativo nem pasta mapeada para injetar arquivos de cookies (`--cookies`) no `yt-dlp`.
- **Solução**:
  - **Suporte Nativo a Cookies no `YtDlpClient`**:
    - O cliente agora verifica se existe um arquivo de cookies configurado via parâmetro `YTDLP_COOKIES_PATH` ou posicionado nos caminhos padrão (`var/cookies/youtube.txt`, `var/cookies/cookies.txt`, `var/storage/cookies/youtube.txt`).
    - Se encontrado, injeta automaticamente o argumento `--cookies <caminho>` tanto na extração de metadados (`--dump-json`) quanto no download de arquivos.
  - **Tratamento Inteligente de Erros no Backend**:
    - `YtDlpClient` agora analisa a saída de erro (`stderr`). Se o YouTube responder com exigência anti-bot (`Sign in to confirm you're not a bot`), a mensagem é traduzida e enriquecida com a orientação exata para o usuário.
    - `YtDlpException` aceita detalhe dinâmico do erro para manter código HTTP e contexto claros.
  - **Exibição Transparente no Frontend**:
    - `useFilaDownloadsStore` passa a extrair `error?.response?.data?.error` prioritariamente, garantindo que a explicação exata chegue ao card de download e ao toast.
  - **Estrutura de Armazenamento e Volume Docker**:
    - Criado o diretório `var/cookies/` com `.gitignore` (protegendo credenciais) e `README.md` com instruções de exportação rápida via extensão de navegador.
    - Mapeado o volume `../var/cookies:/var/www/html/var/cookies` no `devops/docker-compose.prod.yaml`.
- **Arquivos**:
  - `src/Infra/YtDlp/YtDlpClient.php`
  - `src/Exception/Video/YtDlpException.php`
  - `config/services.yaml`
  - `web/features/downloads-video/stores/useFilaDownloadsStore.ts`
  - `devops/docker-compose.prod.yaml`
  - `var/cookies/.gitignore`
  - `var/cookies/README.md`

---

### ✅ Melhoria 73 — Resiliência da Fila de Downloads, Download + Extração de Metadados em Passo Único e Isolamento de Flags por Plataforma (TikTok / YouTube / X)

- **Status**: Concluído
- **Data**: 15 de outubro de 2026
- **Problema**:
  - Ao enfileirar múltiplos vídeos de redes variadas (TikTok, YouTube, X/Twitter), a fila baixava 1 ou 2 vídeos e depois travava indefinidamente com o status `Baixando agora: ...` (carregando infinitamente), exigindo pausar e retomar manualmente.
  - **Causa 1 — Falta do bloco `catch` na Store da Fila (`useFilaDownloadsStore.ts`)**: Uma edição anterior havia omitido acidentalmente a linha `} catch (error: any) {` dentro de `processarFila`. Quando qualquer item retornava erro HTTP (400 ou 504), a exceção saía sem passar pelo `catch`, mantendo o item eternamente com `status: 'baixando'`. Como `processarFila` aborta quando `temItemBaixando` é verdadeiro, toda a fila ficava congelada.
  - **Causa 2 — Dupla Chamada ao `yt-dlp` e Vazamento de Flags do YouTube para o TikTok**: `BaixarVideoService` invocava o `yt-dlp` duas vezes seguidas para cada vídeo (`extrairMetadata` com `--dump-json` e depois `baixarVideo`). Além disso, `YtDlpClient` injetava os cookies do YouTube e `--extractor-args youtube:player_client=web` em todas as URLs, inclusive TikTok e X. Em downloads sequenciais do TikTok, o dobro de requisições causava bloqueio `HTTP Error 403: Forbidden`.
  - **Causa 3 — Timeout de 90s no Nginx**: O Nginx (host e container) cortava conexões em `90s` (`504 Gateway Time-out`), enquanto o timeout do `YtDlpClient` era de `300s`.
- **Solução**:
  - **Correção e Auto-Recuperação na Store (`useFilaDownloadsStore.ts` e `api.ts`)**:
    - Restaurado o bloco `} catch (error: any) {` garantindo que falhas transitem imediatamente para `status: 'erro'` e disparem o próximo item no `finally`.
    - Adicionada auto-recuperação: se `processarFila` ou `retomar` forem acionados quando `processandoAtivo` é `false` e houver algum item órfão preso em `'baixando'`, ele é automaticamente resetado para `'pendente'`.
    - Definido timeout explícito de 180s na chamada Axios `criarPedidoDownload`.
  - **Download + Metadados em Passo Único (`YtDlpClient` e `BaixarVideoService`)**:
    - `BaixarVideoService` passa a executar `baixarParaStorage($url)` antes de `extrairMetadata($url)`.
    - `YtDlpClient::baixarVideo()` utiliza `--write-info-json`, lê e armazena os metadados em cache em memória (`$this->metadataCache[$url]`) e remove o arquivo `.info.json` temporário.
    - Quando `extrairMetadata($url)` é chamado em seguida, retorna os metadados do cache em 0ms sem abrir um segundo processo `yt-dlp`, reduzindo o tempo por vídeo pela metade e evitando rate-limit.
  - **Pipeline Multi-Camada para TikTok (Portado da Franky) e Isolamento por Plataforma (`YtDlpClient`)**:
    - **YouTube**: recebe `--cookies youtube.txt`, `--remote-components ejs:github` e `youtube:player_client=web`.
    - **TikTok (Camada 1 — TikWM Sem Marca d'Água)**: consulta `https://www.tikwm.com/api/?url=...&hd=1` com proteção contra rate-limit, baixando o stream `.mp4` direto da CDN sem marca d'água (~2s por vídeo) e populando o cache de metadados (`title`, `uploader`, `duration`, `thumbnail`) sem sofrer bloqueio `HTTP 403` do WAF do TikTok em IPs de datacenter.
    - **TikTok (Camada 2 — Fallback `yt-dlp` com Retentativa de Processo + Embed URL + oEmbed)**: caso a TikWM esteja indisponível, executa até 3 tentativas de processo do `yt-dlp` (já que `--retries` interno do `yt-dlp` não repete o `403` da página inicial) e faz fallback automático para `https://www.tiktok.com/embed/v2/{id}` enriquecido com título/autor via `https://www.tiktok.com/oembed`.
    - **X / Twitter e demais**: recebem `--retries 3` e `--extractor-retries 3` sem argumentos exclusivos do YouTube.
  - **Alinhamento de Timeouts no Nginx**:
    - Aumentados `fastcgi_read_timeout` em `devops/php/nginx-internal.conf` e `proxy_read_timeout` / `proxy_send_timeout` no Nginx do host de `90s` para `300s`.
- **Arquivos**:
  - `web/features/downloads-video/stores/useFilaDownloadsStore.ts`
  - `web/features/downloads-video/api.ts`
  - `src/Service/Video/BaixarVideoService.php`
  - `src/Infra/YtDlp/YtDlpClient.php`
  - `devops/php/nginx-internal.conf`
