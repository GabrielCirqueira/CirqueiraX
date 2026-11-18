# Melhorias — M201 a M220

> Detalhamento das melhorias **M201–M220**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 201 — Ajuda Contextual nos Cards de `/musica`

- **Status**: Concluído
- **Data**: 17 de novembro de 2026
- **Problema**: os cards redesenhados (M193) não explicavam o que cada bloco media — usuário novo não sabia o significado de Saudade, Neste dia, Álbum em sequência, etc.
- **Solução**:
  - `CartaoBlocoMusica` ganhou prop `descricao` e um ícone discreto `CircleHelp` no canto superior direito; hover abre tooltip (`TooltipMusica`).
  - Todos os cards das abas (visão geral, hábitos, descobertas, versões, histórico, serviços) receberam texto curto explicando o contexto.
- **Arquivos**: `web/features/musica/components/PecasBlocoMusica.tsx`, `VisaoGeralTopos.tsx`, `VisaoGeralAtalhos.tsx`, `AbaHabitos.tsx`, `AbaDescobertas.tsx`, `AbaVersoes.tsx`, `AbaHistorico.tsx`, `AbaServicos.tsx`

---

### ✅ Melhoria 202 — Tooltip no Hover do Card (sem ícone ?)

- **Status**: Concluído
- **Data**: 17 de novembro de 2026
- **Problema**: o ícone `?` no canto do card poluía o layout; a ajuda deveria vir do próprio card.
- **Solução**: removido o ícone; o tooltip da `descricao` abre ao passar o mouse no card inteiro, com atraso de 4 s (`openDelay={4000}`).
- **Arquivos**: `PecasBlocoMusica.tsx`, `MinutosMusica.tsx`

---
