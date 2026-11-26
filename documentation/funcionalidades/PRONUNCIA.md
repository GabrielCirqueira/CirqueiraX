# Funcionalidade: Inglês & Pronúncia

A página **Inglês & Pronúncia** (`/pronuncia`) traduz entre português e inglês e mostra como se fala o inglês, escrito do jeito que um brasileiro lê. Foi criada na melhoria M220; modo Simples em M223; letras de música em M221/M225.

```
eu não sei  →  I don't know  →  ai dounti nou      (Simples, padrão)
                              ai DÔUNT NÔU       (Clara)
```

| Documento | Assunto |
| :--- | :--- |
| Este | Uso, tradução, histórico, correções, banco, API |
| [MOTOR_PRONUNCIA.md](MOTOR_PRONUNCIA.md) | Como o texto vira pronúncia: resolvedores, os três modos e a versão do motor |
| [LETRAS_MUSICA.md](LETRAS_MUSICA.md) | Aba **Tocando agora**: Spotify e YouTube Music, letra, sincronia e tradução |
| [LIMITE_SPOTIFY.md](LIMITE_SPOTIFY.md) | Cota do Spotify e ritmo das consultas |

Funciona com palavras, frases e textos de até 3.000 caracteres. O fluxo principal **não usa IA**: a tradução vem do DeepL e a pronúncia vem de um motor próprio em cima do dicionário CMU. A IA só entra quando o administrador pede uma sugestão de correção.

---

## 1. Como usar

- Escreva o texto e clique em **Traduzir** (ou `Ctrl+Enter`). A direção pode ser **Automático** (detecta o idioma), **PT → EN** ou **EN → PT**.
- O resultado mostra três blocos: **Português**, **Inglês** e **Como se fala**.
- **Como se fala** tem três modos (tabela abaixo); a escolha vale para a página toda e fica salva no navegador.
- **Ouvir** e **Devagar** leem o inglês com a voz do navegador; a palavra falada acende enquanto o áudio toca.
- **Palavra por palavra** mostra as sílabas com a tônica destacada, de onde veio a pronúncia (dicionário, derivada, corrigida ou aproximada) e dicas para brasileiros (TH, R americano, "i" curto, T que vira R etc.).
- **Histórico** guarda cada frase do usuário, com busca e favoritas. Clicar num item reabre o resultado sem gastar cota.
- **Reportar erro** manda a frase (ou uma palavra específica) para a fila de correções.
- A página tem as abas **Tradutor**, **Tocando agora** e, para o administrador, **Correções** e **Dicionário**. A aba aberta fica salva no navegador (`pronuncia:aba`).

### Modos de pronúncia

| Modo | Exemplo (*What's your name?*) | Para quê |
| :--- | :--- | :--- |
| **Simples** (padrão) | uatis ior neimi? | Ler como se fosse português |
| **Clara** | UÂTS iór NÊIM? | Ver sílabas e a tônica |
| **Fala natural** | `to` → `tâ`, *get it out* → `GUÉ-ri-RÁUT` | Ver como o nativo fala rápido |

Regras de cada modo em [MOTOR_PRONUNCIA.md](MOTOR_PRONUNCIA.md#3-os-três-modos).

### Aba Tocando agora

Letra da música que está tocando no Spotify ou no YouTube Music (com a extensão, no computador), acompanhando o tempo, com a pronúncia embaixo de cada linha e tradução opcional. Fluxo completo em [LETRAS_MUSICA.md](LETRAS_MUSICA.md).

---

## 2. Como funciona

### Tradução

- `DeepLClient` (`src/Infra/DeepL/`) chama a API do DeepL. Chave com final `:fx` usa o plano gratuito (`api-free.deepl.com`), com o limite de caracteres informado pela própria API (hoje 1.000.000). A cota aparece na aba **Dicionário**.
- Em **Automático**, o DeepL detecta o idioma. Se o texto já estava em inglês, uma segunda chamada traz o português.
- Cada texto vira uma `FrasePronuncia` única por hash (texto minúsculo, sem espaços extras). Frases repetidas, mesmo de outros usuários, não chamam o DeepL de novo.

### Pronúncia

Motor próprio sobre o dicionário CMU, com cascata de resolvedores (exceção, homógrafo, dicionário, derivação, letra-som) e três escritas (Simples, Clara, Fala natural). A análise fica salva na frase com `versaoMotor` e é refeita quando o motor muda. Detalhes em [MOTOR_PRONUNCIA.md](MOTOR_PRONUNCIA.md).

### Letras de música

LRCLIB para a letra, pronúncia gerada a cada pedido, tradução em lote pelo DeepL só quando pedida, e o ritmo de consulta ao Spotify controlado pelo servidor. Detalhes em [LETRAS_MUSICA.md](LETRAS_MUSICA.md).

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
| `letra_musica_pronuncia` | Letras por faixa do Spotify ou vídeo do YouTube (`yt:{videoId}`), com linhas, situação e tradução |

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
| GET | `/historico` | Histórico (`busca`, `favoritas`, `limite`); cada item traz `pronuncia` e `pronunciaSimples` |
| GET / DELETE | `/historico/{uuid}` | Abrir (refaz a análise se for de versão antiga do motor) ou tirar do histórico |
| PUT | `/historico/{uuid}/favorita` | Favoritar |
| POST | `/historico/{uuid}/relatos` | Reportar erro |
| GET | `/relatos` | Fila de correções (admin; `todos`) |
| POST | `/relatos/{uuid}/sugestao` · `/aprovar` · `/rejeitar` | Ciclo de correção (admin) |
| GET / PUT | `/excecoes` | Listar ou salvar exceção (admin) |
| DELETE | `/excecoes/{uuid}` | Apagar exceção (admin) |
| GET | `/musica/tocando-agora` | Música tocando no Spotify (`conectado`, dados da faixa, `proximaConsultaMs`, `bloqueadoAte`) |
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
| `web/features/pronuncia/` | Página, componentes, hooks (`useFalaIngles`, `useMusicaTocando`), utils (`pronuncia.ts`, `musicaYoutube.ts`) e API |
