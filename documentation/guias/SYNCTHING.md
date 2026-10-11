# Guia de Integração e Sincronização: Syncthing & CirqueiraX

Este guia documenta a arquitetura, pré-requisitos, fluxo de configuração e pareamento do **Syncthing** com a VPS e aparelhos móveis (Android via Syncthing-Fork) para o **CirqueiraX**.

---

## 1. Visão Geral da Arquitetura

O CirqueiraX processa, baixa e categoriza fotos e vídeos, distribuindo os arquivos no armazenamento local conforme a categoria selecionada:

```
[ Download / Upload / Ingestão ]
               │
               ▼
   [ Classificar / Distribuir ]
               │
               ▼
Container: /var/www/html/var/storage/<pasta_local>/<arquivo>
               │ (Bind Mount Docker)
               ▼
Host VPS:  /root/cirqueirax/sync_media/<pasta_local>/<arquivo>
               │
               ▼ (Syncthing fsWatcher / P2P TLS)
Celular:   Internal storage/CirqueiraX/<pasta_local>/<arquivo>
```

- **Host Path:** `/root/cirqueirax/sync_media`
- **Container Path:** `/var/www/html/var/storage`
- **Syncthing Folder ID:** `cirqueirax-media`
- **Permissões do Host:** UID:GID `1000:1000` (container Symfony) e leitura/escrita para grupo (`0775` em diretórios, `0664` em arquivos).

---

## 2. Pré-requisitos e Configuração no CirqueiraX

Antes de configurar o compartilhamento no Syncthing, o sistema CirqueiraX deve estar preparado.

### 2.1. Definir `MEDIA_STORAGE_PATH` no `.env` de Produção

No arquivo `.env` da raiz do projeto na VPS:

```bash
MEDIA_STORAGE_PATH=/root/cirqueirax/sync_media
```

> **Nota de Arquitetura:** O Docker Compose de produção (`devops/docker-compose.prod.yaml`) mapeia `${MEDIA_STORAGE_PATH}` do host diretamente para `/var/www/html/var/storage` do container. O backend do CirqueiraX resolve o diretório automaticamente com fallback resiliente para `/var/www/html/var/storage`.

### 2.2. Criar a Pasta no Host com Permissões Adequadas

Execute no terminal da VPS como `root`:

```bash
mkdir -p /root/cirqueirax/sync_media
chown -R 1000:1000 /root/cirqueirax/sync_media
chmod -R 775 /root/cirqueirax/sync_media
```

### 2.3. Aplicar Migrations de Categorias no Banco

As categorias padrão do sistema já possuem migração automática registrada no Doctrine (`Version20261010215918`):
- `Print Empresa` (`prints/empresa`)
- `Print Pessoal` (`prints/pessoal`)
- `videos/memes` (`videos-memes`)
- `Shingeki no Kyojin` (`videos/shingeki`)

Para rodar em produção:

```bash
make migrate
```

Novas migrations podem ser criadas a qualquer momento usando:
```bash
make new-migration
```

### 2.4. Criação Automática de Subpastas (`mkdir -p`)

O serviço `DistribuirLocalService` e o `ArmazenamentoLocalClient` criam subdiretórios automaticamente de forma recursiva (`0775` e `mkdir -p` nativo). Quando um vídeo recebe a categoria `Shingeki no Kyojin`, a subpasta `videos/shingeki` é criada instantaneamente se ainda não existir.

### 2.5. Recriar os Containers para Aplicar o Volume

Se você alterou o `MEDIA_STORAGE_PATH` no `.env`:

```bash
docker compose --env-file devops/ports.env -f devops/docker-compose.prod.yaml up -d --force-recreate symfony
```

### 2.6. Configurar API Key do Syncthing (Opcional para Dashboard)

No `.env`:

```bash
SYNCTHING_API_URL=http://localhost:8384
SYNCTHING_API_KEY=<sua-api-key>
```

A chave pode ser copiada na interface web do Syncthing em: **Ações → Configurações → Geral / Avançado → API Key**.

---

## 3. Passo a Passo: Configuração do Syncthing na VPS

### Passo 1: Acessar a Interface do Syncthing via Túnel SSH

Por padrão, a porta 8384 do Syncthing deve permanecer fechada para a internet pública. Na sua máquina local, abra um túnel seguro:

```bash
ssh -L 8384:localhost:8384 root@IP-DA-VPS
```

Em seguida, acesse no seu navegador: [http://localhost:8384](http://localhost:8384).

### Passo 2: Criar a Pasta Compartilhada

1. Clique em **"Adicionar Pasta"**.
2. **Aba Geral:**
   - **Rótulo da Pasta:** `CirqueiraX - Mídias`
   - **ID da Pasta:** `cirqueirax-media` *(não utilize IDs de outros sistemas como Franky)*
   - **Caminho da Pasta:** `/root/cirqueirax/sync_media`
3. **Aba Compartilhamento:**
   - Marque o dispositivo **CELULAR** (Device ID já pareado previamente no Syncthing-Fork).
   - Se desejar, marque também **OLD-PC**.
4. **Aba Avançado:**
   - Ative **"Ignorar Permissões"** (*Ignore Permissions*): o Android não suporta permissões POSIX/Unix completas, e essa opção previne conflitos contínuos de sincronização.
   - Padrão de monitoramento: mantenha **"Observar alterações (fsWatcher)"** ativado com intervalo padrão (~10 segundos).
5. Clique em **Salvar**.

---

## 4. Passo a Passo: Aceitar o Compartilhamento no Celular (Android)

1. Abra o aplicativo **Syncthing-Fork** no celular.
2. Uma notificação surgirá: *"VPS quer compartilhar a pasta 'CirqueiraX - Mídias' com você"*.
3. Toque na notificação para aceitar.
4. Defina o diretório local no aparelho:
   - Exemplo: `Armazenamento Principal / CirqueiraX` (ou dentro de `Movies/CirqueiraX`).
5. Confirme e salve.

---

## 5. Fluxo de Validação e Teste Ponta a Ponta

1. Acesse o CirqueiraX no navegador (`/downloads`).
2. Cole a URL de um vídeo e selecione a categoria **Shingeki no Kyojin** (ou faça upload manual na triagem).
3. Aguarde o download e o processamento pelo worker.
4. O arquivo será movido para `/root/cirqueirax/sync_media/videos/shingeki/<arquivo>.mp4`.
5. Em até 10 segundos, o Syncthing detecta o novo arquivo via `fsWatcher`.
6. No celular, o vídeo aparecerá na pasta `CirqueiraX/videos/shingeki/<arquivo>.mp4`.

---

## 6. Escalabilidade e Novas Categorias

Você só precisa realizar o pareamento da pasta raiz (`cirqueirax-media`) **uma única vez**.
Qualquer nova categoria criada no CirqueiraX (seja álbum novo, anime, série ou projeto) criará uma subpasta dentro de `sync_media/` que será imediatamente sincronizada com todos os dispositivos pareados.
