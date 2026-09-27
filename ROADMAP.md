# Roadmap — Feature 4: Prints Automáticos e Upload Manual

> Backlog e planejamento do projeto. Cada tópico descreve o que existe (ou faltava), por que importa e o que precisa acontecer. Marque `[x]` no checklist ao concluir.

**Numeração:** tópicos 81–100.

**Índice visual:** [PROGRESSO_ROADMAP.md](documentation/progresso/PROGRESSO_ROADMAP.md) · **Detalhamento:** [PROGRESSO_ROADMAP_5.md](documentation/progresso/PROGRESSO_ROADMAP_5.md)

---

## Índice

| # | Tópico |
|---|---|
| 81 | Endpoint de ingestão via agente — POST /api/v1/ingestao/print |
| 82 | DTO IngestarPrintDTO e upload multipart do agente |
| 83 | IngestarPrintService — aplica OrigemRegra e delega ao motor |
| 84 | Script agente — estrutura base |
| 85 | Watcher de pasta com debounce (agente) |
| 86 | Cliente HTTP do agente — envio autenticado e retry |
| 87 | Configuração do agente PC empresa |
| 88 | Configuração do agente PC pessoal |
| 89 | Persistência local do agente — evitar reenvio |
| 90 | Execução do agente como serviço do SO |
| 91 | Cadastro das OrigemRegra para print_empresa e print_pessoal |
| 92 | Endpoint POST /api/v1/media-itens/upload (upload manual) |
| 93 | UploadManualDTO e validação de tipo de arquivo |
| 94 | UploadManualService — checagem de duplicidade por hash |
| 95 | Resposta de duplicidade (aviso, não bloqueio) |
| 96 | Frontend — estrutura da feature upload-manual |
| 97 | Frontend — componente de dropzone |
| 98 | Frontend — fila de triagem pós-upload |
| 99 | Frontend — página UploadManual.tsx completa |
| 100 | Teste end-to-end de agentes e upload manual, documentação atualizada |

---

## Checklist

- [x] **81. Endpoint de ingestão via agente — POST /api/v1/ingestao/print**
- [x] **82. DTO IngestarPrintDTO e upload multipart do agente**
- [x] **83. IngestarPrintService — aplica OrigemRegra e delega ao motor**
- [x] **84. Script agente — estrutura base**
- [x] **85. Watcher de pasta com debounce (agente)**
- [x] **86. Cliente HTTP do agente — envio autenticado e retry**
- [x] **87. Configuração do agente PC empresa**
- [x] **88. Configuração do agente PC pessoal**
- [ ] **89. Persistência local do agente — evitar reenvio**
- [ ] **90. Execução do agente como serviço do SO**
- [ ] **91. Cadastro das OrigemRegra para print_empresa e print_pessoal**
- [ ] **92. Endpoint POST /api/v1/media-itens/upload (upload manual)**
- [ ] **93. UploadManualDTO e validação de tipo de arquivo**
- [ ] **94. UploadManualService — checagem de duplicidade por hash**
- [ ] **95. Resposta de duplicidade (aviso, não bloqueio)**
- [ ] **96. Frontend — estrutura da feature upload-manual**
- [ ] **97. Frontend — componente de dropzone**
- [ ] **98. Frontend — fila de triagem pós-upload**
- [ ] **99. Frontend — página UploadManual.tsx completa**
- [ ] **100. Teste end-to-end de agentes e upload manual, documentação atualizada**

---

## Detalhamento

### Tópico 81 — Endpoint de ingestão via agente — POST /api/v1/ingestao/print

**O que existe hoje:** `TokenAgenteAuthenticator` e `AgenteUser` já validam o header `X-Agent-Token` no firewall `api` (Feature 1, tópico 29), mas nenhuma rota usa essa autenticação ainda.

**Por que importa:** é o endpoint que os dois agentes de print (empresa e pessoal) vão chamar — precisa aceitar autenticação de serviço, não JWT de usuário.

**O que precisa acontecer:** `IngestaoController extends DefaultController`, rota `POST /api/v1/ingestao/print` protegida por `ROLE_AGENTE` (role retornada por `AgenteUser`), aplicando também o rate limiter `ingestao` (Feature 1, tópico 39).

---

### Tópico 82 — DTO IngestarPrintDTO e upload multipart do agente

**O que existe hoje:** `IngestarMediaDTO` (Feature 2) espera um caminho de arquivo já em disco no servidor — nada trata upload multipart vindo de fora.

**Por que importa:** o agente envia o arquivo de print pela rede, não um caminho local — o endpoint precisa receber e salvar o arquivo antes de repassar ao motor.

**O que precisa acontecer:** `IngestarPrintDTO` com o arquivo (`UploadedFile`) e metadata mínima (nome original, timestamp de captura); validação de tipo (apenas imagem) e tamanho máximo.

---

### Tópico 83 — IngestarPrintService — aplica OrigemRegra e delega ao motor

**O que existe hoje:** `OrigemRegra` cadastrável desde a Feature 2 (tópico 43), mas nenhum fluxo de print a consulta ainda — só `ClassificarMediaMessageHandler` consulta `OrigemRegra` depois que o `MediaItem` já existe.

**Por que importa:** conecta a chegada do print (autenticada por agente) ao pipeline de ingestão já existente, sem duplicar lógica de hash/dedupe.

**O que precisa acontecer:** `IngestarPrintService::executar()` — salva o arquivo recebido em disco temporário, identifica a origem pelo `TokenAgente` autenticado (`origem()` do token), e chama `IngestarMediaService::executar()` (Feature 2, tópico 45) com essa origem.

---

### Tópico 84 — Script agente — estrutura base

**O que existe hoje:** nenhum código de agente — só o design no `CIRQUEIRAX.md` (script standalone, fora do Symfony).

**Por que importa:** é a peça que roda nos dois PCs (empresa e pessoal), fora da infraestrutura Docker do backend.

**O que precisa acontecer:** decidir a linguagem (Python ou Node, conforme o design), estrutura de projeto mínima (config em arquivo `.env`/`.json` com URL do backend, token, pasta observada), dependências de watcher e cliente HTTP.

---

### Tópico 85 — Watcher de pasta com debounce (agente)

**O que existe hoje:** nada — o design prevê `watchdog` (Python) ou `chokidar` (Node), mas nenhuma implementação.

**Por que importa:** sem debounce, o agente tentaria enviar um arquivo de print ainda sendo escrito em disco pelo sistema operacional, corrompendo o upload.

**O que precisa acontecer:** watcher da pasta de screenshots do SO, aguardando estabilização do arquivo (ex: tamanho parado por N segundos) antes de disparar o envio.

---

### Tópico 86 — Cliente HTTP do agente — envio autenticado e retry

**O que existe hoje:** endpoint de ingestão pronto (tópico 81), mas nenhum cliente que o consome do lado do agente.

**Por que importa:** a rede pode falhar (VPS fora do ar, sem internet no PC) — o agente precisa lidar com isso sem perder o arquivo capturado.

**O que precisa acontecer:** requisição multipart com header `X-Agent-Token`, fila local de retry com backoff quando o backend não responder.

---

### Tópico 87 — Configuração do agente PC empresa

**O que existe hoje:** comando `app:agente:gerar-token` já existe (Feature 1, tópico 30), mas nenhum token foi emitido nem configurado em uma máquina real.

**Por que importa:** é a primeira instância real do agente rodando, com sua própria identidade e pasta observada.

**O que precisa acontecer:** gerar o token via `app:agente:gerar-token` com origem `print_empresa`, configurar o agente (tópico 84) nesse PC apontando pra pasta de screenshots correta.

---

### Tópico 88 — Configuração do agente PC pessoal

**O que existe hoje:** mesma base do tópico anterior, mas pra segunda máquina.

**Por que importa:** valida que o sistema suporta múltiplos agentes simultâneos com origens diferentes, sem um interferir no outro.

**O que precisa acontecer:** gerar token com origem `print_pessoal`, configurar o agente nesse PC.

---

### Tópico 89 — Persistência local do agente — evitar reenvio

**O que existe hoje:** nenhum controle de "já enviei esse arquivo" do lado do agente — a deduplicação por hash só acontece no backend (Feature 2, tópico 45).

**Por que importa:** evita que o agente fique reenviando o mesmo arquivo a cada reinício, mesmo que o backend descarte por hash duplicado — economiza banda e ruído de log.

**O que precisa acontecer:** arquivo local simples (SQLite ou JSON) guardando os arquivos já enviados com sucesso, checado antes de cada tentativa de envio.

---

### Tópico 90 — Execução do agente como serviço do SO

**O que existe hoje:** o agente (se implementado até aqui) rodaria manualmente em primeiro plano — não sobrevive a reinício da máquina.

**Por que importa:** o agente precisa estar sempre ativo, sem depender de alguém lembrar de rodar o script.

**O que precisa acontecer:** configuração como serviço nativo do SO de cada PC (systemd no Linux, Task Scheduler no Windows, launchd no macOS — conforme o SO real de cada máquina), com reinício automático em caso de crash.

---

### Tópico 91 — Cadastro das OrigemRegra para print_empresa e print_pessoal

**O que existe hoje:** endpoints de `OrigemRegra` prontos desde a Feature 2 (tópico 43), mas nenhum registro cadastrado ainda.

**Por que importa:** sem essa regra, prints dos agentes cairiam como `EM_FILA` aguardando classificação manual — quebrando o objetivo de automação total do módulo de prints.

**O que precisa acontecer:** criar via API (ou seed) as duas `OrigemRegra` (`print_empresa` → categoria X, `print_pessoal` → categoria Y), decidindo com o usuário quais categorias reais usar.

---

### Tópico 92 — Endpoint POST /api/v1/media-itens/upload (upload manual)

**O que existe hoje:** nenhum endpoint aceita upload direto de arquivo pelo usuário via dashboard — só a ingestão automatizada dos módulos anteriores.

**Por que importa:** cobre mídia que não passa pelo bot nem pelos agentes — arquivo que já existe no dispositivo do usuário.

**O que precisa acontecer:** rota `POST /api/v1/media-itens/upload` (multipart, autenticada via JWT de usuário, não token de agente), aceitando foto ou vídeo.

---

### Tópico 93 — UploadManualDTO e validação de tipo de arquivo

**O que existe hoje:** nenhuma validação de tipo MIME nem tamanho pra upload vindo do usuário.

**Por que importa:** o upload manual aceita "qualquer mídia", mas ainda precisa rejeitar arquivos fora do escopo (documentos, executáveis).

**O que precisa acontecer:** `UploadManualDTO` com `UploadedFile`, validação de MIME type (imagem/vídeo) e tamanho máximo configurável.

---

### Tópico 94 — UploadManualService — checagem de duplicidade por hash

**O que existe hoje:** `MediaItemRepository::buscarPorHash()` já existe (Feature 1/2), mas o upload manual ainda não o consulta antes de aceitar.

**Por que importa:** é o cenário onde duplicidade é mais provável — o usuário pode arrastar o mesmo arquivo duas vezes sem perceber.

**O que precisa acontecer:** `UploadManualService::executar()` calcula o hash antes de salvar definitivamente, consulta duplicidade e decide se segue pra ingestão (tópico 95 trata a resposta ao usuário).

---

### Tópico 95 — Resposta de duplicidade (aviso, não bloqueio)

**O que existe hoje:** nenhum tratamento diferenciado pra arquivo duplicado no upload manual — a Feature 2 já faz *early return* silencioso na ingestão, mas o design pede aviso visível pro usuário nesse fluxo específico.

**Por que importa:** o design do sistema definiu que a duplicidade no upload manual deve **avisar**, não bloquear silenciosamente (diferente da ingestão automática dos outros módulos).

**O que precisa acontecer:** resposta HTTP diferenciada (ex: `200` com `duplicado: true` e referência ao `MediaItem` já existente) em vez do `201` padrão de criação, pro frontend exibir o aviso.

---

### Tópico 96 — Frontend — estrutura da feature upload-manual

**O que existe hoje:** nenhuma pasta de feature de upload manual — só o padrão já estabelecido em `downloads-video` (Feature 3, tópico 76) como referência de estrutura.

**Por que importa:** mantém a mesma organização feature-based usada no resto do projeto.

**O que precisa acontecer:** `web/features/upload-manual/{api.ts, types.ts, hooks/, components/, index.ts}`, reaproveitando tipos já existentes de `MediaItem` onde fizer sentido.

---

### Tópico 97 — Frontend — componente de dropzone

**O que existe hoje:** nenhum componente de arrastar-e-soltar no frontend.

**Por que importa:** é a interação principal do módulo — arrastar múltiplos arquivos de uma vez, misturando foto e vídeo.

**O que precisa acontecer:** componente de dropzone (drag-and-drop + seleção manual de arquivos), com preview de miniatura antes do envio e barra de progresso por arquivo.

---

### Tópico 98 — Frontend — fila de triagem pós-upload

**O que existe hoje:** `GridVideos` e `BarraAcoesEmLote` já existem da Feature 3 (tópicos 77–78), construídos pro contexto de downloads.

**Por que importa:** o upload manual precisa da mesma mecânica de seleção em lote + definição de categoria, mas exibindo itens que chegaram sem categoria nenhuma.

**O que precisa acontecer:** avaliar se `GridVideos`/`BarraAcoesEmLote` são generalizáveis (aceitando também mídia de origem `MANUAL`) ou se precisam de uma variante própria pra fila de triagem.

---

### Tópico 99 — Frontend — página UploadManual.tsx completa

**O que existe hoje:** componentes isolados dos tópicos 97–98, sem página integrando.

**Por que importa:** fecha a experiência do usuário pro módulo de upload manual, análoga à página de downloads da Feature 3.

**O que precisa acontecer:** `web/pages/UploadManual/UploadManual.tsx`, seguindo `MainLayout → AppContainer → Container`, rota registrada em `web/App.tsx` e item de navegação no `Header`.

---

### Tópico 100 — Teste end-to-end de agentes e upload manual, documentação atualizada

**O que existe hoje:** peças isoladas testáveis, mas nenhuma validação do fluxo completo dos dois agentes rodando em paralelo nem do upload manual ponta a ponta.

**Por que importa:** fecha a Feature 4 — a partir daqui, as três fontes de mídia (download, print, upload manual) estão todas plugadas no motor da Feature 2.

**O que precisa acontecer:** teste manual com os dois agentes reais capturando print simultaneamente + teste de upload manual (incluindo o caso de duplicidade do tópico 95); `CIRQUEIRAX.md` e `DOCUMENTACAO_TECNICA.md`/`FRONTEND.md` atualizados com os nomes reais das classes e componentes implementados nesta feature.