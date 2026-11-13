# Pool de IA

Rodízio de provedores de IA para pedidos de texto. O sistema tenta os provedores gratuitos em ordem de prioridade; quando um atinge o limite, recusa o acesso ou falha seguidas vezes, ele fica pausado e o pedido segue para o próximo. A OpenAI (paga) só entra com `IA_POOL_PERMITIR_PAGOS=1`.

Hoje é usado pela identificação de músicas do YouTube Music (importação do Takeout e identificação de pendentes), mas não depende dela: qualquer funcionalidade nova pode pedir uma resposta ao pool.

## Como usar em uma funcionalidade nova

```php
$resposta = $this->completarComPool->executar(new PedidoIaDTO(
    instrucoes: 'Você resume avaliações de livros...',
    conteudo: json_encode(['avaliacoes' => $avaliacoes]),
    esquemaResposta: new EsquemaRespostaIaDTO('resumo_avaliacoes', $esquemaJson),
));

$resposta->json;                // objeto já decodificado e com os campos obrigatórios do esquema
$resposta->provedor;            // ProvedorIa que respondeu
$this->registrarConsumo->executar($usuario, FinalidadeConsumoIa::..., $resposta);
```

- `CompletarComPoolIaService::executar()` devolve `RespostaIaDTO` ou lança `PoolIaException` quando nenhum provedor conseguiu. Quem chama decide o que fazer (a importação espera uma hora e tenta de novo).
- Com `esquemaResposta`, o pool só aceita a resposta se ela trouxer um objeto JSON com os campos `required` da raiz. Provedores que aceitam esquema estrito recebem `response_format: json_schema`; os outros recebem `json_object` e o esquema no fim das instruções. Resposta fora do formato conta como falha do provedor e o pedido vai para o próximo.
- Sem `esquemaResposta`, a resposta é o texto livre em `$resposta->texto`.
- Para gravar o gasto, crie um caso em `FinalidadeConsumoIa` e chame `RegistrarConsumoIaService` com a resposta. O consumo guarda provedor, modelo, tokens e custo (zero nos gratuitos).
- `EstimarCustoIaService::estimarMicrodolares()` dá o pior custo possível com os provedores liberados (zero quando só os gratuitos estão em uso).

## Peças

| Peça | Arquivo |
|---|---|
| Provedores (enum) | `src/Enum/ProvedorIa.php` |
| Contrato de um provedor | `src/Interface/ProvedorIaInterface.php` (tag `app.provedor_ia`) |
| Cliente compatível com a API de chat da OpenAI | `src/Infra/Ia/ProvedorIaCompativelOpenAiClient.php` (todos os provedores atuais usam esse formato) |
| Pedido e resposta | `src/DataObject/Ia/PedidoIaDTO.php`, `EsquemaRespostaIaDTO.php`, `RespostaIaDTO.php` |
| Rodízio | `src/Service/Ia/CompletarComPoolIaService.php` |
| Provedores liberados e ordem | `src/Service/Ia/ListarProvedoresIaService.php` |
| Pausas e totais | `src/Entity/EstadoProvedorIa.php` (tabela `estado_provedor_ia`) e `src/Service/Ia/AtualizarEstadoProvedorIaService.php` |
| Leitura do JSON da resposta | `src/Domain/Ia/LeitorJsonRespostaIa.php` (remove `<think>` e cercas de código) |
| Erros | `src/Exception/Ia/ProvedorIaException.php`, `PoolIaException.php` |

## Ordem e provedores

Definidos em `config/services.yaml` (serviços `app.provedor_ia.*`, a prioridade da tag define a ordem):

| Ordem | Provedor | Modelo padrão | Esquema estrito | Observação |
|---|---|---|---|---|
| 1 | Groq | `openai/gpt-oss-120b` | não | ~1.000 pedidos/dia, 8 mil tokens/min |
| 2 | Gemini | `gemini-2.5-flash` | sim | cota diária baixa |
| 3 | Mistral | `ministral-8b-latest` | sim | 2 pedidos/min |
| 4 | OpenRouter | `nvidia/nemotron-3-ultra-550b-a55b:free` | sim | 50 pedidos/dia sem créditos comprados |
| 5 | Cloudflare | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | sim | ~10 mil neurons/dia, lento |
| 6 | NVIDIA NIM | `z-ai/glm-5.3-flash` | não | ~2 min por pedido; chave de teste com validade |
| 7 | Z.AI | `glm-4.5-flash` | não | instável, reserva |
| 8 | OpenAI | `OPENAI_MODELO_TEXTO` | sim | paga, só com `IA_POOL_PERMITIR_PAGOS=1` |

Testes de 13/11/2026 com o mesmo lote de 10 vídeos da identificação: Groq gpt-oss-120b, OpenRouter Nemotron, Gemini e NVIDIA glm-5.3 acertaram 10/10; Groq qwen, Mistral e Cloudflare 9/10. Cerebras (conta passou a exigir pagamento) e SambaNova (chave inválida) ficaram de fora.

Para adicionar um provedor compatível: um caso em `ProvedorIa`, um serviço `app.provedor_ia.<nome>` em `services.yaml` com URL, chave, modelo, `$aceitaEsquemaEstrito`, timeout e prioridade, uma linha na migration de `estado_provedor_ia` (ou deixar o repositório criar na primeira vez) e as variáveis no `.env`. Provedor com API diferente: uma nova classe que implemente `ProvedorIaInterface` com a mesma tag.

## Pausas

| Situação | Pausa |
|---|---|
| Limite (HTTP 429) com `Retry-After` | o tempo pedido (máx. 6 h) |
| Limite sem `Retry-After` | 1 min, dobrando a cada limite seguido (máx. 6 h); zera no primeiro sucesso |
| Acesso negado (401, 402, 403, 404, 410) | 24 h |
| Fora do ar, resposta vazia ou fora do formato | 15 min depois de 3 falhas seguidas |

## Configuração

| Variável | Uso |
|---|---|
| `IA_POOL_PERMITIR_PAGOS` | `1` libera a OpenAI como último recurso (padrão `0`) |
| `GROQ_API_KEY`, `GEMINI_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `ZAI_API_KEY` | Chaves dos provedores (vazia = provedor desligado) |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Token e conta do Workers AI |
| `<PROVEDOR>_MODELO` (`GROQ_MODELO`, `GEMINI_MODELO`...) | Troca o modelo sem mexer no código |
| `OPENAI_MODELO_TEXTO`, `OPENAI_ESFORCO_RACIOCINIO`, `OPENAI_PRECO_ENTRADA_POR_MILHAO`, `OPENAI_PRECO_SAIDA_POR_MILHAO` | Configuração da OpenAI no pool |

## Comando

```bash
php bin/console app:ia:provedores                       # ordem, chave, pausas e totais de cada provedor
php bin/console app:ia:provedores --desbloquear=groq    # tira a pausa de um provedor
```
