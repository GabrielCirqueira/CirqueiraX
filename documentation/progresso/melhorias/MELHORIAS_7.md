# Melhorias — M121 a M140

> Detalhamento das melhorias **M121–M140**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 121 — Redesign do Tema Escuro e Design System Inspirado no Spotify (Fundo Suave, Cards Matte Profundo, Badges em Pílula e Bordas Sutis)

- **Status**: Concluído
- **Data**: 06 de novembro de 2026
- **Problema**:
  - O sistema apresentava contraste cansativo e desarmônico: fundo em preto absoluto (`#121212`) provocando cansaço visual, enquanto os cards e painéis usavam tons cinza-claros e opacos (`#1F1F1F`, `#252525`).
  - As badges e tags exibiam caixas retangulares duras (`borderRadius="md"`) com fundos sólidos escuros e turvos (tons 900 opacos, como `#4a1410` para vermelho e `#003225` para verde), gerando baixo contraste com o texto e aparência pesada de blocos coloridos.
  - Cards pequenos de mídias (`CardVideo`, `CardAudio`, `CardPrint`, `CardMidiaCentral`, `CardLivroAudio`), modais e formulários usavam raios legados misturados de 16px/24px (`2xl`/`xl`/`lg`/`md`), sem coerência visual.
  - Vários componentes continham cores em hexadecimal (`#000000`, `#FFFFFF`, `#22e368`, etc.) e strings cruas de RGB/RGBA em vez dos tokens do tema do sistema.
- **Solução**:
  - **Calibração de Superfícies com Alto Contraste no Espectro Preto-Cinza**: Fundo geral (`bg.canvas`) calibrado para o tom grafite escuro neutro `#121315` (RGB: 18, 19, 21), profundo e confortável sem qualquer desvio ou tonalidade verde/azulada excessiva; cards e painéis (`bg.panel`) definidos em `#1E2023` (RGB: 30, 32, 35), proporcionando uma separação nítida e marcante de ~6% de luminosidade sobre o canvas; campos de formulários, inputs e estados elevados (`bg.muted`, `cartaoElevado`) definidos em `#272A2E` e estados ativos/hover (`bg.emphasized`) em `#32363C`. Texto principal (`fg.DEFAULT`) calibrado em `#F4F5F6` e texto secundário em `#9CA3AF`.
  - **Eliminação de Caixas Internas Poluídas nos Cards**: Remoção de caixas internas com bordas pesadas e fundos cinzas dentro do corpo dos cards (em especial o bloco de data/horário no `CardVideo`, que criava um aspecto estranho de botão/input no meio da mídia), substituído por linha tipográfica limpa e sutil com ícones e hover refinados.
  - **Bordas Delimitadas e Neutras**: Bordas refinadas e nítidas em branco translúcido neutro: `border.subtle` (`rgba(255, 255, 255, 0.08)`), `border.muted` (`rgba(255, 255, 255, 0.05)`), `border.DEFAULT` (`rgba(255, 255, 255, 0.12)`) e `border.emphasized` (`rgba(255, 255, 255, 0.20)`), eliminando bordas coloridas invasivas e conferindo profundidade discreta e profissional.
  - **Badges e Pílulas Elegantes**: Receita global de `Badge` (`badgeRecipe`) reformulada com `borderRadius="full"`, fundo neutro escuro matte (`bg.muted`), borda sutil (`border.subtle`) e texto/ícones vibrantes na cor da paleta (`colorPalette.fg`). Fim dos blocos coloridos turvos: todas as badges do sistema (plataformas como YouTube, TikTok, status de pipeline, contagens de mídias e tags) agora seguem o padrão clean de cápsulas refinadas.
  - **Padronização Global de Arredondamento (8px e full)**: Varredura completa em 100% dos componentes frontend eliminando todos os raios legados (`2xl`, `xl`, `lg`, `md`, `sm`). Todos os cards, containers, modais, dialogs, inputs e selects padronizados rigorosamente em `borderRadius="8px"`; todos os botões, badges, pílulas, chips de filtro, avatares e seletores padronizados em `borderRadius="full"`.
  - **Eliminação de Hexadecimais e RGBA**: Remoção de todos os códigos hexadecimais brutos e cores RGB soltas nos componentes JSX, substituídos integralmente pelos tokens semânticos e paletas do `theme.ts` (`cirqueira.<escala>.<tom>`, `border.subtle`, `blackAlpha.800`, `bg.panel`).
---

### ✅ Melhoria 122 — Redesign do Dashboard Geral (Cards Individuais Elevados com Ícones, Barra de Ações Rápidas Expandida e Painéis Modernizados)

- **Status**: Concluído
- **Data**: 07 de novembro de 2026
- **Problema**:
  - O Dashboard geral mantinha uma estrutura visual monótona e ultrapassada: o resumo de mídias utilizava um bloco único dividido por linhas de 1px com tipografia em caixa alta e sem ícones representativos.
  - O cabeçalho continha apenas um ponto simples com texto plano, sem integração visual com a linguagem de pílulas do sistema.
  - A barra de ações rápidas continha poucos botões genéricos, sem atalhos para recursos importantes como Downloads MP3, Transcrições e Spotify.
  - Os painéis de seções (Vídeos, Livros, Gráficos, Atividades e Serviços) careciam de ícones nos cabeçalhos e usavam estados vazios muito simples.
- **Solução**:
  - **Cards de Métricas Individuais e Elevados (`CardsResumo`)**: Substituição da grade contínua de 1px por 4 cards individuais independentes com elevação suave (`bg.panel`, `border.subtle`, hover animado em `translateY(-1px)`). Cada métrica agora conta com um ícone dedicado em container colorido suave (Total de Mídias em Brand, Concluídas em Verde, Processamento em Âmbar e Erros em Vermelho), tipografia em hierarquia clara e métricas secundárias contextuais.
  - **Cabeçalho com Pílula de Status Operacional**: Título do Dashboard alinhado a uma pílula refinada de status em tempo real com indicador luminoso verde/vermelho ("Todos os sistemas operacionais"), padronizada em `borderRadius="full"` e `bg="bg.panel"`.
  - **Barra de Ações Rápidas Expandida (`BarraAcoesRapidas`)**: Inclusão de atalhos diretos para Downloads MP3, Transcrições e Spotify, além de Baixar Vídeo, Prints, Upload Manual, Nova Categoria e Sincronização, cada um com ícone temático e microinterações no hover.
  - **Painéis com Ícones e Microinterações nos Cabeçalhos (`PainelDashboard`)**: Suporte a ícones em containers temáticos em todos os cabeçalhos de painéis (Vídeos, Livros, Origem das Mídias, Armazenamento, Ocupação, Atividades e Serviços).
  - **Modernização de Livros em Áudio e Métricas de Vídeos**: Reformulação do estado vazio de escuta em andamento com card dedicado, ícone de fones e botão de ação direta; barras de proporção calibradas em altura expressiva (6px) com cantos arredondados.
- **Arquivos**:
  - `web/features/dashboard/Dashboard.tsx`
  - `web/features/dashboard/components/CardsResumo.tsx`
  - `web/features/dashboard/components/BarraAcoesRapidas.tsx`
  - `web/features/dashboard/components/CardsVideosMetricas.tsx`
  - `web/features/dashboard/components/SecaoLivrosDashboard.tsx`
  - `web/features/dashboard/components/PainelDashboard.tsx`
  - `web/features/dashboard/components/GraficosDashboard.tsx`
  - `web/features/dashboard/components/AtividadesRecentes.tsx`
  - `web/features/dashboard/components/StatusIntegracoes.tsx`
  - `documentation/progresso/melhorias/MELHORIAS.md`, `documentation/progresso/melhorias/MELHORIAS_6.md`

---

### ✅ Melhoria 123 — Página para Extrair Texto de Imagens

- **Status**: Concluído
- **Data**: 07 de novembro de 2026
- **Problema**:
  - Para pegar o texto de um print era preciso digitar tudo à mão ou usar um serviço externo.
- **Solução**:
  - Nova página `/extrair-texto`, no menu como **Extrair Texto**. Colar uma imagem com Ctrl+V (ou arrastar, ou escolher um arquivo) lê o texto na hora e já copia para a área de transferência.
  - OCR feito no navegador com `tesseract.js` 7, em português e inglês. Sem backend e sem salvar nada.
  - O leitor é criado uma vez e reaproveitado. Na primeira leitura o navegador baixa os dados do CDN e depois usa o cache.
  - O texto aparece num campo editável ao lado da imagem, com progresso durante a leitura e botão para copiar de novo.
- **Arquivos**:
  - `web/features/extrair-texto/` (página, hooks, componentes e utilitário)
  - `web/App.tsx`, `web/layouts/Sidebar.tsx`, `web/layouts/Header.tsx`
  - `package.json`, `package-lock.json`
  - `documentation/funcionalidades/EXTRAIR_TEXTO.md`, `documentation/funcionalidades/CIRQUEIRAX.md`, `documentation/funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md`

---

### ✅ Melhoria 124 — Top Artistas do Spotify Ordenado por Minutos Ouvidos

- **Status**: Concluído
- **Data**: 07 de novembro de 2026
- **Problema**:
  - No Resumo do ano, o top artistas aparecia fora de ordem: Lana Del Rey, com 47h 59m, ficava em 3º, atrás de Alan Walker, com 37h 48m.
  - A lista era ordenada por streams, mas mostrava só as horas. Artistas com músicas mais curtas somavam mais streams com menos tempo.
  - O Wrapped pessoal do Spotify ordena os artistas pelos minutos ouvidos. As músicas continuam por streams.
- **Solução**:
  - Todos os rankings de artistas passam a ordenar por minutos e, no empate, por streams: cápsula do mês, rankings (hoje, dias, mês, ano, sempre, personalizado), resumo do ano, recordes, hábitos, meses no top 5 e posição geral do artista.
  - Músicas e álbuns continuam ordenados por streams.
- **Arquivos**:
  - `src/Repository/AnaliseReproducaoSpotifyRepository.php`
  - `src/Repository/ReproducaoSpotifyRepository.php`
  - `src/Service/Spotify/ObterRecordesSpotifyService.php`, `src/Service/Spotify/ObterHabitosSpotifyService.php`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 125 — Tempo do Spotify Exibido em Minutos com Horas no Tooltip

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - A página do Spotify mostrava o tempo ouvido em horas (`47h 59m`), enquanto os relatórios do próprio Spotify usam minutos.
- **Solução**:
  - Todo tempo ouvido passa a ser exibido em minutos (`2.879 min`): cápsula, rankings, hoje e últimos dias, curiosidades, recordes, evolução por mês, hábitos, resumo do ano e páginas de detalhe.
  - Ao passar o mouse, um tooltip no visual do Spotify (fundo `cartaoElevado`, texto branco em negrito, cantos de 4px) mostra o valor em horas, por extenso (`47 horas e 59 minutos`). Abaixo de 1 hora não há tooltip.
  - Gráficos mostram minutos no eixo e minutos e horas no tooltip. A imagem PNG da Cápsula também usa minutos.
  - Novos componentes `MinutosSpotify` e `TooltipSpotify`, e formatadores `formatarMinutos` e `formatarMinutosEmHorasExtenso`.
- **Arquivos**:
  - `web/features/spotify/components/MinutosSpotify.tsx` (novo)
  - `web/features/spotify/utils/formatadoresSpotify.ts`, `web/features/spotify/utils/imagemCapsula.ts`
  - `web/features/spotify/components/` (cápsula, rankings, seções e gráficos), `web/features/spotify/DetalheArtistaSpotify.tsx`, `web/features/spotify/DetalheMusicaSpotify.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 126 — Músicas de Artistas e Álbuns no Ranking com Popup da Lista Completa

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - No ranking da primeira seção (músicas, artistas e álbuns), abrir um artista mostrava no máximo 5 músicas, sem como ver o resto. Álbuns não abriam.
  - As músicas do artista ignoravam o período escolhido: em "Hoje", "Últimos N dias", "Ano" e "Personalizado" apareciam os números de sempre (por exemplo, Faded com 85 streams no ranking de hoje). Só "Mês" filtrava.
- **Solução**:
  - Artistas e álbuns abrem com as 5 músicas mais ouvidas no mesmo período do ranking. Se houver mais, o botão **Ver todas as músicas** abre um popup (tela cheia no celular) com a lista completa.
  - O endpoint `GET /api/v1/spotify/artistas/top-musicas` passou a aceitar o mesmo período do ranking (`tipo`, `dias`, `ano`, `mes`, `inicio`, `fim`), filtro por `album` e `limite` (até 500). O período é resolvido pela mesma regra do ranking (`ObterResumoIntervaloPersonalizadoService::resolverIntervalo`).
  - A Cápsula do mês continua mostrando as músicas do mês.
  - Correção (08/11/2026): o popup ocupava a tela inteira na vertical. Agora tem tamanho fixo (`lg`), altura máxima de 75% da tela no computador e 85% no celular, e a lista rola por dentro.
- **Arquivos**:
  - `src/Controller/Spotify/SpotifyController.php`, `src/Service/Spotify/ObterTopMusicasArtistaService.php`, `src/Service/Spotify/ObterResumoIntervaloPersonalizadoService.php`, `src/Repository/ReproducaoSpotifyRepository.php`
  - `web/features/spotify/components/ListaMusicasItemSpotify.tsx` (antes `ListaTopMusicasArtista.tsx`), `web/features/spotify/components/ModalMusicasItemSpotify.tsx` (novo), `web/features/spotify/components/ItensRankingSpotify.tsx`, `web/features/spotify/components/SecaoHojeSemana.tsx`, `web/features/spotify/components/SecaoCapsulaSonora.tsx`
  - `web/features/spotify/api.ts`, `web/features/spotify/hooks/useMusicasItemSpotify.ts` (antes `useTopMusicasArtista.ts`), `web/features/spotify/hooks/chavesQuerySpotify.ts`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 127 — Sincronização do Spotify Mais Rápida e Sem Perder Músicas Atrasadas

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - Músicas ouvidas não apareciam: das 15 da playlist "Hoje" do Spotify, algumas demoravam a entrar e uma (Force) não entrou.
  - A coleta pedia ao Spotify só as músicas depois da última coletada (cursor `after`). Quando o Spotify registra uma música com atraso, com horário anterior a esse cursor, ela era pulada para sempre.
  - A coleta automática rodava só a cada 30 minutos e o reinício do container atrasava ainda mais.
- **Solução**:
  - Cada coleta pede sempre as 50 últimas músicas e deixa a deduplicação descartar as já gravadas.
  - Coleta automática a cada 5 minutos.
  - Com a página aberta, o cartão **Tocando agora** sincroniza sozinho 20 s depois de cada troca de música e atualiza a tela se entrar música nova.
  - O aviso de "Sincronizar agora" mostra quantas músicas novas entraram e explica que o Spotify só informa a música depois que ela termina.
- **Arquivos**:
  - `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `src/Schedule.php`
  - `web/features/spotify/hooks/useSincronizacaoAutomaticaSpotify.ts` (novo), `web/features/spotify/hooks/useSincronizarSpotify.ts`, `web/features/spotify/hooks/index.ts`
  - `web/features/spotify/components/CartaoTocandoAgora.tsx`, `web/features/spotify/components/PainelConexaoSpotify.tsx`, `web/features/spotify/components/EstadoVazioSpotify.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`


---

### ✅ Melhoria 128 — Streams e Minutos Contam para Todos os Artistas da Música

- **Status**: Concluído
- **Data**: 08 de novembro de 2026
- **Problema**:
  - Uma música com vários artistas contava só para o artista principal. Play (K-391 com Alan Walker), End of Time e Strongest (Alan Walker Remix) não entravam nos números do Alan Walker.
  - O histórico importado do Spotify só traz o artista principal, então não havia de onde tirar os demais.
  - A M124 passou a ordenar os artistas por minutos com base numa fonte secundária. A metodologia oficial do Spotify ordena por streams.
- **Solução**:
  - Nova tabela `artista_faixa_spotify` com todos os artistas de cada música. A coleta grava os artistas que a API devolve. Uma rotina a cada minuto busca 15 músicas sem artistas em `GET /tracks/{id}` até cobrir todo o histórico (cerca de 14,9 mil músicas). Comando manual: `app:spotify:artistas-faixas --limite=N`.
  - Rankings de artistas, top 5 de artistas, artista do ano, detalhe do artista, meses no top 5, posição geral, artistas novos, redescobertas, concentração nos 5 do topo e curiosidades passam a creditar a música inteira para cada artista. Totais e rankings de músicas não duplicam.
  - Os números antigos foram recalculados: os cálculos são feitos na hora a partir das reproduções, então valem para todo o histórico assim que os artistas de cada música são gravados.
  - Artistas voltam a ser ordenados por streams, com minutos como desempate. Top artistas da Retrospectiva mostram streams e minutos.
  - Correção (09/11/2026): a busca em massa levou um limite de requisições (429) do Spotify com espera longa. O cliente dormia o tempo inteiro e travava também a coleta das músicas recentes por cerca de 1 hora. Agora o cliente só espera até 10 s, a busca pausa pelo tempo exato que o Spotify pede (o primeiro castigo foi de cerca de 22 horas) e vai mais devagar (15 músicas por minuto, 2 s entre chamadas).
- **Arquivos**:
  - `src/Entity/ArtistaFaixaSpotify.php`, `src/Repository/ArtistaFaixaSpotifyRepository.php`, `migrations/Version20261108220436.php` (novos)
  - `src/Service/Spotify/SincronizarArtistasFaixasSpotifyService.php`, `src/Message/SincronizarArtistasFaixasSpotifyMessage.php`, `src/MessageHandler/SincronizarArtistasFaixasSpotifyMessageHandler.php`, `src/Command/SincronizarArtistasFaixasSpotifyCommand.php` (novos)
  - `src/Schedule.php`, `src/Infra/Spotify/SpotifyClient.php`, `src/Exception/Spotify/SpotifyException.php`, `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `src/Repository/AnaliseReproducaoSpotifyRepository.php`, `src/Repository/ReproducaoSpotifyRepository.php`
  - `web/features/spotify/components/SecaoRetrospectiva.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 129 — Transcrição de Vídeos, Limite de 2 GB e Correção do Texto com IA

- **Status**: Concluído
- **Data**: 09 de novembro de 2026
- **Problema**:
  - A tela de transcrições só falava em áudio, e o limite era de 500 MB por arquivo, pouco para vídeos.
  - O texto que sai do reconhecimento de fala vem com falhas (palavras trocadas, nomes errados, pontuação), e não havia como consertar sem editar na mão.
- **Solução**:
  - Vídeos (MP4, MOV, MKV, WEBM, AVI, WMV, M4V...) são aceitos de forma explícita. Antes de transcrever, o worker tira só o áudio do vídeo com `ffmpeg` e apaga o vídeo, para não ocupar até 2 GB por 7 dias.
  - Limite de 2 GB por arquivo em todas as camadas: Nginx do host, Nginx interno, PHP (`upload_max_filesize`, `post_max_size` 2100M, `max_input_time` 3600) e validação. O Whisper pode rodar por até 12 horas.
  - Botão **Corrigir com IA**: manda o texto pronto para a OpenAI (`gpt-5.4-mini`), explicando que é uma transcrição automática de áudio ou vídeo. Roda na fila, em blocos de até 1.500 palavras. O texto corrigido fica numa aba própria, com copiar e `.txt`; o original continua salvo.
  - Chave `OPENAI_API_KEY` e modelo `OPENAI_MODELO_TEXTO` no `.env`.
- **Arquivos**:
  - `src/Entity/Transcricao.php`, `src/Enum/StatusCorrecaoTranscricao.php` (novo), `migrations/Version20261109193657.php` (novo)
  - `src/Interface/ExtratorAudioVideoInterface.php`, `src/Infra/Transcricao/ExtratorAudioFfmpegClient.php`, `src/Interface/CorretorTextoTranscricaoInterface.php`, `src/Infra/OpenAi/OpenAiCorretorTextoClient.php` (novos)
  - `src/Service/Transcricao/SolicitarCorrecaoTranscricaoService.php`, `src/Service/Transcricao/CorrigirTextoTranscricaoService.php`, `src/Message/CorrigirTextoTranscricaoMessage.php`, `src/MessageHandler/CorrigirTextoTranscricaoMessageHandler.php` (novos)
  - `src/Service/Transcricao/TranscreverAudioService.php`, `src/Service/Transcricao/ExpirarAudiosTranscricaoService.php`, `src/Infra/Transcricao/WhisperCppClient.php`, `src/DataObject/Transcricao/EnviarAudioTranscricaoDTO.php`, `src/Exception/Transcricao/TranscricaoException.php`, `src/Controller/Transcricao/TranscricaoController.php`, `src/Serializer/TranscricaoSerializer.php`
  - `config/services.yaml`, `config/packages/messenger.yaml`, `devops/php/php.prod.ini`, `devops/php/php.dev.ini`, `devops/php/nginx-internal.conf`, `devops/nginx/prod.conf`, `devops/nginx/dev.conf`
  - `web/features/transcricoes/components/CorrecaoIaTranscricao.tsx` (novo), `PainelTranscricao.tsx`, `BarraFerramentasTexto.tsx`, `AreaEnvioAudios.tsx`, `CabecalhoTranscricoes.tsx`, `EstadoSemSelecao.tsx`, `api.ts`, `types.ts`, `hooks/useAcoesTranscricao.ts`, `hooks/useTranscricoes.ts`, `utils/arquivos.ts`, `utils/exportacao.ts`
  - `documentation/funcionalidades/TRANSCRICOES.md`, `documentation/funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md`, `documentation/README.md`

---

### ✅ Melhoria 130 — Página de Teste do Player do Spotify

- **Status**: Concluído
- **Data**: 10 de novembro de 2026
- **Problema**:
  - No trabalho, o proxy bloqueia o Spotify. A ideia é ouvir pelo CirqueiraX, mas antes é preciso saber se o player do Spotify consegue tocar nessa rede.
- **Solução**:
  - Página `/spotify/player-teste` com um teste em 4 passos (biblioteca do Spotify, permissão, dispositivo e som), um registro do que aconteceu e um mini player com tocar e pausar.
  - O comando de tocar sai do servidor; só o áudio vem direto do Spotify para o navegador.
  - A conexão com o Spotify passa a pedir as permissões de reprodução. A página tem o botão **Reconectar Spotify**, que volta para o teste.
  - Ajuste (10/11/2026): no primeiro teste no trabalho, o passo 3 parou sem nenhum erro do Spotify. O registro passou a mostrar o suporte a DRM, o pedido e a entrega do token e a resposta do `connect()`. O tempo limite subiu para 40 s e, se falhar, a página testa os endereços do Spotify e mostra quais o proxy bloqueia.
  - Resultado (10/11/2026): na rede do trabalho, a biblioteca (`sdk.scdn.co`) carrega e o navegador tem DRM, mas a API, o `apresolve`, o `dealer`, o `spclient`, a licença DRM e a CDN de áudio do Spotify ficam todos sem resposta ou bloqueados. O player do Spotify não tem como funcionar nessa rede, e não existe forma permitida de fazer o áudio passar pelo servidor do CirqueiraX. Por isso o player completo não foi construído.
- **Arquivos**:
  - `src/Controller/Spotify/PlayerSpotifyController.php`, `src/Service/Spotify/PlayerTesteSpotifyService.php` (novos)
  - `src/Service/Spotify/GerarUrlAutorizacaoSpotifyService.php`, `src/Interface/SpotifyInterface.php`, `src/Infra/Spotify/SpotifyClient.php`, `src/Repository/ReproducaoSpotifyRepository.php`, `src/Exception/Spotify/SpotifyException.php`
  - `web/features/spotify/PlayerTesteSpotify.tsx`, `web/features/spotify/hooks/usePlayerTesteSpotify.ts` (novos), `web/features/spotify/api.ts`, `web/features/spotify/hooks/index.ts`, `web/features/spotify/components/SpotifyCallback.tsx`, `web/App.tsx`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### 🟡 Melhoria 131 — Cada Usuário com as Suas Mídias, Categorias e Google Fotos

- **Status**: Publicado, falta validar
- **Data**: 10 de novembro de 2026
- **Problema**:
  - O sistema vai ser usado por mais pessoas, mas a central de mídias, as categorias, as regras de origem, o Google Fotos (uma conta só), o histórico de envios, os tokens de agente e o painel eram compartilhados: qualquer usuário logado via e mexia em tudo.
- **Solução**:
  - Backup completo antes (`/root/backups/cirqueirax/2026-11-10_antes-multiusuario/`, tag `backup-antes-multiusuario-2026-11-10`).
  - Mídias, categorias, regras de origem, conta do Google Fotos, envios e tokens de agente ganharam dono (`usuario_id`). Tudo o que existia foi ligado à conta `gabrielcirqueira711@gmail.com`.
  - Todas as rotas filtram pela conta logada; item de outra pessoa responde 404, inclusive em lote, stream, miniatura, download, edição de imagem e envio forçado ao Google Fotos. Categoria usada numa ação precisa ser da mesma conta.
  - Duplicados são procurados só dentro da conta. O nome da categoria e a origem da regra só precisam ser únicos por conta.
  - Google Fotos: uma conta Google por usuário; envio usa a conta do dono da mídia; status, álbuns, conectar, desconectar e histórico são da conta logada.
  - Print enviado pelo agente entra na conta do dono do token.
  - Arquivos de cada usuário ficam em `<pasta do usuário>/<pasta da categoria>`. A conta principal usa a pasta vazia, então nenhum arquivo mudou de lugar.
  - Painel: números, últimas mídias, categorias, erros e Spotify da conta logada. Sincronização (Syncthing) só para administradores; a conta principal recebeu `ROLE_ADMIN`.
  - Comandos `app:agente:gerar-token`, `app:seed:origem-regras`, `app:google-fotos:autorizar-conta` e `app:google-fotos:limpar-duplicados-franky` pedem `--usuario`.
- **Arquivos**:
  - `migrations/Version20261110151341.php` (novo)
  - `src/Entity/Usuario.php`, `MediaItem.php`, `Categoria.php`, `OrigemRegra.php`, `ContaGoogleFotos.php`, `RegistroEnvioGoogleFotos.php`, `TokenAgente.php`, `src/DataObject/IngestarMediaDTO.php`
  - `src/Repository/MediaItemRepository.php`, `CategoriaRepository.php`, `OrigemRegraRepository.php`, `ContaGoogleFotosRepository.php`, `RegistroEnvioGoogleFotosRepository.php`, `UsuarioRepository.php`
  - `src/Controller/MediaItem/MediaItemController.php`, `EdicaoImagemController.php`, `src/Controller/Categoria/CategoriaController.php`, `src/Controller/OrigemRegra/OrigemRegraController.php`, `src/Controller/GoogleFotos/GoogleFotosController.php`, `EnviosGoogleFotosController.php`, `src/Controller/Dashboard/DashboardController.php`, `src/Controller/Video/DownloadController.php`, `src/Controller/Sync/SyncController.php`
  - `src/Service/MediaItem/*` (MediaItemService, ClassificarMediaItemService, UploadManualService, SalvarEdicaoImagemService, RetentarMediaItemService, RebaixarMediaItemService), `src/Service/Ingestao/*`, `src/Service/Video/BaixarVideoService.php`, `src/Service/Distribuicao/DistribuirLocalService.php`, `src/Service/Categoria/*`, `src/Service/OrigemRegra/OrigemRegraService.php`, `src/Service/GoogleFotos/*`, `src/Service/Dashboard/DashboardService.php`
  - `src/Message/BaixarVideoMessage.php`, `src/MessageHandler/BaixarVideoMessageHandler.php`, `src/MessageHandler/ClassificarMediaMessageHandler.php`
  - `src/Command/GerarTokenAgenteCommand.php`, `SeedOrigemRegrasCommand.php`, `AutorizarContaGoogleFotosCommand.php`, `LimparDuplicadosFrankyCommand.php`
  - `web/features/dashboard/Dashboard.tsx`, `web/features/dashboard/hooks/useDashboard.ts`
  - `documentation/funcionalidades/MULTIUSUARIO.md` (novo), `CATEGORIAS_E_REGRAS.md`, `GOOGLE_FOTOS.md`, `SYNCTHING.md`, `DASHBOARD.md`, `CENTRAL_MIDIAS.md`, `documentation/stack/BACKEND.md`, `documentation/guias/GUIA_SINCRONIZACAO_ECOSSISTEMA.md`, `documentation/README.md`

---

### ✅ Melhoria 132 — Links Curtos `vt.tiktok.com` Aceitos no Download

- **Status**: Concluído
- **Data**: 10 de novembro de 2026
- **Problema**:
  - O link curto de compartilhamento do TikTok `https://vt.tiktok.com/...` era recusado como "URL inválida ou não pertence a uma plataforma suportada". O validador só aceitava `tiktok.com` e `vm.tiktok.com`.
- **Solução**:
  - O validador passou a aceitar qualquer subdomínio de `tiktok.com`. O yt-dlp já resolve o link curto para o vídeo (testado com o link que falhou).
- **Arquivos**:
  - `src/Service/Video/ValidadorUrlPlataforma.php`
  - `documentation/funcionalidades/DOWNLOADS_VIDEOS.md`

---

### 🟡 Melhoria 133 — Busca de Artistas do Spotify pelas Músicas Mais Tocadas e Registro dos Bloqueios

- **Status**: Publicado, falta validar
- **Data**: 10 de novembro de 2026
- **Problema**:
  - A busca dos artistas (M128) ia das músicas mais recentes para as mais antigas, uma a cada 2 s. O Spotify aceita umas 600 consultas e bloqueia o app por horas; no ritmo de 600 a 700 por dia, as 13.377 que faltavam levariam umas 3 semanas, e as 1.538 já feitas eram as mais recentes, não as mais tocadas.
  - A pausa ficava no cache do container: cada deploy apagava a pausa e a busca chamava o Spotify durante o bloqueio (foi o que aconteceu em 10/11 às 13h33).
  - Durante o bloqueio, a coleta das músicas novas também para, e o recently-played só guarda as últimas 50.
- **Solução**:
  - Ordem por streams (30 s ou mais), das mais tocadas para as menos tocadas. Só entram músicas com 3 ou mais streams (3.522 músicas, 88% dos streams; faltavam 2.576). As outras ficam só com o artista principal.
  - Ritmo mais lento para medir se o bloqueio some: uma consulta a cada 6 s, até 9 por minuto.
  - Tabela `bloqueio_spotify`: cada 429 grava o `Retry-After`, a hora de liberação, a origem (coleta ou busca), as consultas feitas desde o bloqueio anterior e o ritmo. A janela de bloqueio fica no banco e vale para a coleta e para a busca, mesmo depois de deploy. O bloqueio em curso (13h33, 24.179 s, libera às 20h17) já foi gravado.
  - Prioridade da coleta: depois de cada bloqueio, a busca de artistas só volta depois de uma coleta bem-sucedida das músicas recentes.
  - A consulta em lote `GET /tracks?ids=` não foi testada: o Spotify a removeu do modo de desenvolvimento.
- **Arquivos**:
  - `src/Entity/BloqueioSpotify.php`, `src/Repository/BloqueioSpotifyRepository.php`, `src/Service/Spotify/ControleLimiteSpotifyService.php`, `migrations/Version20261110172427.php` (novos)
  - `src/Service/Spotify/SincronizarArtistasFaixasSpotifyService.php`, `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `src/Repository/ArtistaFaixaSpotifyRepository.php`, `src/Command/SincronizarArtistasFaixasSpotifyCommand.php`
  - `documentation/funcionalidades/SPOTIFY.md`

---

### 🟡 Melhoria 134 — Página de Teste do Player do YouTube

- **Status**: Publicado, falta validar
- **Data**: 10 de novembro de 2026
- **Problema**:
  - O Spotify não toca na rede do trabalho (M130). Antes de pensar num player próprio usando o YouTube, é preciso saber se o player oficial embutido do YouTube funciona nessa rede.
- **Solução**:
  - Página `/youtube/player-teste`, só no navegador: baixa a biblioteca do player, abre o player (356 × 200) e, ao clicar em **Tocar**, confirma que o tempo do vídeo anda.
  - Campo para colar um link do YouTube ou do YouTube Music e testar se aquela música aceita tocar fora do YouTube; erros 101/150 aparecem traduzidos.
  - Teste dos endereços do YouTube (biblioteca, site, YouTube Music, imagens, `googlevideo.com` e anúncios) para mostrar o que o proxy bloqueia.
  - Resultado (10/11/2026, 14h50): na rede do trabalho os 3 passos passaram. A biblioteca carregou, o player abriu em 1 s e o vídeo de exemplo tocou e avançou normalmente (tocar e pausar funcionaram). Falta testar músicas reais (bloqueio de incorporação 101/150).
- **Arquivos**:
  - `web/features/youtube/PlayerTesteYoutube.tsx`, `web/features/youtube/hooks/usePlayerTesteYoutube.ts` (novos), `web/App.tsx`
  - `documentation/funcionalidades/YOUTUBE_PLAYER.md` (novo), `documentation/README.md`

---

### ✅ Melhoria 135 — Conectar o YouTube Music com os Cabeçalhos Copiados do Chrome ou do Firefox

- **Status**: Concluído
- **Data**: 11 de novembro de 2026
- **Problema**: ao colar os cabeçalhos da conta Google para conectar o YouTube Music, a conexão falhava com "formato inesperado". Três causas: o Chrome copia os cabeçalhos em linhas alternadas (nome numa linha, valor na outra, com `:authority` e `:path`); o "Copiar cabeçalhos da requisição" do Firefox inclui a primeira linha `POST /youtubei/... HTTP/3`, que não é cabeçalho e fazia o script perder o cookie; e, como o sistema guarda só os cabeçalhos essenciais (sem `Authorization`), o ytmusicapi 1.12 assumia OAuth e falhava antes de consultar.
- **Solução**:
  - `bin/ytmusic.py` aceita o formato de linhas alternadas do Chrome, descarta os cabeçalhos de codificação e a linha de requisição do Firefox.
  - A autenticação é marcada como de navegador; a biblioteca calcula o SAPISIDHASH a partir do cookie.
  - Sessão deslogada aparece como "copie os cabeçalhos de novo" em vez de "formato inesperado"; a verificação sem login tenta 3 vezes (o Google às vezes devolve a página "Sorry" ao IP do servidor); o nome da conta virou opcional.
  - Validado com a cópia do Firefox: conta reconhecida e 199 itens no histórico.
- **Arquivos**: `bin/ytmusic.py`, `documentation/funcionalidades/MUSICA.md`

---

### ✅ Melhoria 136 — Aviso de Cookie Cortado ao Conectar o YouTube Music

- **Status**: Concluído
- **Data**: 11 de novembro de 2026
- **Problema**: o painel de cabeçalhos do Firefox corta valores longos com "…". Colando o cookie assim, a conexão dizia que a sessão não estava logada, o que não explicava o erro.
- **Solução**: a conexão detecta o cookie cortado e explica como copiar inteiro (botão direito na requisição "browse" → Copiar valor → Copiar cabeçalhos da requisição).
- **Arquivos**: `src/Service/YoutubeMusic/InterpretadorCabecalhosNavegadorService.php`, `src/Exception/YoutubeMusic/YoutubeMusicException.php`

---

### ✅ Melhoria 137 — Coleta do YouTube Music Resistente a Respostas Vazias e a Cada 30 s de Verdade

- **Status**: Concluído
- **Data**: 11 de novembro de 2026
- **Problema**:
  - Cerca de 1 em cada 5 consultas autenticadas do servidor volta vazia (limite do Google para o IP), e o script tratava isso como sessão deslogada; a conexão falhava às vezes mesmo com cookie válido.
  - O próximo horário da coleta era calculado no fim da consulta (+30 s) e caía logo depois do disparo do agendador, que também roda a cada 30 s; na prática a consulta acontecia a cada 60 s.
- **Solução**:
  - O script tenta até 4 vezes (esperas de 3, 6 e 9 s) e, se continuar vazio, informa serviço indisponível em vez de pedir cookie novo. Teste: 10 de 10 leituras com sucesso.
  - O próximo horário conta do início da consulta, com 5 s de folga (`TOLERANCIA_AGENDADOR_SEGUNDOS`).
- **Arquivos**: `bin/ytmusic.py`, `src/Service/YoutubeMusic/ColetarHistoricoYoutubeMusicService.php`

---

### ✅ Melhoria 138 — Tempo Ouvido Correto na Música Tocando Agora e no Fuso Horário

- **Status**: Concluído
- **Data**: 11 de novembro de 2026
- **Problema**:
  - A música detectada no topo do histórico entrava com a duração inteira (ex.: 5:45 contados com 2 min de música).
  - `tocadaEm` é gravado em UTC, mas era lido como horário de Brasília; o intervalo entre a reprodução nova e a anterior dava negativo e o tempo da anterior virava 0 (Pink Floyd sumiu do ranking quando chegou Thunderstruck). A busca da última reprodução também ficava 3 h atrasada.
- **Solução**:
  - A reprodução nasce com 0, o início é estimado no meio do intervalo entre consultas e, a cada coleta, o tempo sobe para `min(decorrido, duração)` (`AtualizarReproducaoEmAndamentoYoutubeService`).
  - `ReproducaoYoutube::tocadaEm()` devolve sempre em UTC, e `buscarUltimaAntesDe` converte o momento consultado para UTC.
- **Arquivos**: `src/Service/YoutubeMusic/AtualizarReproducaoEmAndamentoYoutubeService.php`, `src/Service/YoutubeMusic/ColetarHistoricoYoutubeMusicService.php`, `src/Service/YoutubeMusic/RegistrarReproducoesYoutubeService.php`, `src/Entity/ReproducaoYoutube.php`, `src/Repository/ReproducaoYoutubeRepository.php`, `documentation/funcionalidades/MUSICA.md`, `documentation/funcionalidades/YOUTUBE_MUSIC.md`

---

### ✅ Melhoria 139 — Limite da Busca de Artistas do Spotify em Janela de 24 Horas

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: o orçamento de 400 consultas por dia zerava à meia-noite, e a busca chegou a 569 consultas em 24 h. O Spotify bloqueou o app às 00:18 por cerca de 20 h, e a coleta das músicas recentes parou junto.
- **Solução**: no máximo 300 consultas nas últimas 24 h, em janela móvel (`ControleLimiteSpotifyService`).
- **Arquivos**: `src/Service/Spotify/ControleLimiteSpotifyService.php`, `documentation/funcionalidades/SPOTIFY.md`

---

### ✅ Melhoria 140 — Capas das Músicas Aparecendo (Servidas pelo Sistema)

- **Status**: Concluído
- **Data**: 12 de novembro de 2026
- **Problema**: várias capas apareciam quebradas no navegador do usuário, embora os links abrissem normalmente no servidor e num navegador de teste. Primeiro as do YouTube (`yt3.googleusercontent.com`); depois ficou claro que as do Spotify em `image-cdn-ak/fa.spotifycdn.com` também não abriam nesse navegador.
- **Solução**:
  - As imagens da música (`CapaMusica`, ranking, lista e Cápsula) usam `referrerPolicy="no-referrer"`.
  - Nova rota pública `GET /api/v1/musica/capa?url=` (`ObterCapaMusicaService`), restrita a hosts do Google/YouTube, do Spotify (`i.scdn.co`, `mosaic.scdn.co`, `image-cdn-*.spotifycdn.com`), `www.gstatic.com` e Deezer, e a URLs já gravadas no banco, com cache em disco. O frontend passa todas as capas por ela (`urlCapaExibicao`), inclusive o fundo do topo do detalhe da música.
  - Conferido: as 57 imagens do ranking de 7 dias são servidas.
- **Arquivos**: `src/Controller/Musica/CapaMusicaController.php`, `src/Service/Musica/Capa/ObterCapaMusicaService.php`, `src/DataObject/CapaMusicaArquivoDTO.php`, `src/Exception/Musica/CapaMusicaException.php`, `src/Repository/MusicaCatalogoRepository.php`, `config/packages/security.yaml`, `config/services.yaml`, `web/features/musica/utils/capaMusica.ts`, `web/features/musica/utils/imagemCapsula.ts`, `web/features/musica/components/CapaMusica.tsx`, `web/features/musica/components/HeroDetalheMusica.tsx`, `web/features/musica/components/ItensRankingMusica.tsx`, `web/features/musica/components/ListaMusicasItem.tsx`, `web/features/musica/components/SecaoCapsulaSonora.tsx`, `web/features/musica/components/ModalImagemCapsula.tsx`
