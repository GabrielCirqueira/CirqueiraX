# Guia Completo do Ecossistema CirqueiraX — Sincronização, Configuração e Operação

Este documento é o manual definitivo de ponta a ponta para colocar o **CirqueiraX** e todo o seu ecossistema de sincronização em pleno funcionamento: **Servidor Central (VPS)**, **Backup na Nuvem (Google Fotos)**, **Celular Android (Syncthing-Fork)** e **Computador Pessoal (Agente de Capturas)**.

> [!NOTE]
> **Privacidade e Repositório Público**: Este documento foi preparado para versionamento público seguro. Nenhum IP fixo de infraestrutura, senha pessoal, chave secreta ou token privado está exposto. Marcadores genéricos (`<IP_DA_VPS>`, `<SEU_DOMINIO>`, `<AGENT_TOKEN>`, etc.) são utilizados nos exemplos e devem ser substituídos pelos seus valores reais durante a sua configuração.

---

## 1. Visão Geral do Sistema e Arquitetura

O **CirqueiraX** é um hub inteligente e soberano projetado para unificar, organizar e preservar todas as suas mídias pessoais em um único ecossistema coordenado:

* **Screenshots / Prints**: Capturados automaticamente no PC ou no celular, deduplicados via hash SHA-256 e salvos com data real.
* **Downloads de Vídeos**: Ingestão e download automático de vídeos (YouTube, TikTok, Twitter/X, Instagram) com extração rica de metadados via `yt-dlp`.
* **Organização Local**: Separação das mídias em categorias e pastas estruturadas no disco.
* **Backup no Google Fotos**: Envio append-only direto para álbuns oficiais na sua conta do Google via OAuth2.

### Arquitetura de Sincronização das Três Pontas

```text
┌─────────────────────────┐          ┌─────────────────────────┐
│   Computador Pessoal    │          │     Celular Android     │
│   (Agente Python Watch) │          │     (Syncthing-Fork)    │
└────────────┬────────────┘          └────────────┬────────────┘
             │                                    │
             │ HTTPS / REST                       │ TLS P2P / inotify
             │ (Bearer Token)                     │ (Pasta Compartilhada)
             ▼                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    HUB VPS (CirqueiraX)                      │
│                                                              │
│  [ Nginx Host (SSL) ] ──► [ Container App (Symfony 7.3) ]    │
│                                      │                       │
│                           ┌──────────┴──────────┐            │
│                           ▼                     ▼            │
│                 [ Banco MySQL 8.3 ]   [ Pasta Host Mídia ]   │
│                 (Metadados / Status)  (sync_media/ / storage)│
│                                                 │            │
│                           ┌─────────────────────┘            │
│                           ▼ (Workers Assíncronos)            │
│                 [ Messenger Supervisor ]                     │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ OAuth2 API Oficial (photoslibrary)
                            ▼
               ┌─────────────────────────┐
               │      Google Fotos       │
               │ (Álbuns Categorizados)  │
               └─────────────────────────┘
```

---

## 2. Como Funciona o Fluxo de Sincronização

### Fluxo A: Prints do Computador
1. Você tira um screenshot no PC (via atalho de print do sistema).
2. O **Agente CirqueiraX** (`agente.py`), rodando em segundo plano, detecta o novo arquivo na pasta observada via watchdog (`inotify` ou `ReadDirectoryChangesW`).
3. O agente calcula o hash SHA-256 local da imagem (evitando envios repetidos).
4. O agente dispara um `POST /api/v1/ingestao/print` seguro contendo a imagem e os metadados (resolução, título, data e origem `print_pessoal` ou `print_empresa`).
5. O backend salva a imagem na pasta física `sync_media/prints/`, registra no MySQL e despacha o worker assíncrono.
6. O worker do Symfony Messenger envia a imagem para o Google Fotos no álbum vinculado à categoria **Prints**.

### Fluxo B: Prints e Fotos do Celular
1. Você tira um screenshot ou salva uma foto no seu celular Android.
2. O **Syncthing-Fork** detecta a alteração no armazenamento interno do celular.
3. Através de túnel seguro TLS ponto a ponto, o Syncthing transmite o arquivo para a pasta compartilhada no host da VPS (`/caminho/base/cirqueirax/sync_media/prints/`).
4. Como essa pasta está mapeada via bind mount no Docker do CirqueiraX, o arquivo fica imediatamente acessível para o sistema.

### Fluxo C: Downloads de Vídeos
1. Você cola a URL de um vídeo na interface web do CirqueiraX (ou usa a extensão/atalho de envio).
2. O container dispara o download assíncrono via `yt-dlp`, gravando o vídeo em uma área de staging temporária (`var/downloads/`).
3. O vídeo aparece na aba **Downloads de Vídeo** aguardando sua revisão.
4. Ao categorizar (ex: para `videos/memes`, `Shingeki no Kyojin` ou `One Piece`):
   - O arquivo é movido para a subpasta física correspondente (`sync_media/videos/<categoria>/`).
   - O trabalho de upload para o álbum correspondente no Google Fotos é enfileirado no Messenger.

---

## 3. Passo 1: Configuração do Servidor e da VPS

### 3.1. Estrutura de Pastas de Mídia no Host
Na VPS (ou no host local), crie a estrutura de diretórios que será compartilhada entre o Syncthing e o contêiner do CirqueiraX:

```bash
mkdir -p ~/cirqueirax/sync_media/prints
mkdir -p ~/cirqueirax/sync_media/videos/memes
mkdir -p ~/cirqueirax/sync_media/videos/shingeki
mkdir -p ~/cirqueirax/sync_media/videos/onepiece
```

Crie o arquivo de regras de exclusão `.stignore` dentro de `~/cirqueirax/sync_media/`:
```text
(?d).stversions
(?d).DS_Store
(?d)Thumbs.db
downloads/
```

Garanta permissões para o usuário do servidor web (`www-data`):
```bash
sudo chown -R www-data:www-data ~/cirqueirax/sync_media
sudo chmod -R 775 ~/cirqueirax/sync_media
```

### 3.2. Configuração do `.env` do CirqueiraX
No diretório do projeto na VPS, configure as variáveis de ambiente:

```env
APP_ENV=prod
APP_DEBUG=0
APP_SECRET=<GERE_UMA_CHAVE_HEX_DE_32_BYTES>

# Banco de Dados
DATABASE_URL="mysql://<USUARIO_DB>:<SENHA_DB>@database:3306/cirqueirax?serverVersion=8.3.0&charset=utf8mb4"

# Caminho do Storage no Host
MEDIA_STORAGE_PATH=/home/<SEU_USUARIO>/cirqueirax/sync_media

# Token Secreto para Agentes
AGENT_TOKEN=cx_ag_seu_token_secreto_super_longo_aqui

# Porta Exposta pelo Container (mapeada no proxy reverso do host)
DEPLOY_PORT=8089
```

Suba os contêineres:
```bash
docker compose -f devops/docker-compose.prod.yaml up -d
```

---

## 4. Passo 2: Configuração do Google Fotos (OAuth2)

Para que o CirqueiraX envie mídias diretamente para a sua biblioteca e crie álbuns no Google Fotos, é necessário criar credenciais OAuth2 no **Google Cloud Console**.

### 4.1. Criar Projeto e Ativar a API
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto com o nome **CirqueiraX Mídias**.
3. No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
4. Pesquise por **Photos Library API** e clique em **Ativar**.

### 4.2. Configurar a Tela de Permissão OAuth (Consent Screen)
1. Vá em **APIs e Serviços** > **Tela de permissão OAuth**.
2. Selecione o tipo de usuário **Externo** e clique em **Criar**.
3. Preencha os campos obrigatórios:
   - **Nome do app**: `CirqueiraX`
   - **E-mail para suporte**: seu e-mail pessoal.
4. Na etapa de **Escopos**, adicione o escopo:
   - `https://www.googleapis.com/auth/photoslibrary.appendonly` *(Permite criar álbuns e enviar fotos/vídeos sem ler o que já existe)*.
5. Na etapa de **Usuários de teste**, adicione o seu e-mail do Google.

### 4.3. Criar as Credenciais OAuth2
1. Vá em **APIs e Serviços** > **Credenciais** > **Criar credenciais** > **ID do cliente OAuth**.
2. Tipo de aplicativo: **Aplicativo da Web**.
3. Nome: `CirqueiraX Web Server`.
4. Em **URIs de redirecionamento autorizados**, adicione a URL do seu servidor:
   ```text
   https://x.<seu-dominio>.com/api/v1/google-fotos/callback
   ```
5. Clique em **Criar** e copie o **Client ID** e o **Client Secret**.

### 4.4. Conectar a Conta no Painel do CirqueiraX
1. Acesse o CirqueiraX no navegador: `https://x.<seu-dominio>.com/google-fotos`.
2. Cole o **Client ID** e o **Client Secret** nos campos indicados e clique em **Conectar Conta Google**.
3. Você será redirecionado para a tela de login do Google. Faça login com o seu e-mail e clique em **Continuar**.
4. O CirqueiraX salvará seu token de acesso e refresh token de forma segura.
5. Na mesma tela ou na tela de categorias, **vincule os álbuns**:
   - Categoria **Prints** ➔ Selecione ou crie o álbum **Prints**.
   - Categoria **videos/memes** ➔ Selecione ou crie o álbum **Memes**.
   - Categoria **Shingeki no Kyojin** ➔ Selecione ou crie o álbum **Shingeki**.

---

## 5. Passo 3: Configuração do Celular Android (Syncthing-Fork)

O **Syncthing-Fork** é o aplicativo recomendado para Android por oferecer controle avançado de execução em segundo plano, baixo consumo de bateria e observador de arquivos em tempo real.

### 5.1. Instalar o Aplicativo
* Instale o **Syncthing-Fork** através do [F-Droid](https://f-droid.org/packages/com.github.catfriend1.syncthingandroid/) ou da Google Play Store.

### 5.2. Parear o Celular com a VPS
1. **Na VPS (Syncthing Host)**:
   - Abra o painel do Syncthing da VPS (ou use a CLI: `syncthing cli show system`).
   - Copie o **Identificador do Dispositivo (Device ID)** da VPS (sequência de blocos de letras/números).
2. **No Celular**:
   - Abra o Syncthing-Fork.
   - Vá na aba **Dispositivos** e toque no botão **+** (Adicionar Dispositivo).
   - Cole o Device ID da VPS.
   - Nome do Dispositivo: `VPS CirqueiraX`.
   - Marque a opção de **Compressão: Metadados**.
   - Salve.
3. **Na VPS**:
   - Uma notificação aparecerá perguntando se deseja aceitar o novo dispositivo celular. Aceite e confirme.

### 5.3. Compartilhar a Pasta de Mídias
1. Quando a VPS compartilhar a pasta `cirqueirax` ou `sync_media`:
   - No celular, surgirá uma notificação: **"VPS quer compartilhar a pasta..."**.
   - Toque para aceitar.
2. Defina o caminho local no celular:
   ```text
   /storage/emulated/0/cirqueiraX
   ```
   *(Ou se quiser enviar seus prints direto, selecione a pasta `/storage/emulated/0/Pictures/Screenshots`)*.
3. Configurações essenciais da pasta no app:
   - **Tipo de pasta**: `Enviar e Receber` (ou `Apenas Enviar` se não quiser baixar vídeos no celular).
   - **Observador de alterações (Watch for Changes)**: **Ativado** *(detecta arquivos novos em segundos)*.
   - **Tempo de verificação completa (Full Rescan)**: `3600s` (1 hora, para poupar bateria).

### 5.4. Permissões e Bateria no Android
Para evitar que o Android mate o processo em segundo plano:
1. Abra as **Configurações do Android** > **Aplicativos** > **Syncthing-Fork**.
2. **Permissões**: Conceda permissão de **Gerenciar todos os arquivos** (armazenamento irrestrito).
3. **Bateria**: Selecione **Sem restrições** (Não otimizar uso de bateria).
4. No Syncthing-Fork > Configurações > Comportamento: marque para iniciar automaticamente na inicialização do celular.

---

## 6. Passo 4: Configuração do Computador Pessoal (Agente de Capturas)

O **Agente CirqueiraX** (`agente/agente.py`) monitora a pasta de screenshots do seu computador e envia as capturas automaticamente para o servidor.

### 6.1. Instalação das Dependências
No seu computador pessoal (Linux, WSL ou Windows):

```bash
cd /caminho/para/CirqueiraX/agente
pip install -r requirements.txt
```

### 6.2. Configuração do `.env` do Agente
Crie o arquivo `agente/.env` (ou utilize o comando interativo do agente):

```bash
python3 agente.py config --url https://x.<seu-dominio>.com --token cx_ag_seu_token_secreto_super_longo_aqui
```

Ou edite manualmente o arquivo `agente/.env`:
```env
# URL base do servidor de produção (com HTTPS)
SERVER_URL=https://x.<seu-dominio>.com

# Token de autenticação Bearer configurado no backend
AGENT_TOKEN=cx_ag_seu_token_secreto_super_longo_aqui

# Pasta de Screenshots monitorada no seu computador
WATCH_DIR=/home/<seu_usuario>/Imagens/Screenshots

# Identificador da máquina (ex: PC-Casa, PC-Trabalho, Notebook)
INSTANCE_NAME=PC-Principal

# Tag de origem da captura: print_pessoal ou print_empresa
ORIGEM_TAG=print_pessoal

# Nível de log (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
```

### 6.3. Testar a Conexão
Valide se o agente consegue se comunicar com a VPS em produção:

```bash
python3 agente.py test
```

A saída esperada deve confirmar:
```text
[INFO] Testando conexão com: https://x.<seu-dominio>.com/api/v1/health...
[INFO] Conexão HTTP 200 OK! Servidor ativo e saudável.
[INFO] Testando autenticação do token do agente...
[INFO] Autenticação confirmada com sucesso! Perfil: PC-Principal (print_pessoal).
```

Você também pode testar o envio de uma imagem avulsa:
```bash
python3 agente.py send /caminho/para/alguma_imagem.png
```

### 6.4. Executar em Segundo Plano Como Serviço

#### No Linux / WSL (systemd user service)
Copie a unidade de serviço para a pasta do systemd do seu usuário:

```bash
mkdir -p ~/.config/systemd/user
cp agente/servico/cirqueirax-agente.service ~/.config/systemd/user/
```

Edite o arquivo `~/.config/systemd/user/cirqueirax-agente.service` ajustando os caminhos se necessário, e inicie:

```bash
systemctl --user daemon-reload
systemctl --user enable --now cirqueirax-agente
```

Verifique o status do serviço:
```bash
systemctl --user status cirqueirax-agente
```

Para ver os logs em tempo real:
```bash
journalctl --user -u cirqueirax-agente -f
```

#### No Windows
* Crie um atalho para executar:
  ```cmd
  pythonw.exe C:\caminho\para\CirqueiraX\agente\agente.py start
  ```
  e coloque na pasta `shell:startup` (Inicializar do Windows).

---

## 7. Passo 5: Como Testar e Validar Tudo Ponta a Ponta

Execute este checklist prático para ter 100% de certeza de que o ecossistema está operando:

| Teste | Ação | Resultado Esperado |
| :--- | :--- | :--- |
| **1. Print no PC** | Tire um print no PC (salvando na pasta monitorada). | Log do agente exibe `Print enviada com sucesso!`. Acesse `https://x.<seu-dominio>.com/prints` e veja a imagem aparecer instantaneamente. |
| **2. Print no Celular** | Tire um print no celular. | Syncthing-Fork sincroniza com a VPS. O arquivo aparece na pasta `sync_media/prints/` do host. |
| **3. Download de Vídeo** | Cole o link de um vídeo (ex: YouTube/TikTok) em `Downloads de Vídeo`. | O download é concluído e o card do vídeo aparece na lista. |
| **4. Categorização** | Selecione o vídeo e clique em **Categorizar**. No modal, escolha `videos/memes`. | O vídeo é movido para a pasta física `sync_media/videos/memes/` e enfileirado para o Google Fotos. |
| **5. Google Fotos** | Acesse [photos.google.com](https://photos.google.com). | Abra o álbum correspondente e verifique se as mídias recém-processadas estão lá com a data original preservada. |

---

## 8. Diagnóstico e Resolução de Problemas Comuns

### 8.1. Agente retorna `401 Unauthorized` ou `Token Inválido`
* **Causa**: O `AGENT_TOKEN` no arquivo `agente/.env` não bate com o token cadastrado no servidor.
* **Solução**: Verifique o valor de `AGENT_TOKEN` no `.env` da VPS ou gere um novo token via terminal do servidor:
  ```bash
  docker exec -it cirqueirax_symfony_prod php bin/console app:gerar-token-agente "PC-Principal" "print_pessoal"
  ```
  Atualize o `agente/.env` do computador pessoal com o token gerado.

### 8.2. Syncthing-Fork no Android exibe `Desconectado` ou não sincroniza
* **Causa**: Firewall na VPS bloqueando a porta do Syncthing ou restrição de NAT.
* **Solução**:
  1. Garanta que as portas do Syncthing estejam liberadas no firewall da VPS (`ufw allow 22000/tcp`, `ufw allow 22000/udp`).
  2. No Syncthing-Fork, certifique-se de que a opção **Habilitar Retransmissão (Relaying)** e **Descoberta Global** estejam ativadas caso você esteja fora da rede local.
  3. Verifique se o app possui permissão para rodar sem otimização de bateria.

### 8.3. Google Fotos: Erro ao fazer upload ou Token Expirado
* **Causa**: As credenciais OAuth foram revogadas ou a conta de teste expirou após 7 dias (no modo "Em teste" do Google Cloud).
* **Solução**:
  1. No Google Cloud Console, você pode publicar o aplicativo (status "Em produção") para que o refresh token não expire semanalmente.
  2. Acesse `https://x.<seu-dominio>.com/google-fotos` e clique em **Reconectar Conta** para renovar as credenciais OAuth.

### 8.4. Erro de permissão ao salvar arquivos na VPS (`Permission Denied`)
* **Causa**: O usuário do PHP/Nginx dentro do Docker (`www-data`, UID 82 no Alpine ou 33 no Debian) não tem permissão para escrever na pasta do host.
* **Solução**:
  Execute no host da VPS:
  ```bash
  sudo chown -R 33:33 ~/cirqueirax/sync_media
  sudo chmod -R 775 ~/cirqueirax/sync_media
  ```
  *(Se sua imagem for baseada em Alpine, use `sudo chown -R 82:82 ~/cirqueirax/sync_media`)*.

---

## 9. Resumo das Boas Práticas

1. **Segurança em Primeiro Lugar**: O repositório Git é público. Nunca commite arquivos `.env`, chaves privadas SSH, tokens de agentes ou arquivos de mídia pessoais no repositório.
2. **Sincronização P2P Limpa**: A pasta de sincronização do Syncthing deve sempre residir fora do repositório Git.
3. **Supervisão Contínua**: O comando `docker ps` e a página `/dashboard` do CirqueiraX mostram em tempo real a saúde do pipeline, quantidade de itens na fila e o status das sincronizações.
