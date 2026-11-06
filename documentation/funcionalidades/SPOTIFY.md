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

## 6. Diretrizes de Marca e Conformidade

- O logotipo do Spotify é exibido no rodapé e no painel de conexão em estrita conformidade com as diretrizes de marca (área de respiro, cores oficiais e links diretos para abertura no aplicativo com `Abrir no Spotify`).
- Nenhuma alteração, recorte ou sobreposição de texto é aplicada às capas de álbuns originais.

