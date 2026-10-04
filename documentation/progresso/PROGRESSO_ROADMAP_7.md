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

### ⏳ Tópico 122 — Escopo readonly.appcreateddata — atualização da URL de autorização OAuth
- **Status**: Pendente

### ⏳ Tópico 123 — GoogleFotosAlbumService::listarAlbunsDoApp() — chamada a albums.list
- **Status**: Pendente

### ⏳ Tópico 124 — Endpoint GET /api/v1/google-fotos/albuns — lista álbuns criados pelo app
- **Status**: Pendente

### ⏳ Tópico 125 — Cruzamento de álbuns com Categoria — campo vinculada/orfã
- **Status**: Pendente

### ⏳ Tópico 126 — Endpoint PATCH /api/v1/categorias/{uuid}/album — vínculo manual de albumId
- **Status**: Pendente

### ⏳ Tópico 127 — Ajuste em criarOuObter() — respeitar vínculo manual e evitar duplicidade
- **Status**: Pendente

### ⏳ Tópico 128 — DTO e validação de criação de categoria já nomeando o álbum futuro
- **Status**: Pendente

### ⏳ Tópico 129 — Frontend — estrutura da feature google-fotos (types, api, hooks)
- **Status**: Pendente

### ⏳ Tópico 130 — Frontend — tela de status/conexão da conta Google Fotos (gate)
- **Status**: Pendente

### ⏳ Tópico 131 — Frontend — grid de álbuns do CirqueiraX com capa e contagem
- **Status**: Pendente

### ⏳ Tópico 132 — Frontend — modal de vínculo manual de álbum à categoria
- **Status**: Pendente

### ⏳ Tópico 133 — Frontend — indicador de categorias sem álbum ainda vinculado
- **Status**: Pendente

### ⏳ Tópico 134 — Frontend — aviso/guia de migração manual de álbuns antigos
- **Status**: Pendente

### ⏳ Tópico 135 — Backend — BaixarVideoDTO aceita categoriaId opcional na criação
- **Status**: Pendente

### ⏳ Tópico 136 — Backend — BaixarVideoService aplica categoria já na criação do download
- **Status**: Pendente

### ⏳ Tópico 137 — Frontend — CampoNovoLink.tsx com seletor de categoria/álbum
- **Status**: Pendente

### ⏳ Tópico 138 — Página GoogleFotos.tsx completa, rota e item no Header
- **Status**: Pendente

### ⏳ Tópico 139 — Atalho cruzado no Dashboard (TabelaCategorias → Gestão de Álbuns)
- **Status**: Pendente

### ⏳ Tópico 140 — Teste end-to-end do fluxo completo e documentação atualizada
- **Status**: Pendente
