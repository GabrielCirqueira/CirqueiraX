# Permissões por Funcionalidade

> Controle de acesso às telas e APIs do CirqueiraX por usuário.

---

## Papéis

| Papel | Quem | Acesso |
|---|---|---|
| Administrador (`ROLE_ADMIN`) | Conta principal e quem for promovido | Todas as funcionalidades, inclusive gerenciar usuários |
| Usuário | Demais contas | Somente as funcionalidades marcadas em `usuario.permissoes` |

Administrador ignora a lista JSON: o backend e o frontend tratam como acesso total.

## Funcionalidades

| Código | Tela |
|---|---|
| `dashboard` | `/dashboard` |
| `musica` | `/musica` |
| `central_midias` | `/central-midias` |
| `downloads_video` | `/downloads` |
| `downloads_audio` | `/downloads-mp3` |
| `livros_audio` | `/livros-audio` |
| `transcricoes` | `/transcricoes` |
| `prints` | `/prints` |
| `editor_imagem` | `/editor-imagem` |
| `extrair_texto` | `/extrair-texto` |
| `upload_manual` | `/upload-manual` |
| `google_fotos` | `/google-fotos` |
| `gerenciar_usuarios` | `/usuarios` (API exige `ROLE_ADMIN`) |

## Onde vive

- Coluna JSON `usuario.permissoes`
- Enum `App\Enum\FuncionalidadeSistema`
- Attribute `#[RequerPermissao]` + listeners de rota/API
- Tela `/usuarios` (somente administrador)
- `/api/v1/auth/me` devolve `administrador` e `permissoes`

## Conta principal

`gabrielcirqueira711@gmail.com` é promovida a administrador pela migration e pelo comando:

```bash
docker exec -it cirqueirax_symfony_prod php bin/console app:usuario:garantir-administrador
```

## Como o front decide

- Login e `/api/v1/auth/me` gravam `administrador`, `roles` e `permissoes` no `auth-storage`.
- `RotaComPermissao` bloqueia rota sem permissão.
- A sidebar filtra o menu; administrador vê todos os itens (incluindo Usuários).
- No banco, admin pode ter `permissoes: []` — o acesso total vem do `ROLE_ADMIN`.

## API

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/v1/usuarios` | `ROLE_ADMIN` |
| POST | `/api/v1/usuarios` | `ROLE_ADMIN` |
| GET/PUT | `/api/v1/usuarios/{id}` | `ROLE_ADMIN` |
| GET | `/api/v1/auth/me` | autenticado |

A rota catch-all do React em `config/routes.yaml` **não** pode engolir `/api/*` (requirement `^(?!api(?:/|$)).+`).
