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

### ⏳ Tópico 142 — Upload do PDF e armazenamento em volume próprio
- **Status**: Pendente

### ⏳ Tópico 143 — Endpoints da biblioteca — listar, detalhar, apagar e servir o PDF
- **Status**: Pendente

### ⏳ Tópico 144 — Marcador de leitura — endpoint de posição e campos de retomada
- **Status**: Pendente

### ⏳ Tópico 145 — Frontend — estrutura da feature livros-audio (types, api, hooks)
- **Status**: Pendente

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
