# Guia de Deploy e Operação em Produção — CirqueiraX

Este documento descreve detalhadamente a arquitetura de produção, o passo a passo executado no deploy do **CirqueiraX** na VPS, as regras de segurança e o fluxo de atualizações contínuas.

> [!NOTE]
> Este documento foi elaborado para versionamento público seguro: **nenhum endereço IP de infraestrutura, senha, chave privada ou segredo sensível** está exposto aqui. Marcadores genéricos (`<IP_DA_VPS>`, `<SEU_DOMINIO>`, etc.) são utilizados para ilustrar comandos operacionais.

---

## 1. Visão Geral da Arquitetura em Produção

A topologia em produção adota o padrão de isolamento em contêineres Docker gerenciados por proxy reverso no host:

```text
[ Cliente / Internet ]
         │ (HTTPS / 443 - TLS Let's Encrypt)
         ▼
[ Nginx do Host ]  <─── Roteia x.<seu-dominio> para 127.0.0.1:<PORTA_INTERNA>
         │ (HTTP Proxy Reverso)
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Docker Compose (cirqueirax-prod)                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Container App (cirqueirax_symfony_prod)               │  │
│  │                                                       │  │
│  │  - Nginx Interno (porta 80)                           │  │
│  │  - PHP-FPM 8.4 (Alpine)                              │  │
│  │  - Supervisord:                                       │  │
│  │      * Processos PHP-FPM & Nginx                      │  │
│  │      * Messenger Workers (async - 2 workers)          │  │
│  │      * Symfony Scheduler (scheduler_default)          │  │
│  │  - Ferramentas: yt-dlp, ffmpeg, python3               │  │
│  │                                                       │  │
│  │  Volumes montados:                                    │  │
│  │   • /var/www/html/var/storage (Mídias do Host)        │  │
│  │   • thumbnails_prod (Cache persistente de capas)      │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ (Rede interna Docker: app_net) │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │ Container Banco de Dados (cirqueirax_database_prod)   │  │
│  │                                                       │  │
│  │  - MySQL 8.3                                          │  │
│  │  - Volume persistente: db_data_prod                   │  │
│  │  - Não exposto publicamente na internet               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
         │ (Bind mount para armazenamento fora do Git)
         ▼
[ Host VPS: /<caminho_base>/cirqueirax/sync_media/ ]
         ▲
         │ (TLS / fsWatcher em tempo real)
[ Syncthing Daemon (Host) ]
         ├── Celular (Android via Syncthing-Fork)
         └── Computador Pessoal
```

---

## 2. Ajustes Cruciais Realizados na Stack de Produção

Durante a homologação do deploy, foram identificados e aplicados pontos vitais de resiliência:

### 2.1. Inclusão de Ferramentas de Mídia (`Dockerfile.prod`)
Para que o download automatizado de vídeos sociais (TikTok, Twitter/X, Instagram, YouTube) e a extração sob demanda de capas funcionem no container final de produção, foram incorporados os pacotes necessários na imagem Alpine:
- `python3`, `yt-dlp` e `ffmpeg`.

### 2.2. Persistência do Cache de Miniaturas (`docker-compose.prod.yaml`)
O endpoint `/api/v1/media-itens/{uuid}/thumbnail` grava miniaturas processadas em `var/cache/thumbnails/`. Para evitar que recreações de container (`docker compose up -d --force-recreate`) descartassem as capas em cache, foi criado o volume nomeado:
- `thumbnails_prod:/var/www/html/var/cache/thumbnails`.

### 2.3. Isolamento da Pasta de Sincronização (`MEDIA_STORAGE_PATH`)
Seguindo o design de desacoplamento, os arquivos binários de mídia residem **fora do repositório Git**:
- **Caminho no Host:** `/<caminho_base>/cirqueirax/sync_media`
- **Mapeamento no Container:** `/var/www/html/var/storage`

---

## 3. Estratégia de Segredos e Compatibilidade de Criptografia

Um dos pontos mais críticos do deploy foi a garantia de compatibilidade dos tokens de terceiros (Google Fotos):

1. **Chave Mestra de Criptografia (`APP_SECRET`)**:
   - Os tokens de refresh do Google Fotos gravados na tabela `conta_google_fotos` são criptografados com `sodium_crypto_secretbox` cuja chave derivada utiliza `APP_SECRET`.
   - O valor de `APP_SECRET` no `.env` da VPS foi mantido exatamente idêntico ao ambiente onde a autorização foi gerada, permitindo que o CirqueiraX em produção sincronize com o Google Fotos imediatamente sem necessidade de reautorização.
2. **Isolamento de Credenciais**:
   - O arquivo `.env` de produção permanece com permissões restritas (`600`) e devidamente ignorado no `.gitignore`.
   - As senhas de banco (`MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`) e o segredo do JWT (`JWT_PASSPHRASE`) foram gerados aleatoriamente em produção com alta entropia.
3. **Variáveis Operacionais de Bundles**:
   - A variável `SENTRY_DSN` foi definida vazia por padrão para atender à exigência de configuração do pacote Symfony sem gerar logs desnecessários caso o monitoramento externo não esteja ativo.

---

## 4. Migração e Transferência Segura de Dados

Para transportar os dados sem expor nada publicamente e sem commitar arquivos sensíveis no Git:

### 4.1. Banco de Dados (MySQL Dump)
1. Foi extraído um dump local consistente:
   ```bash
   docker exec <container_db_local> sh -c \
     'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --no-tablespaces <banco>' \
     | gzip > /tmp/dump_seguro.sql.gz
   ```
2. O arquivo foi enviado à VPS diretamente via canal criptografado SSH (`scp`).
3. Com os workers temporariamente pausados, o dump foi descompactado diretamente no container MySQL da VPS.
4. Após a validação da integridade de todas as tabelas (mídias ativas, histórico de vídeos da Franky com status `arquivo_removido`, categorias, tokens e usuários), o dump temporário foi destruído de forma segura (`shred -u`).

### 4.2. Mídias Físicas e Cache de Miniaturas
1. As mídias presentes no armazenamento de sincronização foram transferidas via `rsync` através do túnel SSH, preservando a árvore de diretórios:
   - `prints/`
   - `videos/memes/`
   - `videos/shingeki/`
   - `videos/onepiece/`
2. O acervo de thumbnails em cache pré-geradas foi transferido e montado no volume `thumbnails_prod`, com permissões ajustadas para o usuário de execução do PHP-FPM (`www-data` / UID 82).

---

## 5. Integração com o Syncthing na VPS

Para integrar a VPS ao fluxo de sincronização contínua com o celular (Syncthing-Fork) e o computador pessoal:

1. **Configuração da Pasta Compartilhada**:
   - **ID da Pasta:** `cirqueirax-media`
   - **Rótulo:** `CirqueiraX - Mídias`
   - **Caminho Físico na VPS:** `/<caminho_base>/cirqueirax/sync_media`
   - **Marcador:** `.stfolder`
2. **Regras de Sincronização**:
   - `ignorePerms="true"` (essencial para compatibilidade com os sistemas de arquivos móveis do Android).
   - `fsWatcherEnabled="true"` com intervalo de 10 segundos para replicação quase em tempo real de novos prints e vídeos ingeridos.
   - `.stignore` presente na raiz para evitar a sincronização de pastas de trabalho temporárias (`downloads/`).
3. **Dispositivos Pareados**:
   - A pasta foi compartilhada simultaneamente com o **Celular** e o **Computador Pessoal**.

---

## 6. Servidor Web (Nginx Host) e Certificados SSL

O host da VPS atua como ponto de terminação TLS e proxy reverso para o domínio:

1. **Virtual Host Nginx (`/etc/nginx/sites-available/<dominio>`)**:
   - Regra dedicada para `/build/` com headers de cache imutável (`Cache-Control: public, immutable`, `expires 1y`).
   - Rota `/api/v1/health` sem poluição de access log para monitoramento de saúde.
   - Proxy reverso com suporte a WebSockets/SSE (`Upgrade` e `Connection "upgrade"`), buffers ampliados (16x 16k) e limite de corpo estendido para uploads de vídeo:
     ```nginx
     client_max_body_size 500M;
     ```
2. **Certificado Let's Encrypt**:
   - Emitido via Certbot com o plugin oficial do Nginx.
   - Redirecionamento permanente automático de HTTP (`porta 80`) para HTTPS (`porta 443`).
   - Renovação automatizada gerenciada pelo timer do Certbot no systemd.

---

## 7. Automação e Rotinas Agendadas (Cron)

Para garantir que a VPS mantenha espaço livre em disco de forma perene sem intervenção humana:

- **Expurgo Semanal de Vídeos Antigos (Melhoria 49)**:
  - Adicionado agendamento na crontab do host da VPS:
    ```cron
    0 3 * * 0 docker exec cirqueirax_symfony_prod php /var/www/html/bin/console app:media:limpar-videos-antigos --dias=7 --no-interaction >> /var/log/cirqueirax_limpar_videos.log 2>&1
    ```
  - Executa todo domingo às 03:00. Remove os binários de vídeo do disco da VPS que ultrapassaram o período de retenção, alterando seu status para `arquivo_removido`. O registro, metadados e thumbnail continuam preservados no banco e na interface web, permitindo que o vídeo seja "Rebaixado" com um clique quando necessário.
  - As capturas de tela da pasta `prints/` **nunca** são expurgadas.

---

## 8. Fluxo de Atualização Contínua (Deploy Incremental)

Após o deploy inicial, levar novas versões e commits para a produção é feito através do script de atualização simplificado:

### Como Atualizar na VPS

1. Conecte-se na VPS via SSH:
   ```bash
   ssh usuario@<IP_DA_VPS>
   ```
2. Acesse a pasta do projeto:
   ```bash
   cd /var/www/CirqueiraX
   ```
3. Execute o script de atualização:
   ```bash
   bash scripts/update.sh
   ```

### O Que o `update.sh` Executa Automaticamente:
1. **Pull do Git**: Baixa os novos commits da branch `main`.
2. **Detecção Inteligente de Frontend**: Se houver mudanças em `web/`, `package.json`, Vite ou CSS, compila os assets via container Node 20 temporário (`npm run build`). Se não houver mudanças de frontend, pula esta etapa para economizar tempo e memória.
3. **Detecção de Dependências Backend**: Se houver mudanças em `composer.json`, `Dockerfile` ou configs do PHP, reconstrói a imagem Docker. Caso contrário, reaproveita a imagem atual.
4. **Reativação Graciosa**: Reinicia o container da aplicação com healthcheck automático. Em caso de falha de inicialização, aciona rollback automático para a imagem anterior.
5. **Limpeza**: Executa `docker image prune` para liberar espaço de camadas antigas.

---

## 9. Comandos Úteis de Manutenção na VPS

| Finalidade | Comando |
| :--- | :--- |
| **Status dos Contêineres** | `docker compose -f devops/docker-compose.prod.yaml ps` |
| **Logs da Aplicação em Tempo Real** | `bash scripts/logs-prod.sh` ou `docker logs -f cirqueirax_symfony_prod` |
| **Logs dos Workers Assíncronos** | `docker logs cirqueirax_symfony_prod 2>&1 \| grep messenger` |
| **Testar Saúde via Terminal** | `curl -sI https://<seu-dominio>/api/v1/health` |
| **Entrar no Container PHP** | `docker exec -it cirqueirax_symfony_prod /bin/bash` |
| **Status do Syncthing** | `systemctl status syncthing@root` |
| **Testar Config do Nginx Host** | `nginx -t && systemctl reload nginx` |
