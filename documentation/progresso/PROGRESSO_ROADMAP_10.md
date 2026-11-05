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
