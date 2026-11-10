# Vários Usuários — Cada Um com as Suas Coisas

> Como o CirqueiraX separa os dados de cada pessoa que usa o sistema.

---

## Regra geral

Cada usuário logado só vê e só mexe nos próprios dados. Uma mídia, categoria ou envio de outra pessoa responde **404** (como se não existisse), inclusive em ações em lote, stream, miniatura e download.

| Área | Como fica separado |
|---|---|
| Central de mídias (prints, downloads, uploads, edições) | `media_item.usuario_id` |
| Categorias | `categoria.usuario_id` — o nome só precisa ser único dentro da conta |
| Regras de origem | `origem_regra.usuario_id` — uma regra por origem em cada conta |
| Google Fotos | `conta_google_fotos.usuario_id` — **uma conta Google por usuário** |
| Histórico de envios ao Google Fotos | `registro_envio_google_fotos.usuario_id` |
| Tokens de agente (PCs que mandam prints) | `token_agente.usuario_id` — o print entra na conta do dono do token |
| Spotify, livros, transcrições, áudios | já eram por usuário |
| Painel (dashboard) | números, últimas mídias, categorias, erros e Spotify da própria conta |
| Sincronização (Syncthing) | só para administradores (`ROLE_ADMIN`) |

Duplicados são procurados só dentro da conta: a mesma imagem enviada por duas pessoas vira dois itens, um para cada.

## Pastas no servidor

Os arquivos de cada usuário ficam em `MEDIA_STORAGE_PATH/<pasta do usuário>/<pasta da categoria>`.

- A pasta do usuário vem de `usuario.pasta_armazenamento`. Se estiver vazia (`NULL`), vale `usuarios/<username>`.
- A conta principal (`gabrielcirqueira711@gmail.com`) tem a pasta `''` (vazia), então os arquivos dela continuam exatamente onde já estavam e o Syncthing não muda nada.

## Dados que já existiam

A migração `Version20261110151341` ligou tudo o que existia à conta principal (`gabrielcirqueira711@gmail.com`): 1.513 mídias, 4 categorias, 2 regras, a conta do Google Fotos, 663 envios e 4 tokens. Ela também deu `ROLE_ADMIN` a essa conta, para continuar vendo a sincronização.

Backup feito antes: `/root/backups/cirqueirax/2026-11-10_antes-multiusuario/` e tag git `backup-antes-multiusuario-2026-11-10`.

## Adicionar uma pessoa

1. Criar o usuário (não há cadastro aberto):
   ```bash
   docker exec -it cirqueirax_symfony_prod php bin/console app:usuario:criar
   ```
2. Spotify: o app do Spotify está em modo de desenvolvimento. O e-mail da conta Spotify da pessoa precisa ser adicionado em **User Management** no painel do Spotify for Developers.
3. Google Fotos: enquanto o app OAuth do Google estiver em modo de teste, o e-mail Google da pessoa precisa estar em **Test users** na tela de consentimento. Depois ela conecta a própria conta em Configurações.
4. Categorias e regras padrão (opcional):
   ```bash
   docker exec -it cirqueirax_symfony_prod php bin/console app:seed:origem-regras --usuario=<email ou username>
   ```
5. Agente de prints (opcional), com o token já ligado à pessoa:
   ```bash
   docker exec -it cirqueirax_symfony_prod php bin/console app:agente:gerar-token "PC da Pessoa" print_pessoal --usuario=<email ou username>
   ```

## Comandos que agora pedem o dono

| Comando | Opção |
|---|---|
| `app:agente:gerar-token` | `--usuario=<email ou username>` (obrigatória) |
| `app:seed:origem-regras` | `--usuario=<email ou username>` (obrigatória) |
| `app:google-fotos:autorizar-conta` | `--usuario=<email ou username>` (obrigatória) |
| `app:google-fotos:limpar-duplicados-franky` | `--usuario=<email ou username>` (obrigatória) |

`app:media:retentar --todos` (e outros comandos de manutenção, como limpeza de vídeos) continuam valendo para o sistema inteiro.
