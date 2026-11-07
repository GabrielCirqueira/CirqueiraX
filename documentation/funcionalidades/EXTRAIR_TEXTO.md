# Funcionalidade: Extrair Texto

A página **Extrair Texto** (`/extrair-texto`) lê o texto de uma imagem direto no navegador. Foi criada na melhoria M123. Não há backend: nada é enviado ao servidor nem salvo.

---

## 1. Como usar

- Cole uma imagem com **Ctrl+V** em qualquer lugar da página, arraste um arquivo ou escolha um do computador.
- A leitura começa na hora. Quando termina, o texto aparece ao lado da imagem e já vai para a área de transferência.
- O texto pode ser corrigido no campo antes de copiar de novo pelo botão **Copiar texto**.
- Colar outra imagem substitui a anterior. Se uma leitura ainda estiver em andamento, o resultado dela é descartado.

---

## 2. Como funciona

- O OCR é feito pelo [tesseract.js](https://github.com/naptha/tesseract.js) (versão 7), em português e inglês (`por+eng`).
- O leitor é criado na primeira imagem e reaproveitado nas seguintes. Ele é encerrado ao sair da página.
- Na primeira vez, o navegador baixa o worker, o núcleo WebAssembly e os dados dos idiomas pelo CDN (jsDelivr), uns poucos MB. Depois disso eles ficam em cache no navegador (IndexedDB).
- O texto passa por uma limpeza leve: espaços no fim das linhas e linhas em branco repetidas são removidos.
- Se o navegador não permitir copiar automaticamente, o texto continua no campo e pode ser copiado pelo botão.

---

## 3. Arquivos

| Arquivo | Papel |
| :--- | :--- |
| `web/features/extrair-texto/ExtrairTexto.tsx` | Página, arrastar e soltar, seletor de arquivo |
| `web/features/extrair-texto/hooks/useExtracaoTexto.ts` | Leitor, etapas, progresso e cópia |
| `web/features/extrair-texto/hooks/useColarImagem.ts` | Ctrl+V na página |
| `web/features/extrair-texto/utils/reconhecimentoTexto.ts` | Criação do leitor e limpeza do texto |
| `web/features/extrair-texto/components/*` | Cabeçalho, zona de colar, imagem e resultado |

O tratamento da área de transferência reaproveita `web/features/editor-imagem/utils/areaTransferencia.ts`.
