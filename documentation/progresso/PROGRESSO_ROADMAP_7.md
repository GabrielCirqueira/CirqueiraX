# Progresso do Roadmap — Feature 7 (Feature 6: Gestão de Álbuns do Google Fotos)

> Detalhamento dos tópicos 121 ao 140.

---

### ✅ Tópico 121 — Endpoint GET /api/v1/google-fotos/status — verifica conexão da conta
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criado o DTO `StatusContaGoogleFotosDTO.php` para retorno limpo e seguro sem expor tokens ou dados sensíveis.
  - Implementado o serviço `ObterStatusContaGoogleFotosService.php` consultando a conta ativa no `ContaGoogleFotosRepository`.
  - Criado o controller `GoogleFotosController.php` estendendo `DefaultController` com a rota `GET /api/v1/google-fotos/status`.
  - Validado via chamada HTTP autenticada retornando `{ conectado: true, email: "...", conectadoEm: "..." }`.
- **Arquivos**:
  - `src/DataObject/StatusContaGoogleFotosDTO.php`
  - `src/Service/GoogleFotos/ObterStatusContaGoogleFotosService.php`
  - `src/Controller/GoogleFotos/GoogleFotosController.php`

### ✅ Tópico 122 — Escopo readonly.appcreateddata — atualização da URL de autorização OAuth
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Atualizada a constante `SCOPES` em `AutorizarContaGoogleFotosCommand.php` para solicitar os escopos recomendados pela Google Photos Library API: `photoslibrary.appendonly`, `photoslibrary.readonly.appcreateddata`, `photoslibrary.edit.appcreateddata` e `userinfo.email`.
  - Documentada a política e tabela de escopos oficiais em `documentation/stack/BACKEND.md`.
  - Preparado o suporte para que a listagem de álbuns criados pelo app (`albums.list`) funcione com permissões estritas e atualizadas.
- **Arquivos**:
  - `src/Command/AutorizarContaGoogleFotosCommand.php`
  - `documentation/stack/BACKEND.md`

### ✅ Tópico 123 — GoogleFotosAlbumService::listarAlbunsDoApp() — chamada a albums.list
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Implementado o método `listarAlbuns()` na classe de infraestrutura `GoogleFotosAPI.php` realizando chamadas autenticadas paginadas para `GET /v1/albums` com `pageToken` e `pageSize`.
  - Criado o DTO `AlbumGoogleFotosDTO.php` para encapsular `id`, `titulo`, `urlCapa` e `totalItens`.
  - Adicionado o método `listarAlbunsDoApp(ContaGoogleFotos $conta)` no serviço de aplicação `GoogleFotosAlbumService.php`, acumulando todas as páginas do Google Fotos e tratando respostas vazias de forma resiliente.
- **Arquivos**:
  - `src/Infra/GoogleFotos/GoogleFotosAPI.php`
  - `src/DataObject/AlbumGoogleFotosDTO.php`
  - `src/Service/GoogleFotos/GoogleFotosAlbumService.php`

### ✅ Tópico 124 — Endpoint GET /api/v1/google-fotos/albuns — lista álbuns criados pelo app
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criado o Use Case `ListarAlbunsGoogleFotosService.php` para encapsular a busca da conta ativa e delegação para o `GoogleFotosAlbumService`.
  - Adicionada a rota `GET /api/v1/google-fotos/albuns` no `GoogleFotosController.php` estendendo `DefaultController`.
  - Aprimorado o `KernelExceptionListener.php` para tratar `ClienteHTTPException` e exibir mensagens descritivas do Google com status HTTP adequado em vez de erros 500 opacos.
- **Arquivos**:
  - `src/Service/GoogleFotos/ListarAlbunsGoogleFotosService.php`
  - `src/Controller/GoogleFotos/GoogleFotosController.php`
  - `src/EventListener/KernelExceptionListener.php`

### ✅ Tópico 125 — Cruzamento de álbuns com Categoria — campo vinculada/orfã
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Enriquecido o serviço `ListarAlbunsGoogleFotosService.php` para cruzar a lista de álbuns retornada pelo Google Fotos com todas as categorias cadastradas no sistema.
  - Cada álbum é marcado com `vinculado: bool` e dados da categoria associada (`uuid`, `nome`, `pastaLocal`) ou `null` se órfão.
  - Retornada também a lista de `categoriasSemAlbum` e um `resumo` agregado com totais de álbuns, vinculados, órfãos e categorias pendentes.
- **Arquivos**:
  - `src/Service/GoogleFotos/ListarAlbunsGoogleFotosService.php`
  - `src/DataObject/AlbumGoogleFotosDTO.php`

### ✅ Tópico 126 — Endpoint PATCH /api/v1/categorias/{uuid}/album — vínculo manual de albumId
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criado o DTO `VincularAlbumDTO.php` com validação de `googlePhotosAlbumId` não-em-branco.
  - Implementado o serviço `VincularAlbumCategoriaService.php` que busca a categoria, valida se o álbum realmente existe na conta ativa do Google Fotos e persiste o vínculo.
  - Adicionado método `albumNaoEncontradoNoGoogle()` em `CategoriaException.php`.
  - Adicionada a rota `PATCH /api/v1/categorias/{uuid}/album` no `CategoriaController.php`.
- **Arquivos**:
  - `src/DataObject/VincularAlbumDTO.php`
  - `src/Service/Categoria/VincularAlbumCategoriaService.php`
  - `src/Exception/Categoria/CategoriaException.php`
  - `src/Controller/Categoria/CategoriaController.php`

### ✅ Tópico 127 — Ajuste em criarOuObter() — respeitar vínculo manual e evitar duplicidade
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Injetado `LoggerInterface` em `GoogleFotosAlbumService.php`.
  - Adicionado log de `warning` contextual quando um álbum é criado automaticamente para uma categoria nova sem vínculo manual prévio, garantindo rastreabilidade e auditoria de álbuns criados.
  - Mantida a prioridade estrita de utilização de `googleFotosAlbumId` já existente antes de efetuar qualquer chamada à API do Google.
- **Arquivos**:
  - `src/Service/GoogleFotos/GoogleFotosAlbumService.php`

### ✅ Tópico 128 — DTO e validação de criação de categoria já nomeando o álbum futuro
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Atualizado `CriarCategoriaDTO.php` com mensagens de validação descritivas em português nos atributos de validação do Symfony (`Assert\NotBlank`, `Assert\Length`).
  - Adicionada restrição de tamanho máximo para `googlePhotosAlbumId` e clareza contratual de que, se omitido, o álbum será gerado automaticamente com o nome da categoria.
- **Arquivos**:
  - `src/DataObject/CriarCategoriaDTO.php`

### ✅ Tópico 129 — Frontend — estrutura da feature google-fotos (types, api, hooks)
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criada a estrutura da feature em `web/features/google-fotos/`.
  - Definidas as interfaces TypeScript em `types.ts` (`StatusGoogleFotos`, `AlbumGoogleFotos`, `CategoriaVinculo`, `RespostaAlbunsGoogleFotos`, `ResumoAlbunsGoogleFotos`).
  - Implementado o cliente HTTP em `api.ts` consumindo os endpoints `/api/v1/google-fotos/status`, `/api/v1/google-fotos/albuns` e `/api/v1/categorias/{uuid}/album`.
  - Criados os hooks TanStack Query em `hooks/useGoogleFotos.ts` (`useStatusGoogleFotos`, `useAlbunsGoogleFotos`, `useVincularAlbum`) com invalidação automática de cache e notificações de toast.
  - Exportação centralizada via `index.ts`.
- **Arquivos**:
  - `web/features/google-fotos/types.ts`
  - `web/features/google-fotos/api.ts`
  - `web/features/google-fotos/hooks/useGoogleFotos.ts`
  - `web/features/google-fotos/index.ts`
  - `documentation/stack/FRONTEND.md`

### ✅ Tópico 130 — Frontend — tela de status/conexão da conta Google Fotos (gate)
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criado o componente `GateConexaoGoogle.tsx` utilizando Chakra UI v3, sem tags HTML cruas e sem comentários.
  - Implementado estado de carregamento elegante com spinner centralizado.
  - Implementado card de bloqueio quando a conta Google não está conectada (`conectado: false`), apresentando passo a passo explicativo, bloco com o comando CLI `make google-fotos-autorizar`, botão de copiar comando e botão de verificar conexão novamente.
  - Implementado banner de conexão ativa com badge verde, exibição do e-mail autenticado e data de conexão formatada em PT-BR quando conectado (`conectado: true`), liberando o render dos componentes filhos (`children`).
  - Validado com `npx @biomejs/biome check` e `npm run build` do Vite.
- **Arquivos**:
  - `web/features/google-fotos/components/GateConexaoGoogle.tsx`
  - `web/features/google-fotos/index.ts`

### ✅ Tópico 131 — Frontend — grid de álbuns do CirqueiraX com capa e contagem
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criado o componente `GridAlbuns.tsx` com Chakra UI v3, sem tags HTML cruas e sem comentários.
  - Implementado layout de grid responsivo (1 a 4 colunas) exibindo a capa do álbum com overlay degradê, contagem de mídias e status de vínculo.
  - Badges visuais indicando categoria associada (verde com nome e pasta local) ou status órfão (âmbar, "Sem Vínculo").
  - Estado de skeleton loading com 4 cards animados e estado vazio explicativo elegante quando o app ainda não possui álbuns criados.
  - Botão de ação rápida para disparar o vínculo manual de cada álbum.
- **Arquivos**:
  - `web/features/google-fotos/components/GridAlbuns.tsx`
  - `web/features/google-fotos/index.ts`

### ✅ Tópico 132 — Frontend — modal de vínculo manual de álbum à categoria
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criado o componente `ModalVincularAlbum.tsx` com Chakra UI v3 (`Dialog.Root`), sem tags HTML cruas e sem comentários.
  - Suporta dois fluxos de uso:
    - **Álbum → Categoria**: Exibe prévia do álbum do Google Fotos e lista de categorias disponíveis para seleção via `useTodasCategorias()`, indicando se alguma já possui outro álbum.
    - **Categoria → Álbum**: Exibe prévia da categoria e lista de álbuns do app para seleção via `useAlbunsGoogleFotos()`.
  - Integração com `useVincularAlbum()` (`PATCH /api/v1/categorias/{uuid}/album`) disparando invalidação de cache e toast de confirmação.
- **Arquivos**:
  - `web/features/google-fotos/components/ModalVincularAlbum.tsx`
  - `web/features/google-fotos/api.ts`
  - `web/features/google-fotos/hooks/useGoogleFotos.ts`
  - `web/features/google-fotos/index.ts`

### ✅ Tópico 133 — Frontend — indicador de categorias sem álbum ainda vinculado
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Atualizado `TabelaCategorias.tsx` no dashboard para identificar categorias com `googlePhotosAlbumId` nulo e aplicar visualmente um badge de destaque âmbar (`colorPalette="amber"` com ícone `AlertTriangle` e texto "Sem Álbum Google").
  - Adicionado botão de ação rápida "Vincular Álbum" que abre diretamente o `ModalVincularAlbum` pré-configurado com a categoria selecionada.
  - Adicionado botão "Trocar Álbum" para categorias que já possuem vínculo prévio, permitindo alteração rápida de álbum do Google Fotos diretamente pela listagem.
  - Integração sem recarregamento de página, acionando invalidação automática de cache no TanStack Query.
- **Arquivos**:
  - `web/features/dashboard/components/TabelaCategorias.tsx`

### ✅ Tópico 134 — Frontend — aviso/guia de migração manual de álbuns antigos
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Criado o componente `AvisoMigracaoAlbuns.tsx` no módulo `web/features/google-fotos/components/` com Chakra UI v3, sem tags HTML cruas e sem comentários.
  - Apresenta explicação contextualizada sobre a política de privacidade e restrição de escopo da Google Photos Library API (`photoslibrary.readonly.appcreateddata` e `photoslibrary.appendonly`), elucidando por que álbuns legados e criados fora da aplicação não aparecem na listagem do CirqueiraX.
  - Disponibiliza guia prático em 3 passos com link direto para o Google Fotos para orientar a migração manual de fotos e vídeos para os novos álbuns gerenciados pelo CirqueiraX.
  - Componente com cabeçalho expansível e visual polido, exportado em `web/features/google-fotos/index.ts`.
  - Documentação atualizada em `documentation/funcionalidades/CIRQUEIRAX.md`.
- **Arquivos**:
  - `web/features/google-fotos/components/AvisoMigracaoAlbuns.tsx`
  - `web/features/google-fotos/index.ts`
  - `documentation/funcionalidades/CIRQUEIRAX.md`

### ✅ Tópico 135 — Backend — BaixarVideoDTO aceita categoriaId opcional na criação
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Adicionada a propriedade opcional `public ?string $categoriaId = null` no DTO `BaixarVideoDTO.php` com atributo de validação `#[Assert\Uuid(message: 'O ID da categoria deve ser um UUID válido.')]`.
  - Adicionado método getter `categoriaId(): ?string`.
  - Mantida compatibilidade total quando `categoriaId` não é enviado (continua `null` e vai para triagem manual/`EM_FILA`).
- **Arquivos**:
  - `src/DataObject/BaixarVideoDTO.php`

### ✅ Tópico 136 — Backend — BaixarVideoService aplica categoria já na criação do download
- **Status**: Concluído
- **Data**: 04 de outubro de 2026
- **O que foi feito**:
  - Atualizado `BaixarVideoMessage.php` com propriedade opcional `categoriaId` e método acessor.
  - Injetado `ClassificarMediaItemService` em `BaixarVideoService.php` e ajustada a assinatura de `executar(string $url, ?OrigemMedia $origem = null, ?string $categoriaId = null): MediaItem`.
  - Ao receber `categoriaId`, executa `classificarManualmente()`, associando imediatamente a categoria, transicionando para `CLASSIFICADO` e despachando os jobs de distribuição local e envio para o álbum correspondente no Google Fotos.
  - Atualizados `DownloadController.php`, `BaixarVideoMessageHandler.php` e `RebaixarMediaItemService.php` para repassar `categoriaId`.
  - Aprimorado `ClassificarMediaMessageHandler.php` para manter idempotência e não sobrescrever mídias já classificadas.
- **Arquivos**:
  - `src/Message/BaixarVideoMessage.php`
  - `src/Service/Video/BaixarVideoService.php`
  - `src/Controller/Video/DownloadController.php`
  - `src/MessageHandler/BaixarVideoMessageHandler.php`
  - `src/Service/MediaItem/RebaixarMediaItemService.php`
  - `src/MessageHandler/ClassificarMediaMessageHandler.php`

### ⏳ Tópico 137 — Frontend — CampoNovoLink.tsx com seletor de categoria/álbum
- **Status**: Pendente

### ⏳ Tópico 138 — Página GoogleFotos.tsx completa, rota e item no Header
- **Status**: Pendente

### ⏳ Tópico 139 — Atalho cruzado no Dashboard (TabelaCategorias → Gestão de Álbuns)
- **Status**: Pendente

### ⏳ Tópico 140 — Teste end-to-end do fluxo completo e documentação atualizada
- **Status**: Pendente
