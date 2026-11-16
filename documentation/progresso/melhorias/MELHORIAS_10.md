# Melhorias — M181 a M200

> Detalhamento das melhorias **M181–M200**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 181 — Endurecimento de Segurança Multi-usuário

- **Status**: Concluído
- **Data**: 15 de novembro de 2026
- **Problema**: outras pessoas (devs) vão acessar o CirqueiraX. Havia risco de ver dados de todos no painel de livros, caminho absoluto de mídia na API, Syncthing aberto a qualquer `ROLE_ADMIN`, JWT master e seed com senha fraca em produção, e refresh sem limite de tentativas.
- **Solução**:
  - Painel de livros filtra por `usuario_id`; memória/pasta global só para admin.
  - API de mídia devolve só o nome do arquivo (sem path do storage) e categoria só do dono.
  - Syncthing exige `ROLE_SUPER_ADMIN` (dono promovido; convidados ficam em `ROLE_USER`).
  - `app:jwt:master` e seed bloqueados em prod (JWT master só com `JWT_MASTER_ENABLED=1`; seed só em `dev`).
  - `--admin` em `app:usuario:criar` exige `ALLOW_ADMIN_CREATE=1` em produção.
  - Throttling no refresh JWT; cabeçalhos `X-Frame-Options: DENY`, CORP e cross-domain.
  - **Não alterado**: `POST /api/v1/youtube-music/extensao/eventos` e autenticador da extensão.
- **Arquivos**: `config/packages/security.yaml`, `src/Command/JwtMasterCommand.php`, `src/Command/AppSeedCommand.php`, `src/Command/CriarUsuarioCommand.php`, `src/Controller/Sync/SyncController.php`, `src/Serializer/MediaItemSerializer.php`, `src/Service/LivroAudio/PainelSistemaLivrosAudioService.php`, `src/Repository/LivroAudioRepository.php`, `src/Repository/LivroAudioBlocoRepository.php`, `src/Repository/LivroAudioBlocoVozRepository.php`, `src/EventListener/CabecalhosSegurancaListener.php`, `documentation/stack/AUTH.md`

---
