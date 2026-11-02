# Funcionalidade: Editor de Imagem

O **Editor de Imagem** (`/editor-imagem`) anota e ajusta imagens direto no navegador. Foi criado nas melhorias M89 a M91. O original nunca é alterado: salvar sempre gera uma nova mídia.

---

## 1. Como abrir uma imagem

- Colar com **Ctrl+V**.
- Arrastar para a tela.
- Escolher um arquivo.
- Usar **Editar** em Prints ou na Central de Mídias, que abre `/editor-imagem?midia=<uuid>`.

Só itens que passam em `MediaItem::isEditavelComoImagem()` podem ser abertos a partir de uma mídia.

---

## 2. Ferramentas

| Tecla | Ferramenta |
| :--- | :--- |
| `V` | Selecionar |
| `A` | Seta |
| `R` | Retângulo |
| `E` | Círculo |
| `L` | Linha |
| `B` | Pincel |
| `H` | Marca-texto |
| `T` | Texto |
| `N` | Número |
| `D` | Pixelar |
| `C` | Recorte |

Há 8 cores e 3 espessuras. O painel de propriedades ajusta o elemento selecionado, e as preferências de cada ferramenta ficam salvas no `localStorage`.

---

## 3. Atalhos

| Atalho | Ação |
| :--- | :--- |
| `Shift` | Trava retas e proporção ao desenhar |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` ou `Ctrl+Shift+Z` | Refazer |
| `Ctrl+C` | Copiar |
| `Ctrl+S` | Salvar |
| `Ctrl+D` | Duplicar elemento |
| `Delete` ou `Backspace` | Apagar elemento |
| Setas | Mover 1 px |
| `Shift` + setas | Mover 10 px |
| `Esc` | Cancelar |

---

## 4. Salvar

```
POST /api/v1/media-itens/edicoes (arquivo + editado_de_uuid)
              │
              ▼
Nova mídia ──► herda a origem e a data da original
              │
              ▼
Segue o pipeline normal de ingestão e classificação
```

- Aceita PNG, JPEG e WebP de até 50 MB.
- A ligação com a mídia original fica nos metadados, em `editado_de_uuid`.
- A edição herda a origem da mídia original, portanto um print editado continua na galeria de Prints.

---

## 5. Código

`web/features/editor-imagem/`: `EditorImagem.tsx`, `components/`, `hooks/`, `utils/`, `api.ts` e `types.ts`.
