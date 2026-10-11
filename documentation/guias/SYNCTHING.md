# Guia de Integração e Sincronização: Syncthing & CirqueiraX

Este guia documenta a arquitetura, estrutura de diretórios, fluxo de configuração e sincronização do **Syncthing** entre a **VPS**, o **Celular (Android via Syncthing-Fork)** e o **Computador Pessoal** para o **CirqueiraX**.

---

## 1. Visão Geral da Arquitetura e Pastas

O CirqueiraX centraliza o processamento, ingestão e download de mídias, organizando os arquivos em disco em **1 pasta de prints** e **3 pastas de vídeos**:

```
[ Ingestão / Captura de Prints / Download de Vídeos ]
                         │
                         ▼
             [ Classificar / Distribuir ]
                         │
                         ▼
        Container: /var/www/html/var/storage/
                         │ (Docker Bind Mount)
                         ▼
        Host VPS:  /root/cirqueirax/sync_media/
                         │
        ┌────────────────┴────────────────┐
        │ (Syncthing TLS / fsWatcher)     │
        ▼                                 ▼
Celular (Syncthing-Fork)          Computador Pessoal (OLD-PC)
```

### 1.1. Estrutura Oficial de Diretórios

```
sync_media/ (ou /var/www/html/var/storage/)
├── prints/                     <- Pasta ÚNICA para todos os prints (trabalho + casa)
└── videos/                     <- Pasta base para os vídeos
    ├── memes/                  <- 1ª Pasta de Vídeos: Memes
    ├── shingeki/               <- 2ª Pasta de Vídeos: Shingeki no Kyojin
    └── onepiece/               <- 3ª Pasta de Vídeos: One Piece
```

### 1.2. Regra das Prints: 1 Pasta Única, 2 Origens

- **Pasta Física Única:** `prints/` (Categoria `Prints`).
- **Origens Suportadas:**
  - `print_empresa` (Capturas enviadas pelo agente do computador do trabalho).
  - `print_pessoal` (Capturas enviadas pelo agente do computador pessoal de casa).
- **Como funciona:** Ambas as origens caem na **mesma pasta** física `prints/`. Não existem pastas separadas de prints em disco. A distinção de onde o print veio é mantida através do metadado de origem no banco de dados (`origem: print_empresa` ou `origem: print_pessoal`), permitindo exibir badges e filtros na interface web.

### 1.3. As 3 Pastas de Vídeos

| Categoria no CirqueiraX | Subpasta Física | Descrição |
| :--- | :--- | :--- |
| **`videos/memes`** | `videos/memes/` | Memes em vídeo baixados ou enviados |
| **`Shingeki no Kyojin`** | `videos/shingeki/` | Clipes e episódios de Shingeki no Kyojin |
| **`One Piece`** | `videos/onepiece/` | Clipes e episódios de One Piece |

---

## 2. Dispositivos Identificados na Rede Syncthing

No ecossistema Syncthing configurado na VPS:

| Dispositivo | Nome Syncthing | Device ID | Papel |
| :--- | :--- | :--- | :--- |
| **VPS** | `old` | `D52KJIR-53A7OZA-WDQOQNI-AJZFZKI-OBEOJUP-3H7IXLQ-FCHSX3L-US7TTA6` | Servidor central / Origem dos downloads e ingestão |
| **Celular** | `CELULAR` | `ITIL4U6-KCKJNYL-TFOTFQA-LEOA2C3-DBMEC2V-V7SOTSF-AHZ4ZGV-3L6I7AA` | Smartphone Android (App Syncthing-Fork) |
| **Computador Pessoal** | `OLD-PC` | `QEV4QHJ-I24KCG4-PHKYV63-V6BWFXZ-74H3DY3-JD2J6ID-A57HX37-V7XW6QP` | Computador pessoal de casa |

---

## 3. Pré-requisitos e Configuração no CirqueiraX

### 3.1. Definir `MEDIA_STORAGE_PATH` no `.env` da VPS

No arquivo `.env` da raiz do projeto na VPS:

```bash
MEDIA_STORAGE_PATH=/root/cirqueirax/sync_media
```

> **Nota de Arquitetura:** O Docker Compose de produção (`devops/docker-compose.prod.yaml`) mapeia `${MEDIA_STORAGE_PATH}` do host diretamente para `/var/www/html/var/storage` do container. O backend do CirqueiraX resolve o diretório automaticamente com fallback resiliente para `/var/www/html/var/storage`.

### 3.2. Criar as Pastas no Host da VPS

Execute no terminal da VPS como `root`:

```bash
mkdir -p /root/cirqueirax/sync_media/prints
mkdir -p /root/cirqueirax/sync_media/videos/memes
mkdir -p /root/cirqueirax/sync_media/videos/shingeki
mkdir -p /root/cirqueirax/sync_media/videos/onepiece

chown -R 1000:1000 /root/cirqueirax/sync_media
chmod -R 775 /root/cirqueirax/sync_media
```

### 3.3. Aplicar Migrations no Banco de Dados

As categorias (`Prints`, `videos/memes`, `Shingeki no Kyojin`, `One Piece`) e as regras de origem automáticas estão registradas na migration do Doctrine:

```bash
make migrate
```

Caso queira executar via seed do console:
```bash
docker exec cirqueirax_symfony php bin/console app:seed:origem-regras
```

### 3.4. Criação Automática de Subpastas (`mkdir -p`)

O serviço `DistribuirLocalService` e o `ArmazenamentoLocalClient` criam subdiretórios automaticamente de forma recursiva (`0775` e `mkdir -p` nativo). Quando um vídeo recebe a categoria `One Piece`, a subpasta `videos/onepiece` é criada instantaneamente se ainda não existir.

---

## 4. Passo a Passo: Configuração do Syncthing

Você pode configurar a sincronização de duas formas:
- **Abordagem A (Recomendada):** Compartilhar a pasta raiz unificada (`sync_media`). Uma única pasta configurada no Syncthing que já sincroniza tudo organizado.
- **Abordagem B:** Compartilhar as pastas individualmente (`prints`, `memes`, `shingeki`, `onepiece`), útil se você quiser que cada pasta vá para um local específico diferente no celular (ex: galeria do Android).

---

### Opção A: Pasta Raiz Unificada (Recomendado)

#### Passo 1: Acessar a Interface do Syncthing da VPS via Túnel SSH

Na sua máquina local:

```bash
ssh -L 8384:localhost:8384 root@72.60.14.61
```

Acesse no navegador: [http://localhost:8384](http://localhost:8384).

#### Passo 2: Criar a Pasta no Syncthing da VPS

1. Clique em **"Adicionar Pasta"**.
2. **Aba Geral:**
   - **Rótulo da Pasta:** `CirqueiraX - Mídias`
   - **ID da Pasta:** `cirqueirax-media`
   - **Caminho da Pasta:** `/root/cirqueirax/sync_media`
3. **Aba Compartilhamento:**
   - Marque **CELULAR** (`ITIL4U6...`).
   - Marque **OLD-PC** (`QEV4QHJ...`).
4. **Aba Avançado:**
   - Ative **"Ignorar Permissões"** (*Ignore Permissions*) — essencial para Android.
   - Padrão de monitoramento: mantenha **"Observar alterações (fsWatcher)"** ativado com intervalo padrão (~10 segundos).
5. Clique em **Salvar**.

#### Passo 3: Aceitar no Celular (Syncthing-Fork)

1. Abra o app **Syncthing-Fork** no celular.
2. Surgirá o alerta: *"old quer compartilhar a pasta 'CirqueiraX - Mídias' (cirqueirax-media)"*.
3. Toque para aceitar.
4. Escolha onde salvar na memória interna (ex.: `Armazenamento Principal / CirqueiraX`).
5. Ative **"Ignorar permissões"** e salve.
6. Pronto! As subpastas `prints/`, `videos/memes/`, `videos/shingeki/` e `videos/onepiece/` surgirão automaticamente no celular.

#### Passo 4: Aceitar no Computador Pessoal (OLD-PC)

1. Abra o Syncthing no seu computador de casa.
2. Aceite o compartilhamento de `cirqueirax-media`.
3. Escolha o diretório local (ex.: `D:\CirqueiraX` ou `C:\Users\...\CirqueiraX`).
4. Salve.

---

### Opção B: Pastas Individuais (Se quiser mapear separadamente no Android)

Se preferir que cada pasta vá para um diretório específico da sua galeria no Android (por exemplo, `Pictures/Prints`, `Movies/Memes`, `Movies/Shingeki`, `Movies/One Piece`), crie as pastas no Syncthing da VPS individualmente:

| Rótulo da Pasta | ID da Pasta (Folder ID) | Caminho na VPS |
| :--- | :--- | :--- |
| `CirqueiraX - Prints` | `cirqueirax-prints` | `/root/cirqueirax/sync_media/prints` |
| `CirqueiraX - Memes` | `cirqueirax-videos-memes` | `/root/cirqueirax/sync_media/videos/memes` |
| `CirqueiraX - Shingeki` | `cirqueirax-videos-shingeki` | `/root/cirqueirax/sync_media/videos/shingeki` |
| `CirqueiraX - One Piece` | `cirqueirax-videos-onepiece` | `/root/cirqueirax/sync_media/videos/onepiece` |

Em cada uma:
- Compartilhe com `CELULAR` e `OLD-PC`.
- Marque **"Ignorar Permissões"**.
- No celular (Syncthing-Fork), aponte cada uma para a pasta de destino correspondente.

---

## 5. Fluxo de Validação Ponta a Ponta

1. **Teste de Prints:**
   - Faça uma captura no PC de casa ou do trabalho pelo agente.
   - O print é salvo em `/root/cirqueirax/sync_media/prints/print_<data>_<hash>.png`.
   - Em poucos segundos, o Syncthing sincroniza o print para o Celular e para o PC pessoal.

2. **Teste de Vídeos (One Piece / Shingeki / Memes):**
   - No CirqueiraX web (`/downloads`), cole uma URL de vídeo e selecione a categoria **One Piece** (ou **Shingeki no Kyojin** ou **videos/memes**).
   - O worker baixa o arquivo e distribui para `/root/cirqueirax/sync_media/videos/onepiece/<arquivo>.mp4`.
   - O Syncthing detecta via `fsWatcher` e o vídeo surge instantaneamente no seu celular na pasta de One Piece.
