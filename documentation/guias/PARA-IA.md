# Como escrever código neste repositório

Este é o **primeiro arquivo** que uma IA deve ler. Siga na ordem. Não invente pasta, padrão ou biblioteca.

Se faltar detalhe, use a seção **Onde buscar mais contexto** no final deste arquivo — abra só o trecho da tarefa, nunca o arquivo misto inteiro.

---

## 0. Antes de escrever uma linha

1. Classifique a tarefa (backend / frontend / devops) e abra **só** as faixas no final deste arquivo.
2. Backend: um Controller em `src/Controller/` e um Repository em `src/Repository/`. Pule `web/`.
3. Frontend: `web/App.tsx` e a feature mais parecida em `web/features/`. Pule `src/` (exceto se precisar do contrato JSON).
4. Copie o padrão que já existe. Não misture `<div>` cru ou `axios` solto.
5. Nomes em **português**: pastas, arquivos, variáveis, funções, DTOs, services, entidades.
6. Sem comentários (`//`, `/* */`, `{/* */}`). Código se explica pelo nome. Exceção: DocBlock curto em Service PHP se o retorno for complexo.
7. Não crie testes. Não instale PHPUnit.
8. Importação explícita de classes (PHP): Proibido usar FQCN inline no meio do código (ex: `\App\...`, `\DateTime`, `\Symfony\...`). Todas as classes, DTOs, interfaces, exceções e enums devem ser importadas no topo do arquivo via `use` logo abaixo do `namespace`.
9. Verificações de estado e predicados booleanos: Proibido fazer checagens complexas/inline de status, categoria ou flags de entidades nos Services, Handlers e Controllers. Crie métodos de domínio na própria Entidade ou Enum com prefixo `is` retornando `bool` (ex: `$mediaItem->isClassificado()`, `$mediaItem->isFinal()`, `$mediaItem->isClassificadoOuFinalizado()`, `$status->isFinal()`).

---

## 1. Mapa do sistema

```
src/          API Symfony  — JSON em /api/v1/
web/          SPA React    — o usuário só vê isto
```

Fluxo de uma feature completa:

```
Controller (rota, sem lógica) → Service (regra de negócio) → Repository (toda query)
Lógica grande ou repetida → vários services + interface + `TaggedIterator` numa Feature. Nunca um arquivo só.
Entidade → Migration → DTO → Serializer
Types → api.ts → Hook (TanStack Query) → Componentes → Página → rota em App.tsx
```

No backend: **crie o Controller primeiro**. Ele só recebe o request e chama o Service (ou a Feature, se o fluxo for grande). A lógica mora no Service. Consulta e persistência **nunca** no Service nem na Feature — só no Repository.

---

## 2. Onde colocar cada arquivo

### Frontend (`web/`)

| O quê | Onde |
| :--- | :--- |
| Página / tela de um módulo | `web/features/{feature}/Nome.tsx` |
| Types, api, hooks, componentes só dessa tela | `web/features/{feature}/` |
| Rota | só em `web/App.tsx` (lazy) |
| Guard de login | `web/routes/` — nunca dentro da página |
| Header / Footer / casca | `web/layouts/` — **não recrie** na página |
| Axios, JWT | `web/config/api.ts` — único cliente HTTP |
| Auth global | `web/stores/useAuthStore.ts` |
| Layout e texto | `web/shared/ui/layout.tsx` |
| Coisa usada em várias features | `web/shared/` |

Regra: 2+ arquivos do mesmo assunto → `features/{feature}/`. Reutilizável → `shared/`. Não crie `web/pages/` para feature nova.

### Backend (`src/`)

> [!IMPORTANT]
> **Regra de Organização Obrigatória**: É estritamente **PROIBIDO** deixar arquivos soltos na raiz de `src/Service/`, `src/Exception/`, `src/Controller/` ou `src/Feature/`. Todos os arquivos devem **obrigatoriamente** ficar dentro de uma subpasta de contexto (ex: `MediaItem/`, `Ingestao/`, `Video/`, `GoogleFotos/`, `Storage/`, `Sistema/`). Se a pasta de contexto contiver muitos arquivos, crie subcategorias dentro dela.

| O quê | Onde |
| :--- | :--- |
| HTTP da API | `src/Controller/{Contexto}/` — **sempre** em subpasta de contexto e extends `DefaultController` |
| SPA / Twig | `src/Controller/Sistema/FrontendController.php` |
| Caso de uso (Service) | `src/Service/{Contexto}/VerboEntidadeService.php` — **sempre** em subpasta de contexto |
| Estratégia expansível / Pipeline | `src/Feature/{Contexto}/{Nome}Feature.php` — para algoritmos e regras dinâmicas |
| Exceções personalizadas | `src/Exception/{Contexto}/{Nome}Exception.php` — **sempre** em subpasta com métodos estáticos descritivos em PT-BR |
| Banco | `src/Repository/` — único lugar com Doctrine |
| Contrato PHP | `src/Interface/{Nome}Interface.php` |
| Entrada da API | `src/DataObject/` — sufixo `DTO` |
| Tabela | `src/Entity/` |
| JSON de saída | `src/Serializer/` |
| Enum fechado | `src/Enum/` |
| Evento + reação | `src/EventListener/` — fato em `Event/`, reação ao lado |
| Clientes HTTP externos | `src/Infra/{Sistema}/{Sistema}Client.php` e `src/Infra/{Sistema}/{Sistema}API.php` |

---

## 3. Frontend — como construir

### 3.1 Página

A página **não** monta Header nem Footer. `MainLayout` já envolve o `Outlet`.

```tsx
import { AppContainer } from '@/layouts'
import { Container, Text, VStack } from '@/shared/ui/layout'

export function Component() {
  return (
    <AppContainer>
      <Container>
        <VStack className="gap-6">
          <Text as="h1" className="text-3xl font-bold">Título</Text>
        </VStack>
      </Container>
    </AppContainer>
  )
}
```

- Um `Container` = uma seção.
- Conteúdo grande de uma seção vira componente em `features/{feature}/components/`.
- Nomes concretos: `TabelaUsuarios`, `ModalCadastroPedido`. Nunca `Card1`, `Tabela`, `Modal`.

Rota lazy em `App.tsx`:

```tsx
<Route path="pedidos" lazy={() => lazyWithRetry(() => import('@/features/pedidos/Pedidos'))} />
```

Página autenticada: envolva com `<RotaProtegida />` como `/app`.

### 3.2 UI (obrigatório)

Proibido no JSX: `<div>`, `<p>`, `<h1>`–`<h6>`, `<span>`.

| Precisa de | Use |
| :--- | :--- |
| Caixa | `Box` |
| Lado a lado | `HStack` |
| Empilhado | `VStack` |
| Flex livre | `Flex` |
| Colunas | `Grid` |
| Largura máxima | `Container` |
| Texto / título | `Text` / `Text as="h1"` / `Text as="span"` |

```tsx
import { Box, HStack, VStack, Flex, Grid, Container, Text } from '@/shared/ui/layout'
```

Exceção: `<main>`, `<header>`, `<footer>`, `<nav>`, `<section>` só se forem semântica real. Botões, inputs e cards: **HeroUI** (`@heroui/react`), não HTML cru.

Estilo: só `className` + Tailwind 4. Animação padrão: classes `tailwindcss-motion`. Framer Motion só se o módulo `ui-extra` estiver ativo e houver montar/desmontar de verdade.

### 3.3 Dados e estado

- **Proibido `useEffect`** em página e feature. Derivado no render / `useMemo`. Evento em `onClick` / `onSubmit`. Fetch no TanStack Query. Montagem pontual: `useMountEffect` ou `useSEO`.
- Página **nunca** chama Axios. Hook da feature chama `api` de `@/config/api`.
- Toast no hook (`toast.success` / `toast.danger`), não no JSX da página.
- Zustand só para estado global de verdade (auth). Não abra store por feature “por precaução”.

```tsx
// features/pedidos/api.ts
import { api } from '@/config/api'
export const listarPedidos = () => api.get('/api/v1/pedidos')

// features/pedidos/hooks/usePedidos.ts
export function usePedidos() {
  return useQuery({ queryKey: ['pedidos'], queryFn: listarPedidos })
}
```

---

## 4. Backend — como construir

Três camadas com responsabilidades claras:

| Camada | Faz | Não faz |
| :--- | :--- | :--- |
| **Controller** | Rota, DTO de entrada, chamar Use Case diretamente, retornar `$this->success()` / `$this->error()` | Regra de negócio, query, EntityManager, fachadas delegadoras |
| **Use Case (Service)** | Uma operação/caso de uso coeso (ex: `UploadManualService`, `ClassificarMediaItemService`), orquestra domínio e infraestrutura | Query Doctrine; DTO com I/O; repassar chamadas sem valor |
| **Repository** | Toda consulta e persistência Doctrine | Regra de negócio HTTP ou I/O externo |
| **Infraestrutura** | Filesystem, chamadas de API externas, processos CLI (`yt-dlp`), clientes HTTP | Regra de negócio do domínio |

Comece pelo **Controller** (contrato da rota). Ele injeta diretamente os **Use Cases (Services)** necessários para a operação. Cada Use Case encapsula o fluxo de um caso de uso real (validar invariantes, acionar repositórios/infraestrutura e persistir). Toda busca (`find`, `createQueryBuilder`, SQL, `persist`, `flush`) vai para um método do Repository — o Use Case só chama esse método.

### 4.1 Controller

Crie o Controller **primeiro**. Extends `DefaultController`. Corpo: ler DTO → chamar Use Case diretamente → `$this->success()` / `$this->created()` / `$this->error()`. Sempre `Response`. Nada além disso.

Envelope JSON: `{ success, data }` ou `{ success, error, details? }`. Chaves em **inglês**.

```php
#[Route('/api/v1/pedidos', methods: ['POST'])]
public function criar(#[MapRequestPayload] CriarPedidoDTO $dto): Response
{
    $pedido = $this->criarPedidoService->executar($dto);

    return $this->created($this->serializer->serializar($pedido));
}
```

Rotas: prefixo `/api/v1/`, recurso no **plural**.

Handler de fila (módulo `async`): mesma regra — zero regra de negócio; chama um Use Case.

### 4.2 Entidade

- UUID como PK nas entidades **novas** (`doctrine.uuid_generator`).
- Getter **sem** `get`: `nome()`, não `getNome()` — salvo contrato do Symfony (`UserInterface`).
- Setter `setNome(): self`.
- Métodos de intenção de domínio (Tell, Don't Ask): `$mediaItem->classificarComo($categoria)`, `$mediaItem->marcarParaDownload()`, `$mediaItem->registrarErro($motivo)`. Proibido sequências de `set*()` soltos no Use Case quando existe uma operação de domínio.
- Métodos de predicado e checagem de estado sempre com prefixo `is` retornando `bool`: `$mediaItem->isClassificado()`, `$mediaItem->isFinal()`, `$mediaItem->isClassificadoOuFinalizado()`, `$mediaItem->isElegivelParaClassificacao()`. Nunca faça checagens inline combinando status e flags fora da entidade/enum.
- Conjunto fechado de valores → Enum em `src/Enum/`, não string solta.

### 4.3 Migration

> [!IMPORTANT]
> **É ESTRITAMENTE PROIBIDO criar arquivos de migration manualmente na mão**. Toda migration deve ser gerada automaticamente a partir das diferenças do Schema Doctrine das entidades mapeadas utilizando os comandos oficiais do `Makefile`:

```bash
make doctrine-diff      # Gera automaticamente o arquivo de migration baseado no schema das entidades
make migrate            # Executa todas as migrations pendentes no banco de dados
make doctrine-validate  # Valida se o schema do banco está 100% sincronizado com o mapeamento ORM
make rollback           # Reverte para a versão anterior da migration se necessário
```

Revise o SQL gerado antes de aplicar. Garanta índices e restrições de unicidade (`UNIQUE INDEX`) no banco para campos de unicidade de domínio (`hash`, `nome`, `origem`).

### 4.4 Repository

**Único** lugar com query. `find`, `createQueryBuilder`, DQL, SQL, `persist`, `flush` — só aqui.

**Proibido** no Use Case e no Controller: `EntityManagerInterface`, `createQueryBuilder`, `findBy`, consulta crua.

O Use Case pede dados com um método de intenção (`buscarPorUuid`, `buscarPorHash`, `salvar`). Se a consulta ainda não existe, crie no Repository — não escreva a query no Use Case.

Contrato do repositório (e de qualquer porta: cliente HTTP, armazenamento) vai em `src/Interface/{Nome}Interface.php`. O Use Case tipa a interface, não a classe concreta.

### 4.5 DTO

`final readonly class` em `src/DataObject/`, nome `VerboEntidadeDTO`. Sem setters. Getter = nome da propriedade. Validar com `#[Assert\…]`. Entrada HTTP via `MapRequestPayload` / `MapQueryString` — não monte array na mão com `$request->get()`.

> [!IMPORTANT]
> **DTO é carregador de dados puro**: É estritamente **PROIBIDO** que um DTO acesse o sistema de arquivos (`file_exists`, `hash_file`, `is_readable`), chame serviços de I/O ou execute validações de infraestrutura. O DTO apenas transporta dados. Cálculos de hash ou checagens de arquivo pertencem ao Use Case ou à camada de Infraestrutura (`ArmazenamentoInterface`).

### 4.6 Use Cases (Services)

Toda lógica de negócio fica no **Use Case**, não no Controller. Cada Use Case representa uma operação coesa da aplicação (ex: `UploadManualService`, `ClassificarMediaItemService`, `ApagarMediaItemService`). `final class`, dependências no construtor DI.

- Sem Request/Response.
- **Sem query.** Precisa de dado do banco? Chame o Repository. Não monte QueryBuilder, DQL nem `find` no Use Case.
- **Não crie fachadas delegadoras**: É proibido criar classes intermediárias (ex: "Features" delegadoras) apenas para repassar chamadas `$this->service->metodo()`. O Controller deve injetar os Use Cases diretamente.
- **Divida por Coesão, não por Contagem de Métodos**: Não existe limite artificial de 3 métodos. Uma classe com 5 métodos coesos é infinitamente melhor que 5 classes artificiais de 1 método que apenas repassam chamadas.
- **Sem `new Service()` manual**: Injete dependências no construtor via Container DI do Symfony.
- **Processamento em Lote Resiliente**: Métodos em lote devem capturar **exceções esperadas** (de domínio ou armazenamento), logar/coletar a falha em um mapa e continuar o loop. **NUNCA** use `catch (\Throwable)` indiscriminadamente — erros de programação (`TypeError`, `Error`, `LogicException`) devem falhar rapidamente para serem corrigidos.
- **Substitua Arrays Mágicos por Result Objects**: Operações com múltiplos retornos (ex: upload com flag de duplicado, lote de apagar) devem retornar DTOs de saída dedicados (`ResultadoUploadDTO`), evitando `array{mediaItem: ..., duplicado: true}`.
- Guard clauses baratas primeiro (dado local → memória → Repository → API externa).

### 4.7 Quando usar Interfaces e TaggedIterator

**Não crie interfaces nem abstrações para tudo por hábito**. Crie interfaces e estratégias dinâmicas em `src/Interface/` e `src/Feature/` apenas quando houver:
1. Mais de uma implementação concreta (ex: `ArmazenamentoLocalClient`, `YtDlpClient`).
2. Necessidade real de estratégias expansíveis (ex: regras de classificação dinâmicas via `#[TaggedIterator]`).
3. Fronteiras de integração de infraestrutura que exigem substituição em testes.

```php
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

#[AutoconfigureTag('app.regra_classificacao')]
interface RegraClassificacaoInterface
{
    public function suporta(MediaItem $item): bool;
    public function classificar(MediaItem $item): ?Categoria;
}
```

```php
use Symfony\Component\DependencyInjection\Attribute\TaggedIterator;

final class CalcularDescontoFeature
{
    public function __construct(
        #[TaggedIterator('app.regra_desconto')]
        private readonly iterable $regras,
    ) {}

    public function executar(Pedido $pedido): Pedido
    {
        foreach ($this->regras as $regra) {
            if ($regra->suporta($pedido)) {
                $regra->aplicar($pedido);
            }
        }

        return $pedido;
    }
}
```

Nova peça = nova classe. A Feature não muda. Symfony registra sozinho.

**Quando isso é o padrão (sempre que possível)**

- Lógica grande ou que se repete (desconto, validação, imposto, fraude, permissão).
- Várias peças do mesmo conceito: pagamento, exportação, notificação, frete, parser, webhook.
- Pipeline de etapas (`#[AsTaggedItem(priority: 100)]` define a ordem).
- Outro módulo precisa plugar comportamento sem conhecer a Feature.

Um único Service atômico (criar pedido, buscar por uuid) **não** vira Feature.

**Variações:** `TaggedLocator` + `#[AsTaggedItem(index: 'pix')]` quando a Feature já sabe a chave e só instancia o que usar.

O Controller chama a Feature.

### 4.8 Serializer

Nunca devolva entidade crua. Array estável: `uuid`, campos, timestamps.

### 4.9 Clientes HTTP e Infraestrutura (`src/Infra/` e `src/Exception/`)

**PROIBIDO**: Fazer requisições HTTP cruas (`HttpClientInterface` ou `$client->request()`), comandos de processos externos (`Symfony\Component\Process\Process`) ou chamadas diretas de sistema de arquivos (`mkdir`, `copy`, `unlink`, `file_exists`, `@unlink`) diretamente em Services ou Commands.

Toda integração com APIs, sistemas externos, processos CLI (`yt-dlp`) ou armazenamento de sistema de arquivos deve ser desacoplada na camada de infraestrutura sob `src/Infra/{Sistema}/`:

1. **Base Client Abstrato (`src/Infra/Client.php`)**:
   - Injeta `\GuzzleHttp\ClientInterface` e `baseUrl`.
   - Método `protected function request()` executa a requisição, trata `RequestException` via `executarRequisicao()`, deserializa via Symfony Serializer (se `$type` for informado) ou decodifica JSON e valida via `Assert::isArray()`.
   - Método `protected function requestRaw()` para respostas puras em string.
2. **Cliente por Sistema (`src/Infra/{Sistema}/{Sistema}Client.php`)**:
   - Classe abstrata ou concreta em `src/Infra/{Sistema}/` isolando comandos de CLI, I/O de disco ou chamadas de API.
3. **Serviços de Armazenamento Local e Processos (`src/Infra/Storage/`, `src/Infra/YtDlp/`)**:
   - Operações de sistema de arquivos (copiar, mover, apagar, criar diretório com permissão restrita `0755`) devem ser abstraídas em clientes de Infra (ex: `ArmazenamentoLocalClient`). Proibido usar a arroba `@` para suprimir erros de exclusão — valide o retorno de `unlink` e trate erros adequadamente.
4. **Configuração DI (`config/services.yaml`)**:
   - Parâmetros como `%env(GOOGLE_CLIENT_ID)%` e `%env(MEDIA_STORAGE_PATH)%` são injetados diretamente via construtor no `services.yaml`. Proibido ler `$_ENV` ou `getenv()` manualmente dentro de métodos de serviços de negócio.
5. **Exceções Personalizadas por Contexto (`src/Exception/`)**:
   - **PROIBIDO**: Lançar exceções genéricas nativas do PHP (`throw new \DomainException(...)`, `throw new \RuntimeException(...)`, `throw new \Exception(...)`) diretamente no corpo dos métodos.
   - **PROIBIDO**: Usar identificadores curtos com snake_case (ex: `'erro_salvar_arquivo'`) como mensagem de exceção. **A mensagem da exceção (primeiro argumento) deve ser uma frase completa, clara e altamente descritiva em português**.
   - **SEMPRE**: Criar uma classe de exceção personalizada em `src/Exception/` estendendo `\DomainException` para cada contexto de domínio ou infraestrutura (ex: [`App\Exception\YtDlpException`](file:///home/gabriel/dev/CirqueiraX/src/Exception/YtDlpException.php), [`App\Exception\ArmazenamentoLocalException`](file:///home/gabriel/dev/CirqueiraX/src/Exception/ArmazenamentoLocalException.php), [`App\Exception\MediaItemException`](file:///home/gabriel/dev/CirqueiraX/src/Exception/MediaItemException.php), [`App\Exception\UploadManualException`](file:///home/gabriel/dev/CirqueiraX/src/Exception/UploadManualException.php)).
   - **Métodos Construtores Estáticos Descritivos**: O código lança a exceção exclusivamente chamando seus métodos estáticos em camelCase com mensagens em linguagem natural descritivas (ex: `throw YtDlpException::falhaAoExtrairMetadataDoVideo();`, `throw UploadManualException::falhaAoSalvarArquivoDeUpload();`, `throw ArmazenamentoLocalException::falhaAoCriarDiretorioDeArmazenamento();`).

```php
namespace App\Exception;

class YtDlpException extends \DomainException
{
    public static function falhaAoExtrairMetadataDoVideo(): self
    {
        return new self('Falha ao extrair os metadados do vídeo utilizando o yt-dlp.', 400);
    }

    public static function falhaAoEfetuarDownloadDoVideo(): self
    {
        return new self('Ocorreu uma falha durante o download do vídeo pelo yt-dlp.', 500);
    }
}
```

### 4.10 Uso Obrigatório de Constantes e Tipagem Múltipla (Proibição de Magic Values)

**PROIBIDO** utilizar valores numéricos soltos (*magic numbers*) ou strings literais de comportamento/configuração espalhados no corpo dos métodos.

1. **Configurações e Comportamentos**: Timeouts (`TIMEOUT_EXTRACAO_SEGUNDOS = 60.0`), permissões de diretório (`PERMISSAO_DIRETORIO_PADRAO = 0755`), algoritmos (`ALGORITMO_HASH_SHA256 = 'sha256'`), formatos de data/arquivo e subdiretórios temporários **devem obrigatoriamente** ser declarados como `private const` ou `public const` no topo da classe.
2. **Exceções via Métodos Estáticos**: Códigos de erro HTTP e mensagens estáveis ficam encapsulados dentro das exceções personalizadas em `src/Exception/` (ver § 4.9.5).
3. **Chaves de Metadados Compartilhadas**: Chaves de array usadas para leitura/gravação de metadados (`url_original`, `nome_original`, `timestamp_captura`) devem utilizar constantes centrais (ex: [`App\Support\MetadataKeys`](file:///home/gabriel/dev/CirqueiraX/src/Support/MetadataKeys.php)).

### 4.11 Object Calisthenics Aplicado ao Projeto

1. **Um nível de indentação por método**: Métodos de Service com loops/condicionais aninhadas devem extrair o corpo do loop/bloco para métodos privados nomeados (ex: `apagarItemIndividual()`).
2. **Não use `else`**: Sempre inverta a condição e retorne cedo (Guard Clauses).
3. **Encapsule tipos primitivos (Value Objects e Enums)**: Strings de regra (hash, URLs, status) devem ser Enums (`OrigemMedia`, `StatusMediaItem`), VOs ou checadas via helpers centralizados (`TextoUtil::estaEmBranco()`).
4. **Coleções de Primeira Classe e DTOs de Saída**: Evite arrays anônimos soltos sem nome para estruturas fixas de retorno.
5. **Um ponto por linha (Lei de Demeter)**: Evite encadear chamadas longas ou nulas (`$item->uuid()?->toString()`). Encapsule a intenção na entidade ou helper.
6. **Não abrevie nomes**: Nomes em português completos e descritivos em exceções, variáveis e métodos (`falhaAoExtrairMetadataDoVideo()`).
7. **Classes e métodos pequenos**: Métodos de `executar()` com mais de ~25 linhas devem ser divididos em passos privados nomeados.
8. **Métodos de intenção nas Entidades**: Evite sequências de `set*()` soltos no Service. A Entidade deve conter métodos com significado de negócio (ex: `transicionarPara()`, `classificarComo()`).
9. **Máximo de dependências por Service**: Services com 5+ dependências injetadas devem ser refatorados dividindo responsabilidades ou convertidos em Feature.

### 4.12 Clean Code — Princípios Fundamentais

- **Uma única responsabilidade por método**: Sem duplicação de mapeamento ou transformação de dados.
- **Trate erros com exceções de contexto**: Nunca exponha mensagens brutas de exceções internas (`$e->getMessage()`) para respostas de API HTTP.
- **DRY (Don't Repeat Yourself)**: Lógicas de validação de guarda ou regras idênticas entre múltiplos services devem ser centralizadas num helper ou serviço compartilhado.
- **Fronteiras Claras entre Camadas**: Tipos de infraestrutura externa (JSON de APIs terceiras) devem ser mapeados em DTOs/Value Objects antes de entrar na camada de negócio.

### 4.13 Boas Práticas Específicas do Symfony e Performance

- **Classes `final` com Interface para Portas**: Classes de infraestrutura e serviços de I/O devem ser `final` e implementar uma interface em `src/Interface/` (`ArmazenamentoInterface`, `ExtratorVideoInterface`).
- **Otimização de Flush em Lote (Prevenção de N+1 Queries e Transactions)**: Em métodos que executam ações em lote no Repository (ex: exclusão de N itens em loop), chame `$repository->remover($item, flush: false)` dentro do loop e execute uma única chamada a `$repository->flush()` **após o término do loop**.
- **DTOs de Saída em Vez de Arrays Anônimos**: Retornos estruturados de serviços (ex: resultado de upload com flag de duplicado) devem utilizar DTOs de saída dedicados (`ResultadoUploadDTO`), evitando arrays genéricos não-tipados.
- **Injeção de Parâmetros via DI (`services.yaml`)**: Nunca use `$_ENV` ou `getenv()` dentro de métodos. Injete parâmetros no `services.yaml`.
- **Value Resolvers HTTP**: Use `MapRequestPayload` / `MapQueryString` por padrão (exceto uploads multipart/form-data com arquivos, que usam `fromRequest()`).
- **Mensageria**: MessageHandlers devem servir apenas como porta de entrada delegadora, sem conter lógica de negócio.

### 4.14 Importação Explícita de Classes (Proibido FQCN Inline)

> [!IMPORTANT]
> **Regra de Importação**: É estritamente **PROIBIDO** usar FQCNs (Fully Qualified Class Names) inline com barra invertida no meio do código PHP (ex: `#[MapRequestPayload] \App\DataObject\MeuDTO $dto`, `\App\Support\TextoUtil::metodo()`, `\DateTimeInterface`, `\DomainException`, `\Throwable`).
> 
> - **SEMPRE**: Todas as classes, DTOs, interfaces, exceções, enums e traits devem ser importadas no topo do arquivo com declarações `use` explícitas, logo abaixo do `namespace`, organizadas em ordem alfabética.
> - **No corpo do arquivo**: Use sempre o nome curto da classe importada (ex: `MeuDTO $dto`, `TextoUtil::naoEstaEmBranco(...)`, `DateTimeInterface::ATOM`, `DomainException`).


---

## 5. Passo a passo de uma feature nova

1. Entender a tela e o contrato JSON.
2. Backend: **Controller primeiro**. Service atômico. Lógica grande/repetida → vários services + interface + `TaggedIterator` na Feature. Nunca um arquivo com toda a lógica. Repository para toda consulta → Entidade / migration / DTO / Serializer.
3. Frontend: `types.ts` → `api.ts` → hook → componentes HeroUI + layout → página `Component` → rota lazy em `App.tsx`.
4. Se a rota for autenticada, registrar em `RotaProtegida`.
5. `make lint-all`. Corrigir o que o Biome/PHP apontar.

---

## 6. Checklist rápido (antes de encerrar)

- [ ] Sem `<div>` / `<p>` / `<h*>` / `<span>` — só primitivos de `@/shared/ui/layout`
- [ ] Sem Header/Footer na página
- [ ] Sem `any`, sem `ts-ignore`
- [ ] Nenhum `else` em Service/Controller — sempre guard clause com early return
- [ ] Nenhum Service usa `\DomainException` genérica — sempre exceção por contexto com método estático
- [ ] Nenhuma exceção interna (`getMessage()`) é exposta em payload de resposta HTTP
- [ ] Nenhum Client de I/O ou Infra é `final` sem uma Interface correspondente em `src/Interface/`
- [ ] Nenhum método de mapeamento de resposta externa duplicado em dois Services — extrair Mapper/DTO único
- [ ] Nenhuma checagem de "string em branco" repetida com sintaxe diferente — usar `TextoUtil`
- [ ] Nenhum método proxy que só chama outro método com nome diferente — escolher um nome e eliminar o outro
- [ ] Nenhum parâmetro de método declarado e nunca usado no corpo
- [ ] Toda mudança de comportamento de negócio vem em commit separado de reorganização de pastas/namespaces
- [ ] Toda constante de chave de array de metadata usa `App\Support\MetadataKeys`, nunca string solta
- [ ] Método de Service com mais de ~25 linhas de corpo é candidato a extrair passos privados nomeados
- [ ] Regra de negócio de transição de estado mora na Entidade (método de intenção), nunca em dois `set*()` soltos chamados em sequência pelo Service
- [ ] Loops de remoção/persistência em lote usam `flush: false` e disparam um único `$repository->flush()` ao final
- [ ] Operações com retornos compostos devolvem DTOs de saída dedicados (ex: `ResultadoUploadDTO`) em vez de arrays genéricos
- [ ] Sem `useEffect`
- [ ] Sem Axios fora de `config/api.ts` e dos `api.ts` da feature
- [ ] Controller extends `DefaultController`; só chama Service ou Feature; retorna `$this->success()` / `$this->error()` (`Response`)
- [ ] Lógica só no Service (ou Feature orquestrando services) — zero query, zero EntityManager
- [ ] Service não excede 3 métodos de ação de negócio — refatorado em Feature/Services se crescer
- [ ] Injeção direta de Services especificos no Controller/Command — zero fachadas mortas que descartam retornos
- [ ] Processamento em lote captura `\Throwable` por item e retorna relatório `{ removidos: [...], falhas: [...], total: int }`
- [ ] Injeção de dependência 100% via DI no construtor — zero `new Service()` manual e zero leitura crua de `$_ENV`/`getenv()`
- [ ] Sem I/O cru de sistema de arquivos (`mkdir`, `copy`, `unlink`, `@unlink`) ou `Process` no Service — isolado em `src/Infra/`
- [ ] Exceções personalizadas em `src/Exception/` com métodos estáticos por contexto — zero `throw new \DomainException()` genérico
- [ ] Zero magic values/strings no corpo dos métodos — utilizar `private const` e `MetadataKeys`
- [ ] Toda consulta/persistência no Repository
- [ ] Contrato novo em `src/Interface/{Nome}Interface.php`
- [ ] DTO validado, sem setter
- [ ] JSON via Serializer, não entidade
- [ ] Nomes em português, descritivos
- [ ] `make lint-all` passou

---

## Onde buscar mais contexto

Leia este arquivo até o fim. Depois abra **só** os trechos da sua tarefa. Não carregue `GUIA-GERAL.md` nem `DOCUMENTACAO_TECNICA.md` inteiros.

Código de referência: backend → `src/Controller/` e `src/Repository/`. Frontend → `web/App.tsx` e uma feature em `web/features/`. Não abra o outro lado se a tarefa for só um deles.

### Backend (Controller, Service, Feature, Repository, DTO, Entity)

| Arquivo | Linhas | Pular |
| :--- | :--- | :--- |
| [Estruturação.md](Estruturação.md) | 448–673 (§ 13) | §§ 3–12 (front) |
| [BACKEND.md](../stack/BACKEND.md) | 1–105 (arquivo curto) | — |
| [GUIA-GERAL.md](GUIA-GERAL.md) | 135–835 (§ 5) | § 6 front, § 7 UI |
| [DOCUMENTACAO_TECNICA.md](../referencia/DOCUMENTACAO_TECNICA.md) | 259–462 (§ 5) | § 6 front |
| [NOVA-FUNCIONALIDADE.md](NOVA-FUNCIONALIDADE.md) | 42–154 (§ 3) | § 4 front |

Auth JWT API: [AUTH.md](../stack/AUTH.md) linhas **1–26**. Pular 28–52.
Fila: [MESSENGER.md](../stack/MESSENGER.md) inteiro (curto).

### Frontend (página, layout, `Box`/`Text`, hook, rota)

| Arquivo | Linhas | Pular |
| :--- | :--- | :--- |
| [Estruturação.md](Estruturação.md) | 59–446 (§§ 3–12) | § 13 back |
| [FRONTEND.md](../stack/FRONTEND.md) | 1–182 (arquivo curto) | — |
| [DESIGN.md](DESIGN.md) | 1–720 se for visual/UI | — |
| [GUIA-GERAL.md](GUIA-GERAL.md) | 837–1570 (§§ 6–7) | § 5 back |
| [DOCUMENTACAO_TECNICA.md](../referencia/DOCUMENTACAO_TECNICA.md) | 464–718 (§ 6) | § 5 back |
| [NOVA-FUNCIONALIDADE.md](NOVA-FUNCIONALIDADE.md) | 156–293 (§ 4) | § 3 back |

Auth tela / store / interceptors: [AUTH.md](../stack/AUTH.md) linhas **28–52**. Pular 1–26.

### DevOps, Docker, portas

| Arquivo | Linhas | Pular |
| :--- | :--- | :--- |
| [DOCKER.md](../ops/DOCKER.md) | 1–55 (arquivo curto) | — |
| [DOCUMENTACAO_TECNICA.md](../referencia/DOCUMENTACAO_TECNICA.md) | 190–257 (env/portas); 1100–1248 (§§ 11–12) | §§ 5–6 app |
| [STRUCTURE.md](../referencia/STRUCTURE.md) | 7–82 (raiz, tooling) | — |

### Deploy / produção

| Arquivo | Linhas |
| :--- | :--- |
| [DEPLOY.md](../ops/DEPLOY.md) | 1–770 |
| [MAKEFILE.md](../ops/MAKEFILE.md) | 39–48 |

### Lint / Makefile / CLI

| Arquivo | Linhas |
| :--- | :--- |
| [FORMATTING.md](../ops/FORMATTING.md) | 1–44 |
| [MAKEFILE.md](../ops/MAKEFILE.md) | 1–38 |
| [CLI.md](../ops/CLI.md) | 1–28 |

### Árvore de pastas

[STRUCTURE.md](../referencia/STRUCTURE.md): **84–106** (`src/`) · **108–126** (`web/`). O resto, pular.
