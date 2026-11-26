# Limite de Consultas do Spotify

> Parte da página **Música** e da aba **Tocando agora** de [PRONUNCIA.md](PRONUNCIA.md). Funcionamento geral do Spotify em [SPOTIFY.md](SPOTIFY.md).

O app do Spotify está em **modo de desenvolvimento**. Nesse modo, o Spotify dá uma cota baixa e não divulga o número. A cota vale para o **app inteiro**: todas as contas conectadas e todas as partes do sistema dividem o mesmo limite. Quando ela estoura, o Spotify responde **429** com um `Retry-After`, e nenhuma chamada funciona até o horário de liberação.

Este documento junta, num lugar só, quem consulta o Spotify, em que ritmo, como o sistema conta e como ele se protege.

---

## 1. Quem consulta o Spotify

Cada chamada é contada com uma **origem** (`OrigemConsultaSpotify`).

| Origem | O que faz | Ritmo | Consumo típico em 24 h |
| :--- | :--- | :--- | :--- |
| `coleta_historico` | Lê as últimas 50 músicas tocadas de cada conta conectada (`SincronizarHistoricoSpotifyMessage`) | A cada **10 min** por conta (eram 5 até 26/11). Também 20 s depois de cada troca de música com a página aberta e no botão de atualizar | ~430 com 3 contas |
| `autorizacao` | Renova o token de acesso de cada conta | Quando o token vence (cerca de 1 h) | ~75 |
| `busca_artistas` | Busca os artistas de cada faixa (`SincronizarArtistasFaixasSpotifyMessage`) | A cada 1 min, até 9 faixas por rodada, 6 s entre chamadas | Até **300** (teto próprio) |
| `tocando_agora` | Música tocando agora, no painel de `/musica` e na aba de pronúncia | Painel: 10 s tocando, 30 s parado. Pronúncia: 5 s com folga, 15 s sem folga, 20 s parado | Depende do uso |
| `capas` | Capas que faltam (`BuscarImagemSpotifyMessage`) | Sob demanda, em fila | Varia (picos na importação) |

Nada consulta o Spotify com a aba do navegador em segundo plano.

---

## 2. Como o sistema conta

- **Por hora, no banco:** cada chamada soma 1 em `consulta_spotify_hora` (hora + origem). Sobrevive a deploy.
- **Por minuto, em cache:** `registrarConsulta` também soma num balde por minuto (`spotify_limite_minutos_{origem}`, válido por 2 h). É a janela móvel de 60 minutos usada pelo ritmo da aba de pronúncia (`consultasNaUltimaHora`).
- **Totais de 24 h:** `consultasTotaisUltimas24h()` soma todas as origens; `consultasArtistasUltimas24h()` só a busca de artistas.

---

## 3. Como o sistema se protege

| Proteção | Regra | Onde |
| :--- | :--- | :--- |
| Teto da busca de artistas | No máximo `LIMITE_CONSULTAS_ARTISTAS_EM_24H = 300` em 24 h (janela móvel) | `ControleLimiteSpotifyService::podeBuscarArtistas` |
| Artistas só depois da coleta | A busca de artistas não roda se a última coleta falhou ou ainda não houve coleta desde a liberação de um bloqueio | `isUltimaColetaBemSucedida` |
| Cache do "tocando agora" | 4 s por usuário: `/musica` e a aba de pronúncia abertas juntas dividem a mesma chamada (o progresso é adiantado pelo tempo em cache) | `ObterTocandoAgoraSpotifyService` |
| Freio da aba de pronúncia | Ritmo de 5 s só se o "tocando agora" fez menos de 360 chamadas na última hora **e** o app inteiro fez menos de 900 em 24 h; senão 15 s | `ObterTocandoAgoraPronunciaService` |
| YouTube Music primeiro | Com a extensão do YouTube Music mandando a música, a aba de pronúncia não consulta o Spotify | [LETRAS_MUSICA.md](LETRAS_MUSICA.md) |
| Capas sem cota | Enquanto houver bloqueio, as capas vêm de fontes públicas | [SPOTIFY.md](SPOTIFY.md) |
| Sem espera longa | O cliente só espera o `Retry-After` quando ele é de até 10 s; acima disso desiste na hora | `SpotifyClient` |

### Quando chega um 429

1. `registrarBloqueio` grava em `bloqueio_spotify`: o `Retry-After`, a origem, as consultas de artistas desde o bloqueio anterior, o ritmo usado e o total de cada origem nas últimas 24 h.
2. A espera gravada é `max(15 min, Retry-After + 60 s)`.
3. Até a liberação, nenhuma origem chama o Spotify (`estaBloqueado()`), inclusive depois de um deploy, porque o bloqueio fica no banco.
4. Na liberação, a coleta roda primeiro. A busca de artistas só volta depois de uma coleta bem-sucedida.
5. As telas mostram o aviso: `GET /api/v1/spotify/status` e o Dashboard devolvem `bloqueadoAte`; o painel do Spotify e a aba de pronúncia dizem até que horas (horário de Brasília).

---

## 4. Histórico de bloqueios

Horários de Brasília. "24 h antes" é o total gravado no momento do bloqueio.

| Data | Espera | Origem do 429 | 24 h antes | O que mudou depois |
| :--- | :--- | :--- | :--- | :--- |
| 10/11 13:33 | 6,7 h | busca de artistas | — | Primeiro registro de bloqueios |
| 10/11 21:25 | 22,9 h | busca de artistas | — | — |
| 12/11 00:18 | 20,1 h | busca de artistas | ~700 (artistas 569) | Teto de 300 artistas em 24 h móveis (antes 400 por dia de calendário) |
| 24/11 09:10 | 22,5 h | capas | ~1.700 (capas 530, coleta 692) | Capas sem gastar cota (fontes públicas primeiro) |
| 26/11 06:40 | 2 h | coleta | ~1.370 (coleta 838, artistas 306) | Coleta a cada 10 min; freio de 900 em 24 h na aba de pronúncia; YouTube Music sem cota |

**Leitura:** os bloqueios aparecem quando o app passa de mais ou menos **1.300 a 1.700 chamadas em 24 h**, ou com rajadas. Um dia normal, depois das mudanças de 26/11, fica em torno de 800.

---

## 5. Como investigar

Total por hora e origem nas últimas 24 h (como usuário do app, nunca root):

```sql
SELECT hora, origem, total
FROM consulta_spotify_hora
WHERE hora >= UTC_TIMESTAMP() - INTERVAL 24 HOUR
ORDER BY hora, origem;
```

Últimos bloqueios:

```sql
SELECT ocorrido_em, segundos_espera, origem, liberado_em, consultas_por_origem_ultimas24h
FROM bloqueio_spotify
ORDER BY id DESC
LIMIT 5;
```

No log, procure por `Spotify bloqueou as consultas do app (429).`.

---

## 6. Arquivos

| Caminho | Papel |
| :--- | :--- |
| `src/Service/Spotify/ControleLimiteSpotifyService.php` | Contagem, janelas, teto de artistas e registro de bloqueio |
| `src/Enum/OrigemConsultaSpotify.php` | Origens das chamadas |
| `src/Entity/ConsultaSpotifyHora.php`, `src/Entity/BloqueioSpotify.php` | Contagem por hora e bloqueios |
| `src/Service/Spotify/ColetarHistoricoRecenteSpotifyService.php` | Coleta das músicas recentes |
| `src/Service/Spotify/ObterTocandoAgoraSpotifyService.php` | "Tocando agora" com cache de 4 s |
| `src/Service/Pronuncia/ObterTocandoAgoraPronunciaService.php` | Ritmo da aba de pronúncia |
| `src/Schedule.php` | Frequência da coleta e da busca de artistas |
