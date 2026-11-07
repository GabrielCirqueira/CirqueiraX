# Spotify & Cápsula Sonora

Este documento descreve a funcionalidade do Spotify no CirqueiraX, incluindo a sincronização com a Spotify Web API, a importação retroativa do histórico completo de reproduções, as regras de agregação da Cápsula Sonora e os procedimentos de uso e calibração.

---

## 1. Visão Geral

A funcionalidade do Spotify traz de volta para o usuário a experiência autêntica da antiga **Cápsula Sonora** do aplicativo móvel do Spotify (descontinuada na versão oficial), permitindo reviver mensalmente:
1. **Tempo Total Ouvido** em minutos e reproduções.
2. **Top Artistas** com contagem de reproduções, tempo, foto circular e movimento em relação ao mês anterior (subida, descida, permanência ou estreia).
3. **Top Músicas** com contagem de streams, tempo, capa oficial, álbum e movimento de ranking.
4. **Variedade Musical**: número de músicas distintas ouvidas e comparação percentual com o mês anterior.
5. **Histórico Diário**: gráfico de distribuição de minutos ouvidos por cada dia do mês.
6. **Métricas de Hoje e Últimos 7 Dias** com alternância de períodos e abas de faixas/artistas.
7. **Curiosidades**: horário de pico, dia mais frequente, dia mais longo, faixa mais repetida em um único dia e novos artistas descobertos.
8. **Tocando agora**: cartão ao vivo com capa, progresso e quantas vezes a música já foi ouvida.
9. **Recordes e sequências**, **evolução por mês**, **hábitos** (mapa dia × hora e concentração do gosto), **descobertas** e **resumo do ano** (detalhes na seção 7).
10. **Detalhe de artista e de música** e **imagem da Cápsula** para compartilhar.

---

## 2. Fontes de Dados e Sincronização

O sistema opera com duas origens de dados que se complementam e se deduplicam automaticamente:

| Origem | Mecanismo | Frequência / Prazo | Granularidade |
| :--- | :--- | :--- | :--- |
| **Coleta Periódica (API)** | OAuth 2.0 PKCE (`user-read-recently-played`) | A cada 30 minutos via Symfony Scheduler | Últimas 50 faixas tocadas (minutos estimados pelo intervalo entre reproduções, ver abaixo) |
| **Importação de Arquivo** | Upload de `.json` ou `.zip` (`StreamingHistory*.json` / `Audio_*.json`) | Manual / sob demanda | Histórico exato em milissegundos (`msPlayed`) de até toda a conta |

### Sincronizar agora
- Com a conta conectada, o painel tem um botão discreto (ícone de atualizar) que roda na hora a mesma coleta da rotina de 30 minutos, só para a conta do usuário.
- `POST /api/v1/spotify/sincronizar` (`SincronizarAgoraSpotifyService` → `ColetarHistoricoRecenteSpotifyService::executarParaConta`) devolve `totalColetadas`, `totalNovas` e `totalDuplicadas`, mostrados num aviso.
- Se a API do Spotify falhar, a coleta devolve zero, igual à rotina agendada. O motivo fica só no log.

### Tempo ouvido nas reproduções da API
- A API de "tocadas recentemente" não informa quanto da música foi ouvido, só o momento em que ela terminou (`played_at`).
- O tempo ouvido é o intervalo entre o fim da reprodução anterior e o fim desta, limitado à duração da faixa (`EstimarTempoReproduzidoSpotifyService`). A reprodução anterior pode vir de qualquer fonte e é buscada no banco quando está fora do lote.
- Exemplo: música de 4 min, a anterior terminou 2 min antes, entram 2 min. Se o intervalo ficar abaixo de 30 s, ela não conta como stream.
- A primeira música de uma sessão (sem reprodução anterior próxima) e intervalos com pausa ficam limitados à duração da faixa, então podem contar a música inteira.
- Quando o arquivo de histórico é importado, o `ms_played` real substitui a estimativa.
- A migration `Version20261106120000` recalculou com a mesma regra as reproduções da API gravadas antes da mudança.

### Conexão da conta (OAuth)
- `GET /api/v1/spotify/oauth/url` gera a URL de login do Spotify. `POST /api/v1/spotify/oauth/concluir` recebe `code` e `state` na volta (`/spotify/callback`).
- O `state` é assinado com HMAC-SHA256 usando o `APP_SECRET` (`EstadoAutorizacaoSpotifyService`). Ele leva o id do usuário e a validade de 15 minutos, então não depende de cache no servidor.
- A tela de retorno envia cada `code` uma vez só e mostra a mensagem de erro que veio da API.
- Variáveis no `.env`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` e `SPOTIFY_REDIRECT_URI` (em produção, `https://x.cirqueira.com/spotify/callback`). Com o app em modo de desenvolvimento, só as contas em "User Management" no painel do Spotify podem autorizar.

### Regra de Deduplicação e Refinamento
- Quando um registro importado de arquivo bate no mesmo minuto de uma reprodução coletada via API, o sistema **substitui** a estimativa da API pelo tempo exato registrado pelo arquivo do Spotify (`msPlayed`), marcando a fonte como `arquivo_estendido` ou `arquivo_basico`.
- Reimportar o mesmo arquivo ou arquivos de períodos sobrepostos é totalmente seguro: registros repetidos são identificados e ignorados sem duplicação.

---

## 3. Regras de Negócio da Cápsula Sonora

1. **Corte Mínimo de Stream**: reproduções com duração inferior a 30 segundos (`30.000 ms`) são descartadas e não contam como stream nem pontuam nos rankings, respeitando o padrão oficial da indústria fonográfica e do Spotify.
2. **Fuso Horário Oficial**: todas as agregações de início e fim de mês e dias são truncadas e calculadas no fuso horário de Brasília (`America/Sao_Paulo`).
3. **Mês em Andamento**: o mês corrente é exibido como "em andamento" na interface, recalculando suas métricas a cada nova coleta ou importação.
4. **Comparação com o Mês Anterior**:
   - Variação percentual de músicas distintas: `((músicas_mês_atual - músicas_mês_anterior) / músicas_mês_anterior) * 100`.
   - Variação de ranking (`movimento`): diferença de posições no top 5 em relação ao mês imediatamente anterior.
   - Flag de estreia (`isEstreia`): sinaliza se o artista ou música entrou no top 5 pela primeira vez no histórico recente.
5. **Exportação CSV**: o frontend permite baixar uma planilha estruturada com BOM UTF-8 com os totais, rankings e histórico diário do mês selecionado.

---

## 4. Como Solicitar os Arquivos no Spotify

Caso deseje carregar seus meses passados para a Cápsula:
1. Acesse sua conta em [spotify.com/account/privacy](https://www.spotify.com/account/privacy).
2. Na seção **Baixar seus dados**:
   - **Dados da conta**: inclui o histórico do último ano (cerca de 5 dias úteis para entrega por e-mail).
   - **Histórico ampliado de streams**: histórico completo desde a criação da conta (até 30 dias para preparação).
3. Baixe o arquivo ZIP recebido por e-mail e envie diretamente na página `/spotify` pelo botão **Importar histórico**.

---

## 5. Resolução Automática de Capas e Fotos

- O sistema cataloga e armazena em cache as capas e fotos de perfil de artistas na entidade `ImagemSpotify`.
- Quando um registro do histórico antigo traz apenas os nomes de texto (sem código Spotify), um processo em segundo plano via Symfony Messenger (`BuscarImagemSpotifyMessage`) busca a capa na API com conferência de similaridade de strings (threshold 70) e tolerância de duração, evitando capas incorretas.
- A interface exibe placeholders neutros e atualiza dinamicamente as capas via polling reativo sem necessidade de recarregar a tela.

---

## 6. Diretrizes de Marca, Identidade Visual e Conformidade

### 6.1 Identidade Visual Autêntica e Paleta Oficial (Exceção de Design)

A página do Spotify (`/spotify` e suas telas de detalhe) é uma **exceção intencional de design** em todo o ecossistema CirqueiraX. Ela foi concebida para recriar com máxima fidelidade a experiência do aplicativo oficial do Spotify e da clássica Cápsula Sonora.

> **Regra Mandatória de Isolamento:** A feature do Spotify possui sua própria identidade visual e **nunca** deve ser mesclada ou sobrescrita pela paleta neutra/cinza/ardósia global da aplicação. Quaisquer scripts de geração de tema (`gerar-paleta-brand.sh`/`mjs`) ou refatorações visuais devem obrigatoriamente manter preservada a paleta oficial do Spotify.

| Token Semântico | Token de Cor | Hex Oficial | Uso na Interface |
| :--- | :--- | :--- | :--- |
| `spotify.fundo` | `cirqueira.spotify.fundo` | `#121212` | Superfície base da tela (preto fosco oficial Spotify) |
| `spotify.cartao` | `cirqueira.spotify.cartao` | `#1F1F1F` | Superfície base de cartões, listas e painéis de dados |
| `spotify.cartaoElevado` | `cirqueira.spotify.cartaoElevado` | `#252525` | Superfícies elevadas, hover de cartões, badges e bordas de separação |
| `spotify.textoPrincipal` | `cirqueira.spotify.textoPrincipal` | `#FFFFFF` | Títulos, métricas em destaque, valores e texto de alto contraste |
| `spotify.textoSecundario` | `cirqueira.spotify.textoSecundario` | `#B3B3B3` | Legendas, subtítulos, durações e metadados (contraste > 5:1) |
| `spotify.textoDesabilitado` | `cirqueira.spotify.textoDesabilitado` | `#6A6A6A` | Rótulos inativos ou controles desabilitados |
| `spotify.verde` | `cirqueira.spotify.verde` | `#1ED760` | Verde oficial Spotify: botões de ação principal, minutos e status |
| `spotify.verdeHover` | `cirqueira.spotify.verdeHover` | `#22E368` | Estado hover interativo dos botões em pílula |
| `spotify.azul` | `cirqueira.spotify.azul` | `#539DF5` | Destaque oficial para "Top Artista" e badges de artistas |
| `spotify.amarelo` | `cirqueira.spotify.amarelo` | `#FEE44F` | Destaque oficial para "Top Música" e posições do ranking |

### 6.2 Regras Estruturais de Design

- **Dark Mode Sempre Ativo**: A página é renderizada sob o wrapper `<TemaSpotify>`, que força modo escuro independente do tema claro ou escuro configurado no restante do sistema. Header e Sidebar continuam respeitando o tema global.
- **Tipografia Inter**: Carregada pontualmente para esta feature (`fontFamily="inter"`), respeitando a tipografia moderna do player.
- **Geometria dos Componentes**:
  - Botões de ação em pílula (`borderRadius="full"`).
  - Cartões com raio suave de 8px (`borderRadius="8px"`).
  - Capas de álbuns quadradas com 4px (`borderRadius="4px"`) e 8px no desktop.
  - Fotos de artista estritamente circulares (`borderRadius="full"`).

### 6.3 Conformidade com Diretrizes da Marca Spotify

- O logotipo do Spotify é exibido no rodapé e no painel de conexão em estrita conformidade com as diretrizes de marca (área de respiro, cores oficiais e links diretos para abertura no aplicativo com `Abrir no Spotify`).
- Nenhuma alteração, recorte ou sobreposição de texto é aplicada às capas de álbuns originais.


---

## 7. Análises

Todas usam o fuso `America/Sao_Paulo` e o corte de 30 s para stream. Uma música é identificada pelo nome e pelo artista principal, sem diferenciar maiúsculas.

| Seção | O que mostra | Regra |
| :--- | :--- | :--- |
| Tocando agora | Faixa atual, capa, progresso, vezes ouvida e primeira vez | `GET /me/player/currently-playing`. Consulta de novo perto do fim da faixa; sem conta conectada não aparece |
| Recordes e sequências | Sequência atual e maior sequência, dia e mês recorde, música mais ouvida, artista com mais horas, maior repetição num dia | Sequência atual conta até ontem quando ainda não houve música hoje |
| Evolução por mês | Barras de 12, 24 ou 60 meses e comparação do mês atual | Compara até o mesmo dia do mês passado e do mesmo mês no ano anterior |
| Hábitos | Mapa dia × hora, % do tempo nos 5 artistas do topo, músicas ouvidas uma vez, streams por música, pulos e aleatório | Pulos e aleatório só contam reproduções vindas do histórico estendido |
| Descobertas | Artistas novos, músicas novas, redescobertas e obsessões | Novo = primeira reprodução dentro do período. Redescoberta = volta após 90 dias sem ouvir. Obsessão = 8 ou mais streams em 7 dias |
| Resumo do ano | Totais, top 5 de artistas, músicas e álbuns, mês mais intenso, momento favorito, maior sequência, descobertas e gráfico do ano | Ano em andamento aparece marcado |
| Detalhe | Totais, primeira e última vez, evolução mensal, meses no top 5, músicas e álbuns | `/spotify/artista?nome=` e `/spotify/musica?nome=&artista=` |
| Rankings | Hoje até 90 dias, mês, ano, sempre e personalizado; abas de músicas, artistas e álbuns | Álbum agrupado por nome e artista |

### Pulos e aleatório
- Vêm dos campos `skipped` e `shuffle` do histórico estendido (`Streaming_History_Audio_*.json`) e ficam em `reproducao_spotify.pulada` e `reproducao_spotify.aleatorio`. IP, país e plataforma não são guardados.
- A API e o arquivo básico não trazem esses campos. Reimportar o histórico estendido preenche as reproduções já gravadas.

### Gêneros
- Não há análise por gênero: desde as mudanças de fevereiro, a API devolve a lista de gêneros dos artistas vazia.

### Cache
- As análises ficam em cache por usuário por até 6 h (a chave muda a cada dia) e são invalidadas quando chegam reproduções novas (coleta ou importação) ou quando a conta é desconectada.

### Imagem da Cápsula
- O botão **Gerar imagem** monta no navegador um PNG 1080×1920 com o mês, os números, as 5 músicas e o artista do topo. As capas aparecem inteiras, sem corte, e a imagem leva o ícone do Spotify com "Dados do Spotify".
