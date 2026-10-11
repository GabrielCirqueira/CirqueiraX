# Autenticação e Segurança (JWT & Token de Agente)

O **CirqueiraX** adota uma estratégia de autenticação dupla e totalmente *stateless*, atendendo tanto aos usuários humanos na interface web quanto aos processos clientes autônomos em segundo plano (agentes de captura de prints nas máquinas cliente).

---

## 1. Visão Geral dos Mecanismos de Autenticação

| Canal de Acesso | Mecanismo | Identificador | Destinatário | Escopo |
| :--- | :--- | :--- | :--- | :--- |
| **Interface Web (React / SPA)** | **JWT (RS256)** | `Authorization: Bearer <token>` | Usuários autenticados | Acesso total à API e Dashboard |
| **Agente de Prints (Python CLI)** | **Token de Agente** | `X-Agent-Token: cx_ag_...` | Máquinas do usuário (PC Empresa / PC Casa) | Ingestão dedicada em `/api/v1/ingestao/print` |
| **Google Photos API** | **OAuth 2.0** | Refresh Token persistido | Backend CirqueiraX | Uploads append-only e gestão de álbuns |

---

## 2. Autenticação de Usuários Web (JWT)

A autenticação web utiliza **LexikJWTAuthenticationBundle** e **GesdinetJWTRefreshTokenBundle** com assinatura assimétrica **RS256** (RSA 4096 bits com SHA-256).

### 2.1. Chaves Criptográficas (RSA)
As chaves residem no diretório protegido `config/jwt/`:
- `private.pem`: Assina os tokens de acesso emitidos pelo backend. Nunca deve ser exposta.
- `public.pem`: Valida a assinatura de tokens recebidos em cada requisição.

Para gerar novas chaves (setup inicial ou rotação):
```bash
php bin/console lexik:jwt:generate-keypair
```

### 2.2. Ciclo de Vida dos Tokens
- **Access Token (`JWT`)**: Tempo de vida curto (**1 hora**). Carrega os claims do usuário (`id`, `username`, `roles`).
- **Refresh Token**: Tempo de vida longo (**30 dias**), persistido no banco na tabela `refresh_tokens`.

### 2.3. Endpoints de Autenticação de Usuários
| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Autentica com credenciais, retornando `{ token, refresh_token }` |
| `POST` | `/api/v1/auth/registro` | Público | Cadastro de novos usuários |
| `POST` | `/api/v1/token/refresh` | Público | Emite novo access token a partir de um refresh token válido |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Retorna perfil e permissões do usuário logado |

### 2.4. Renovação Automática no Frontend (`web/config/api.ts`)
O cliente Axios possui interceptores reativos:
1. Ao receber resposta `401 Unauthorized`, pausa requisições pendentes.
2. Faz chamada silenciosa para `POST /api/v1/token/refresh`.
3. Atualiza o token no Zustand store (`useAuthStore`) e `localStorage`.
4. Re-executa as requisições que estavam pausadas.
5. Se o refresh token expirar ou for inválido, limpa o estado e redireciona para `/login`.

---

## 3. Autenticação de Agentes (`TokenAgenteAuthenticator`)

Para permitir que agentes Python rodando no Windows, Linux ou WSL enviem prints sem expor credenciais de login interativo, o sistema implementa o autenticador customizado `TokenAgenteAuthenticator`.

### 3.1. Como Funciona
- O agente envia cada print no cabeçalho HTTP:
  ```http
  X-Agent-Token: cx_ag_seu_token_aqui
  ```
- O autenticador consulta a entidade `TokenAgente` no banco:
  - Valida se o token existe e está ativo (`ativo = 1`).
  - Obtém a `origem` configurada para aquela máquina (ex: `OrigemMedia::PRINT_EMPRESA` ou `OrigemMedia::PRINT_PESSOAL`).
  - Atualiza o carimbo de data/hora do último uso (`ultimo_uso_em`).
  - Injeta a identidade e origem do agente no contexto da requisição.

### 3.2. Como Emitir Tokens para Máquinas
No terminal do backend (via Makefile):

```bash
# Emitir token para a máquina corporativa
make agente-token ARGS="\"PC Empresa\" print_empresa"

# Emitir token para o computador pessoal
make agente-token ARGS="\"PC Pessoal\" print_pessoal"
```

A chave gerada (`cx_ag_...`) é salva no `.env` do respectivo agente (`AGENT_TOKEN`).

---

## 4. Rate Limiting e Proteção contra Abuso

O sistema utiliza o componente **Symfony Rate Limiter** configurado em `config/packages/rate_limiter.yaml`:
- **Login Web**: Limite estrito de **5 tentativas por minuto** por IP, mitigando ataques de força bruta.
- **Ingestão de Prints**: Limite generoso de **300 requisições por minuto** por token de agente, permitindo envios rápidos em sequência sem interrupção.

---

## 5. Resumo de Segurança e Parâmetros

| Parâmetro | Valor |
| :--- | :--- |
| **Assinatura JWT** | RS256 (RSA assimétrico) |
| **Validade Access Token** | 3600 segundos (1 hora) |
| **Validade Refresh Token** | 2.592.000 segundos (30 dias) |
| **Hashing de Senhas** | `auto` (Argon2id ou Bcrypt com salt nativo) |
| **Formato de Token de Agente** | Chave opaca prefixada `cx_ag_` (SHA-256) |
| **Políticas de CORS** | Restrito a domínios autorizados via `nelmio_cors.yaml` |
