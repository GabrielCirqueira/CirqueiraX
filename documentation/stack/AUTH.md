# Autenticação e Segurança

O CirqueiraX usa autenticação sem sessão no servidor, com mecanismos diferentes para pessoas, agentes e Google Fotos.

---

## 1. Mecanismos

| Canal | Mecanismo | Credencial | Escopo |
| :--- | :--- | :--- | :--- |
| Interface web | JWT RS256 | `Authorization: Bearer <token>` | API completa |
| Stream, thumbnail e áudio | JWT na query | `?token=<token>` | Recursos abertos por tags de mídia |
| Agente de prints | Token de agente | `X-Agent-Token: cx_ag_...` | `POST /api/v1/ingestao/print` |
| Extensão do YouTube Music | Token por aparelho | `X-Extensao-Token: cxyt_...` | `POST /api/v1/youtube-music/extensao/eventos` |
| Administração | JWT master | Gerado por `app:jwt:master` | Uso em linha de comando |
| Google Fotos | OAuth 2.0 | Tokens em `ContaGoogleFotos` | Backup e álbuns |
| Spotify | OAuth 2.0 PKCE | Tokens em `ContaSpotify` | Histórico de reproduções e perfil |
| YouTube Music | Cabeçalhos da sessão do navegador | Cookie criptografado em `ContaYoutubeMusic` (`CriptografiaInterface`), só via entrada padrão para `bin/ytmusic.py` | Histórico do YouTube Music |

---

## 2. Usuários

Não há cadastro público. Contas são criadas:

1. Pela tela **Usuários** (`/usuarios`), só `ROLE_ADMIN` — define senha e permissões por funcionalidade.
2. Ou pelo CLI:

```bash
php bin/console app:usuario:criar
```

O provider de segurança é uma `chain`, com a entidade `Usuario` e o usuário em memória `master-cli`, usado por `app:jwt:master`. Em produção o comando `app:jwt:master` fica bloqueado a menos que `JWT_MASTER_ENABLED=1`. Contas de convidados devem nascer só com `ROLE_USER` (`--admin` em prod exige `ALLOW_ADMIN_CREATE=1`). Syncthing (`/api/v1/sync`) exige `ROLE_SUPER_ADMIN`.

Cada usuário comum tem `usuario.permissoes` (JSON de códigos de `FuncionalidadeSistema`). Administrador ignora a lista. Detalhes em [PERMISSOES.md](../funcionalidades/PERMISSOES.md).

### Login

O firewall `json_login` lê os campos `username` e `senha`. As rotas `api_auth_login` (`POST /api/v1/auth/login`) e `api_token_refresh` (`POST /api/v1/token/refresh`) estão em `config/routes.yaml` (sem controller): o firewall intercepta. O catch-all da SPA usa `reactRouting: "^(?!api(?:/|$)).+"` e **não** pode engolir `/api/*` — sem as rotas explícitas de login/refresh, a API devolve 404.

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

As chaves ficam em `config/jwt/`. `private.pem` nunca deve ser exposta. Em produção a pasta é o volume `jwt_prod`, para as chaves sobreviverem aos deploys. Antes elas eram geradas de novo a cada container novo (`devops/bootstrap.sh`), o que invalidava todos os access tokens a cada deploy.

```bash
php bin/console lexik:jwt:generate-keypair
```

### Endpoints

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Autentica e devolve os tokens |
| `POST` | `/api/v1/token/refresh` | Público | Renova o access token |
| `GET` | `/api/v1/auth/me` | JWT | Dados do usuário (`administrador`, `roles`, `permissoes`) |
| `PUT`/`PATCH` | `/api/v1/auth/me` | JWT | Atualiza nome e e-mail |
| `PUT`/`PATCH` | `/api/v1/auth/me/senha` | JWT | Troca a própria senha |
| `GET` | `/api/v1/health` | Público | Saúde da aplicação |
| `GET`/`POST`/`PUT` | `/api/v1/usuarios*` | `ROLE_ADMIN` | Gerenciar contas e permissões |

Demais rotas em `/api` exigem autenticação; além disso, `ResolverPermissaoPorRotaService` e `#[RequerPermissao]` restringem por funcionalidade.

### Renovação no frontend

O interceptor em `web/config/api.ts`:

1. Recebe a resposta `401`.
2. Chama `POST /api/v1/token/refresh`.
3. Atualiza o token.
4. Refaz as requisições pendentes.
5. Se o refresh for recusado (4xx), limpa a sessão e volta para o login, guardando a página atual em `state.voltarPara` (`RotaProtegida`); depois do login, `destinoAposLogin` (`web/features/auth/utils.ts`) volta para ela. Falha de rede, 429 ou 5xx mantêm a sessão.

O estado fica em `useAuthStore` (Zustand persistido), com `administrador`, `roles` e `permissoes`. Rotas de módulo passam por `RotaComPermissao`.

---

## 3. Agentes

`TokenAgenteAuthenticator` lê `X-Agent-Token`, calcula o SHA-256 e procura o registro em `TokenAgente`. Só tokens ativos passam. A origem vem desse registro, e a rota de ingestão exige `ROLE_AGENTE`.

```bash
make agente-token ARGS="\"PC Empresa\" print_empresa"
make agente-token ARGS="\"PC Pessoal\" print_pessoal"
```

A chave em texto aberto aparece só na geração. No banco fica apenas o hash.

### Extensão do YouTube Music

`TokenExtensaoYoutubeMusicAuthenticator` só atua em `POST /api/v1/youtube-music/extensao/eventos`: lê `X-Extensao-Token`, calcula o SHA-256 e procura um registro ativo em `TokenExtensaoYoutubeMusic`. O usuário autenticado é `ExtensaoYoutubeMusicUser` (`ROLE_EXTENSAO_YOUTUBE_MUSIC`), que carrega o token e o dono; a rota exige esse papel, então o JWT normal recebe 403 nela e o token da extensão recebe 401 em qualquer outra rota. O próprio usuário gera (até 5 ativos) e revoga os tokens no cartão do YouTube Music. Detalhes na seção 18 de [YOUTUBE_MUSIC.md](../funcionalidades/YOUTUBE_MUSIC.md).

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
| Permissões de tela | `usuario.permissoes` + `ROLE_ADMIN` bypass |
