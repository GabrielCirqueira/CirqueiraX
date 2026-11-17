# Funcionalidade: Upload Manual

A tela **Upload Manual** (`/upload-manual`) envia fotos e vídeos que já estão no dispositivo. Os arquivos seguem o mesmo pipeline das demais mídias, com origem `manual`.

---

## 1. Fluxo

```
[ Arrastar, selecionar ou Ctrl+V ]
                │
                ▼
    Validação no navegador (tipo e tamanho)
                │
                ▼
    POST /api/v1/media-itens/upload (multipart)
                │
    ├─ 1. Valida o MIME real
    ├─ 2. Grava o temporário em {tmp}/cirqueirax_uploads
    ├─ 3. Ingestão com dedupe
    │     └─ Duplicado: devolve o item existente e _warning: item_duplicado_existente
    │
    └─ 4. Com categoria: classifica e distribui localmente;
          envia ao Google Fotos só se a conta tiver permissão google_fotos
          Sem categoria: fica como sem_categoria
```

---

## 2. Formatos e limites

- **Imagens:** `image/png`, `image/jpeg`, `image/webp`, `image/gif`.
- **Vídeos:** `video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo`, `video/mkv`, `video/x-matroska`.
- **Tamanho:** até 500 MB por arquivo.
- **PHP e Nginx:** limite de 500M, `max_execution_time` de 300 s e `memory_limit` de 512M.

---

## 3. Interface

- Dropzone, seletor de arquivos e **Ctrl+V** global com arquivos.
- Categoria padrão antes do envio.
- Categoria por item, para os selecionados, para todos ou para os que estão sem categoria.
- Progresso de envio.
- Filtros: Todas, Sem Categoria, Classificadas e Com Erro.
- Visões em grade e tabela, com busca por nome ou hash.
- **Limpar Concluídos** tira da lista os itens já processados.

### Arquivo duplicado

O item aparece como **Já Existente (Não Duplicado)**, e nenhum arquivo novo é criado. Com permissão `google_fotos`, o modal **Sim, Sincronizar Mesmo Assim** e o botão **Forçar Google Fotos** chamam `POST /api/v1/media-itens/{uuid}/forcar-google-fotos` (API exige a mesma permissão). Sem a permissão, essas ações não aparecem.

---

## 4. Código

- **Frontend:** `web/features/upload-manual/`, com a lógica em `hooks/useUploadManual.ts`.
- **Backend:** `MediaItemController`, `POST /api/v1/media-itens/upload`.
