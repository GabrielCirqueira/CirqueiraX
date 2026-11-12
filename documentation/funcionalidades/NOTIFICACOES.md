# Notificações de atualização

Avisos do que mudou no sistema. Cada usuário tem as suas notificações; ao entrar ou depois de uma atualização, as novas aparecem num popup.

## Como funciona

| Parte | Comportamento |
| :--- | :--- |
| Popup | Abre sozinho quando há notificações não lidas. Fechar (X, fora da janela ou Esc) ou clicar em **Ler tudo** marca como lidas as notificações exibidas |
| Sino no topo | Mostra a quantidade de não lidas e abre o histórico completo (últimas 50, lidas e não lidas). **Marcar todas como lidas** zera o contador |
| Verificação | O frontend consulta as não lidas a cada 60 s e ao voltar para a aba, então uma notificação criada depois de um deploy aparece sem recarregar a página |
| Tipos | `melhoria`, `correcao`, `novidade`, `aviso` |

## Cadastro

Feito pelo command, ao terminar uma tarefa ou melhoria:

```bash
php bin/console app:notificacao:criar \
  --tipo=melhoria \
  --titulo="Título curto" \
  --mensagem="O que mudou, em linguagem simples"
```

- Sem `--usuario`, cria uma notificação para cada usuário. Com `--usuario=<id>`, só para ele.
- Título com até 160 caracteres; a mensagem aceita quebras de linha.
- Em produção: `docker exec cirqueirax_symfony_prod php bin/console app:notificacao:criar ...`.

## API

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/notificacoes?naoLidas=1&limite=50` | Lista do usuário logado (mais recentes primeiro) e total de não lidas |
| `POST` | `/api/v1/notificacoes/marcar-lidas` | Corpo `{"uuids": [...]}`; lista vazia marca todas |

## Dados

Tabela `notificacao`: `uuid`, `usuario_id` (cascade), `tipo`, `titulo`, `mensagem`, `lida_em`, `criado_em`. Índices por usuário + criação e usuário + leitura. Cada usuário só vê e marca as próprias.

## Código

- Backend: `Notificacao`, `NotificacaoRepository`, `Service/Notificacao/*`, `NotificacaoController`, `NotificacaoSerializer`, `CriarNotificacaoCommand`.
- Frontend: `web/features/notificacoes` (`PopupNotificacoesNovas` no `MainLayout`, `BotaoNotificacoes` no `Header`).
