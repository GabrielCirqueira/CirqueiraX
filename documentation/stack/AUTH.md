# Autenticação e Segurança

O CirqueiraX usa autenticação sem sessão no servidor, com mecanismos diferentes para pessoas, agentes e Google Fotos.

---

## 1. Mecanismos

| Canal | Mecanismo | Credencial | Escopo |
| :--- | :--- | :--- | :--- |
| Interface web | JWT RS256 | `Authorization: Bearer <token>` | API completa |
| Stream, thumbnail e áudio | JWT na query | `?token=<token>` | Recursos abertos por tags de mídia |
| Agente de prints | Token de agente | `X-Agent-Token: cx_ag_...` | `POST /api/v1/ingestao/print` |
| Administração | JWT master | Gerado por `app:jwt:master` | Uso em linha de comando |
| Google Fotos | OAuth 2.0 | Tokens em `ContaGoogleFotos` | Backup e álbuns |
| Spotify | OAuth 2.0 PKCE | Tokens em `ContaSpotify` | Histórico de reproduções e perfil |

---

## 2. Usuários

Não existe cadastro pela API nem pela interface. Os usuários são criados no terminal:

```bash
php bin/console app:usuario:criar
```

O provider de segurança é uma `chain`, com a entidade `Usuario` e o usuário em memória `master-cli`, usado por `app:jwt:master`.

### Login

O firewall `json_login` lê os campos `username` e `senha`.

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "username": "...", "senha": "..." }
```

### Tokens

| Token | Duração | Observação |
| :--- | :--- | :--- |
| Access token (JWT) | `JWT_TTL`, padrão de 1 hora | Assinado com chave RSA |
| Refresh token | 30 dias | Persistido no banco, com `ttl_update: true`, que renova o prazo a cada uso |

As chaves ficam em `config/jwt/`. `private.pem` nunca deve ser exposta.

```bash
php bin/console lexik:jwt:generate-keypair
```

### Endpoints

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Autentica e devolve os tokens |
| `POST` | `/api/v1/token/refresh` | Público | Renova o access token |
| `GET` | `/api/v1/auth/me` | JWT | Dados do usuário logado |
| `GET` | `/api/v1/health` | Público | Saúde da aplicação |

Todas as demais rotas em `/api` exigem `IS_AUTHENTICATED_FULLY`.

### Renovação no frontend

O interceptor em `web/config/api.ts`:

1. Recebe a resposta `401`.
2. Chama `POST /api/v1/token/refresh`.
3. Atualiza o token.
4. Refaz as requisições pendentes.
5. Se o refresh for recusado (4xx), limpa a sessão e volta para o login. Falha de rede, 429 ou 5xx mantêm a sessão, para o app continuar funcionando sem internet.

O estado fica em `useAuthStore`, com Zustand persistido. Como o token também é usado em URLs de mídia, ele aparece nessas requisições e pode constar em logs de acesso.

---

## 3. Agentes

`TokenAgenteAuthenticator` lê `X-Agent-Token`, calcula o SHA-256 e procura o registro em `TokenAgente`. Só tokens ativos passam. A origem vem desse registro, e a rota de ingestão exige `ROLE_AGENTE`.

```bash
make agente-token ARGS="\"PC Empresa\" print_empresa"
make agente-token ARGS="\"PC Pessoal\" print_pessoal"
```

A chave em texto aberto aparece só na geração. No banco fica apenas o hash.

---

## 4. Limites de requisições

Definidos em `config/packages/rate_limiter.yaml`, com política `token_bucket`:

| Limitador | Limite | Aplicação |
| :--- | :--- | :--- |
| `login_throttling` | 5 por minuto | Login |
| `api_standard` | 60 por minuto | Definido na configuração, mas nenhum código o consome hoje |
| `ingestao` | 300 por minuto | `IngestaoRateLimiterListener`, por token ou IP |

Ao estourar `ingestao`, a resposta é `429` com o cabeçalho `Retry-After`.

---

## 5. Resumo

| Parâmetro | Valor |
| :--- | :--- |
| Assinatura JWT | RS256 |
| Access token | `JWT_TTL` |
| Refresh token | 30 dias, renovável |
| Token de agente | Chave `cx_ag_`, armazenada em SHA-256 |
| CORS | `config/packages/nelmio_cors.yaml` |
