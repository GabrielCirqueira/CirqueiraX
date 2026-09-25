# Progresso do Roadmap — Feature 5 (Feature 4: Prints Automáticos e Upload Manual)

> Detalhamento dos tópicos 81 ao 100.

---

### ✅ Tópico 81 — Endpoint de ingestão via agente — POST /api/v1/ingestao/print
- **Status**: Concluído
- **O que foi feito**:
  - **Controller REST de Ingestão**: Criado [`src/Controller/IngestaoController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/IngestaoController.php) estendendo `DefaultController`.
  - **Endpoint HTTP POST**: Mapeada a rota `POST /api/v1/ingestao/print` protegida por `#[IsGranted('ROLE_AGENTE')]`.
  - **Autenticação via Agente**: Injeta a instância `AgenteUser` via `#[CurrentUser]` e extrai as credenciais e a origem vinculadas ao `TokenAgente` autenticado pelo header `X-Agent-Token`.
- **Arquivos envolvidos**:
  - [`src/Controller/IngestaoController.php`](file:///home/gabriel/dev/CirqueiraX/src/Controller/IngestaoController.php)

### ✅ Tópico 82 — DTO IngestarPrintDTO e upload multipart do agente
- **Status**: Concluído
- **O que foi feito**:
  - **DTO de Upload Multipart**: Criado [`src/DataObject/IngestarPrintDTO.php`](file:///home/gabriel/dev/CirqueiraX/src/DataObject/IngestarPrintDTO.php) (`final readonly class`) para capturar requisições `multipart/form-data`.
  - **Validações Symfony**: Aplicadas as restrições `#[Assert\NotNull]` para a imagem e `#[Assert\File(maxSize: '20M', mimeTypes: ['image/png', 'image/jpeg', 'image/webp'])]`.
  - **Método de Construção `fromRequest()`**: Extrai de forma inteligente o arquivo enviado via `$request->files`, nome original, timestamp de captura e decodificação do campo `metadata` em JSON ou array.
- **Arquivos envolvidos**:
  - [`src/DataObject/IngestarPrintDTO.php`](file:///home/gabriel/dev/CirqueiraX/src/DataObject/IngestarPrintDTO.php)

### ⏳ Tópico 83 — IngestarPrintService — aplica OrigemRegra e delega ao motor
- **Status**: Pendente

### ⏳ Tópico 84 — Script agente — estrutura base
- **Status**: Pendente

### ⏳ Tópico 85 — Watcher de pasta com debounce (agente)
- **Status**: Pendente

### ⏳ Tópico 86 — Cliente HTTP do agente — envio autenticado e retry
- **Status**: Pendente

### ⏳ Tópico 87 — Configuração do agente PC empresa
- **Status**: Pendente

### ⏳ Tópico 88 — Configuração do agente PC pessoal
- **Status**: Pendente

### ⏳ Tópico 89 — Persistência local do agente — evitar reenvio
- **Status**: Pendente

### ⏳ Tópico 90 — Execução do agente como serviço do SO
- **Status**: Pendente

### ⏳ Tópico 91 — Cadastro das OrigemRegra para print_empresa e print_pessoal
- **Status**: Pendente

### ⏳ Tópico 92 — Endpoint POST /api/v1/media-itens/upload (upload manual)
- **Status**: Pendente

### ⏳ Tópico 93 — UploadManualDTO e validação de tipo de arquivo
- **Status**: Pendente

### ⏳ Tópico 94 — UploadManualService — checagem de duplicidade por hash
- **Status**: Pendente

### ⏳ Tópico 95 — Resposta de duplicidade (aviso, não bloqueio)
- **Status**: Pendente

### ⏳ Tópico 96 — Frontend — estrutura da feature upload-manual
- **Status**: Pendente

### ⏳ Tópico 97 — Frontend — componente de dropzone
- **Status**: Pendente

### ⏳ Tópico 98 — Frontend — fila de triagem pós-upload
- **Status**: Pendente

### ⏳ Tópico 99 — Frontend — página UploadManual.tsx completa
- **Status**: Pendente

### ⏳ Tópico 100 — Teste end-to-end de agentes e upload manual, documentação atualizada
- **Status**: Pendente
