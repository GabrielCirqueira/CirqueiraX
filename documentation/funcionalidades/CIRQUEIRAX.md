# CirqueiraX — Documentação Técnica

**Versão:** 1.1 (v1 / MVP)
**Última atualização:** 21/09/2026
**Stack base:** cirqueiraX v5.0.0 (Symfony 7.3 + React 19, DDD/Clean Architecture) — módulo instalado, ainda sem `async`/`observability`/`ui-extra` ativados

---

## 1. Visão geral

CirqueiraX é o hub central de gerenciamento e organização de mídia pessoal. O sistema resolve um problema hoje manual e repetitivo: mídias vindas de múltiplas origens (download de plataformas, capturas de tela, uploads manuais) precisam ser classificadas, distribuídas para pastas locais sincronizadas (via Syncthing) e enviadas para os álbuns correspondentes no Google Fotos — sem intervenção manual diária.

O sistema nasce como módulo de mídia, mas é desenhado para crescer como hub geral de ferramentas pessoais (v2+).

### 1.1 Problema que resolve

| Hoje (manual) | Com CirqueiraX |
|---|---|
| Vídeo baixado → Syncthing → celular → backup manual pro Google Fotos | Vídeo baixado → categorizado → distribuído automaticamente pra pasta local **e** Google Fotos |
| Print do PC da empresa/pessoal → upload manual no álbum certo | Agente detecta print → classifica pela origem → upload automático |
| Sem visão consolidada do que já foi processado, onde está, e o que falhou | Dashboard único com status de todo o pipeline |
| Celular como ponto único de sincronização de tudo | Celular sincroniza só o que você quiser, quando quiser |

### 1.2 Princípios de design

1. **Fonte única de verdade**: o backend (Symfony) é o único que escreve estado. Dashboard nunca fala direto com Syncthing ou Google Fotos — sempre via API própria.
2. **Categoria decide o destino**: cada item de mídia pertence a uma categoria, e a categoria carrega o mapeamento pra pasta local + álbum Google Fotos. Não existe lógica de destino espalhada pelo código.
3. **Idempotência em tudo**: qualquer worker pode reprocessar um item sem duplicar resultado (hash de arquivo como chave).
4. **Upload é de mão única**: o sistema nunca tenta ler ou auditar o que já existe na biblioteca do Google Fotos (limitação da API desde 2025 — só é possível gerenciar conteúdo criado pela própria aplicação).
5. **Fila assíncrona, não requisição síncrona**: ingestão, classificação e upload rodam como jobs via Symfony Messenger, nunca bloqueando a UI.

---

## 2. Arquitetura

### 2.1 Componentes

```
Fontes de mídia
├── Bot de download (link → vídeo)
├── Agente de print — PC empresa
├── Agente de print — PC pessoal
└── Upload manual (dashboard)
        │
        ▼
Serviço de ingestão (fila assíncrona, dedupe por hash)
        │
        ▼
Motor de classificação (regra por categoria/origem, ou decisão manual)
        │
        ├──► Worker de distribuição local (pasta X/Y/Z → Syncthing sincroniza)
        │
        └──► Worker de upload Google Fotos (API appendonly → álbum correspondente)
        │
        ▼
Dashboard (React) — consome API própria, nunca fala direto com Syncthing/Google
```

### 2.2 Stack

- **Backend**: PHP 8.4 + Symfony 7.3, JSON API, Clean Architecture/DDD (herdado do Catalyst Skeleton)
- **Async**: Symfony Messenger + workers dedicados por tipo de job (ingestão, classificação, distribuição local, upload Google Fotos)
- **Frontend**: React 19 + TypeScript, SPA
- **Banco**: o mesmo do skeleton (MySQL via Docker)
- **Integrações externas**: Syncthing REST API, Google Photos Library API (`photoslibrary.appendonly`, `photoslibrary.edit.appcreateddata`)

### 2.3 Fluxo de estados de um item de mídia

```
recebido → em_fila → classificado → distribuindo → distribuido_local
                                                  → enviando_google_fotos → concluido
                                                                          → erro (com motivo)
```

Cada transição é registrada com timestamp, pra permitir auditoria e retry granular.

---

## 3. Módulos (v1)

### 3.1 Downloads de vídeo

**Objetivo**: baixar mídia de qualquer plataforma suportada (YouTube, TikTok, Twitter/X, Instagram, + o que o `yt-dlp` cobrir) e roteá-la.

**Funcionalidades**:
- Campo de input de link com validação de URL suportada
- Fila de download com status em tempo real (baixando / na VPS / no dashboard / com erro)
- Grid de itens: thumbnail, título, uploader, plataforma de origem, tamanho, data
- Seleção múltipla (checkbox por card + "selecionar todos")
- Filtros: por status (Na VPS, No Dashboard, Baixando, Com erro, Deletados), busca por título/uploader, ordenação (mais recentes, etc)
- Ações em lote: definir categoria e enviar, rebaixar selecionados, alterar data/metadados, apagar arquivos, remover do histórico
- Ação individual: rebaixar, baixar MP4, apagar
- Edição de metadados (data de captura/upload) por item

**Categorização**: pode acontecer em dois momentos (a definir na implementação):
- No momento do pedido de download (usuário já escolhe categoria antes de baixar)
- Depois, no grid, selecionando um ou vários itens e aplicando categoria em lote

### 3.2 Prints automáticos

**Objetivo**: eliminar upload manual de screenshots, mantendo a separação entre PC da empresa e PC pessoal.

**Componentes**:
- Agente leve rodando em cada máquina, monitorando a pasta de screenshots do sistema operacional
- Cada agente tem uma origem fixa e pré-configurada (não pergunta categoria toda vez — já sabe pra onde vai)
- Debounce de arquivo (evita processar captura ainda sendo escrita em disco)
- Envio pro serviço de ingestão central com metadata de origem anexada

**Sem página de decisão manual no fluxo padrão** — a automação é o objetivo principal deste módulo. Reclassificação manual, se necessário, acontece pelo dashboard.

### 3.3 Upload manual

**Objetivo**: cobrir mídia que não passa pelo bot nem pelos agentes de print — arquivos que já existem no dispositivo do usuário.

**Funcionalidades**:
- Área de drag-and-drop / seleção de múltiplos arquivos (foto e vídeo misturados)
- Checagem de duplicidade por hash antes de aceitar (aviso, não bloqueio silencioso)
- Fila de triagem pós-upload: cada arquivo aparece sem categoria até o usuário definir
- Mesma UI de seleção em lote + definição de destino usada nos outros módulos
- Pipeline mais curto que o de download: upload → classificar → distribuir (sem etapa de "baixar")

### 3.4 Motor de classificação e roteamento

Não é uma página — é o núcleo do sistema, usado pelos três módulos acima.

**Responsabilidades**:
- Manter o cadastro de categorias: nome, pasta local correspondente, `album_id` do Google Fotos correspondente
- Receber itens da fila de ingestão e aplicar a categoria (automática por regra de origem, ou aguardando decisão manual)
- Garantir idempotência: hash do arquivo como chave de deduplicação
- Dois workers de distribuição, disparados após a classificação:
  - **Worker de distribuição local**: copia/move o arquivo pra pasta observada pelo Syncthing
  - **Worker de upload Google Fotos**: usa a API com escopo `appendonly`, envia o arquivo, adiciona ao álbum, e **grava o `media_id` retornado no banco** — esse dado é essencial pra permitir reclassificação futura (trocar de álbum exige `batchAddMediaItems`/`batchRemoveMediaItems`, e só é possível pra itens que o próprio app enviou)

**Regras de categoria por origem** (configuráveis):
- Print PC empresa → categoria fixa (sem decisão manual)
- Print PC pessoal → categoria fixa (sem decisão manual)
- Bot de download → categoria escolhida no pedido ou no dashboard
- Upload manual → categoria escolhida no dashboard

### 3.5 Dashboard

**Objetivo**: visão e controle central de todo o ecossistema — não só mídia, mas o pipeline inteiro.

**Seções**:

1. **Visão geral**
   - Cards de totais: total de itens, baixado, classificado, sincronizado localmente, no Google Fotos, com erro
   - Quebra por origem: bot / print-empresa / print-pessoal / upload-manual

2. **Por categoria**
   - Lista de categorias com contagem de itens, tamanho total, pasta local e álbum Google Fotos mapeados
   - Edição do mapeamento categoria → pasta/álbum direto pela UI (sem mexer em config)

3. **Status de sincronização**
   - Estado de cada pasta no Syncthing (ativa/pausada) por dispositivo
   - Botão de "sincronizar agora" por pasta, via API REST do Syncthing (sem precisar abrir o app no celular)
   - Espaço usado: VPS, celular, e o que já está seguro no Google Fotos (indicador de "pode limpar local")

4. **Erros e retry**
   - Lista de falhas (distribuição local ou upload Google Fotos) com motivo
   - Ação de reenviar/reprocessar item por item ou em lote

5. **Reclassificação manual**
   - Trocar categoria de um item já processado — dispara mover de pasta local e trocar de álbum no Google Fotos (usando o `media_id` guardado)

6. **Upload manual** (módulo 3.3, acessível a partir do dashboard)

---

## 4. Modelo de dados (essencial)

### 4.1 `media_item`
| Campo | Descrição |
|---|---|
| `id` | identificador interno |
| `hash` | hash do arquivo, usado pra deduplicação |
| `origem` | `bot` \| `print_empresa` \| `print_pessoal` \| `upload_manual` |
| `status` | `recebido` \| `em_fila` \| `classificado` \| `distribuindo` \| `distribuido_local` \| `enviando_google_fotos` \| `concluido` \| `erro` |
| `categoria_id` | FK pra `categoria` (nullable até classificação) |
| `caminho_local` | path do arquivo na VPS/pasta observada |
| `google_photos_media_id` | id retornado pela API do Google Fotos após upload (nullable até envio) |
| `plataforma_origem` | quando vem do bot: YouTube/TikTok/Twitter/Instagram etc |
| `metadata` | título, uploader, data de captura, tamanho |
| `erro_motivo` | texto do último erro, se houver |
| `criado_em`, `atualizado_em` | timestamps |

### 4.2 `categoria`
| Campo | Descrição |
|---|---|
| `id` | identificador interno |
| `nome` | ex: X, Y, Z |
| `pasta_local` | caminho da pasta observada pelo Syncthing |
| `google_photos_album_id` | id do álbum criado pela app via `albums.create` |

### 4.3 `origem_regra`
Mapeia origem fixa → categoria automática (usado pelos agentes de print, que não pedem decisão manual).

---

## 5. Integrações externas

### 5.1 Syncthing
- REST API local/remota pra: consultar status de pasta, pausar/retomar pasta, disparar sync sob demanda
- Sync no celular fica com granularidade de **pasta/categoria**, não arquivo individual — o Syncthing não tem (ainda) modo nativo de "baixar sob demanda" por arquivo, essa é uma limitação conhecida e aceita no design

### 5.2 Google Photos API
- Escopo `photoslibrary.appendonly` para upload e criação de álbum
- Escopo `photoslibrary.edit.appcreateddata` para editar título/capa de álbum criado pela app
- **Limitação aceita**: a API só gerencia conteúdo criado pela própria aplicação. Não há leitura da biblioteca existente do usuário, nem endpoint de delete. O sistema nunca tenta auditar o que já está na conta — apenas escreve.
- Quota: 10.000 requisições/dia por projeto (upload, listagem, filtros); 75.000/dia pra acesso a bytes de mídia
- Suporte a múltiplas contas (PC empresa e PC pessoal podem autenticar contas diferentes) — cada credencial OAuth gerenciada e renovada separadamente

---

## 6. Fora do escopo da v1

Explicitamente adiado, não esquecido:

- Reclassificação em massa retroativa de itens que já estavam no Google Fotos **antes** do sistema existir (fora do alcance da API, exigiria trabalho manual ou Google Takeout)
- Qualquer leitura/auditoria da biblioteca já existente no Google Fotos (bloqueado pela própria API)
- Múltiplas categorias simultâneas por item (v1 assume 1 item → 1 categoria; modelo N:N fica pra v2 se necessário)
- Sync verdadeiramente sob demanda por arquivo individual no celular (limitação do Syncthing, não do CirqueiraX)
- Expansão do hub pra outras ferramentas além de mídia (v2+)

---

## 7. Roadmap de implementação sugerido

**Fase 1 — Motor + downloads de vídeo**
Aproveita a base que já existe (bot + Syncthing). Cadastro de categorias, fila de ingestão, workers de distribuição local e upload Google Fotos, grid de downloads com seleção em lote.

**Fase 2 — Agentes de print**
Script de watcher pra cada PC, com origem fixa mapeada, integrado à mesma fila de ingestão da Fase 1.

**Fase 3 — Upload manual**
Página de drag-and-drop reaproveitando o motor de classificação já existente.

**Fase 4 — Dashboard completo**
Visão geral, por categoria, status de sync, erros/retry, reclassificação manual — consumindo o estado que os workers das fases anteriores já estão escrevendo.

---

## 8. Perguntas em aberto (a decidir antes/durante a implementação)

- [ ] Categorização no momento do pedido de download, ou só depois no grid?
- [ ] Múltiplas categorias por item — mantém 1:1 na v1 ou já desenha N:N?
- [ ] Onde os agentes de print rodam de forma persistente (serviço do SO, tarefa agendada, daemon)?
- [ ] Retenção de arquivo local após confirmação de upload no Google Fotos — mantém indefinidamente ou libera espaço automaticamente após X dias?

---

## 9. Achados da análise técnica do projeto já montado (21/09/2026)

Revisão feita em cima do setup real (`scripts/setup.sh` já rodado), `DOCUMENTACAO_TECNICA.md`, o guia de padrões do time e o `README.md` do cirqueiraX v5. Registrado aqui para não perder o levantamento — resolução fica para quando a implementação começar.

### 9.1 Conflitos entre documentos (resolvido no Tópico 40 do Roadmap)

| Conflito | Estado Inicial | Resolução Definitiva |
|---|---|---|
| Biblioteca de UI | Conflito HeroUI vs Shadcn UI | HeroUI v3 + Tailwind CSS v4 como stack oficial obrigatória de UI |
| Animação | Conflito tailwindcss-motion vs Framer Motion | `tailwindcss-motion` como padrão oficial de animação; Framer Motion opcional via `ui-extra` apenas para `AnimatePresence` |
| Gráficos | Recharts no módulo `ui-extra` | Recharts ativado (Tópico 24) como única biblioteca adicional do `ui-extra` em uso |

### 9.2 Módulos opcionais desativados no setup atual

Confirmado no log de setup: `async=0 | observability=0 | ui-extra=0`.

- **`async` (Messenger + Scheduler + Supervisor) — bloqueador real**: todo o motor de classificação e roteamento (seção 3.4) pressupõe fila assíncrona e workers. Sem o módulo ativo, download/upload/distribuição rodariam de forma síncrona no request HTTP — trava a UI e não sobrevive a restart de container no meio de um job. **Precisa ser ativado antes da Fase 1 do roadmap.**
- **`observability` (Sentry)**: recomendado dado que o pipeline depende de três integrações externas com falhas possíveis (Syncthing, Google Photos API, yt-dlp). Sem isso, only Monolog em arquivo/stderr — funcional, mas exige checagem manual.
- **`ui-extra` (Framer Motion + Recharts)**: necessário para os gráficos do dashboard (seção 3.5) e para cumprir a regra de animação do guia de padrões, caso essa regra seja mantida.

### 9.3 Lacunas de infraestrutura não cobertas por nenhum documento

- **Volume compartilhado com o Syncthing**: nenhum bind mount documentado entre o container Symfony e a pasta observada pelo Syncthing na VPS. Necessário para o worker de distribuição local (seção 3.4) conseguir escrever onde o Syncthing lê.
- **Autenticação máquina-a-máquina**: `security.yaml` documentado só cobre login humano via JWT. Os agentes de print e o serviço de ingestão do bot precisam de um mecanismo próprio (ex: token de serviço de longa duração por agente), distinto do fluxo de refresh token de 30 dias pensado para o usuário humano.
- **Rate limiter de ingestão**: o limitador `api` (60 req/min) pode bloquear rajadas de screenshots ou uploads em lote. Vale um limitador dedicado para os endpoints de ingestão dos módulos 3.1–3.3.
- **Armazenamento de credenciais OAuth multi-conta**: nenhuma estratégia definida para guardar com segurança os refresh tokens do Google Fotos de contas diferentes (PC empresa vs PC pessoal) — precisa de coluna criptografada ou tabela de segredos dedicada.

### 9.4 Ordem recomendada para destravar a implementação

1. Resolver o conflito de UI (HeroUI vs Shadcn/Framer Motion) ✅ Concluído (Tópico 40)
2. Ativar o módulo `async` (pré-requisito estrutural, não opcional para este projeto)
3. Definir autenticação dos agentes/bot (separada do JWT de usuário)
4. Adicionar volume Docker compartilhado com o Syncthing
5. Definir onde/como guardar os tokens OAuth multi-conta do Google Fotos
