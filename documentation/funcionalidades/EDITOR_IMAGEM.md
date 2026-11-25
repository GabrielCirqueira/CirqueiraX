# Funcionalidade: Editor de Imagem

O **Editor de Imagem** (`/editor-imagem`) anota e ajusta imagens direto no navegador. Foi criado nas melhorias M89 a M91. O original nunca é alterado: salvar sempre gera uma nova mídia.

---

## 1. Como abrir uma imagem

- Sem mídia na URL, a página abre uma **tela em branco** (último formato usado, padrão 1920 × 1080, fundo branco). Dá para montar a imagem só com formas e texto. Colar ou abrir uma imagem substitui a tela (M218).
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
| `G` | Triângulo |
| `S` | Estrela |
| `L` | Linha |
| `B` | Pincel |
| `H` | Marca-texto |
| `T` | Texto |
| `N` | Número |
| `D` | Pixelar |
| `C` | Recorte |

Formas (botão com seta na barra): retângulo, círculo, triângulo, losango, estrela, hexágono e balão de fala.

**Cores:** 8 rápidas na barra e um seletor com paleta de 42 cores, recentes (`editor-imagem:cores-recentes`), área deslizante, barra de matiz, hex e conta-gotas (`SeletorCor`, Chakra `ColorPicker`).

**Painel lateral** (M218): mostra o item selecionado ou, sem seleção, as preferências da ferramenta atual (valem para o próximo desenho).
- Formas: cor da borda, preenchimento (vazio, translúcido, sólido) com cor própria, espessura 0 a 60 (0 = sem borda), traço sólido/tracejado/pontilhado, arredondamento (retângulo e balão).
- Texto: 9 fontes (`utils/fontesEditor.ts`, via `@fontsource`), tamanho 6 a 400 (deslizante ou digitado), negrito, itálico, alinhamento, estilo simples/contorno/etiqueta, várias linhas (`Shift+Enter`). A alça do canto muda o tamanho.
- Todos: opacidade e sombra; camadas (frente, trás, subir, descer) e centralizar na tela.
- **Camadas**: lista de todos os itens, com seleção, ordem e exclusão.
- **Tela**: 8 formatos prontos, largura e altura livres (16 a 6000 px), girar e fundo de qualquer cor ou transparente. Mudar a tela mantém os itens.

**Seleção e layout** (M219):
- Depois de desenhar, a ferramenta volta ao cursor; o cadeado na barra (`Q`) mantém a ferramenta ativa. Pincel, marca-texto, marcador e recorte continuam ativos.
- Com ferramenta de desenho, clicar no contorno de um item o seleciona (`ModoAcerto` `borda`); dentro de forma preenchida continua desenhando.
- Layout: barra superior, ferramentas na vertical, barra flutuante de estilo rápido, zoom no canto e painel com abas Estilo / Camadas / Tela.
- Guias magnéticas ao mover (`utils/encaixeAlinhamento.ts`), `Alt` desliga.
- Camadas podem ser escondidas (`oculta`, não sai na exportação) e bloqueadas (`bloqueada`, sem clique nem movimento).

Valores de tamanho ficam relativos a uma imagem de 1200 px (`calcularFatorEscala`). As preferências de cada ferramenta ficam no `localStorage`.

---

## 3. Atalhos

| Atalho | Ação |
| :--- | :--- |
| `Shift` | Trava retas e proporção ao desenhar |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` ou `Ctrl+Shift+Z` | Refazer |
| `Ctrl+C` | Copiar o item selecionado (sem item: copia a imagem) |
| `Ctrl+X` | Recortar o item |
| `Ctrl+V` | Colar item, imagem (substitui a tela) ou texto (vira caixa de texto) |
| `Ctrl+Shift+C` | Copiar a imagem final |
| `Ctrl` + `+`/`-`, `Ctrl` + roda | Zoom |
| `Ctrl+0` / `Ctrl+1` | Ajustar à tela / tamanho real |
| `Q` | Travar a ferramenta |
| `Alt` ao mover | Sem encaixe nas guias |
| `Ctrl+S` | Salvar |
| `Ctrl+D` | Duplicar elemento |
| `[` / `]` | Diminuir / aumentar o item selecionado |
| `Ctrl+]` / `Ctrl+[` | Subir / descer camada (`Shift` leva ao topo ou ao fundo) |
| `Shift` ao esticar alça | Mantém a proporção |
| `Delete` ou `Backspace` | Apagar elemento |
| Setas | Mover 1 px |
| `Shift` + setas | Mover 10 px |
| `Esc` | Cancelar |

---

## 4. Exportar e salvar

Copiar gera PNG. Baixar oferece PNG (mantém transparência) ou JPG (fundo branco). As fontes são carregadas antes de gerar a imagem.

```
POST /api/v1/media-itens/edicoes (arquivo + editado_de_uuid)
              │
              ▼
Nova mídia ──► herda a origem e a data da original
              │
              ▼
Ingestão + classificação (pasta local)
              │
              └──► Google Fotos só se a conta tiver permissão google_fotos
```

- Aceita PNG, JPEG e WebP de até 50 MB.
- A ligação com a mídia original fica nos metadados, em `editado_de_uuid`.
- A edição herda a origem da mídia original, portanto um print editado continua na galeria de Prints.
- Na UI, badge/texto “enviar ao Google Fotos” só aparece com a permissão (`ModalSalvarEdicao`, `CabecalhoEditor`).

---

## 5. Código

`web/features/editor-imagem/`: `EditorImagem.tsx`, `components/`, `hooks/`, `utils/`, `api.ts` e `types.ts`.
