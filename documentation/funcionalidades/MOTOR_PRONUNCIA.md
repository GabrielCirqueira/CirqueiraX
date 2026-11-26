# Motor de Pronúncia

> Parte da página **Inglês & Pronúncia** ([PRONUNCIA.md](PRONUNCIA.md)). Este documento explica como um texto em inglês vira a pronúncia escrita em português, nos três modos.

```
I don't know
  Simples       ai dounti nou
  Clara         ai DÔUNT NÔU
  Fala natural  ai DÔUNT NÔU
```

O motor é próprio e **não usa IA**. Ele parte do dicionário CMU (135 mil palavras com fonemas ARPAbet) e de regras escritas para quem fala português.

---

## 1. O caminho de uma frase

```
texto em inglês
  │  GerarAnalisePronunciaService
  ├─ TokenizadorTextoIngles ........ sentenças → palavras e pontuação
  │    └─ NumeroPorExtensoIngles .... "1990" → nineteen ninety, "$20" → twenty dollars
  ├─ uma consulta ao dicionário e outra às exceções, para todas as palavras de uma vez
  │
  ├─ para cada palavra: PronunciarTextoFeature
  │    ├─ cascata de resolvedores ... acha os fonemas (seção 2)
  │    ├─ SeparadorSilabasFonemas ... sílabas pelo ataque máximo
  │    ├─ ConversorFonemasPortugues . modo Clara (sílabas, tônica em MAIÚSCULAS)
  │    ├─ ConversorFonemasSimples ... modo Simples (seção 3)
  │    └─ GeradorDicasPronuncia ..... até 3 dicas para brasileiros
  │
  └─ MontadorSentencaPronunciada ... junta as palavras com a pontuação
       ├─ pronuncia (Clara)
       ├─ falaNatural ................ formas fracas + ligação T/D → r
       └─ simples
```

O resultado é um `AnalisePronunciaDTO`: as três frases prontas, a lista de palavras aproximadas e, para cada sentença, cada palavra com texto, sílabas, tônica, fonemas, origem, dicas e a forma simples.

Letras de música usam `executarLinhas`: cada linha é analisada separadamente, mas o dicionário é consultado uma vez só para a letra inteira.

---

## 2. Cascata de resolvedores

Cada palavra passa pelos resolvedores (tag `app.resolvedor_pronuncia_palavra`) do mais confiável ao menos confiável. O primeiro que responder vence.

| Prioridade | Resolvedor | Origem mostrada | O que faz |
| :--- | :--- | :--- | :--- |
| 400 | `ResolvedorExcecaoPronuncia` | Corrigida manualmente | Pronúncia corrigida à mão ou aprovada da IA (`excecao_pronuncia`). Não tem fonemas: usa a escrita revisada |
| 350 | `ResolvedorHomografoPronuncia` | Dicionário | Escolhe a variante pela palavra anterior (`read`, `live`, `lead`, `wind`, `tear`) |
| 300 | `ResolvedorDicionarioPronuncia` | Dicionário | CMU Pronouncing Dictionary |
| 200 | `ResolvedorDerivacaoPronuncia` | Montada a partir de outra palavra | Plural, passado, -ing, -ly, prefixos e palavras compostas a partir de uma palavra conhecida |
| 100 | `ResolvedorLetraSomPronuncia` | Pronúncia aproximada | Palpite pela escrita (`RegrasLetraSomIngles`). Sempre responde |

Palavras **aproximadas** aparecem com borda laranja e entram em `palavrasAproximadas`. Numa letra de música com mais de 25% de aproximadas, a tela avisa que ela parece não estar em inglês.

---

## 3. Os três modos

O usuário escolhe o modo nos botões **Simples · Clara · Fala natural**. A escolha fica salva no navegador (`pronuncia:modo-v2`) e vale para o tradutor, o histórico e as letras. O padrão é **Simples**.

### Simples (`ConversorFonemasSimples`)

Escrito para ser lido como português, sem maiúsculas nem hífen. Feito a partir dos exemplos que o usuário lê sem esforço ("uotis ior neimi", "rau mati iz dis").

| Regra | Exemplo |
| :--- | :--- |
| "i" de apoio no fim de palavra que termina em consoante (não em r, n, z, s, l) | good → gudi, help → relpi |
| "m" final ganha "i" só em sílaba tônica | name → neimi, welcome → uelcam |
| "s" final depois de consoante oclusiva ganha "i" antes | it's → itis, thanks → tenkis |
| "ch" vira "t" antes de "i" (lido "tchi") | much → mati |
| "h" vira "r" ("rr" entre vogais) | how → rau |
| "s" + consoante no começo ganha "i" | speak → ispiqui, stop → istópi |
| "l" no fim vira "u" | bill → biu, Brazil → braziu |
| T entre vogais (ou depois de R) antes de sílaba fraca vira "r" | water → uórer, later → leirer |
| K: "qu" antes de e/i ou no fim, "c" antes de a/o/u, l e r, "k" antes das outras consoantes | like → laiqui, club → clabi, cry → crai |
| G: "gu" antes de e/i ou no fim | get → gueti |
| TH surdo → "t", TH sonoro → "d" | thank → tenqui, this → dis |
| Só o "ó" aberto tônico tem acento | sorry → sóri |
| "ii" e "uu" seguidos viram uma letra só | — |
| Palavras curtas com forma pronta | the → de, a → a, to → tu, you → iu, your/you're → ior, and → end, of → ofi, are → ar, I → ai, I'm → aim, is → iz, can → quen |

Palavra corrigida pelo administrador usa a escrita da correção, sem hífen e em minúsculas (NÊIM → nêim).

### Clara (`ConversorFonemasPortugues`)

| Regra | Exemplo |
| :--- | :--- |
| Sílabas separadas por hífen | `UÓ-rer` |
| Sílaba tônica em MAIÚSCULAS | `BÉ-rer` |
| Palavras funcionais (to, the, a, of…) em minúsculas | `dâ`, `âv` |
| T/D entre vogais antes de sílaba fraca vira `r` | water → `UÓ-rer` |

### Fala natural (`MontadorSentencaPronunciada`)

Parte da Clara e imita a fala rápida:

- **Formas fracas** (`PalavrasFuncionaisIngles`): no meio da frase, `to` → `tâ`, `and` → `ân`. A última palavra da sentença fica na forma cheia.
- **Ligação:** palavra que termina em T ou D seguida de palavra que começa com vogal emenda com `r`: *get it out* → `GUÉ-ri-RÁUT`.

---

## 4. Versão do motor

A análise de cada frase traduzida fica salva em JSON em `frase_pronuncia.analise`, com `versaoMotor` (`AnalisePronunciaDTO::VERSAO_MOTOR`, hoje **2**; a 2 trouxe o campo `simples`).

Quando o motor muda de versão:

- a frase é refeita na próxima vez que alguém a traduz (`TraduzirTextoService`);
- e também ao abrir pelo histórico (`GerenciarHistoricoPronunciaService::obter` chama `RecalcularFrasesPronunciaService::atualizarSeDesatualizada`);
- até lá, a lista do histórico mostra a pronúncia Clara (`pronunciaSimples` cai para a Clara quando falta).

Letras de música não guardam a análise: ela é gerada a cada pedido, então já sai na versão atual.

Ao aprovar uma correção, `RecalcularFrasesPronunciaService::porPalavras` refaz até 1.000 frases que contêm as palavras corrigidas.

---

## 5. Como testar

- Pela tela: aba **Dicionário** → **Testar o motor** (`POST /api/v1/pronuncia/previa`), sem traduzir nem salvar.
- Os exemplos de referência do modo Simples (Good morning → gudi mórnin, How much is this? → rau mati iz dis?, Water, please → uórer, pliz) estão na melhoria M223.

---

## 6. Arquivos

| Caminho | Papel |
| :--- | :--- |
| `src/Service/Pronuncia/GerarAnalisePronunciaService.php` | Entrada do motor (`executar`, `executarLinhas`) |
| `src/Feature/Pronuncia/PronunciarTextoFeature.php` | Uma palavra: resolvedores, sílabas, conversores e dicas |
| `src/Feature/Pronuncia/Resolvedor/` | Cascata de resolvedores |
| `src/Domain/Pronuncia/` | Tokenizador, números, sílabas, conversores, formas fracas, derivação, letra-som, homógrafos, dicas |
| `src/DataObject/Pronuncia/AnalisePronunciaDTO.php` | Resultado e `VERSAO_MOTOR` |
| `config/pronuncia/cmudict.dict` | Dicionário CMU (carregado com `app:pronuncia:importar-dicionario`) |
