# Progresso do Roadmap — Feature 8 (Livros em Áudio)

> Detalhamento dos tópicos 141 ao 160.

---

### ✅ Tópico 141 — Entidade LivroAudio, enum de status e migration
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o enum `StatusLivroAudio` com os estados `enviado`, `extraindo`, `gerando_audio`, `parcial`, `pronto` e `erro`, incluindo métodos descritivos e predicados booleanos `is*` (`isEnviado`, `isExtraindo`, `isGerandoAudio`, `isParcial`, `isPronto`, `isErro`, `isEmProcessamento`, `isDisponivelParaOuvir`, `isFinal`).
  - Criada a entidade `LivroAudio` com chave primária UUID v7, relacionamento com `Usuario` (onDelete: CASCADE), campos `titulo`, `caminhoPdf`, `tamanhoBytes`, `totalPaginas`, `status`, `erroMotivo`, `criadoEm` e `atualizadoEm`.
  - Implementados métodos de intenção de domínio (`iniciarExtracao`, `iniciarGeracaoAudio`, `marcarComoParcial`, `concluirGeracao`, `registrarFalha`, `atualizarTitulo`, `definirTotalPaginas`, `definirCaminhoPdf`) e predicados `is*`.
  - Criado o repositório `LivroAudioRepository` com métodos `salvar`, `remover`, `flush`, `buscarPorUuid`, `buscarDoUsuario` e `listarDoUsuario`.
  - Gerada e aplicada a migration `Version20261102210112.php` via `make doctrine-diff` e `make migrate`, com validação de schema 100% sincronizado via `make doctrine-validate`.
- **Arquivos**:
  - `src/Enum/StatusLivroAudio.php`
  - `src/Entity/LivroAudio.php`
  - `src/Repository/LivroAudioRepository.php`
  - `migrations/Version20261102210112.php`

### ✅ Tópico 142 — Upload do PDF e armazenamento em volume próprio
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o DTO `UploadLivroAudioDTO` como carregador de dados puro sem I/O, com validação de arquivo PDF (MIME `application/pdf`, `application/x-pdf` e tamanho máximo de 500 MB).
  - Criada a interface `ArmazenamentoLivroInterface` e o cliente de infraestrutura `ArmazenamentoLivroClient` em `src/Infra/Storage/` para isolar todas as operações em disco (salvar PDF, contar páginas via parsing de catálogo PDF, remover diretório recursivo).
  - Configurado o cliente de armazenamento no `config/services.yaml` com injeção do diretório `%kernel.project_dir%/var/livros`.
  - Criada a classe `LivroAudioException` em `src/Exception/LivroAudio/` com métodos de fábrica estáticos em português.
  - Implementado o serviço de caso de uso `UploadLivroAudioService` em `src/Service/LivroAudio/` para validar, armazenar o PDF no volume, calcular total de páginas e persistir o `LivroAudio`.
  - Declarado o volume persistente `livros_prod` montado em `/var/www/html/var/livros` em `devops/docker-compose.prod.yaml`.
- **Arquivos**:
  - `src/DataObject/UploadLivroAudioDTO.php`
  - `src/Interface/ArmazenamentoLivroInterface.php`
  - `src/Infra/Storage/ArmazenamentoLivroClient.php`
  - `src/Exception/LivroAudio/LivroAudioException.php`
  - `src/Service/LivroAudio/UploadLivroAudioService.php`
  - `config/services.yaml`
  - `devops/docker-compose.prod.yaml`

### ✅ Tópico 143 — Endpoints da biblioteca — listar, detalhar, apagar e servir o PDF
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o serviço `ConsultarLivrosAudioService` em `src/Service/LivroAudio/` com métodos para listar livros do usuário, obter livro individual com checagem de propriedade e preparar o `ArquivoMidiaDTO` para servir o PDF.
  - Criado o serviço `ApagarLivroAudioService` em `src/Service/LivroAudio/` para apagar os arquivos físicos no disco via `ArmazenamentoLivroInterface` e remover a entidade no repositório.
  - Criado o serializador `LivroAudioSerializer` em `src/Serializer/` para formatar os retornos da API em JSON estável sem expor entidades cruas.
  - Criado o controller `LivroAudioController` em `src/Controller/LivroAudio/` estendendo `DefaultController` com os endpoints:
    - `GET /api/v1/livros-audio`: lista livros do usuário autenticado.
    - `POST /api/v1/livros-audio`: upload de novo livro em PDF.
    - `GET /api/v1/livros-audio/{uuid}`: detalhes do livro.
    - `DELETE /api/v1/livros-audio/{uuid}`: exclusão do livro e arquivos.
    - `GET /api/v1/livros-audio/{uuid}/pdf`: stream e exibição inline do PDF original via `BinaryFileResponse` com ETag automático.
- **Arquivos**:
  - `src/Service/LivroAudio/ConsultarLivrosAudioService.php`
  - `src/Service/LivroAudio/ApagarLivroAudioService.php`
  - `src/Serializer/LivroAudioSerializer.php`
  - `src/Controller/LivroAudio/LivroAudioController.php`

### ✅ Tópico 144 — Marcador de leitura — endpoint de posição e campos de retomada
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Adicionados os campos `paginaAtual` (default 1), `blocoAtual` (nullable), `segundosNoBloco` (default 0) e `ultimaEscutaEm` (nullable) na entidade `LivroAudio`.
  - Criado o método de domínio `atualizarPosicao(int $paginaAtual, ?int $blocoAtual = null, int $segundosNoBloco = 0): self` com atualização automática de `ultimaEscutaEm` e `atualizadoEm`.
  - Gerada e aplicada a migration `Version20261102212500.php` via `make doctrine-diff` e `make migrate`, com validação de schema 100% sincronizado via `make doctrine-validate`.
  - Criado o DTO `SalvarPosicaoLivroDTO` em `src/DataObject/` com validações de constraints (`Positive`, `PositiveOrZero`).
  - Configurado o rate limiter `marcador_posicao` em `config/packages/rate_limiter.yaml` com política `token_bucket` (180 req/min).
  - Implementado o serviço `SalvarPosicaoLivroService` em `src/Service/LivroAudio/` para persistir o progresso do usuário.
  - Implementado o endpoint `PUT /api/v1/livros-audio/{uuid}/posicao` no `LivroAudioController` com rate limiter por usuário/livro e resposta serializada atualizada via `LivroAudioSerializer`.
- **Arquivos**:
  - `src/Entity/LivroAudio.php`
  - `migrations/Version20261102212500.php`
  - `src/DataObject/SalvarPosicaoLivroDTO.php`
  - `src/Service/LivroAudio/SalvarPosicaoLivroService.php`
  - `config/packages/rate_limiter.yaml`
  - `src/Serializer/LivroAudioSerializer.php`
  - `src/Controller/LivroAudio/LivroAudioController.php`

### ✅ Tópico 145 — Frontend — estrutura da feature livros-audio (types, api, hooks)
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criada a pasta da feature `web/features/livros-audio/` seguindo a arquitetura modular do frontend.
  - Criado `types.ts` com esquemas Zod (`statusLivroAudioSchema`, `livroAudioSchema`, `salvarPosicaoLivroSchema`) e tipos TypeScript inferidos (`LivroAudio`, `StatusLivroAudio`, `SalvarPosicaoLivro`, `UploadLivroAudioPayload`).
  - Criado `api.ts` com integração via cliente `@/config/api`, validação de retornos com Zod (`listarLivrosAudio`, `obterLivroAudio`, `fazerUploadLivroAudio`, `salvarPosicaoLivroAudio`, `apagarLivroAudio`, `obterUrlPdfLivro`).
  - Criado `hooks/useLivrosAudio.ts` com TanStack React Query (`useLivrosAudio`, `useLivroAudio`, `useUploadLivroAudio`, `useSalvarPosicaoLivroAudio`, `useApagarLivroAudio`), toasts automáticos via `addToast`, sem uso de `useEffect` e com atualização otimista/invalidação de queries.
  - Criado `index.ts` com re-exportação unificada da feature.
  - Código formatado e validado sem erros com Biome (`npx biome check web/features/livros-audio`).
- **Arquivos**:
  - `web/features/livros-audio/types.ts`
  - `web/features/livros-audio/api.ts`
  - `web/features/livros-audio/hooks/useLivrosAudio.ts`
  - `web/features/livros-audio/index.ts`

### ⏳ Tópico 146 — Frontend — biblioteca de livros com upload, cards e progresso
- **Status**: Pendente

### ⏳ Tópico 147 — Frontend — carregamento e renderização de páginas com pdf.js
- **Status**: Pendente

### ⏳ Tópico 148 — Frontend — visualizador em formato de livro
- **Status**: Pendente

### ⏳ Tópico 149 — Frontend — barra inferior do livro e abertura na página salva
- **Status**: Pendente

### ⏳ Tópico 150 — Infra — extração de texto do PDF por página
- **Status**: Pendente

### ⏳ Tópico 151 — Entidade LivroAudioBloco e migration
- **Status**: Pendente

### ⏳ Tópico 152 — Pipeline de limpeza do texto e divisão em blocos por páginas
- **Status**: Pendente

### ⏳ Tópico 153 — Infra — sintetizador de voz com edge-tts e Piper
- **Status**: Pendente

### ⏳ Tópico 154 — Fila dedicada e mensagens do livro em áudio
- **Status**: Pendente

### ⏳ Tópico 155 — Geração do áudio dos blocos
- **Status**: Pendente

### ⏳ Tópico 156 — Stream do bloco e renovação do token de acesso
- **Status**: Pendente

### ⏳ Tópico 157 — Retenção e controle de espaço em disco dos livros
- **Status**: Pendente

### ⏳ Tópico 158 — Frontend — player de áudio com capítulos e configurações
- **Status**: Pendente

### ⏳ Tópico 159 — Sincronização entre páginas do livro e o áudio
- **Status**: Pendente

### ⏳ Tópico 160 — Teste end-to-end do fluxo completo e documentação atualizada
- **Status**: Pendente
