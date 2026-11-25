# Funcionalidade: Inglês & Pronúncia

A página **Inglês & Pronúncia** (`/pronuncia`) traduz entre português e inglês e mostra como se fala o inglês, escrito do jeito que um brasileiro lê. Foi criada na melhoria M220.

```
eu não sei  →  I don't know  →  ai DÔUNT NÔU
```

Funciona com palavras, frases e textos de até 3.000 caracteres. O fluxo principal **não usa IA**: a tradução vem do DeepL e a pronúncia vem de um motor próprio em cima do dicionário CMU. A IA só entra quando o administrador pede uma sugestão de correção.

---

## 1. Como usar

- Escreva o texto e clique em **Traduzir** (ou `Ctrl+Enter`). A direção pode ser **Automático** (detecta o idioma), **PT → EN** ou **EN → PT**.
- O resultado mostra três blocos: **Português**, **Inglês** e **Como se fala**.
- **Clara** mostra cada palavra pronunciada por inteiro. **Fala natural** mostra como o nativo fala rápido: palavras curtas reduzidas (`to` → `tâ`) e emendadas (`get it out` → `GUÉ-ri-RÁUT`).
- **Ouvir** e **Devagar** leem o inglês com a voz do navegador; a palavra falada acende enquanto o áudio toca.
- **Palavra por palavra** mostra as sílabas com a tônica destacada, de onde veio a pronúncia (dicionário, derivada, corrigida ou aproximada) e dicas para brasileiros (TH, R americano, "i" curto, T que vira R etc.).
- **Histórico** guarda cada frase do usuário, com busca e favoritas. Clicar num item reabre o resultado sem gastar cota.
- **Reportar erro** manda a frase (ou uma palavra específica) para a fila de correções.

### Escrita da pronúncia

| Regra | Exemplo |
| :--- | :--- |
| Sílabas separadas por hífen | `UÓ-rer` |
| Sílaba tônica em MAIÚSCULAS | `BÉ-rer` |
| Palavras funcionais (to, the, a, of…) em minúsculas | `dâ`, `âv` |
| T/D entre vogais antes de sílaba fraca vira `r` | water → `UÓ-rer` |
| Números e símbolos por extenso | `$20` → `TUÉN-ti DÁ-lerz` |

### Aba Tocando agora (M221)

- Mostra a música que está tocando na conta do Spotify do usuário (conectada na página Música), com capa, tempo e a letra.
- A letra acompanha a música: a linha atual acende e fica no centro. Embaixo de cada linha vem a pronúncia (Clara ou Fala natural) e, se pedida, a tradução.
- Clicar numa linha abre **Ouvir linha**, **Devagar** e o palavra por palavra.
- **Letra fora do tempo?** adianta ou atrasa a letra de meio em meio segundo.
- Rolar a letra com o mouse ou o dedo pausa o acompanhamento por 5 segundos; o botão **Voltar para a linha atual** retoma.

---

## 2. Como funciona

### Tradução

- `DeepLClient` (`src/Infra/DeepL/`) chama a API do DeepL. Chave com final `:fx` usa o plano gratuito (`api-free.deepl.com`), com o limite de caracteres informado pela própria API (hoje 1.000.000). A cota aparece na aba **Dicionário**.
- Em **Automático**, o DeepL detecta o idioma. Se o texto já estava em inglês, uma segunda chamada traz o português.
- Cada texto vira uma `FrasePronuncia` única por hash (texto minúsculo, sem espaços extras). Frases repetidas, mesmo de outros usuários, não chamam o DeepL de novo.

### Pronúncia (motor próprio)

`PronunciarTextoFeature` resolve cada palavra por uma cascata de resolvedores (tag `app.resolvedor_pronuncia_palavra`), do mais confiável ao menos:

| Prioridade | Resolvedor | O que faz |
| :--- | :--- | :--- |
| 400 | Exceção | Pronúncia corrigida à mão ou aprovada da IA (`excecao_pronuncia`) |
| 350 | Homógrafo | Escolhe a variante pelo contexto (`read`, `live`, `lead`, `wind`, `tear`) |
| 300 | Dicionário | CMU Pronouncing Dictionary (135 mil palavras, fonemas ARPAbet) |
| 200 | Derivação | Sufixos, prefixos e palavras compostas a partir do dicionário |
| 100 | Letra-som | Regras de ortografia; marca a palavra como **aproximada** |

Depois, `ConversorFonemasPortugues` separa sílabas (maximal onset), acha a tônica e escreve em português. `MontadorSentencaPronunciada` aplica formas fracas e ligação entre palavras para a **fala natural**. `GeradorDicasPronuncia` cria as dicas.

A análise fica salva em JSON na frase com `versaoMotor`. Quando o motor muda de versão, a análise é refeita na próxima consulta.

### Letras de música

- `MusicaPronunciaController` (`/api/v1/pronuncia/musica`) devolve o que está tocando (reaproveita `ObterTocandoAgoraSpotifyService`, com o mesmo controle de limite e bloqueio do Spotify) e a letra da faixa.
- A letra vem do [LRCLIB](https://lrclib.net) (`LrclibClient`): primeiro `/api/get` com música, artista, álbum e duração; se não achar, `/api/search` com o título sem sufixos e duração parecida (até 4 s de diferença). Prefere letra sincronizada (LRC); senão usa a simples.
- `LeitorLetraMusica` lê o LRC (várias marcações por linha, metadados ignorados, pausas repetidas removidas, até 400 linhas).
- A letra fica salva por faixa do Spotify em `letra_musica_pronuncia`. Se não foi encontrada, é procurada de novo depois de 3 dias.
- A pronúncia não é salva: `GerarAnalisePronunciaService::executarLinhas` gera todas as linhas com uma consulta ao dicionário, então correções aprovadas valem na hora.
- A tradução (`TraduzirLetraMusicaService`) só roda quando o usuário pede: as linhas distintas vão em lote ao DeepL (`traduzirLote`, até 50 por chamada) e o resultado fica salvo.
- O navegador consulta o que está tocando no ritmo que o servidor devolve em `proximaConsultaMs`: **5 s**, ou **12 s** quando o "tocando agora" já fez 360 consultas na última hora (janela móvel por minuto, em cache, `ControleLimiteSpotifyService::consultasNaUltimaHora`). Parado: 20 s. Também consulta logo após o fim da faixa, ao voltar para a aba e pelo botão de atualizar no cartão da música. Nada com a aba em segundo plano; entre consultas o tempo é contado no navegador.
- `ObterTocandoAgoraSpotifyService` guarda o resultado por 4 s por usuário: `/musica` e esta aba abertas juntas dividem a mesma consulta (o progresso é adiantado pelo tempo em cache).
- Se o resultado tiver mais de 25% de palavras aproximadas, a tela avisa que a letra parece não estar em inglês.

### Correções

1. O usuário reporta o erro → `relato_erro_pronuncia` com status **pendente** e a frase vira **reportada**.
2. O administrador abre a aba **Correções** e pede **Sugerir com IA**. O pool de IA (`CompletarComPoolIaService`, finalidade `CorrecaoPronuncia`) devolve tradução corrigida, palavras com nova pronúncia e explicação. Status **sugerido**.
3. O administrador ajusta e **aprova**. Cada palavra vira exceção (vale para todas as frases), a tradução é trocada se informada, e as frases que contêm essas palavras são recalculadas. Status **aprovado**; a frase vira **corrigida**.
4. Ou **rejeita** o relato.

A aba **Dicionário** permite cadastrar, editar e apagar exceções, testar o motor sem traduzir e ver a cota do DeepL.

---

## 3. Banco de dados

| Tabela | Conteúdo |
| :--- | :--- |
| `palavra_dicionario_pronuncia` | Dicionário CMU importado (palavra, variante, fonemas) |
| `excecao_pronuncia` | Pronúncias corrigidas (manual ou IA) |
| `frase_pronuncia` | Frase traduzida, análise JSON, status e total de consultas (cache global) |
| `consulta_pronuncia` | Histórico por usuário, favorita e vezes consultada |
| `relato_erro_pronuncia` | Erros reportados, sugestão da IA e resolução |
| `letra_musica_pronuncia` | Letras por faixa do Spotify (linhas com tempo, situação e tradução) |

O dicionário fica em `config/pronuncia/cmudict.dict` e é carregado no banco com:

```bash
docker exec -u www-data cirqueirax_symfony_prod php bin/console app:pronuncia:importar-dicionario
```

O comando apaga e recarrega a tabela (cerca de 10 segundos).

---

## 4. API

Rotas em `/api/v1/pronuncia`, exigem a permissão `pronuncia`.

| Método | Rota | Uso |
| :--- | :--- | :--- |
| POST | `/traducoes` | Traduz e pronuncia (`texto`, `direcao`) |
| POST | `/previa` | Pronuncia texto em inglês sem traduzir nem salvar |
| GET | `/painel` | Números do dicionário e cota do DeepL |
| GET | `/historico` | Histórico (`busca`, `favoritas`, `limite`) |
| GET / DELETE | `/historico/{uuid}` | Abrir ou tirar do histórico |
| PUT | `/historico/{uuid}/favorita` | Favoritar |
| POST | `/historico/{uuid}/relatos` | Reportar erro |
| GET | `/relatos` | Fila de correções (admin; `todos`) |
| POST | `/relatos/{uuid}/sugestao` · `/aprovar` · `/rejeitar` | Ciclo de correção (admin) |
| GET / PUT | `/excecoes` | Listar ou salvar exceção (admin) |
| DELETE | `/excecoes/{uuid}` | Apagar exceção (admin) |
| GET | `/musica/tocando-agora` | Música tocando no Spotify (`conectado` + dados da faixa) |
| GET | `/musica/letra` | Letra com pronúncia (`codigoFaixa`, `titulo`, `artista`, `album`, `duracaoMs`) |
| POST | `/musica/letra/{uuid}/traducao` | Traduz a letra (uma vez) |

---

## 5. Configuração

| Variável | Uso |
| :--- | :--- |
| `DEEPL_API_KEY` | Chave da API do DeepL. Vazia = tradução indisponível (a prévia de pronúncia continua funcionando). |

---

## 6. Arquivos

| Caminho | Papel |
| :--- | :--- |
| `src/Controller/Pronuncia/` | Rotas do usuário e de correção |
| `src/Service/Pronuncia/` | Tradução, histórico, relatos, correção, exceções, importação |
| `src/Feature/Pronuncia/` | Motor de pronúncia e resolvedores |
| `src/Domain/Pronuncia/` | Tokenizador, números, sílabas, conversor, regras, derivação, dicas |
| `src/Infra/DeepL/`, `src/Infra/Pronuncia/` | Cliente DeepL e leitor do dicionário |
| `src/Infra/Lrclib/` | Cliente do LRCLIB (letras) |
| `src/Command/ImportarDicionarioPronunciaCommand.php` | Importação do dicionário |
| `web/features/pronuncia/` | Página, componentes, hooks (`useFalaIngles`, `useMusicaTocando`) e API |
