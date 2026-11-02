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

### ✅ Tópico 146 — Frontend — biblioteca de livros com upload, cards e progresso
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criados utilitários de apresentação em `web/features/livros-audio/utils/livros.ts` (`calcularProgressoLeitura`, `obterAparenciaStatusLivro`, `formatarTamanhoLivro`, `formatarDataRelativa`, `contarLivrosPorStatus`).
  - Implementado o componente `ModalUploadLivro.tsx` com suporte a drag-and-drop de arquivo PDF, campo de título opcional, validação de tipos e integração com `useUploadLivroAudio`.
  - Implementado o componente `CardLivroAudio.tsx` com barra de progresso de leitura Chakra UI, badges de status, contagem de páginas, atalho para abrir o leitor (`/livros-audio/{uuid}`), download do PDF original e exclusão com confirmação.
  - Implementado o componente `GradeLivrosAudio.tsx` com estado de carregamento skeleton, visual de lista vazia amigável e grid responsivo.
  - Implementado o componente `CabecalhoLivrosAudio.tsx` com título, contadores de status agregados e botões de ação ("Atualizar" e "Novo Livro").
  - Implementada a página principal `LivrosAudio.tsx` com metadados `useSEO` e rota protegida `/livros-audio` registrada em `web/App.tsx`.
  - Adicionado item de navegação `Livros em Áudio` na `Sidebar.tsx` e título de rota no `Header.tsx`.
- **Arquivos**:
  - `web/features/livros-audio/utils/livros.ts`
  - `web/features/livros-audio/components/ModalUploadLivro.tsx`
  - `web/features/livros-audio/components/CardLivroAudio.tsx`
  - `web/features/livros-audio/components/GradeLivrosAudio.tsx`
  - `web/features/livros-audio/components/CabecalhoLivrosAudio.tsx`
  - `web/features/livros-audio/LivrosAudio.tsx`
  - `web/layouts/Sidebar.tsx`
  - `web/layouts/Header.tsx`
  - `web/App.tsx`

### ✅ Tópico 147 — Frontend — carregamento e renderização de páginas com pdf.js
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Instalado o pacote `pdfjs-dist` e configurado o carregamento do worker via Vite URL (`pdfjs-dist/build/pdf.worker.min.mjs?url`).
  - Criado o utilitário `web/features/livros-audio/utils/pdf.ts` com funções `carregarDocumentoPdf` e `renderizarPaginaEmCanvas` (suporte a telas retina via `devicePixelRatio` e controle de cancelamento com `renderTask.cancel()`).
  - Criado o hook `useDocumentoPdf.ts` com cache TanStack Query em memória (`staleTime: Infinity`).
  - Implementado o componente `PaginaPdf.tsx` para renderização reativa da página em `<canvas>` sem `useEffect`, utilizando ref callback com cancelamento automático de tarefas concorrentes e estados de loading/error.
  - Re-exportado o módulo completo em `web/features/livros-audio/index.ts`.
  - Validado com Biome (`npx biome check`) e compilado com sucesso no build do Vite (`npm run build`).
- **Arquivos**:
  - `package.json`
  - `web/features/livros-audio/utils/pdf.ts`
  - `web/features/livros-audio/hooks/useDocumentoPdf.ts`
  - `web/features/livros-audio/components/PaginaPdf.tsx`
  - `web/features/livros-audio/index.ts`

### ✅ Tópico 148 — Frontend — visualizador em formato de livro
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o hook de controle `useLeitorLivro.ts` para gerenciar página atual, escala/zoom (de 80% a 250%), modo de exibição (página única / página dupla) e alternância de tela cheia.
  - Implementado o componente `BarraSuperiorLeitor.tsx` com navegação de retorno à biblioteca, título do livro, badge de progresso, controles granulares de zoom (aumentar, diminuir, resetar), botão de página dupla com ícone dinâmico e alternância de tela cheia.
  - Implementado o componente `VisualizadorLivro.tsx` com acabamento de folha de livro, suporte a modo página dupla com simulação de lombada central em gradiente, botões laterais flutuantes para folheio rápido e navegação por teclado (`ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`) sem `useEffect`.
  - Criada a página do leitor `LeitorLivroAudio.tsx` carregando o livro e o documento PDF com tratamento de estados de carregamento e erro amigáveis.
  - Registrada a rota `/livros-audio/:uuid` em `web/App.tsx`.
- **Arquivos**:
  - `web/features/livros-audio/hooks/useLeitorLivro.ts`
  - `web/features/livros-audio/components/BarraSuperiorLeitor.tsx`
  - `web/features/livros-audio/components/VisualizadorLivro.tsx`
  - `web/features/livros-audio/LeitorLivroAudio.tsx`
  - `web/App.tsx`

### ✅ Tópico 149 — Frontend — barra inferior do livro e abertura na página salva
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Implementado o componente `BarraInferiorLeitor.tsx` contendo slider de páginas Chakra UI v3 (`Slider.Root`, `Slider.Control`, `Slider.Track`, `Slider.Range`, `Slider.Thumbs`), contador numérico tabular `X / Y`, badge de porcentagem lida e botão de marcador com indicação de estado persistido.
  - Implementada a abertura automática na página salva (`livro.paginaAtual`) vinda do backend através da inicialização de estado em `useLeitorLivro` sem violar a regra de ausência de `useEffect`.
  - Integrada a mutação `useSalvarPosicaoLivroAudio` para persistência automática ao navegar entre páginas e salvamento manual via botão "Salvar Marcador".
  - Build validado com sucesso e sem erros no Vite (`npm run build`).
- **Arquivos**:
  - `web/features/livros-audio/components/BarraInferiorLeitor.tsx`
  - `web/features/livros-audio/LeitorLivroAudio.tsx`
  - `web/features/livros-audio/index.ts`

### ✅ Tópico 150 — Infra — extração de texto do PDF por página
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Instalado o utilitário nativo de alta performance `poppler-utils` (`pdftotext`) nas imagens Docker (`devops/php/Dockerfile` e `devops/php/Dockerfile.prod`).
  - Criada a interface `ExtratorTextoPdfInterface` em `src/Interface/` com os métodos `extrairTextoDaPagina(string $caminhoPdf, int $numeroPagina): string` e `extrairTextoDeIntervalo(string $caminhoPdf, int $paginaInicio, int $paginaFim): array`.
  - Criada a classe de exceção personalizada `ExtratorPdfException` em `src/Exception/Pdf/` com métodos estáticos descritivos em português.
  - Implementado o cliente de infraestrutura `ExtratorTextoPdfClient` em `src/Infra/Pdf/` utilizando `Symfony\Component\Process\Process`, timeout configurável em constante (`30.0s`), codificação `UTF-8` e validações de integridade de arquivo e página.
  - Registrado o serviço e a interface no container DI em `config/services.yaml`.
- **Arquivos**:
  - `devops/php/Dockerfile`
  - `devops/php/Dockerfile.prod`
  - `src/Interface/ExtratorTextoPdfInterface.php`
  - `src/Exception/Pdf/ExtratorPdfException.php`
  - `src/Infra/Pdf/ExtratorTextoPdfClient.php`
  - `config/services.yaml`

### ✅ Tópico 151 — Entidade LivroAudioBloco e migration
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o enum `StatusLivroAudioBloco` com os estados `pendente`, `gerando`, `pronto` e `erro`, incluindo métodos descritivos e predicados booleanos `is*`.
  - Criada a entidade `LivroAudioBloco` com UUID v7 como chave primária, relacionamento ManyToOne com `LivroAudio` (com `onDelete: CASCADE`), campos `numeroBloco`, `paginaInicio`, `paginaFim`, `texto`, `caminhoAudio`, `duracaoSegundos`, `tamanhoBytes`, `status`, `erroMotivo`, `criadoEm` e `atualizadoEm`.
  - Implementados métodos de intenção de domínio (`iniciarGeracao`, `concluirGeracao`, `registrarFalha`) e predicados `is*`.
  - Atualizada a entidade `LivroAudio` com relacionamento OneToMany inverso para `LivroAudioBloco` (`$blocos`, `Collection`).
  - Criado o repositório `LivroAudioBlocoRepository` com métodos para persistência, busca por número de bloco, listagem por livro e busca de blocos pendentes para a fila de geração.
  - Gerada e aplicada a migration `Version20261102215610.php` via `make doctrine-diff` e `make migrate`, com validação do schema 100% sincronizado via `make doctrine-validate`.
- **Arquivos**:
  - `src/Enum/StatusLivroAudioBloco.php`
  - `src/Entity/LivroAudioBloco.php`
  - `src/Entity/LivroAudio.php`
  - `src/Repository/LivroAudioBlocoRepository.php`
  - `migrations/Version20261102215610.php`

### ✅ Tópico 152 — Pipeline de limpeza do texto e divisão em blocos por páginas
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o serviço `LimpezaTextoPdfService` em `src/Service/LivroAudio/` especializado na higienização de textos extraídos de arquivos PDF:
    - Normalização de quebras de linha (`\r\n` para `\n`).
    - Substituição de ligaduras tipográficas e pontuação especial (`ﬁ`, `ﬂ`, `ﬀ`, `ﬃ`, `ﬄ`, `’`, `“`, `”`, `–`, `—`, `…`).
    - Remoção de caracteres de controle invisíveis e ruídos de codificação.
    - Junção de palavras hifenizadas no final de linhas (`palavra-\ncontinua` -> `palavracontinua`).
    - Remoção de numerações de página isoladas no cabeçalho ou rodapé.
    - Normalização de espaços múltiplos e redução de quebras excessivas.
  - Criado o serviço `DividirLivroEmBlocosService` em `src/Service/LivroAudio/`:
    - Validação de integridade do arquivo PDF no disco.
    - Atualização do status do livro para `extraindo`.
    - Iteração página a página com `ExtratorTextoPdfInterface`.
    - Higienização de cada página via `LimpezaTextoPdfService`.
    - Agrupamento em blocos sequenciais respeitando limites ideais para síntese de voz (3 páginas ou ~3.500 caracteres).
    - Instanciação de entidades `LivroAudioBloco` com status inicial `pendente`.
    - Persistência no banco via `LivroAudioBlocoRepository` e transição do status do `LivroAudio` para `gerando_audio`.
- **Arquivos**:
  - `src/Service/LivroAudio/LimpezaTextoPdfService.php`
  - `src/Service/LivroAudio/DividirLivroEmBlocosService.php`

### ✅ Tópico 153 — Infra — sintetizador de voz com edge-tts e Piper
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Configurado o suporte a `edge-tts` nos Dockerfiles de desenvolvimento e produção (`devops/php/Dockerfile` e `devops/php/Dockerfile.prod`) utilizando `py3-pip` e o executável do Python.
  - Criado o DTO `ResultadoSinteseVozDTO` em `src/DataObject/` contendo `caminhoAudio`, `duracaoSegundos` e `tamanhoBytes`.
  - Criada a interface `SintetizadorVozInterface` em `src/Interface/` padronizando o contrato de síntese textual.
  - Criada a exceção de domínio `SinteseVozException` em `src/Exception/Audio/` com métodos estáticos descritivos em português.
  - Criado o cliente de infraestrutura `EdgeTtsClient` em `src/Infra/Audio/`:
    - Validação de texto não vazio e garantia de criação de diretórios de destino.
    - Síntese com a voz neural em português brasileiro padrão (`pt-BR-AntonioNeural`), configurável por parâmetro.
    - Execução desacoplada via `Symfony\Component\Process\Process` com timeout seguro.
    - Extração automática da duração exata em segundos através do `ffprobe` e tamanho do arquivo via `filesize`.
  - Registrado o alias do serviço em `config/services.yaml` apontando `App\Interface\SintetizadorVozInterface` para `App\Infra\Audio\EdgeTtsClient`.
- **Arquivos**:
  - `devops/php/Dockerfile`
  - `devops/php/Dockerfile.prod`
  - `src/DataObject/ResultadoSinteseVozDTO.php`
  - `src/Interface/SintetizadorVozInterface.php`
  - `src/Exception/Audio/SinteseVozException.php`
  - `src/Infra/Audio/EdgeTtsClient.php`
  - `config/services.yaml`

### ✅ Tópico 154 — Fila dedicada e mensagens do livro em áudio
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Configurado o transporte dedicado `livro_audio` em `config/packages/messenger.yaml` com fila própria no Doctrine (`queue_name: livro_audio`) e estratégia de retentativas (`max_retries: 3`, `multiplier: 2`).
  - Configurado o roteamento específico no Symfony Messenger para direcionar `App\Message\ProcessarLivroAudioMessage` e `App\Message\GerarAudioBlocoMessage` para o transporte `livro_audio`, isolando totalmente o processamento de livros da fila geral `async` de mídias.
  - Adicionado o worker dedicado `[program:messenger-livro-audio]` no Supervisor de desenvolvimento (`devops/supervisord.conf`) e de produção (`devops/php/supervisord-prod.conf`) consumindo a fila `livro_audio` com limite de memória de 256MB e reinício automático.
  - Criadas as mensagens `ProcessarLivroAudioMessage` e `GerarAudioBlocoMessage` em `src/Message/`.
  - Criados os message handlers `ProcessarLivroAudioMessageHandler` e `GerarAudioBlocoMessageHandler` em `src/MessageHandler/` com injeção de dependência e delegação direta aos serviços responsáveis.
- **Arquivos**:
  - `config/packages/messenger.yaml`
  - `devops/supervisord.conf`
  - `devops/php/supervisord-prod.conf`
  - `src/Message/ProcessarLivroAudioMessage.php`
  - `src/Message/GerarAudioBlocoMessage.php`
  - `src/MessageHandler/ProcessarLivroAudioMessageHandler.php`
  - `src/MessageHandler/GerarAudioBlocoMessageHandler.php`

### ✅ Tópico 155 — Geração do áudio dos blocos
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o serviço `GerarAudioBlocoService` em `src/Service/LivroAudio/`:
    - Busca e validação do bloco por UUID com idempotência (ignora se já estiver `pronto`).
    - Transição de status do bloco para `gerando` e do livro para `gerando_audio`.
    - Resolução e criação do diretório persistente de áudios em `var/livros/{uuid}/blocos/`.
    - Execução da síntese de áudio através de `SintetizadorVozInterface` gerando o arquivo MP3 sequencial (`bloco_{numero}.mp3`).
    - Gravação da duração exata em segundos e do tamanho em bytes no `LivroAudioBloco`.
    - Atualização do status geral do livro: concluído (`pronto`) quando todos os blocos estiverem sintetizados, ou `parcial` caso haja falhas pontuais permitindo retentativa.
    - Registro de falha pontual no bloco (`registrarFalha`) em caso de exceção, relançando para permitir retentativas automáticas do Messenger.
  - Criado o serviço `ProcessarLivroAudioService` em `src/Service/LivroAudio/`:
    - Orquestra a extração do PDF e divisão inicial em blocos caso o livro ainda não possua blocos cadastrados via `DividirLivroEmBlocosService`.
    - Suporte a retentativas recuperando blocos não prontos com `listarNaoProntosDoLivro`.
    - Despacho assíncrono de cada `GerarAudioBlocoMessage` para a fila dedicada `livro_audio`.
  - Atualizado `UploadLivroAudioService` para disparar assincronamente `ProcessarLivroAudioMessage` logo após o upload do PDF, tornando o fluxo de processamento de áudio 100% automático e não-bloqueante.
- **Arquivos**:
  - `src/Service/LivroAudio/GerarAudioBlocoService.php`
  - `src/Service/LivroAudio/ProcessarLivroAudioService.php`
  - `src/Service/LivroAudio/UploadLivroAudioService.php`
  - `src/Repository/LivroAudioBlocoRepository.php`

### ✅ Tópico 156 — Stream do bloco e renovação do token de acesso
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Implementado o endpoint `GET /api/v1/livros-audio/{uuid}/blocos/{numeroBloco}/stream` no `LivroAudioController` servindo áudios MP3 sequenciais com `BinaryFileResponse`, suporte completo a cabeçalho `Range` (HTTP 206 Partial Content), ETag e Content-Type `audio/mpeg`.
  - Criado o método `obterArquivoBloco` em `ConsultarLivrosAudioService` validando permissão do usuário, existência do bloco e disponibilidade física do arquivo em disco.
  - Adicionadas as exceções de domínio `blocoNaoEncontrado` e `audioBlocoNaoDisponivel` em `LivroAudioException`.
  - Confirmado o suporte a autenticação por query parameter `?token=...` configurado no `LexikJWTAuthenticationBundle` para tags nativas `<audio>`.
  - Criada a função auxiliar `obterUrlStreamBloco` em `web/features/livros-audio/api.ts` permitindo obter a URL do bloco com token autenticado e suporte a sobreposição/renovação de token na transição entre blocos e no tratamento de 401.
- **Arquivos**:
  - `src/Controller/LivroAudio/LivroAudioController.php`
  - `src/Service/LivroAudio/ConsultarLivrosAudioService.php`
  - `src/Exception/LivroAudio/LivroAudioException.php`
  - `web/features/livros-audio/api.ts`

### ✅ Tópico 157 — Retenção e controle de espaço em disco dos livros
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Definida e formalizada a política de ciclo de vida e retenção: livros em áudio possuem **retenção permanente**, isentos da expiração automática de 7 dias aplicada a downloads efêmeros de música/áudios.
  - Garantido que a remoção de um livro via `DELETE /api/v1/livros-audio/{uuid}` (`ApagarLivroAudioService` e `ArmazenamentoLivroClient::removerLivro`) expurga recursivamente todo o diretório do livro em `var/livros/{uuid}/`, incluindo o PDF original e todos os arquivos MP3 de blocos gerados, além da cascata relacional no banco (`onDelete: CASCADE`).
  - Adicionado o método `tamanhoTotalBytes` na entidade `LivroAudio` somando os bytes do PDF e de todos os blocos gerados.
  - Serializado o campo `tamanhoTotalBytes` em `LivroAudioSerializer` e adicionado aos tipos Zod/TypeScript em `web/features/livros-audio/types.ts`.
  - Atualizado o card de exibição da biblioteca (`CardLivroAudio.tsx`) para apresentar o tamanho total consumido em disco pelo livro.
  - Atualizado o `HealthController` (`/api/v1/health`) para monitorar o espaço livre específico do volume persistente de livros (`disk_livros`, apontando para `var/livros`), com status crítico caso o espaço livre seja inferior a 100 MB.
  - Criada a documentação arquitetural em `documentation/regras/RETENCAO_E_LIMPEZA.md`.
- **Arquivos**:
  - `src/Entity/LivroAudio.php`
  - `src/Serializer/LivroAudioSerializer.php`
  - `src/Controller/Sistema/HealthController.php`
  - `web/features/livros-audio/types.ts`
  - `web/features/livros-audio/components/CardLivroAudio.tsx`
  - `documentation/regras/RETENCAO_E_LIMPEZA.md`

### ✅ Tópico 158 — Frontend — player de áudio com capítulos e configurações
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criado o serializer `LivroAudioBlocoSerializer` em `src/Serializer/` normalizando os blocos com paginação e status.
  - Criado o endpoint `GET /api/v1/livros-audio/{uuid}/blocos` no `LivroAudioController` e método `listarBlocosDoLivro` em `ConsultarLivrosAudioService`.
  - Definidos schemas Zod e types TypeScript para `LivroAudioBloco` e `StatusLivroAudioBloco` em `web/features/livros-audio/types.ts`.
  - Implementada a função `listarBlocosLivroAudio` em `web/features/livros-audio/api.ts` e o hook TanStack Query `useBlocosLivroAudio` com polling inteligente quando houver blocos sendo gerados.
  - Criado o componente `PlayerAudioLivro` em `web/features/livros-audio/components/PlayerAudioLivro.tsx`:
    - Controles de reprodução: Play/Pause, avançar 15s, retroceder 15s, próximo bloco e bloco anterior.
    - Barra de progresso interativa com busca (seek) e contadores de tempo decorrido e duração total.
    - Seletor de velocidade de reprodução rápida (0.75x, 1x, 1.25x, 1.5x, 2x) aplicando diretamente no `playbackRate`.
    - Gaveta de seleção de capítulos/blocos com indicador de intervalo de páginas, duração e status.
    - Integração com a `Media Session API` do navegador (`navigator.mediaSession`) para exibição de metadados e controle de áudio na tela de bloqueio e central de notificações de celulares e desktops.
    - Retomada exata do bloco e segundo salvos e persistência periódica da posição (`timeupdate`, `pause`, `pagehide`).
- **Arquivos**:
  - `src/Serializer/LivroAudioBlocoSerializer.php`
  - `src/Service/LivroAudio/ConsultarLivrosAudioService.php`
  - `src/Controller/LivroAudio/LivroAudioController.php`
  - `web/features/livros-audio/types.ts`
  - `web/features/livros-audio/api.ts`
  - `web/features/livros-audio/hooks/useLivrosAudio.ts`
  - `web/features/livros-audio/components/PlayerAudioLivro.tsx`

### ✅ Tópico 159 — Sincronização entre páginas do livro e o áudio
- **Status**: Concluído
- **Data**: 02 de novembro de 2026
- **O que foi feito**:
  - Criados utilitários de sincronização bidirecional em `web/features/livros-audio/utils/sincronizacao.ts`:
    - `encontrarBlocoPorPagina`: localiza o bloco de áudio correspondente a uma página do PDF.
    - `calcularPaginaPorTempoBloco`: interpola o tempo decorrido dentro do bloco para determinar qual página está sendo lida.
    - `formatarTempoAudio`: formatação de tempo em `mm:ss` ou `hh:mm:ss`.
  - Implementado o interruptor "Acompanhar áudio" / "Folhear livre" no `PlayerAudioLivro`:
    - **Acompanhar áudio ativo (padrão):** a página do visualizador vira automaticamente conforme o áudio avança no bloco; ao virar manualmente de página no visualizador, o áudio salta para o bloco da página aberta.
    - **Folhear livre:** o usuário pode folhear o PDF para qualquer página sem interromper nem alterar a reprodução do áudio que está tocando.
  - Integrado o `PlayerAudioLivro` com o `VisualizadorLivro` e `BarraInferiorLeitor` dentro de `LeitorLivroAudio.tsx`.
- **Arquivos**:
  - `web/features/livros-audio/utils/sincronizacao.ts`
  - `web/features/livros-audio/components/PlayerAudioLivro.tsx`
  - `web/features/livros-audio/LeitorLivroAudio.tsx`
  - `web/features/livros-audio/index.ts`

### ⏳ Tópico 160 — Teste end-to-end do fluxo completo e documentação atualizada
- **Status**: Pendente
