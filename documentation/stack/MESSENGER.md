# Processamento Assíncrono e Mensageria (Symfony Messenger)

O **CirqueiraX** utiliza o **Symfony Messenger** como espinha dorsal assíncrona para todo o pipeline de processamento de mídia. Nenhuma operação pesada ou propensa a latência de rede externa (downloads de vídeo via yt-dlp, classificação, distribuição no sistema de arquivos, cópia do Syncthing ou upload para o Google Fotos) bloqueia as requisições HTTP da API.

---

## 1. Visão Geral e Infraestrutura

- **Transporte**: `doctrine` gerenciado pelo MySQL na tabela `messenger_messages`. Não requer Redis nem RabbitMQ para operação padrão.
- **Gerenciador de Processos**: `supervisord` rodando dentro do container `cirqueirax_symfony`, mantendo o worker ativo 24/7 com reinício automático em caso de falhas ou consumo de memória.
- **Configuração no Supervisor**: Gerenciado em [`devops/supervisord.conf`](file:///home/gabriel/dev/CirqueiraX/devops/supervisord.conf) através do comando:
  ```bash
  php bin/console messenger:consume async --time-limit=3600 --memory-limit=256M
  ```
- **Roteamento de Mensagens**: Mapeado em `config/packages/messenger.yaml`:
  - `App\Message\BaixarVideoMessage` ──► `async`
  - `App\Message\ClassificarMediaMessage` ──► `async`
  - `App\Message\DistribuirLocalMessage` ──► `async`
  - `App\Message\EnviarGoogleFotosMessage` ──► `async`

---

## 2. Pipeline Completo de Mensagens e Fluxo de Execução

```
                    [ API / Web / Agente ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    [ Download de Vídeo ]             [ Ingestão de Print / Upload ]
               │                               │
        BaixarVideoMessage                     │
               │                               │
               ▼                               ▼
    BaixarVideoMessageHandler          ClassificarMediaMessage
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
                  ClassificarMediaMessageHandler
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
     DistribuirLocalMessage          EnviarGoogleFotosMessage
               │                               │
               ▼                               ▼
  DistribuirLocalMessageHandler     EnviarGoogleFotosMessageHandler
               │                               │
       (Salva no storage físico)        (Upload no Google Fotos)
```

---

## 3. Catálogo de Mensagens do CirqueiraX

### 3.1. `BaixarVideoMessage`
- **Origem**: Disparada por `POST /api/v1/downloads` na UI web de downloads.
- **Payload**: `url`, `origem` (ex: `OrigemMedia::DOWNLOAD`), `categoriaId` (opcional).
- **Handler**: [`BaixarVideoMessageHandler`](file:///home/gabriel/dev/CirqueiraX/src/MessageHandler/BaixarVideoMessageHandler.php).
- **Ação**: Executa `BaixarVideoService`, que extrai metadados com `yt-dlp`, faz download para `var/storage/downloads/`, ingesta o `MediaItem` e, se uma categoria foi pré-selecionada, classifica e engatilha o próximo passo.

### 3.2. `ClassificarMediaMessage`
- **Origem**: Disparada após a ingestão de qualquer mídia (prints, uploads manuais, downloads).
- **Payload**: `mediaItemUuid`.
- **Handler**: [`ClassificarMediaMessageHandler`](file:///home/gabriel/dev/CirqueiraX/src/MessageHandler/ClassificarMediaMessageHandler.php).
- **Ação**:
  1. Verifica se a origem da mídia possui uma `OrigemRegra` cadastrada (ex: `print_empresa` ou `print_pessoal` vinculadas à categoria `Prints`).
  2. Se houver regra automática, atribui a categoria, transiciona o status para `classificado` e despacha em paralelo:
     - `DistribuirLocalMessage` (cópia física no disco).
     - `EnviarGoogleFotosMessage` (upload para o álbum na nuvem).
  3. Se não houver regra automática (ex: vídeo genérico), marca como `sem_categoria` para aguardar triagem do usuário na interface web.

### 3.3. `DistribuirLocalMessage`
- **Origem**: Disparada após classificação (automática ou manual).
- **Payload**: `mediaItemUuid`.
- **Handler**: [`DistribuirLocalMessageHandler`](file:///home/gabriel/dev/CirqueiraX/src/MessageHandler/DistribuirLocalMessageHandler.php).
- **Ação**: Executa `DistribuirLocalService`. Localiza a pasta física da categoria (`pastaLocal()`), cria os diretórios recursivamente (`mkdir -p` com permissões `0775`), copia o arquivo da pasta temporária/download para a subpasta final no storage do Syncthing (`sync_media/<pasta>/<arquivo>`) e atualiza o status para `distribuido_local`.

### 3.4. `EnviarGoogleFotosMessage`
- **Origem**: Disparada após classificação quando a categoria possui álbum associado.
- **Payload**: `mediaItemUuid`.
- **Handler**: [`EnviarGoogleFotosMessageHandler`](file:///home/gabriel/dev/CirqueiraX/src/MessageHandler/EnviarGoogleFotosMessageHandler.php).
- **Ação**: Executa `EnviarGoogleFotosService`. Lê os bytes do arquivo em disco, sobe para o endpoint de upload em chunks da Google Photos API, anexa a nova mídia ao álbum configurado na categoria e atualiza o status para `concluido`.

---

## 4. Retentativa de Falhas e Resiliência

1. **Dead Letter Queue (Failed)**:
   Mensagens que esgotam o número de retentativas do Messenger são enviadas para a fila `failed`.
2. **Registro de Motivo de Erro no Domínio**:
   Quando qualquer handler falha, o erro é capturado, persistido no campo `erro_motivo` do `MediaItem` e o status é transicionado para `StatusMediaItem::ERRO`.
3. **Reprocessamento Direto via API/Dashboard**:
   A interface web conta com botões de retentativa individual e em lote:
   - `POST /api/v1/media-itens/{uuid}/retentar`
   - `POST /api/v1/media-itens/retentar`
   Os endpoints reinjetam o item na fila correta dependendo da etapa onde ocorreu a falha.

---

## 5. Comandos Úteis do Console

```bash
# Monitorar fila no container PHP
docker exec -it cirqueirax_symfony php bin/console messenger:consume async -vv

# Listar mensagens que falharam
docker exec -it cirqueirax_symfony php bin/console messenger:failed:show

# Reprocessar todas as mensagens que falharam
docker exec -it cirqueirax_symfony php bin/console messenger:failed:retry --all

# Descartar mensagens da fila de falha
docker exec -it cirqueirax_symfony php bin/console messenger:failed:reject
```
