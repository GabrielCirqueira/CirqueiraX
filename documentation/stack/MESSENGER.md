# Processamento Assíncrono (Messenger e Scheduler)

O **Symfony Messenger** roda a classificação, a distribuição, o envio ao Google Fotos, o download de áudio, o rebaixar em lote e as rotinas de limpeza.

Duas operações continuam síncronas: `POST /api/v1/downloads` e o rebaixar individual. Elas rodam dentro da requisição e, depois, entregam o restante do trabalho às filas.

---

## 1. Infraestrutura

- **Transporte:** Doctrine, na tabela `messenger_messages`.
- **Filas:** `async` e `failed`.
- **Novas tentativas:** `max_retries: 3`, `multiplier: 2`.
- **Roteamento:** `'App\Message\*': async`.

### Processos

| Processo | Comando | Instâncias |
| :--- | :--- | :--- |
| `messenger` | `messenger:consume async --time-limit=3600 --memory-limit=128M` | 2 |
| `scheduler` | `messenger:consume scheduler_default` | 1 |

Configurados em `devops/supervisord.conf` (desenvolvimento) e `devops/php/supervisord-prod.conf` (produção).

---

## 2. Pipeline

```
[ Print, upload, edição ou download ]
                 │
          IngestarMediaService
                 │
       ClassificarMediaMessage
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
Com OrigemRegra         Sem regra: sem_categoria
    │                         │
    │                 Usuário escolhe a categoria
    ▼                         │
ClassificarMediaItemService ◄─┘
    │
    ├──► DistribuirLocalMessage ──► cópia para a pasta da categoria
    └──► EnviarGoogleFotosMessage ──► envio ao álbum
```

---

## 3. Mensagens

| Mensagem | Origem | Ação |
| :--- | :--- | :--- |
| `ClassificarMediaMessage` | Ingestão | Aplica `OrigemRegra` ou marca `sem_categoria` |
| `DistribuirLocalMessage` | Classificação | Copia para `{storage}/{pastaLocal}`, reaplica metadados e marca `distribuido_local` |
| `EnviarGoogleFotosMessage` | Classificação, retentativa, reenvio | Envia ou reaproveita a mídia no álbum |
| `BaixarAudioMessage` | `POST /api/v1/audios` | Gera o MP3 |
| `RebaixarMediaItemMessage` | Rebaixar em lote | Baixa de novo um vídeo |
| `LimparVideosAntigosMessage` | Scheduler | Remove vídeos com mais de 7 dias |
| `ExpirarAudiosAntigosMessage` | Scheduler | Expira MP3 e encerra áudios presos |
| `BaixarVideoMessage` | Nenhuma no momento | Tem handler, mas a aplicação não a despacha |

---

## 4. Agendamento

`src/Schedule.php` registra as rotinas:

```php
RecurringMessage::every('1 day', new LimparVideosAntigosMessage(7)),
RecurringMessage::every('1 day', new ExpirarAudiosAntigosMessage()),
```

O schedule é `stateful` e usa `processOnlyLastMissedRun(true)`. Veja [RETENCAO_E_LIMPEZA.md](../funcionalidades/RETENCAO_E_LIMPEZA.md).

---

## 5. Falhas

1. O Messenger tenta de novo até 3 vezes, com espera crescente.
2. Mensagens esgotadas vão para a fila `failed`.
3. O motivo da falha fica em `erroMotivo` e o item vai para `erro`.
4. A interface permite retentar por `POST /api/v1/media-itens/{uuid}/retentar`, `POST /api/v1/media-itens/retentar` ou `POST /api/v1/dashboard/erros/retentar`.

A retentativa decide o próximo passo pela categoria:

- **Com categoria:** volta para `classificado` e dispara distribuição e envio.
- **Sem categoria:** volta para `recebido` e passa pela classificação.

---

## 6. Comandos

```bash
# Consumir manualmente
docker exec -it cirqueirax_symfony php bin/console messenger:consume async -vv

# Ver mensagens com falha
docker exec -it cirqueirax_symfony php bin/console messenger:failed:show

# Reprocessar todas
docker exec -it cirqueirax_symfony php bin/console messenger:failed:retry --force

# Remover uma mensagem da fila de falhas
docker exec -it cirqueirax_symfony php bin/console messenger:failed:remove <id>
```

Em produção, use o container `cirqueirax_symfony_prod`.
