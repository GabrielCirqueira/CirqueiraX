# Roadmap — Livros em Áudio

> Premissas deste lote: voz gratuita (edge-tts, com Piper como reserva atrás de uma interface); PDFs com texto selecionável (PDF escaneado é recusado com mensagem clara, OCR fica fora do lote); o módulo é independente do pipeline de mídias, sem categoria, Syncthing ou Google Fotos, no mesmo desenho do módulo Downloads MP3.

**Numeração:** tópicos 141–160.

## Índice

| # | Tópico |
|---|---|
| 141 | Entidade LivroAudio, enum de status e migration |
| 142 | Upload do PDF e armazenamento em volume próprio |
| 143 | Endpoints da biblioteca — listar, detalhar, apagar e servir o PDF |
| 144 | Marcador de leitura — endpoint de posição e campos de retomada |
| 145 | Frontend — estrutura da feature livros-audio (types, api, hooks) |
| 146 | Frontend — biblioteca de livros com upload, cards e progresso |
| 147 | Frontend — carregamento e renderização de páginas com pdf.js |
| 148 | Frontend — visualizador em formato de livro |
| 149 | Frontend — barra inferior do livro e abertura na página salva |
| 150 | Infra — extração de texto do PDF por página |
| 151 | Entidade LivroAudioBloco e migration |
| 152 | Pipeline de limpeza do texto e divisão em blocos por páginas |
| 153 | Infra — sintetizador de voz com edge-tts e Piper |
| 154 | Fila dedicada e mensagens do livro em áudio |
| 155 | Geração do áudio dos blocos |
| 156 | Stream do bloco e renovação do token de acesso |
| 157 | Retenção e controle de espaço em disco dos livros |
| 158 | Frontend — player de áudio com capítulos e configurações |
| 159 | Sincronização entre páginas do livro e o áudio |
| 160 | Teste end-to-end do fluxo completo e documentação atualizada |

## Checklist

- [x] **141. Entidade LivroAudio, enum de status e migration**
- [x] **142. Upload do PDF e armazenamento em volume próprio**
- [x] **143. Endpoints da biblioteca — listar, detalhar, apagar e servir o PDF**
- [x] **144. Marcador de leitura — endpoint de posição e campos de retomada**
- [x] **145. Frontend — estrutura da feature livros-audio (types, api, hooks)**
- [x] **146. Frontend — biblioteca de livros com upload, cards e progresso**
- [x] **147. Frontend — carregamento e renderização de páginas com pdf.js**
- [x] **148. Frontend — visualizador em formato de livro**
- [x] **149. Frontend — barra inferior do livro e abertura na página salva**
- [x] **150. Infra — extração de texto do PDF por página**
- [x] **151. Entidade LivroAudioBloco e migration**
- [x] **152. Pipeline de limpeza do texto e divisão em blocos por páginas**
- [x] **153. Infra — sintetizador de voz com edge-tts e Piper**
- [x] **154. Fila dedicada e mensagens do livro em áudio**
- [x] **155. Geração do áudio dos blocos**
- [x] **156. Stream do bloco e renovação do token de acesso**
- [x] **157. Retenção e controle de espaço em disco dos livros**
- [ ] **158. Frontend — player de áudio com capítulos e configurações**
- [ ] **159. Sincronização entre páginas do livro e o áudio**
- [ ] **160. Teste end-to-end do fluxo completo e documentação atualizada**

## Detalhamento

### Tópico 141 — Entidade LivroAudio, enum de status e migration

**O que existe hoje:** o sistema tem `MediaItem` e `Audio`, mas nada que represente um livro com PDF, progresso de leitura e áudio por capítulos.

**Por que importa:** sem uma entidade própria, o livro não tem espaço individual nem lugar para guardar o marcador de retomada.

**O que precisa acontecer:** criar `LivroAudio` (UUID v7, dono `Usuario`, `titulo`, `totalPaginas`, `status`, `erroMotivo`, `criadoEm`) e o enum `StatusLivroAudio` (`enviado`, `extraindo`, `gerando_audio`, `parcial`, `pronto`, `erro`). Incluir métodos de intenção e predicados `is*` na entidade e no enum. A migration sai de `make doctrine-diff`, nunca à mão, e o schema é validado com `make doctrine-validate`.

---

### Tópico 142 — Upload do PDF e armazenamento em volume próprio

**O que existe hoje:** o upload manual aceita só imagens e vídeos, com checagem de MIME e limite de 500 MB. Não há pasta nem volume para PDFs.

**Por que importa:** o PDF original precisa ficar guardado para o visualizador e para regerar o áudio sem novo upload, sem se misturar com as mídias sincronizadas pelo Syncthing.

**O que precisa acontecer:** criar `UploadLivroAudioDTO` (sem I/O) e `UploadLivroAudioService`, que valida o MIME `application/pdf`, grava o arquivo via `ArmazenamentoLivroClient` em `src/Infra/Storage/` (com interface), lê o total de páginas e cria o `LivroAudio`. Adicionar o volume `livros_prod` ao `docker-compose.prod.yaml`. Exceções por contexto em `src/Exception/LivroAudio/`, constantes no topo das classes e zero I/O cru no Service.

---

### Tópico 143 — Endpoints da biblioteca — listar, detalhar, apagar e servir o PDF

**O que existe hoje:** não há rotas para livros. O padrão de listagem, detalhe e exclusão existe em `/audios` e `/media-itens`.

**Por que importa:** a biblioteca e o visualizador dependem desses contratos.

**O que precisa acontecer:** criar `LivroAudioController` em `src/Controller/LivroAudio/` com `GET /api/v1/livros-audio`, `GET /api/v1/livros-audio/{uuid}`, `DELETE /api/v1/livros-audio/{uuid}` e `GET /api/v1/livros-audio/{uuid}/pdf`. Controller estende `DefaultController`, consultas vão para `LivroAudioRepository`, saída por `LivroAudioSerializer`, e cada livro só é visível ao seu dono.

---

### Tópico 144 — Marcador de leitura — endpoint de posição e campos de retomada

**O que existe hoje:** o sistema não guarda posição de leitura nem de escuta. As preferências locais usam `localStorage`, que não acompanha o usuário entre aparelhos.

**Por que importa:** o marcador é a promessa central da página: sair e voltar exatamente de onde parou, em qualquer dispositivo.

**O que precisa acontecer:** adicionar a `LivroAudio` os campos `paginaAtual`, `blocoAtual`, `segundosNoBloco` e `ultimaEscutaEm`, com migration. Criar `PUT /api/v1/livros-audio/{uuid}/posicao` com `SalvarPosicaoLivroDTO` validado e um `SalvarPosicaoLivroService` que atualiza via método de intenção da entidade. O endpoint deve ser leve, pois será chamado com frequência, e entrar no rate limiter adequado.

---

### Tópico 145 — Frontend — estrutura da feature livros-audio (types, api, hooks)

**O que existe hoje:** as features existentes seguem o padrão `types.ts`, `api.ts`, `hooks/` e `index.ts` (por exemplo, `downloads-audio`). Não há feature para livros.

**Por que importa:** manter a mesma estrutura evita código fora do padrão e permite reaproveitar o `api` central com refresh de token.

**O que precisa acontecer:** criar `web/features/livros-audio/` com `types.ts`, `api.ts`, `hooks/useLivrosAudio.ts` (`useQuery` e `useMutation` com toast e invalidação) e `index.ts`. A página nunca chama Axios, sem `useEffect`, sem comentários e com nomes em português. Os dados da API são validados com Zod.

---

### Tópico 146 — Frontend — biblioteca de livros com upload, cards e progresso

**O que existe hoje:** o menu lateral leva às telas atuais, e o upload manual tem dropzone para mídias. Não existe tela de livros.

**Por que importa:** é a porta de entrada: onde o usuário sobe PDFs e escolhe qual livro abrir.

**O que precisa acontecer:** criar a página `LivrosAudio.tsx` com dropzone de PDF, grade de cards (capa = primeira página, título, percentual lido, status de geração do áudio) e ação de apagar. Registrar a rota protegida `/livros-audio` com `lazyWithRetry` em `web/App.tsx` e o item no menu lateral. Usar só primitivos Chakra e tokens da paleta `cirqueira.*`. A lógica de formatação e progresso fica em `utils/`.

---

### Tópico 147 — Frontend — carregamento e renderização de páginas com pdf.js

**O que existe hoje:** nenhuma dependência de renderização de PDF no frontend.

**Por que importa:** o visualizador depende de desenhar páginas sem travar o navegador, principalmente em livros de centenas de páginas e no celular.

**O que precisa acontecer:** adicionar `pdfjs-dist` e configurar o worker no Vite. Criar um hook que baixa o PDF pelo `api` autenticado e abre o documento, e um componente `PaginaCanvas` que renderiza uma página sob demanda. Manter em memória só a página atual e as vizinhas, descartando as distantes. O desenho no canvas, por ser imperativo, usa `useMountEffect`, sem `useEffect`.

---

### Tópico 148 — Frontend — visualizador em formato de livro

**O que existe hoje:** não há visualização de documento em formato de livro.

**Por que importa:** é a experiência pedida: capa, páginas abertas lado a lado e virada de página como um livro de verdade.

**O que precisa acontecer:** criar `VisualizadorLivro` com a página 1 sozinha como capa, depois pares (2-3, 4-5...), setas laterais e navegação por teclado. Avaliar a StPageFlip (`react-pageflip`) para a animação de virada, **validando antes a compatibilidade com o React 19**; se não for compatível, montar o par de páginas em CSS sem animação. Em telas estreitas, exibir uma página por vez.

---

### Tópico 149 — Frontend — barra inferior do livro e abertura na página salva

**O que existe hoje:** o visualizador do tópico 148 ainda não tem controles de navegação nem sabe onde o usuário parou.

**Por que importa:** contador, miniaturas e zoom tornam o livro navegável, e abrir na página certa fecha a promessa do marcador na parte visual.

**O que precisa acontecer:** criar a barra inferior com contador (ex.: 17/788), grade de miniaturas, índice quando o PDF tiver sumário, zoom e menu "…" reservado para as configurações de áudio. Ao virar a página, salvar `paginaAtual` pelo endpoint do tópico 144 com debounce. Ao abrir, ir direto para a página salva.

---

### Tópico 150 — Infra — extração de texto do PDF por página

**O que existe hoje:** a imagem de produção tem `python3`, `yt-dlp` e `ffmpeg`, mas nenhuma ferramenta de leitura de texto de PDF. Processos externos só podem rodar em `src/Infra/`.

**Por que importa:** o áudio só existe se o texto for extraído por página, o que também permite casar áudio e páginas depois.

**O que precisa acontecer:** criar `ExtratorTextoPdfInterface` e um client em `src/Infra/` que chama um script Python com PyMuPDF e devolve texto por página e o sumário, quando houver. **Validar a instalação do PyMuPDF na imagem Alpine**; se falhar, usar `pdftotext` (poppler). Detectar PDF sem texto e recusar com exceção descritiva. Timeouts e caminhos como constantes.

---

### Tópico 151 — Entidade LivroAudioBloco e migration

**O que existe hoje:** `LivroAudio` guarda o livro, mas nada representa as partes do áudio.

**Por que importa:** dividir em blocos é o que permite começar a ouvir antes de o livro terminar, repetir só o que falhou e retomar por bloco.

**O que precisa acontecer:** criar `LivroAudioBloco` (livro, `ordem`, `titulo` do capítulo, `paginaInicio`, `paginaFim`, `status`, `duracaoSegundos`, caminho do MP3, `erroMotivo`), o enum `StatusBlocoAudio` e o `LivroAudioBlocoRepository`. Migration gerada por `make doctrine-diff`.

---

### Tópico 152 — Pipeline de limpeza do texto e divisão em blocos por páginas

**O que existe hoje:** o texto extraído vem cru, com cabeçalhos, rodapés, números de página e palavras quebradas por hífen, que atrapalham a leitura em voz alta.

**Por que importa:** texto sujo gera áudio ruim, e blocos mal cortados quebram a ligação entre áudio e páginas.

**O que precisa acontecer:** criar uma Feature em `src/Feature/LivroAudio/` com etapas de limpeza via `#[TaggedIterator]` e prioridade (remover cabeçalho e rodapé repetidos, números de página, juntar hifenização, normalizar quebras). Depois, dividir em blocos de ~3.000 caracteres por parágrafo, respeitando capítulos do sumário e registrando a faixa de páginas de cada bloco.

---

### Tópico 153 — Infra — sintetizador de voz com edge-tts e Piper

**O que existe hoje:** não há geração de voz no sistema. O módulo de MP3 usa só `yt-dlp` e `ffmpeg`.

**Por que importa:** o `edge-tts` é não oficial, então a troca de motor precisa ser barata, e o Piper roda offline como reserva.

**O que precisa acontecer:** criar `SintetizadorVozInterface` com duas implementações, `EdgeTtsClient` e `PiperClient`, em `src/Infra/Voz/`. A voz e o motor ativo vêm do `services.yaml`, sem `getenv()`. Atualizar o `Dockerfile.prod` com as dependências e, para o Piper, o modelo pt-BR. Exceções por contexto e constantes no topo da classe.

---

### Tópico 154 — Fila dedicada e mensagens do livro em áudio

**O que existe hoje:** há uma única fila `async` com 2 workers, usada por classificação, distribuição e envio ao Google Fotos. Um livro gera centenas de mensagens.

**Por que importa:** sem isolar a fila, a geração de um livro atrasaria o pipeline de mídias inteiro.

**O que precisa acontecer:** criar um transporte e uma fila próprios para o livro em áudio, com worker dedicado em `devops/supervisord.conf` e `devops/php/supervisord-prod.conf`. Criar `ProcessarLivroAudioMessage` e `GerarAudioBlocoMessage` com handlers que só delegam ao Service, mantendo as regras de retry do Messenger.

---

### Tópico 155 — Geração do áudio dos blocos

**O que existe hoje:** nenhuma etapa transforma texto em MP3 por bloco, nem registra duração ou falha por bloco.

**Por que importa:** é o coração do módulo, e precisa ser retomável: a falha de um bloco não pode perder o resto.

**O que precisa acontecer:** criar `GerarAudioBlocoService`, que sintetiza o bloco, grava o MP3 em `var/livros/{uuid}/`, mede a duração com `ffmpeg` e atualiza o status. O `ProcessarLivroAudioMessage` extrai, limpa, cria os blocos e despacha uma mensagem por bloco. O livro passa por `extraindo`, `gerando_audio`, `parcial` e `pronto`, com `erroMotivo` quando falhar, e a retentativa só reprocessa os blocos com erro.

---

### Tópico 156 — Stream do bloco e renovação do token de acesso

**O que existe hoje:** o stream de áudio usa o JWT na query string, porque o `<audio>` não envia cabeçalho. O token dura 1 hora.

**Por que importa:** em escuta longa, o token pode vencer no meio do livro e os pedidos de seek passarem a retornar 401.

**O que precisa acontecer:** criar `GET /api/v1/livros-audio/{uuid}/blocos/{ordem}/stream` com suporte a Range. **Confirmar no código atual como o token do stream é validado e como o refresh acontece.** No frontend, renovar a URL do bloco ao trocar de bloco e ao receber erro de autorização, para a escuta não cair.

---

### Tópico 157 — Retenção e controle de espaço em disco dos livros

**O que existe hoje:** os MP3 expiram em 7 dias e o agendador limpa vídeos antigos. O health check já monitora o disco.

**Por que importa:** expirar um livro em 7 dias obrigaria a regerar áudio caro, e um livro longo pode ocupar centenas de MB.

**O que precisa acontecer:** definir uma política própria para áudio de livro, sem expiração automática de 7 dias. Garantir que apagar um livro remove o PDF e todos os MP3. Exibir o espaço usado por livro na biblioteca e incluir `var/livros` no cuidado de espaço do health check. Documentar a escolha em `RETENCAO_E_LIMPEZA.md`.

---

### Tópico 158 — Frontend — player de áudio com capítulos e configurações

**O que existe hoje:** o módulo Downloads MP3 tem um player fixo "Tocando agora", sem capítulos, sem retomada e sem configurações.

**Por que importa:** o player é onde o marcador acontece: o usuário ouve, sai e volta continuando do mesmo ponto.

**O que precisa acontecer:** criar o player do livro com lista de capítulos, play/pause, velocidade, seleção de voz quando houver mais de uma e integração com a Media Session API para controles do aparelho. Salvar a posição pelos eventos do `<audio>` (`onTimeUpdate` com limite de frequência, `onPause`, `onEnded`) e ao sair da página (`pagehide`, via `useMountEffect`). Ao abrir, carregar o bloco salvo e pular para o segundo gravado. **Testar a escuta com a tela bloqueada no celular.**

---

### Tópico 159 — Sincronização entre páginas do livro e o áudio

**O que existe hoje:** visualizador e player são independentes, mesmo com cada bloco já guardando a faixa de páginas que cobre.

**Por que importa:** é o que une as duas metades: ouvir enquanto o livro vira a página sozinho, e ouvir a partir da página que o usuário abriu.

**O que precisa acontecer:** criar em `utils/` a lógica que traduz bloco e tempo em página e o inverso. Com o áudio tocando, avançar a página exibida; ao virar a página manualmente, pular o áudio para o bloco correspondente. O marcador passa a guardar bloco, segundo e página de forma consistente. Um interruptor "acompanhar áudio" permite virar páginas sem mexer no áudio.

---

### Tópico 160 — Teste end-to-end do fluxo completo e documentação atualizada

**O que existe hoje:** o módulo estará implementado em partes, sem validação de ponta a ponta nem documentação própria.

**Por que importa:** o fluxo atravessa upload, extração, fila, voz, stream, visualizador e marcador, e uma falha em qualquer elo quebra a promessa.

**O que precisa acontecer:** validar o fluxo completo com um PDF real: upload, abrir como livro, gerar o áudio, ouvir, sair no meio, voltar e retomar da página e do segundo corretos. Validar também PDF sem texto, falha de um bloco com retentativa e apagar um livro. Rodar `make phpstan`, `make frontend-lint` e `make build`. Criar `documentation/funcionalidades/LIVROS_AUDIO.md` e atualizar `BACKEND.md`, `FRONTEND.md`, `MESSENGER.md` e `CIRQUEIRAX.md`.