# Guia de Integração e Sincronização: Syncthing & CirqueiraX

Este guia documenta a arquitetura, estrutura de diretórios, regras de pastas e fluxo de configuração e sincronização do **Syncthing** entre o **Computador Pessoal**, o **Celular (Android via Syncthing-Fork)** e a **VPS** para o **CirqueiraX**.

---

## 1. Visão Geral da Arquitetura e Diretórios

O CirqueiraX centraliza o processamento, ingestão de prints e download de vídeos, organizando as mídias em **1 pasta física de prints** e **3 subpastas físicas de vídeos**, todas contidas dentro de uma **única pasta raiz externa**:

```
[ Ingestão de Prints / Downloads de Vídeos ]
                     │
                     ▼
             [ Classificar ]
                     │
                     ▼
    Container: /var/www/html/var/storage/
                     │ (Docker Bind Mount)
                     ▼
    Host:  ~/cirqueirax/sync_media/ (PC) ou /root/cirqueirax/sync_media/ (VPS)
                     │
    ┌────────────────┴────────────────┐
    │ (Syncthing TLS / fsWatcher)     │
    ▼                                 ▼
Celular (Syncthing-Fork)       Computador Pessoal (OLD-PC)
```

> [!IMPORTANT]
> **Isolamento do Repositório**: A pasta de sincronização do Syncthing fica **fora do projeto** (em `~/cirqueirax/sync_media` no host local ou `/root/cirqueirax/sync_media` na VPS). O repositório Git do projeto (`dev/CirqueiraX`) **nunca** é monitorado ou sincronizado diretamente pelo Syncthing.

---

## 2. Estrutura Oficial de Diretórios

A pasta raiz unificada compartilhada no Syncthing é `sync_media/`:

```text
sync_media/
├── .stignore                   <- Ignora a pasta temporária downloads/
├── prints/                     <- Pasta ÚNICA para todos os prints (trabalho + casa)
└── videos/                     <- Pasta base para os vídeos
    ├── memes/                  <- 1ª Categoria de Vídeo: Memes
    ├── shingeki/               <- 2ª Categoria de Vídeo: Shingeki no Kyojin
    └── onepiece/               <- 3ª Categoria de Vídeo: One Piece
```

### 2.1. Regra das Prints (1 Pasta Única, 2 Origens)
- **Pasta Física Única:** `prints/` (Categoria `Prints`).
- **Origens Suportadas:**
  - `print_empresa` (Capturas enviadas pelo agente do computador do trabalho).
  - `print_pessoal` (Capturas enviadas pelo agente do computador pessoal de casa).
- **Como funciona:** Ambas as origens caem na **mesma pasta** física `prints/`. Não existem pastas separadas no disco. A distinção de onde o print veio é mantida através do metadado de origem no banco de dados (`origem: print_empresa` ou `origem: print_pessoal`), permitindo exibir badges e filtros na interface web.

### 2.2. As 3 Pastas de Vídeos

| Categoria no CirqueiraX | Subpasta Física | Descrição |
| :--- | :--- | :--- |
| **`videos/memes`** | `videos/memes/` | Memes em vídeo baixados ou enviados |
| **`Shingeki no Kyojin`** | `videos/shingeki/` | Clipes e episódios de Shingeki no Kyojin |
| **`One Piece`** | `videos/onepiece/` | Clipes e episódios de One Piece |

### 2.3. Downloads Brutos e `.stignore`
Downloads temporários e mídias ainda não distribuídas ficam na pasta `downloads/` dentro do storage. Para evitar tráfego desnecessário e não sincronizar arquivos incompletos ou não triados, o arquivo `.stignore` na raiz da pasta de sincronização ignora essa pasta:

```text
downloads
downloads/**
(?d).DS_Store
(?d)Thumbs.db
```

---

## 3. Por Que Sincronizar 1 Pasta Raiz (e NÃO 4 Pastas Separadas)

O Syncthing sincroniza diretórios de forma **recursiva**:

1. **Uma Única Sincronização Basta:** Ao sincronizar apenas a pasta raiz `cirqueirax-media` (`sync_media`), o Syncthing replica **toda a árvore com todas as subpastas** (`prints/`, `videos/memes/`, `videos/shingeki/`, `videos/onepiece/`) com total fidelidade.
2. **Zero Conflitos:** Configurar pastas aninhadas (*nested folders*) no Syncthing gera conflitos graves de monitoramento (`fsWatcher`) e loops de sincronização.
3. **Aceite Único no Celular:** No Syncthing-Fork, você aceita **uma única vez** a pasta `CirqueiraX - Mídias`. Não é necessário aceitar 4 convites nem configurar 4 diretórios no Android.
4. **Álbuns Automáticos na Galeria do Android:** Os aplicativos de galeria (Google Fotos, Galeria Samsung, VLC, etc.) leem as subpastas automaticamente como álbuns separados (`prints`, `memes`, `shingeki`, `onepiece`), mantendo sua organização visual intacta.

---

## 4. Dispositivos Identificados na Rede Syncthing

| Dispositivo | Nome Syncthing | Device ID | Papel |
| :--- | :--- | :--- | :--- |
| **Computador / Host** | `CirqueiraX-PC` | Configurado localmente | Origem local atual (WSL / Linux) |
| **Celular** | `CELULAR` | `ITIL4U6-KCKJNYL-TFOTFQA-LEOA2C3-DBMEC2V-V7SOTSF-AHZ4ZGV-3L6I7AA` | Smartphone Android (App Syncthing-Fork) |
| **VPS** | `old` / `VPS` | `D52KJIR-53A7OZA-WDQOQNI-AJZFZKI-OBEOJUP-3H7IXLQ-FCHSX3L-US7TTA6` | Servidor em nuvem |
| **Computador Pessoal** | `OLD-PC` | `QEV4QHJ-I24KCG4-PHKYV63-V6BWFXZ-74H3DY3-JD2J6ID-A57HX37-V7XW6QP` | Máquina pessoal |

---

## 5. Configuração no CirqueiraX e Docker

### 5.1. Variável `MEDIA_STORAGE_PATH`
A variável `MEDIA_STORAGE_PATH` aponta para a pasta externa fora do repositório:

- **No ambiente local (desenvolvimento):**
  Em `devops/ports.env` e `.env`:
  ```bash
  MEDIA_STORAGE_PATH=/home/gabriel/cirqueirax/sync_media
  ```
- **No ambiente VPS (produção):**
  No `.env` da VPS:
  ```bash
  MEDIA_STORAGE_PATH=/root/cirqueirax/sync_media
  ```

O Docker Compose monta `${MEDIA_STORAGE_PATH}` do host diretamente em `/var/www/html/var/storage` do container.

### 5.2. Criação das Pastas no Host
```bash
mkdir -p /home/gabriel/cirqueirax/sync_media/prints
mkdir -p /home/gabriel/cirqueirax/sync_media/videos/memes
mkdir -p /home/gabriel/cirqueirax/sync_media/videos/shingeki
mkdir -p /home/gabriel/cirqueirax/sync_media/videos/onepiece
chmod -R 777 /home/gabriel/cirqueirax/sync_media
```

---

## 6. Configuração no Syncthing (Passo a Passo)

### 6.1. Pasta Compartilhada no Syncthing
Na interface web do Syncthing (`http://127.0.0.1:8384`):

- **Rótulo da Pasta:** `CirqueiraX - Mídias`
- **ID da Pasta (Folder ID):** `cirqueirax-media`
- **Caminho da Pasta:** `/home/gabriel/cirqueirax/sync_media` (ou `/root/cirqueirax/sync_media` na VPS)
- **Aba Compartilhamento:** Marcar `CELULAR` (e `VPS` / `OLD-PC` conforme o ambiente).
- **Aba Avançado:**
  - Ativar **"Ignorar permissões"** (*Ignore permissions*) — obrigatório para Android.
  - Ativar **"Observar alterações (fsWatcher)"** com intervalo de 10s.

### 6.2. Aceite no Celular (Syncthing-Fork)
1. Abra o app **Syncthing-Fork** no celular Android.
2. Aguarde ou visualize a notificação:
   > *"Dispositivo quer compartilhar a pasta 'CirqueiraX - Mídias' (cirqueirax-media)"*
3. Toque para **Aceitar**.
4. Defina o diretório de destino na memória interna (ex: `Armazenamento Principal/CirqueiraX`).
5. Marque a caixa de seleção **"Ignorar permissões"** (*Ignore permissions*).
6. Toque no ícone de confirmação (✔) no topo para salvar.

A sincronização iniciará automaticamente e replicará todas as subpastas `prints/`, `videos/memes/`, `videos/shingeki/` e `videos/onepiece/`.

---

## 7. Fluxo de Validação Ponta a Ponta

1. **Prints Automáticos:**
   - O agente detecta um print no Windows/Linux e envia para `POST /api/v1/ingestao/print`.
   - O CirqueiraX salva em `sync_media/prints/print_<data>_<hash>.png`.
   - O Syncthing detecta via `fsWatcher` e o print surge imediatamente na pasta de prints do celular.

2. **Vídeos Categorizados:**
   - Na interface do CirqueiraX (`/downloads`), você seleciona os vídeos e define a categoria (**One Piece**, **Shingeki no Kyojin** ou **videos/memes**).
   - O backend copia o arquivo para `sync_media/videos/<categoria>/<video>.mp4`.
   - O Syncthing sincroniza o vídeo diretamente para a respectiva subpasta no celular.
