# Progresso — Tópicos 181 a 200

> Documento de detalhamento contínuo dos tópicos concluídos do roadmap.

### ✅ Tópico 181 — Frontend — vincular, retornar do Spotify, reconectar e desconectar
- **Status**: Concluído
- **O que foi feito**:
  - Implementação do painel de controle e conexão [`PainelConexaoSpotify.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/spotify/components/PainelConexaoSpotify.tsx):
    - Três estados visuais:
      1. **Desconectada**: botão verde com efeito de brilho e ícone do Spotify chamando `obterUrlAutorizacaoSpotify` e redirecionando a janela diretamente para o OAuth do Spotify.
      2. **Conectada**: exibe avatar/foto do usuário em círculo, nome de exibição, badge de status sincronizado, data/hora da conexão e da última coleta periódica, botão para acionar importação manual e botão de desconexão.
      3. **Reconectar / Revogada**: aviso em destaque e botão de reconexão automática com o mesmo fluxo simplificado.
    - Indicador de alerta quando a coleta periódica estiver parada há mais de 1 hora.
  - Implementação do modal de confirmação de desconexão [`ModalConfirmarDesconexao.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/spotify/components/ModalConfirmarDesconexao.tsx):
    - Explicação clara ao usuário de que as reproduções obtidas via API serão excluídas, mas os dados importados de arquivos de histórico permanecem preservados.
    - Lembrete de que o aplicativo pode ser revogado a qualquer momento nas configurações do Spotify.
  - Implementação da página/rota de callback [`SpotifyCallback.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/spotify/components/SpotifyCallback.tsx):
    - Rota `/spotify/callback` registrada no `App.tsx` dentro da malha autenticada `<RotaProtegida />`.
    - Execução automática na montagem com `useMountEffect` (sem `useEffect`) consumindo os parâmetros `code` e `state`.
    - Tratamento explícito de cancelamento (`error=access_denied`), parâmetros ausentes ou erro na troca de tokens (ex: conta não cadastrada no modo desenvolvimento do Spotify Developer Dashboard).
    - Feedback visual com botões "Tentar novamente" e "Voltar para o Spotify".
  - Totalmente aderente ao padrão semântico Chakra UI, tema escuro `TemaSpotify` e sem tags HTML puras.
- **Arquivos**:
  - `web/features/spotify/components/PainelConexaoSpotify.tsx`
  - `web/features/spotify/components/ModalConfirmarDesconexao.tsx`
  - `web/features/spotify/components/SpotifyCallback.tsx`
  - `web/App.tsx`

### ✅ Tópico 182 — Frontend — importação do arquivo de histórico
- **Status**: Concluído
- **O que foi feito**:
  - Criação do componente [`ModalUploadHistoricoSpotify.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/spotify/components/ModalUploadHistoricoSpotify.tsx):
    - Layout responsivo adaptativo via `useMediaQuery`: abre como `Dialog` no desktop e `Drawer` (bottom sheet) em dispositivos móveis.
    - Área de dropzone interativa para arrastar e soltar ou selecionar arquivos `.zip` ou `.json`.
    - Instruções passo a passo (Accordion colapsável) ensinando como pedir os arquivos na conta do Spotify: "Dados da conta" (cerca de 5 dias) vs "Histórico ampliado de streams" (até 30 dias), dispensando "Informações técnicas de registro".
    - Aviso de privacidade em destaque: esclarece que arquivos ZIP contêm dados adicionais, mas o sistema consome unicamente o histórico de reproduções descartando todo o restante.
    - Explicação da deduplicação e idempotência: o usuário pode reimportar arquivos do mesmo período sem duplicar reproduções.
    - Barra de progresso com polling ativo (`useConsultarImportacaoSpotify`) a cada 2,5s enquanto o status for `enviada` ou `processando`.
    - Painel resumido dos resultados após conclusão exibindo: total de reproduções lidas, novas adicionadas, substituídas/refinadas com código e ignoradas/duplicadas.
    - Tratamento e exibição de falhas de processamento com botão para tentar novo arquivo.
- **Arquivos**:
  - `web/features/spotify/components/ModalUploadHistoricoSpotify.tsx`
  - `web/features/spotify/components/index.ts`


### ✅ Tópico 183 — Frontend — página /spotify com Hoje, Semana e Curiosidades
- **Status**: Concluído
- **O que foi feito**:
  - Implementação da página principal [`web/features/spotify/Spotify.tsx`](file:///home/gabriel/dev/CirqueiraX/web/features/spotify/Spotify.tsx):
    - Uso de `AppContainer`, metadados de página via `useSEO`, sem Header nem Footer próprios.
    - Estrutura completa de cima para baixo: `PainelConexaoSpotify`, `SecaoHojeSemana`, `SecaoCuriosidades`, `SecaoCapsulaSonora` e `RodapeSpotify`.
    - Suporte a estados de carregamento em esqueleto (`EsqueletoPaginaSpotify`) que replicam a estrutura exata do layout (sem spinners genéricos isolados).
    - Suporte a estado vazio com ilustrações temáticas e chamadas claras de ação (`EstadoVazioSpotify`) para vincular ou importar arquivos.
  - Implementação de `SecaoHojeSemana.tsx`:
    - Alternância em pílula entre "Hoje" e "Últimos 7 dias".
    - Abas "Músicas" e "Artistas" com rankings temáticos e formatações de tempo e streams.
    - Exibição de variação percentual de minutos com badges semânticos verde/vermelho.
  - Implementação de `SecaoCuriosidades.tsx`:
    - Grade responsiva com cartões de destaque: Horário de Pico, Dia Mais Frequente, Dia Mais Longo, Faixa Mais Repetida em um único dia, Novos Artistas Descobertos e Média Diária com comparação em relação ao ritmo do mês anterior.
  - Implementação de `ItensRankingSpotify.tsx`:
    - Linhas de ranking com capa da faixa ou avatar circular do artista, posição amarela/azul, links para abertura direta no Spotify e tempos formatados.
  - Implementação de `RodapeSpotify.tsx`:
    - Emblema oficial do Spotify com área de respiro e link "Abrir no Spotify".
  - Registro da rota `/spotify` em `web/App.tsx`, item no menu lateral `web/layouts/Sidebar.tsx` com ícone `Radio` e título da rota em `web/layouts/Header.tsx`.
- **Arquivos**:
  - `web/features/spotify/Spotify.tsx`
  - `web/features/spotify/components/SecaoHojeSemana.tsx`
  - `web/features/spotify/components/SecaoCuriosidades.tsx`
  - `web/features/spotify/components/ItensRankingSpotify.tsx`
  - `web/features/spotify/components/EstadoVazioSpotify.tsx`
  - `web/features/spotify/components/EsqueletoPaginaSpotify.tsx`
  - `web/features/spotify/components/RodapeSpotify.tsx`
  - `web/layouts/Sidebar.tsx`
  - `web/layouts/Header.tsx`
  - `web/App.tsx`

### ✅ Tópico 184 — Frontend — seção Cápsula Sonora com seletor de mês
- **Status**: Concluído
- **O que foi feito**:
  - Implementação de `SecaoCapsulaSonora.tsx`:
    - Título "Sua Cápsula sonora" com o mês em destaque na cor verde e o ano em cinza.
    - Selo de "Mês em andamento" para o mês corrente.
    - Seletor suspenso (`select` estilizado) com todos os meses disponíveis, sincronizado com a URL através do hook `useMesCapsulaUrl` (`?mes=AAAA-MM`).
    - Quatro cartões principais com a estética dos prints originais da Cápsula:
      1. **Tempo ouvindo**: número de minutos em verde grande e streams totais.
      2. **Artista mais ouvido**: nome em azul com foto circular e reproduções.
      3. **Música mais ouvida**: título em amarelo com capa de cantos arredondados (4px/8px) e streams.
      4. **Variedade musical**: contagem de faixas distintas e percentual de variação em relação ao mês anterior, com miniatura das capas do top 4.
    - Modal/Drawer de detalhes completo:
      - Detalhe de **Músicas mais ouvidas**: comparação com o total de músicas distintas do mês anterior, ranking com posições em amarelo, indicadores de subida/descida (`ArrowUp`/`ArrowDown`), selo de `Estreia` e badge de "N meses no top 5".
      - Detalhe de **Artistas mais ouvidos**: foto circular, ranking azul, indicadores de movimento e tempo total ouvido.
      - Detalhe de **Tempo ouvindo por dia**: gráfico de barras com Recharts renderizando os minutos ouvidos dia a dia com tooltip interativo e cores da paleta.
    - Botão de exportação em planilha CSV acionando o utilitário `exportarResumoCapsulaParaCsv`.
    - Polling reativo em segundo plano via `useImagensSpotify` para resolução e exibição de capas faltantes sem travar a interface.
- **Arquivos**:
  - `web/features/spotify/components/SecaoCapsulaSonora.tsx`
  - `web/features/spotify/components/index.ts`

### ✅ Tópico 185 — Calibração com os prints, teste end-to-end e documentação atualizada
- **Status**: Concluído
- **O que foi feito**:
  - Verificação e calibração das regras de domínio da Cápsula Sonora:
    - Filtro de corte mínimo de 30 segundos (`30.000 ms`) para contagem de stream.
    - Cálculo de minutos arredondado e agrupado estritamente no fuso horário de Brasília (`America/Sao_Paulo`).
    - Deduplicação inteligente e priorização de tempos exatos do arquivo estendido/básico sobre estimativas da API.
    - Comparação percentual de variedade musical contra o mês anterior (`((músicas_atual - músicas_anterior) / músicas_anterior) * 100`).
    - Resolução de ranking com desempates e cálculo de movimento de posições no top 5.
  - Verificação de ponta a ponta:
    - `make doctrine-validate`: mapeamento ORM e schema do banco de dados 100% sincronizados.
    - Biome linter executado com zero erros em todos os arquivos da feature (`npx biome check web/features/spotify/ web/App.tsx web/layouts/`).
    - Build de produção do Vite executado com sucesso e zero erros de TypeScript (`npm run build`).
  - Documentação completa atualizada:
    - Criação de `documentation/funcionalidades/SPOTIFY.md` com manual detalhado de funcionamento e calibração.
    - Atualização de `documentation/funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md` com a nova página.
    - Atualização de `documentation/funcionalidades/CIRQUEIRAX.md` registrando os 185 tópicos concluídos.
    - Atualização de `documentation/stack/BACKEND.md` com os controllers, entidades, repositórios e serializers.
    - Atualização de `documentation/stack/FRONTEND.md` com as rotas `/spotify` e `/spotify/callback`.
    - Atualização de `documentation/stack/MESSENGER.md` com as 3 novas mensagens e handler do scheduler.
    - Atualização de `documentation/stack/AUTH.md` com o mecanismo de OAuth 2.0 PKCE.
    - Atualização de `documentation/stack/DOCUMENTACAO_TECNICA.md` com as variáveis de ambiente do Spotify.
- **Arquivos**:
  - `documentation/funcionalidades/SPOTIFY.md`
  - `documentation/funcionalidades/FUNCIONALIDADES_DO_SISTEMA.md`
  - `documentation/funcionalidades/CIRQUEIRAX.md`
  - `documentation/stack/BACKEND.md`
  - `documentation/stack/FRONTEND.md`
  - `documentation/stack/MESSENGER.md`
  - `documentation/stack/AUTH.md`
  - `documentation/stack/DOCUMENTACAO_TECNICA.md`

### ✅ Tópico 186 — Preparação — decisões, limpeza do teste e verificações antes de construir
- **Status**: Concluído (com pendências do Gabriel registradas no documento)
- **O que foi feito**:
  - Criação de [`MUSICA.md`](../funcionalidades/MUSICA.md) com objetivo do lote, tabela de decisões, regras de dados, segurança da credencial, evidências dos testes, pendências do Gabriel, plano de limpeza e fora do escopo. Link adicionado em `documentation/README.md`.
  - Decisões abertas registradas com a proposta padrão do roadmap: página **Música** em `/musica`; tempo ouvido em "Todos" soma medido e estimado com a marca "inclui estimativas"; `LIMITE_COMPONENTES_MASHUP = 5`; Cápsula acompanha o seletor de fonte; desconectar o YouTube Music apaga só a credencial e mantém as reproduções.
  - Remoção de `YTMUSIC_CLIENT_ID` e `YTMUSIC_CLIENT_SECRET` do `.env` do servidor (arquivo fora do Git; nenhuma referência no código).
  - Nova evidência registrada: o segundo cookie do teste funcionou das 07h46 até cerca de 08h10 e depois o coletor só recebeu `YTMusicServerError: None`. O tópico 192 precisa tratar esse erro repetido como sessão expirada.
- **Pendências do Gabriel** (bloco no `MUSICA.md`): pedir o Google Takeout em JSON; conferir a exclusão automática no `myactivity.google.com`; ler as diretrizes de marca do Spotify; medir o atraso do histórico com 5 plays anotados (precisa de cookie válido no coletor de teste); apagar o cliente OAuth do teste no Google Cloud e revogar o acesso de terceiros; confirmar as decisões padrão.
- **Limpeza adiada**: o contêiner `ytmusic_teste_coletor` e `/root/ytmusic_teste` só saem depois do tópico 192 em produção.
- **Arquivos**:
  - `documentation/funcionalidades/MUSICA.md`
  - `documentation/README.md`

### ✅ Tópico 187 — Spotify — proteger a coleta dos bloqueios 429 e remover o que sobrou do teste do player
- **Status**: Concluído
- **O que foi feito**:
  - **Medição por origem:** enum [`OrigemConsultaSpotify`](../../src/Enum/OrigemConsultaSpotify.php) (`coleta_historico`, `tocando_agora`, `capas`, `busca_artistas`, `autorizacao`) e entidade [`ConsultaSpotifyHora`](../../src/Entity/ConsultaSpotifyHora.php) (tabela `consulta_spotify_hora`, hora UTC + origem, único por par). [`ConsultaSpotifyHoraRepository`](../../src/Repository/ConsultaSpotifyHoraRepository.php) incrementa com `INSERT … ON DUPLICATE KEY UPDATE` e soma por origem numa janela.
  - Todas as chamadas ao Spotify registram a origem antes de sair: coleta das recentes, tocando agora, capas e fotos (`ResolverImagemSpotifyService`), busca de artistas e troca/renovação de token.
  - `BloqueioSpotify` passou a usar o enum na origem e ganhou `consultas_por_origem_ultimas24h` (JSON) com o total de cada origem nas 24 h anteriores ao 429. `consultas_desde_ultimo_bloqueio` agora vem do banco, não do cache.
  - **Orçamento:** [`ControleLimiteSpotifyService`](../../src/Service/Spotify/ControleLimiteSpotifyService.php) com `LIMITE_CONSULTAS_ARTISTAS_POR_DIA = 400` (dia de Brasília, contado no banco). A busca de artistas só roda se não houver bloqueio, se a última coleta das recentes deu certo (falha de token ou de API marca a coleta como falha) e se o orçamento do dia não acabou.
  - Tocando agora e capas não consultam o Spotify durante um bloqueio ativo e registram 429 próprios.
  - **Aviso:** `GET /api/v1/spotify/status` (via `StatusSpotifyDTO`) e o resumo do Dashboard devolvem `bloqueadoAte` e `motivoBloqueio`. O `PainelConexaoSpotify` mostra o aviso âmbar com o horário de Brasília e o limite das 50 músicas; o Dashboard mostra o Spotify como **Bloqueado** (âmbar), separado de **Atrasado**.
  - **Limpeza do teste do player:** removidos `PlayerSpotifyController`, `PlayerTesteSpotifyService`, a rota `/spotify/player-teste`, `PlayerTesteSpotify.tsx`, `usePlayerTesteSpotify.ts`, as funções de API, `tocarNoDispositivo` do cliente e da interface, as exceções do player e as permissões `streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state` e `user-modify-playback-state`. Resultado do teste condensado no `SPOTIFY.md`.
  - **Documentação:** `PROGRESSO_ROADMAP_9.md` deixou de mostrar 183, 184 e 185 como pendentes. `SPOTIFY.md` explica a contagem, o orçamento e o aviso.
  - Migration `Version20261111141619` gerada pelo diff contra o esquema da produção.
- **A confirmar com o Gabriel:** o valor de `LIMITE_CONSULTAS_ARTISTAS_POR_DIA` depois de ver a medição por origem no próximo bloqueio.
- **Arquivos**:
  - `src/Enum/OrigemConsultaSpotify.php`, `src/Entity/ConsultaSpotifyHora.php`, `src/Repository/ConsultaSpotifyHoraRepository.php`
  - `src/Entity/BloqueioSpotify.php`, `src/Service/Spotify/ControleLimiteSpotifyService.php`
  - `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `ObterTocandoAgoraSpotifyService.php`, `ResolverImagemSpotifyService.php`, `SincronizarArtistasFaixasSpotifyService.php`, `ObterTokenValidoSpotifyService.php`, `ConcluirAutorizacaoSpotifyService.php`, `ObterStatusSpotifyService.php`, `GerarUrlAutorizacaoSpotifyService.php`
  - `src/DataObject/Spotify/StatusSpotifyDTO.php`, `src/Serializer/ContaSpotifySerializer.php`, `src/Controller/Spotify/SpotifyController.php`, `src/Service/Dashboard/DashboardService.php`
  - `src/Infra/Spotify/SpotifyClient.php`, `src/Interface/SpotifyInterface.php`, `src/Exception/Spotify/SpotifyException.php`
  - `web/features/spotify/components/PainelConexaoSpotify.tsx`, `web/features/spotify/utils/formatadoresSpotify.ts`, `web/features/spotify/types.ts`, `web/features/spotify/api.ts`, `web/features/spotify/hooks/index.ts`, `web/App.tsx`
  - `web/features/dashboard/utils/metricasDashboard.ts`, `web/features/dashboard/types.ts`, `web/shared/utils/formatarData.ts`
  - `migrations/Version20261111141619.php`
  - `documentation/funcionalidades/SPOTIFY.md`, `documentation/progresso/PROGRESSO_ROADMAP_9.md`

### ✅ Tópico 188 — Infra — cliente do YouTube Music com ytmusicapi por processo
- **Status**: Concluído
- **O que foi feito**:
  - Script [`bin/ytmusic.py`](../../bin/ytmusic.py) com os subcomandos `validar`, `historico` e `buscar`. As credenciais (cabeçalhos do navegador) chegam como JSON pela entrada padrão e viram autenticação em memória com `setup_browser(filepath=None)`, sem arquivo, argumento ou variável de ambiente. A saída é JSON. Códigos de saída: 0 sucesso, 2 credenciais inválidas, 3 serviço indisponível ou limite, 4 formato inesperado.
  - Tratamento do `YTMusicServerError: None` visto no teste: o script faz uma busca sem login para decidir entre sessão expirada (2) e falha passageira (3). Testado com o cookie expirado do coletor de teste (saiu com código 2) e com uma busca real (`kavinsky nightcall`, código 0).
  - `ytmusicapi` fixada em **1.12.3** (`ARG YTMUSICAPI_VERSAO`) no `Dockerfile.prod` e no `Dockerfile` de desenvolvimento.
  - [`YoutubeMusicInterface`](../../src/Interface/YoutubeMusicInterface.php) (`validarCredenciais`, `listarHistorico`, `buscarMusica`) e [`YoutubeMusicClient`](../../src/Infra/YoutubeMusic/YoutubeMusicClient.php) com `Process`, tempo limite de 30 s, mapeamento dos códigos de saída para exceções e sem log da saída bruta. Registrado no `services.yaml` com `$projectDir`.
  - DTOs em `src/DataObject/YoutubeMusic/`: `CredenciaisYoutubeMusicDTO` (cabeçalhos com `#[SensitiveParameter]`), `ItemHistoricoYoutubeMusicDTO` (`videoId`, `titulo`, `textoArtistas`, `album`, `urlCapa`, `duracaoMs`, `secao`, `posicao`, `tipoVideo`), `ListaHistoricoYoutubeMusicDTO`, `ResultadoBuscaYoutubeMusicDTO` e `ContaValidadaYoutubeMusicDTO` (nome da conta e canal, para mostrar na conexão).
  - [`YoutubeMusicException`](../../src/Exception/YoutubeMusic/YoutubeMusicException.php) com `credenciaisInvalidas()`, `servicoIndisponivel()`, `respostaInesperada()` e o predicado `isCredenciaisInvalidas()`.
  - Seção "Cliente do YouTube Music" no `MUSICA.md`, com o formato mínimo de cabeçalhos aceito (`cookie` e `x-goog-authuser`).
- **Diferença do roadmap**: os testes de parsing com fixtures não foram criados, porque a regra do projeto (`PARA-IA.md`) proíbe criar testes. O parsing fica no script Python, que já entrega o JSON normalizado.
- **Arquivos**:
  - `bin/ytmusic.py`
  - `src/Interface/YoutubeMusicInterface.php`, `src/Infra/YoutubeMusic/YoutubeMusicClient.php`
  - `src/DataObject/YoutubeMusic/*.php`, `src/Exception/YoutubeMusic/YoutubeMusicException.php`
  - `config/services.yaml`, `devops/php/Dockerfile.prod`, `devops/php/Dockerfile`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 189 — Entidade ContaYoutubeMusic, enum de status, credenciais criptografadas e migration
- **Status**: Concluído
- **O que foi feito**:
  - Enum [`StatusContaYoutubeMusic`](../../src/Enum/StatusContaYoutubeMusic.php) (`conectada`, `reconectar`, `desconectada`) com `descricao()`, `isConectada()`, `isReconectar()` e `isDesconectada()`.
  - Entidade [`ContaYoutubeMusic`](../../src/Entity/ContaYoutubeMusic.php) (tabela `conta_youtube_music`): UUID v7, uma por `Usuario` (`UNIQ_CONTA_YOUTUBE_MUSIC_USUARIO`, exclusão em cascata), índice em `status` + `proximaConsultaEm`. Campos: `credenciaisCriptografadas` (texto, só cifrado), `nomeConta` (nome devolvido pela validação, para a tela), `status`, `conectadoEm`, `ultimaConsultaEm`, `ultimaNovidadeEm`, `proximaConsultaEm`, `errosSeguidos`, `erroMotivo`, `snapshotTopo` (JSON com os `videoId` do topo), `criadoEm` e `atualizadoEm` (atualizado no `PreUpdate`).
  - Métodos de intenção: `conectar`, `registrarConsulta` (grava o snapshot, zera erros e marca `ultimaNovidadeEm` quando houve música nova), `registrarErro`, `marcarComoReconectar`, `desconectar` (apaga credenciais e snapshot) e `definirProximaConsulta`. Predicados `isConectada()` (status + credencial presente), `isReconectar()`, `isDesconectada()` e `isPrimeiraConsulta()`.
  - [`ContaYoutubeMusicRepository`](../../src/Repository/ContaYoutubeMusicRepository.php) com `salvar`, `remover`, `flush`, `buscarDoUsuario` e `listarComConsultaVencida` (conectadas, com credencial e `proximaConsultaEm` nula ou no passado, mais antigas primeiro).
  - Migration `Version20261111143842` gerada pelo diff contra o esquema da produção e validada (`schema:validate` em sincronia).
- **Arquivos**:
  - `src/Enum/StatusContaYoutubeMusic.php`, `src/Entity/ContaYoutubeMusic.php`, `src/Repository/ContaYoutubeMusicRepository.php`
  - `migrations/Version20261111143842.php`

### ✅ Tópico 190 — Conexão do YouTube Music — serviços, endpoints e status no Dashboard
- **Status**: Concluído
- **O que foi feito**:
  - [`YoutubeMusicController`](../../src/Controller/YoutubeMusic/YoutubeMusicController.php) (JWT, `DefaultController`): `POST /api/v1/youtube-music/conectar`, `GET /api/v1/youtube-music/status` e `POST /api/v1/youtube-music/desconectar`.
  - `ConectarYoutubeMusicDTO` com `NotBlank` e tamanho máximo de 32.768 caracteres (`TAMANHO_MAXIMO_CABECALHOS`), parâmetro marcado como sensível.
  - [`InterpretadorCabecalhosNavegadorService`](../../src/Service/YoutubeMusic/InterpretadorCabecalhosNavegadorService.php): aceita "Nome: valor", o formato do Chrome em linhas separadas e "Copiar como cURL"; mantém só `cookie`, `x-goog-authuser` (padrão 0), `x-goog-visitor-id`, `user-agent` e `accept-language`; recusa sem `cookie` ou sem `__Secure-3PAPISID` com mensagens em português. Testado com os cabeçalhos do teste, com texto sem cookie, com cookie deslogado e com cURL.
  - [`ConectarYoutubeMusicService`](../../src/Service/YoutubeMusic/ConectarYoutubeMusicService.php): limite de 5 tentativas por minuto (`youtube_music_conexao`), interpreta, valida na biblioteca, criptografa, grava, guarda o retrato do topo (50 `videoId`, sem gerar reproduções) e agenda a primeira coleta para 1 minuto depois.
  - `ObterStatusYoutubeMusicService` e `DesconectarYoutubeMusicService` (apaga credencial e retrato, mantém as reproduções; 404 se não houver conta).
  - [`ContaYoutubeMusicSerializer`](../../src/Serializer/ContaYoutubeMusicSerializer.php): `conectada`, `status`, `statusDescricao`, `nomeConta`, `conectadoEm`, `ultimaConsultaEm`, `ultimaNovidadeEm`, `erroMotivo`. Nunca as credenciais.
  - Novas exceções em `YoutubeMusicException`: `cabecalhosSemCookie`, `cookieSemSessaoLogada`, `muitasTentativasDeConexao` (429) e `contaNaoConectada` (404).
  - **Dashboard:** o resumo das integrações de música saiu do `DashboardService` para [`ResumoIntegracoesMusicaService`](../../src/Service/Dashboard/ResumoIntegracoesMusicaService.php), que devolve `spotify` (igual a antes) e o novo `youtubeMusic` com `estado` (`nao_configurado`, `conectado`, `reconectar`), `nomeConta`, `ultimaConsultaEm`, `ultimaNovidadeEm`, `motivoErro` e `rota` `/musica`.
  - Passo a passo de copiar os cabeçalhos (janela anônima, DevTools, requisição `browse`, fechar sem sair) no `MUSICA.md`.
- **Pendente**: `totalReproducoesColetadas` entra no serializer quando as reproduções existirem (tópico 192). A duração do cookie da janela anônima ainda precisa ser medida.
- **Arquivos**:
  - `src/Controller/YoutubeMusic/YoutubeMusicController.php`
  - `src/DataObject/YoutubeMusic/ConectarYoutubeMusicDTO.php`
  - `src/Service/YoutubeMusic/InterpretadorCabecalhosNavegadorService.php`, `ConectarYoutubeMusicService.php`, `ObterStatusYoutubeMusicService.php`, `DesconectarYoutubeMusicService.php`
  - `src/Serializer/ContaYoutubeMusicSerializer.php`, `src/Exception/YoutubeMusic/YoutubeMusicException.php`
  - `src/Service/Dashboard/ResumoIntegracoesMusicaService.php`, `src/Service/Dashboard/DashboardService.php`, `src/Entity/ContaYoutubeMusic.php`
  - `config/packages/rate_limiter.yaml`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 191 — Entidades — vídeo, reprodução, catálogo canônico e regra de canal
- **Status**: Concluído
- **O que foi feito**:
  - Enums em `src/Enum/`: `FonteReproducaoYoutube` (`coletor`, `takeout`), `StatusClassificacaoVideo` (`pendente`, `musica`, `mashup`, `compilacao`, `nao_musica`, `revisar`, `indisponivel`, com `isContaComoMusica()` e `isFinal()`), `OrigemClassificacao` (`regra`, `regra_canal`, `ia`, `manual`), `TipoVersaoMusica` (14 tipos, de `original` a `outro`), `TipoMusicaCatalogo` (`original`, `mashup`) e `ClassificacaoCanal` (`musica`, `nao_musica`). Todos com `descricao()` e predicados `is*`.
  - `VideoYoutube` (`video_youtube`): único por usuário e `videoId`, índice `(usuario, status)`. Guarda título, canal, `canalId`, duração, capa, categoria do YouTube, descrição resumida (até 1.000 caracteres), disponibilidade, status, origem da classificação, confiança (0–100), resposta da IA (JSON), data da classificação, tipo de versão e vínculo opcional com `MusicaCatalogo` (`SET NULL`). Métodos `atualizarDadosColetados`, `registrarDetalhesYoutube`, `marcarIndisponivel` e `classificar`.
  - `ReproducaoYoutube` (`reproducao_youtube`): vídeo, `tocadaEm` em UTC, `msReproduzidos`, `tempoExato` sempre falso, fonte e `chaveDeduplicacao` (sha256 de `videoId` + horário UTC). Único por usuário e chave, índices `(usuario, tocadaEm)` e no vídeo. `ajustarMsReproduzidos` para o tempo estimado.
  - Catálogo por usuário: `MusicaCatalogo` (título, tipo, `chaveNormalizada` única por usuário, álbum, capa, `videoOficialId`, `confirmadaManualmente`, coleções ordenadas de artistas e componentes), `ArtistaCatalogo` (único por nome normalizado), `AliasArtistaCatalogo` (alias único por usuário), `MusicaArtistaCatalogo` (posição 0 = principal), `ComponenteMashup` (texto do componente e música opcional, `SET NULL`), `VinculoMusicaSpotify` (nome + artista principal normalizados do Spotify → música do catálogo, com marca de vínculo manual) e `RegraCanalYoutube` (canal normalizado → `musica`/`nao_musica`).
  - Repositórios com `salvar`, `remover`, `flush` e as buscas dos próximos tópicos: vídeo por `videoId`, vários `videoId` de uma vez, pendentes em lote e por canal; chaves de reprodução já existentes, última reprodução antes de um momento e total do usuário; música por chave; artista por nome normalizado; alias; vínculo do Spotify por identidade; regra por canal.
  - Migration `Version20261111145156` gerada pelo diff contra o esquema da produção e validada.
- **Diferença do roadmap**: uma migration em vez de duas. `video_youtube` depende de `musica_catalogo`, e o diff é gerado contra a produção, então separar exigiria editar a migration à mão, o que a regra do projeto proíbe. As tabelas do Spotify não mudaram.
- **Arquivos**:
  - `src/Enum/FonteReproducaoYoutube.php`, `StatusClassificacaoVideo.php`, `OrigemClassificacao.php`, `TipoVersaoMusica.php`, `TipoMusicaCatalogo.php`, `ClassificacaoCanal.php`
  - `src/Entity/VideoYoutube.php`, `ReproducaoYoutube.php`, `MusicaCatalogo.php`, `ArtistaCatalogo.php`, `AliasArtistaCatalogo.php`, `MusicaArtistaCatalogo.php`, `ComponenteMashup.php`, `VinculoMusicaSpotify.php`, `RegraCanalYoutube.php`
  - `src/Repository/` com um repositório para cada entidade acima
  - `migrations/Version20261111145156.php`

### ✅ Tópico 192 — Coleta do histórico do YouTube Music — novas reproduções, intervalo adaptativo e Scheduler
- **Status**: Concluído
- **O que foi feito**:
  - `DetectarNovasReproducoesYoutubeService`: compara a consulta com o `snapshotTopo` procurando o alinhamento numa janela de 15 itens, com reserva que conta até o primeiro item conhecido. Conferido nos cenários do roadmap (música nova, várias de uma vez, repetição não seguida, repetição seguida, lista vazia, snapshot vazio, mudança de rótulo das seções).
  - `EstimarTempoReproduzidoYoutubeService`: ajusta a reprodução anterior para `min(intervalo, duração)`.
  - `RegistrarReproducoesYoutubeService`: cria ou atualiza os `VideoYoutube`, cria as `ReproducaoYoutube` com `fonte = coletor`, retroage o horário quando várias chegam juntas, descarta duplicatas pela chave e encadeia o tempo estimado com a última reprodução anterior. Conferido no banco de produção dentro de uma transação desfeita no final.
  - `TratarErroColetaYoutubeMusicService`: espera de 1, 2, 5 e 15 minutos; sessão recusada ou três erros seguidos com validação recusada marcam `reconectar` e gravam o motivo; logs sem dados do usuário.
  - `ColetarHistoricoYoutubeMusicService`: descriptografa a sessão só na memória, reserva a próxima consulta antes de chamar o YouTube Music, intervalo de 30 s com novidade nos últimos 10 minutos e 120 s sem, mínimo de 15 s, primeira consulta só grava o snapshot, invalida o cache das análises quando há reprodução nova.
  - `ColetarHistoricoYoutubeMusicMessage` + handler, `RecurringMessage::every('30 seconds')` com `RedispatchMessage` para a fila `youtube_coleta` (sem novas tentativas automáticas), worker em `devops/supervisord.conf` e `devops/php/supervisord-prod.conf` com 128 MB.
  - `totalReproducoesColetadas` no status do YouTube Music e no resumo do dashboard.
  - `ConectarYoutubeMusicService` passou a usar `RateLimiterFactoryInterface` (o alias antigo está depreciado).
  - Seção "Coleta contínua do YouTube Music" e limites conhecidos em `MUSICA.md`.
- **Diferença do roadmap**: sem testes automatizados (regra do projeto); os cenários foram conferidos com scripts descartáveis. O bloqueio por conta é a reserva de `proximaConsultaEm` com um único worker, porque o projeto não tem o componente Lock. O disparo da identificação fica para o tópico 195, que cria o serviço.
- **Pendente**: conectar a conta com um cookie novo pela rota de conexão, confirmar a coleta em produção e então desligar o coletor de teste.
- **Arquivos**:
  - `src/Service/YoutubeMusic/DetectarNovasReproducoesYoutubeService.php`, `EstimarTempoReproduzidoYoutubeService.php`, `RegistrarReproducoesYoutubeService.php`, `TratarErroColetaYoutubeMusicService.php`, `ColetarHistoricoYoutubeMusicService.php`, `ObterStatusYoutubeMusicService.php`, `ConectarYoutubeMusicService.php`
  - `src/Message/ColetarHistoricoYoutubeMusicMessage.php`, `src/MessageHandler/ColetarHistoricoYoutubeMusicMessageHandler.php`
  - `src/Schedule.php`, `config/packages/messenger.yaml`
  - `devops/supervisord.conf`, `devops/php/supervisord-prod.conf`
  - `src/Serializer/ContaYoutubeMusicSerializer.php`, `src/Controller/YoutubeMusic/YoutubeMusicController.php`, `src/Service/Dashboard/ResumoIntegracoesMusicaService.php`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 193 — Infra — YouTube Data API em lote para categoria, duração e descrição
- **Status**: Concluído
- **O que foi feito**:
  - `YoutubeDataInterface` e `YoutubeDataClient` em `src/Infra/YoutubeData/`, com o Guzzle dedicado `guzzle.youtube_data` e a chave `YOUTUBE_API_KEY` injetada por parâmetro (vazia por padrão). `buscarVideos` usa `videos.list` (`snippet`, `contentDetails`) em lotes de 50 e devolve `ListaVideosYoutubeDataDTO` com `VideoYoutubeDataDTO` por `videoId`, os ids não encontrados e o número de chamadas. A chave vai no cabeçalho `X-goog-api-key`, fora da URL.
  - Conversão da duração ISO 8601 (`PT4M13S`, `PT1H2M3S`, `P1DT1S`, `P0D`) para ms, descrição cortada em 1.000 caracteres e escolha da maior capa.
  - `YoutubeDataException` com `cotaExcedida()`, `chaveInvalida()`, `respostaInesperada()` e `servicoIndisponivel()`, classificando os motivos do corpo do erro do Google.
  - Cota: entidade `CotaYoutubeDataDia` (`cota_youtube_data_dia`, soma atômica por dia) e `ControleCotaYoutubeDataService` com `ORCAMENTO_DIARIO_UNIDADES = 5000`, dia no fuso do Pacífico e pausa até o dia seguinte ao receber `quotaExceeded`.
  - `AtualizarDetalhesVideosYoutubeService` aplica os detalhes no `VideoYoutube` e marca os que não voltam como indisponíveis. `VideoYoutube` ganhou `detalhesAtualizadosEm` (com índice), e `marcarIndisponivel` só troca o status de vídeos ainda pendentes.
  - Política de dados lida (dados sem login: atualizar ou apagar em 30 dias). Reatualização periódica: `AtualizarDetalhesVideosYoutubeMessage` a cada hora, até 500 vídeos sem detalhes ou com mais de 30 dias.
  - Migration `Version20261111151907` gerada pelo diff e validada.
  - `YOUTUBE_API_KEY` nos modelos `.tooling/env/.env.example` e `.env.prod.example`; seção e pendência nova em `MUSICA.md`.
- **Diferença do roadmap**: sem testes automatizados (regra do projeto); a conversão de duração e o parsing foram conferidos com respostas simuladas do Guzzle (sucesso, lote de 60 ids em 2 chamadas, cota excedida, chave inválida, erro 500 e resposta sem `items`).
- **Pendente**: criar a chave `YOUTUBE_API_KEY` (Pendências do Gabriel em `MUSICA.md`); até lá a rotina horária registra só um aviso.
- **Arquivos**:
  - `src/Interface/YoutubeDataInterface.php`, `src/Infra/YoutubeData/YoutubeDataClient.php`
  - `src/DataObject/YoutubeData/VideoYoutubeDataDTO.php`, `ListaVideosYoutubeDataDTO.php`
  - `src/Exception/YoutubeData/YoutubeDataException.php`
  - `src/Entity/CotaYoutubeDataDia.php`, `src/Repository/CotaYoutubeDataDiaRepository.php`, `src/Entity/VideoYoutube.php`, `src/Repository/VideoYoutubeRepository.php`
  - `src/Service/YoutubeData/ControleCotaYoutubeDataService.php`, `AtualizarDetalhesVideosYoutubeService.php`, `AtualizarDetalhesVencidosYoutubeService.php`
  - `src/Message/AtualizarDetalhesVideosYoutubeMessage.php`, `src/MessageHandler/AtualizarDetalhesVideosYoutubeMessageHandler.php`, `src/Schedule.php`
  - `config/services.yaml`, `.tooling/env/.env.example`, `.tooling/env/.env.prod.example`
  - `migrations/Version20261111151907.php`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 194 — Infra — identificador de músicas por IA com resposta estruturada e registro de custo
- **Status**: Concluído
- **O que foi feito**:
  - `IdentificadorMusicaInterface` (`TAMANHO_LOTE_IDENTIFICACAO = 10`) e `OpenAiIdentificadorMusicaClient` com saída estruturada por esquema JSON estrito, tempo limite de 30 s, 2 tentativas com espera crescente e `Retry-After` no 429.
  - DTOs `EntradaIdentificacaoDTO` (descrição cortada em 500 caracteres), `ComponenteIdentificadoDTO`, `ResultadoIdentificacaoDTO` (validado com o Validator do Symfony) e `ResultadoLoteIdentificacaoDTO` (resultados por id, modelo e tokens). Enum `TipoIdentificacaoMusica`.
  - `IdentificacaoException` com `respostaInvalida()` (carrega modelo e tokens para o custo), `servicoIndisponivel()`, `chaveAusente()`, `limiteDeRequisicoes()` e `pedidoRecusado()`.
  - Instruções do modelo em `InstrucoesIdentificacaoMusica`.
  - Custo: entidade `ConsumoIa` (`consumo_ia`), enum `FinalidadeConsumoIa`, `ConsumoIaRepository` (soma por usuário e finalidade) e `RegistrarConsumoIaService` com preços por milhão de tokens vindos do `services.yaml` (`OPENAI_PRECO_ENTRADA_POR_MILHAO`, `OPENAI_PRECO_SAIDA_POR_MILHAO`). Migration `Version20261111164509` gerada pelo diff e validada.
  - Comparação de esforço com 14 títulos reais: `low` acertou todos e marcou "Renegade" como ambíguo; `none` custa metade mas inventou o artista com confiança 92; `minimal` é recusado pelo modelo. Escolha `low` (`OPENAI_ESFORCO_IDENTIFICACAO`), registrada em `MUSICA.md`.
  - Casos de erro conferidos com respostas simuladas: item faltando, confiança fora da faixa, tipo inválido, JSON quebrado, 429 repetido, 500 seguido de sucesso e 400.
- **Diferença do roadmap**: sem testes automatizados (regra do projeto). A comparação foi com 14 títulos, não 100, porque ainda não há histórico coletado nem Takeout; repetir com 100 no tópico 205. Não houve base comum extraída com o `OpenAiCorretorTextoClient` (os dois só compartilham a URL e a autenticação), e a correção de transcrição (M129) ainda não grava consumo, porque o cliente dela não devolve os tokens.
- **Arquivos**:
  - `src/Interface/IdentificadorMusicaInterface.php`, `src/Infra/OpenAi/OpenAiIdentificadorMusicaClient.php`, `src/Infra/OpenAi/InstrucoesIdentificacaoMusica.php`
  - `src/DataObject/IdentificacaoMusica/EntradaIdentificacaoDTO.php`, `ComponenteIdentificadoDTO.php`, `ResultadoIdentificacaoDTO.php`, `ResultadoLoteIdentificacaoDTO.php`
  - `src/Exception/IdentificacaoMusica/IdentificacaoException.php`
  - `src/Enum/TipoIdentificacaoMusica.php`, `src/Enum/FinalidadeConsumoIa.php`
  - `src/Entity/ConsumoIa.php`, `src/Repository/ConsumoIaRepository.php`, `src/Service/Ia/RegistrarConsumoIaService.php`
  - `config/services.yaml`, `.tooling/env/.env.example`, `.tooling/env/.env.prod.example`
  - `migrations/Version20261111164509.php`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 195 — Serviço de identificação — música, mashup, compilação, confirmação pela busca e revisão
- **Status**: Concluído
- **O que foi feito**:
  - `IdentificarVideosYoutubeService`: pula decisão manual, aplica a regra de canal, o atalho de faixa oficial ("- Topic" ou `MUSIC_VIDEO_TYPE_ATV`) sem IA, enriquece pela YouTube Data API quando falta duração ou categoria, chama a IA em lotes de 10 com pausa de 1 s, grava o custo e trata falhas (item malformado → `revisar`, item esquecido pela IA → continua pendente, falha da busca → continua pendente).
  - `AplicarIdentificacaoVideoYoutubeService` (`LIMITE_CONFIANCA_REVISAO = 70`, `LIMITE_COMPONENTES_MASHUP = 5`): não música, compilação, revisão, música confirmada, colaboração, mashup pela chave do conjunto de componentes e agrupamento de versões pela chave normalizada.
  - `ConfirmarMusicaYoutubeService`: busca no YouTube Music com a pontuação do `ResolverImagemSpotifyService` (limiar 70), com a duração pesando só na versão original.
  - Catálogo: `NormalizarTextoMusicaService` (normalização, chave de música, chave de mashup, separação de artistas), `ObterArtistaCatalogoService` (alias, nome ou criação) e `ObterMusicaCatalogoService` (música e mashup).
  - `VideoYoutube` ganhou `tipoVideo` (vem da coleta) e `isFaixaOficial()`; migration `Version20261111170331`.
  - `IdentificarPendentesYoutubeService`, `IdentificarVideosYoutubeMessage` agendada a cada minuto na fila `youtube_identificacao` (1 worker, 192 MB, nos dois supervisord) e comando `app:youtube:identificar --pendentes|--todos --usuario --limite`. `VideoYoutubeRepository` ganhou `listarPendentesDeTodos` e `listarParaReidentificar`.
  - O cliente da IA passou a devolver os resultados que vieram e os ids malformados, em vez de descartar o lote inteiro quando a IA esquece um item.
  - Teste real no banco de produção dentro de uma transação desfeita, com IA e busca de verdade, cobrindo os casos do roadmap; resultado em `MUSICA.md`.
- **Diferença do roadmap**: sem testes automatizados (regra do projeto); os casos reais foram conferidos com o script descartável descrito acima. O aviso para a projeção das reproduções entra no tópico 199, que cria a projeção. A coleta não dispara a identificação diretamente: a rodada de cada minuto já pega os vídeos novos.
- **Arquivos**:
  - `src/Service/IdentificacaoMusica/IdentificarVideosYoutubeService.php`, `AplicarIdentificacaoVideoYoutubeService.php`, `ConfirmarMusicaYoutubeService.php`, `IdentificarPendentesYoutubeService.php`
  - `src/Service/Musica/NormalizarTextoMusicaService.php`, `ObterArtistaCatalogoService.php`, `ObterMusicaCatalogoService.php`
  - `src/Message/IdentificarVideosYoutubeMessage.php`, `src/MessageHandler/IdentificarVideosYoutubeMessageHandler.php`, `src/Command/IdentificarVideosYoutubeCommand.php`
  - `src/Entity/VideoYoutube.php`, `src/Repository/VideoYoutubeRepository.php`, `src/Service/YoutubeMusic/RegistrarReproducoesYoutubeService.php`
  - `src/Infra/OpenAi/OpenAiIdentificadorMusicaClient.php`, `src/DataObject/IdentificacaoMusica/ResultadoLoteIdentificacaoDTO.php`
  - `src/Schedule.php`, `config/packages/messenger.yaml`, `devops/supervisord.conf`, `devops/php/supervisord-prod.conf`
  - `migrations/Version20261111170331.php`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 196 — Ligação entre Spotify e catálogo, e correções manuais — serviços e endpoints
- **Status**: Concluído
- **O que foi feito**:
  - `NormalizarTextoMusicaService` reforçado: forma de compatibilidade Unicode, acentos removidos por decomposição (o `iconv` do servidor transformava "Beyoncé" em "beyonc e"), letras espaçadas juntadas, `&` = `and`, hífen interno e remoção de rótulos de versão na chave do título.
  - `VincularFaixasSpotifyAoCatalogoService` (lotes de 200, idempotente) e comando `app:musica:vincular-spotify`; `VincularSpotifyAoCatalogoMessage` disparada pela coleta e pela importação do Spotify; `AtualizarArtistasMusicaSpotifyService` chamado pela busca de artistas (M133). `ObterMusicaCatalogoService` passou a preferir o título limpo e a seguir uniões.
  - União reversível: `MusicaCatalogo.unidaA` e `ArtistaCatalogo.unidoA`, com `musicaEfetiva()` e `artistaEfetivo()`; `definirArtistas`, `definirComponentes` e `MusicaArtistaCatalogo::reposicionar`; `VideoYoutube::voltarParaPendente`. Migration `Version20261111173332`.
  - Serviços de correção em `src/Service/Musica/Correcao/`: unir e desfazer união de músicas, separar vídeo, definir música do vídeo (inclui não música e manter compilação), definir componentes de mashup, definir artistas, unir artistas (com alias) e classificar canal.
  - `SugerirDuplicatasCatalogoService`, `ListarRevisaoMusicaService` (seis tipos de fila, paginada), `MusicaCatalogoSerializer` e `MusicaCorrecaoController` com as rotas do roadmap e mais `PUT /catalogo/{uuid}/artistas`.
  - Enums `TipoRevisaoMusica` e `AcaoRevisaoVideo`, `MusicaCatalogoException` e os DTOs de entrada em `src/DataObject/Musica/`.
  - Conferido no banco de produção dentro de transações desfeitas: vínculo de 400 músicas reais, sugestão e união de duplicata, união desfeita, 404 para música de outro usuário, redefinição de artistas, as seis filas de revisão, regra de canal, definição manual preservando a resposta da IA, separação de vídeo e união de artistas com alias.
- **Diferença do roadmap**: o normalizador manteve o nome `NormalizarTextoMusicaService`, criado no tópico 195. `ResolverCompilacaoService` virou as ações `nao_musica` e `manter_compilacao` de `DefinirMusicaDoVideoService`. A sugestão de duplicatas não usa duração (o catálogo não guarda) e ainda não tem como dispensar uma sugestão. Sem testes automatizados (regra do projeto).
- **Pendente**: rodar `app:musica:vincular-spotify` em produção depois do deploy final (cerca de 12 minutos para as 14 mil músicas).
- **Arquivos**:
  - `src/Service/Musica/NormalizarTextoMusicaService.php`, `ObterMusicaCatalogoService.php`, `ObterArtistaCatalogoService.php`, `VincularFaixasSpotifyAoCatalogoService.php`, `AtualizarArtistasMusicaSpotifyService.php`, `SugerirDuplicatasCatalogoService.php`, `ListarRevisaoMusicaService.php`
  - `src/Service/Musica/Correcao/` (8 serviços)
  - `src/Controller/Musica/MusicaCorrecaoController.php`, `src/Serializer/MusicaCatalogoSerializer.php`
  - `src/DataObject/Musica/`, `src/Enum/TipoRevisaoMusica.php`, `src/Enum/AcaoRevisaoVideo.php`, `src/Exception/Musica/MusicaCatalogoException.php`
  - `src/Message/VincularSpotifyAoCatalogoMessage.php`, `src/MessageHandler/VincularSpotifyAoCatalogoMessageHandler.php`, `src/Command/VincularSpotifyAoCatalogoCommand.php`
  - `src/Entity/MusicaCatalogo.php`, `ArtistaCatalogo.php`, `MusicaArtistaCatalogo.php`, `VideoYoutube.php`
  - `src/Repository/` (música, artista, vídeo, regra de canal, vínculo Spotify, reprodução Spotify, artistas das faixas)
  - `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php`, `DeduplicarEImportarHistoricoSpotifyService.php`, `SincronizarArtistasFaixasSpotifyService.php`
  - `migrations/Version20261111173332.php`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 197 — Importação do Takeout — leitura, filtros, fila e deduplicação com a coleta
- **Status**: Concluído
- **O que foi feito**:
  - Enum `StatusImportacaoYoutube` (seis estados) e entidade `ImportacaoYoutube` (arquivo, nome, tamanho, contadores de lidos, descartados, novos, ignorados, unificados e vídeos novos, motivo do erro e datas). Migration `Version20261111175012`.
  - `LeitorArquivoTakeoutYoutube` em `src/Infra/YoutubeMusic/` com interface: ZIP ou JSON, em streaming, acha o histórico de exibição pelo conteúdo (amostra de 50 objetos com `header`, `title`, `titleUrl`, `time` e endereço de vídeo), ignora buscas e o resto do ZIP, tira o prefixo do título, extrai o `videoId` de `v=` ou `youtu.be`, lê o canal e converte o horário para UTC. Anúncios, posts e entradas sem vídeo são descartados e contados.
  - O parser de JSON em streaming do Spotify virou `LeitorStreamObjetosJson` (`src/Infra/Json/`, com interface), usado pelos dois leitores.
  - `ImportarHistoricoTakeoutYoutubeService`: lotes de 500, vídeos novos pendentes e reservados (`VideoYoutube.aguardandoImportacao`), reprodução com `fonte = takeout`, chave exata para repetidas e unificação com a coleta dentro de `JANELA_TOLERANCIA_TAKEOUT_SEGUNDOS = 600` (horário do Takeout, fonte `takeout`, `ReproducaoYoutube::unificarComTakeout`).
  - Vídeos reservados ficam fora da identificação automática e da atualização de detalhes até o tópico 198; a coleta libera a reserva quando vê o mesmo vídeo.
  - `IniciarImportacaoYoutubeService` (ZIP ou JSON, 200 MB, uma por vez), `ProcessarImportacaoYoutubeService` (remove o arquivo no `finally`, reabre o EntityManager no erro), `ConsultarImportacaoYoutubeService`, `ArmazenamentoImportacaoYoutubeClient` em `var/tmp/youtube_importacoes`, `ImportacaoYoutubeException`.
  - Fila `youtube_importacao`, `ImportarHistoricoYoutubeMessage` e handler, worker nos dois supervisord.
  - `YoutubeImportacaoController`: `POST /api/v1/youtube-music/importacoes` (201) e `GET /api/v1/youtube-music/importacoes/{uuid}`.
  - Conferido com um Takeout sintético em português num MySQL temporário com o esquema de produção: anúncio e post descartados, busca rejeitada, vídeo apagado sem título, reprodução da coleta a 2 minutos unificada, a de 3 horas mantida, reimportação sem nada novo, arquivo removido e erro gravado para arquivo sem histórico. O leitor do Spotify continuou lendo depois da extração do parser.
- **Diferença do roadmap**: a importação termina em `concluida` neste tópico; os estados `aguardando_confirmacao` e `classificando` passam a ser usados no tópico 198. Foi criada a marca `aguardandoImportacao` no vídeo para a IA não rodar antes da prévia de custo. Sem testes automatizados (regra do projeto).
- **A confirmar**: o formato real do arquivo com uma amostra do Takeout do Gabriel e a janela de 600 s.
- **Arquivos**:
  - `src/Infra/YoutubeMusic/LeitorArquivoTakeoutYoutube.php`, `ArmazenamentoImportacaoYoutubeClient.php`, `src/Infra/Json/LeitorStreamObjetosJson.php`, `src/Infra/Spotify/LeitorArquivoHistoricoSpotify.php`
  - `src/Interface/LeitorArquivoTakeoutYoutubeInterface.php`, `LeitorStreamObjetosJsonInterface.php`, `ArmazenamentoImportacaoYoutubeInterface.php`
  - `src/Service/YoutubeMusic/Importacao/` (4 serviços)
  - `src/Entity/ImportacaoYoutube.php`, `VideoYoutube.php`, `ReproducaoYoutube.php`, `src/Enum/StatusImportacaoYoutube.php`
  - `src/Repository/ImportacaoYoutubeRepository.php`, `VideoYoutubeRepository.php`, `ReproducaoYoutubeRepository.php`
  - `src/DataObject/YoutubeMusic/ItemHistoricoTakeoutYoutubeDTO.php`, `ResultadoImportacaoTakeoutYoutubeDTO.php`, `UploadImportacaoYoutubeDTO.php`, `src/Exception/ImportacaoYoutube/ImportacaoYoutubeException.php`
  - `src/Message/ImportarHistoricoYoutubeMessage.php`, `src/MessageHandler/ImportarHistoricoYoutubeMessageHandler.php`
  - `src/Controller/YoutubeMusic/YoutubeImportacaoController.php`, `src/Serializer/ImportacaoYoutubeSerializer.php`
  - `config/packages/messenger.yaml`, `config/services.yaml`, `devops/supervisord.conf`, `devops/php/supervisord-prod.conf`
  - `migrations/Version20261111175012.php`
  - `documentation/funcionalidades/MUSICA.md`

### ✅ Tópico 198 — Importação do Takeout — enriquecimento, prévia de custo, classificação e tempo ouvido
- **Status**: Concluído
- **O que foi feito**:
  - Enums `EtapaImportacaoYoutube` e `ResultadoEtapaImportacaoYoutube`. `ImportacaoYoutube` ganhou etapa, período coberto, números do filtro e da prévia, tokens e custo estimados e reais, datas de classificação e confirmação, cursor do tempo ouvido e relatório. Migration `Version20261111180215`.
  - `ProcessarImportacaoYoutubeService` virou o orquestrador das etapas; o handler reenvia a mensagem na hora (`continuar`) ou com atraso de 1 hora (`aguardar`).
  - Etapas: `LerArquivoImportacaoYoutubeService`, `EnriquecerVideosImportacaoYoutubeService`, `FiltrarVideosImportacaoYoutubeService` (`CATEGORIAS_NAO_MUSICA_DIRETAS`, `DURACAO_MAXIMA_SEM_CATEGORIA_MUSICA_MS`, regra de canal), `CalcularPreviaImportacaoYoutubeService` (`LIMITE_CUSTO_AUTOMATICO_MICRODOLARES`), `ClassificarVideosImportacaoYoutubeService`, `CalcularTempoOuvidoImportacaoYoutubeService` e `GerarRelatorioImportacaoYoutubeService`.
  - `ConfirmarImportacaoYoutubeService` e `POST /api/v1/youtube-music/importacoes/{uuid}/confirmar`; `RetomarImportacaoYoutubeService` e comando `app:youtube:continuar-importacao {uuid}`.
  - Repositórios: vídeos reservados (sem detalhes, pendentes por cursor, contagem por status, faixas oficiais, liberação), reproduções no intervalo, primeira a partir de um momento e resumo por status e meses.
  - Serializer mostra leitura, prévia, classificação e relatório, com o período coberto em UTC.
  - Conferido num MySQL temporário com o esquema de produção e um identificador falso (sem gastar IA): faixa oficial virou música por regra, categoria 20 e vídeo de 30 minutos viraram não música sem IA, o edit da categoria 24 foi para a IA, o vídeo apagado ficou indisponível, o tempo ouvido saiu limitado pelo próximo vídeo e pela duração (inclusive cruzando o mês), o relatório bateu e nenhum vídeo reservado apareceu para o identificador automático. Com 2.100 vídeos a prévia deu US$ 2,08, parou em `aguardando_confirmacao`, não andou sem confirmação, seguiu para a classificação depois de confirmar e a segunda confirmação respondeu 409.
- **Diferença do roadmap**: a estimativa usa tokens fixos por vídeo (300 de entrada e 170 de saída), a ajustar com o Takeout real. O custo real soma o `consumo_ia` do usuário desde o início da classificação, então inclui a identificação da coleta que rodar no mesmo período. Sem testes automatizados (regra do projeto).
- **A confirmar**: categorias e regra dos 20 minutos com a distribuição real do arquivo; o limite de US$ 2.
- **Arquivos**:
  - `src/Service/YoutubeMusic/Importacao/` (etapas, orquestrador, confirmação, retomada, relatório)
  - `src/Enum/EtapaImportacaoYoutube.php`, `src/Enum/ResultadoEtapaImportacaoYoutube.php`
  - `src/Entity/ImportacaoYoutube.php`, `src/Repository/ImportacaoYoutubeRepository.php`, `VideoYoutubeRepository.php`, `ReproducaoYoutubeRepository.php`
  - `src/MessageHandler/ImportarHistoricoYoutubeMessageHandler.php`, `src/Command/ContinuarImportacaoYoutubeCommand.php`
  - `src/Controller/YoutubeMusic/YoutubeImportacaoController.php`, `src/Serializer/ImportacaoYoutubeSerializer.php`
  - `src/DataObject/YoutubeMusic/ResultadoImportacaoTakeoutYoutubeDTO.php`, `src/Exception/ImportacaoYoutube/ImportacaoYoutubeException.php`
  - `migrations/Version20261111180215.php`
  - `documentation/funcionalidades/MUSICA.md`

### ⏳ Tópico 199 — Leitura unificada — projeção das reproduções e paridade com os números do Spotify
- **Status**: Pendente

### ⏳ Tópico 200 — Endpoints unificados /api/v1/musica com filtro de fonte
- **Status**: Pendente
