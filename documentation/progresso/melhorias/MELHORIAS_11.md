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

### ✅ Melhoria 203 — Extensão do YouTube Music: Tempo Real, Pausa Certa e Identificação Imediata

- **Status**: Concluído
- **Data**: 23 de novembro de 2026
- **Problema**: o painel mostrava a música do YouTube Music como pausada, com o tempo diferente do player, e ficava "identificando" sem terminar — mesmo para músicas que já estavam no catálogo pela importação do Spotify.
- **Causas encontradas**:
  - O cache de produção ficou com dono `root` em 17/11 (`cache:clear` rodado como root via `make cache-clear-prod`). O PHP e os workers (`www-data`) não conseguiam gravar; o scheduler não salvava o checkpoint e **parou de disparar as tarefas**: identificação, detalhes dos vídeos e coleta do Spotify ficaram paradas desde 17/11 (11 mil erros de gravação em 48 h).
  - A extensão lia a duração do player durante o anúncio (29,9 s / 49,9 s) e o servidor guardava essa duração errada; a barra travava e parecia pausada.
  - O painel calculava o tempo pelo "tempo ouvido", não pela posição do player — qualquer pausa, avanço ou início no meio deixava o tempo diferente.
  - A fila de identificação pegava os 50 pendentes mais antigos; vídeos que falhavam sempre bloqueavam os novos.
- **Solução**:
  - Permissão do cache corrigida; `make` passa a rodar o console de produção como `www-data`.
  - Extensão 1.5.0: envia a posição real do player e o momento da leitura; avisa na hora ao pausar, dar play ou avançar; progresso a cada 5 s; detecção de anúncio melhor (estado do player e overlay visível) e duração só fora do anúncio.
  - Servidor guarda posição e horário da leitura (`extensao_posicao_ms`, `extensao_posicao_em`) e corrige duração curta demais enquanto a API do YouTube não trouxe a oficial.
  - Painel calcula o tempo pela posição do player (atualiza a cada 10 s); duração impossível não trava a barra.
  - Identificação: pendentes tocados mais recentemente primeiro, e a primeira reprodução de um vídeo pendente dispara a identificação na hora.
- **Arquivos**: `extensao/youtube-music/pagina.js`, `extensao/youtube-music/conteudo.js`, `extensao/youtube-music/fundo.js`, `extensao/youtube-music/manifest.json`, `src/Service/YoutubeMusic/Extensao/RegistrarEventosExtensaoYoutubeService.php`, `src/DataObject/YoutubeMusic/EventoExtensaoYoutubeDTO.php`, `src/Entity/ReproducaoYoutube.php`, `src/Entity/VideoYoutube.php`, `src/Repository/VideoYoutubeRepository.php`, `src/Serializer/ContaYoutubeMusicSerializer.php`, `migrations/Version20261123090000.php`, `web/features/youtube-music/types.ts`, `web/features/youtube-music/utils/extensaoYoutubeMusic.ts`, `web/features/youtube-music/hooks/useStatusYoutubeMusic.ts`, `Makefile`

---
