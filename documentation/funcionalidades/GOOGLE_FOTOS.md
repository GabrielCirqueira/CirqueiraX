# Funcionalidade: Integração com Google Fotos

A integração do **CirqueiraX** com o **Google Fotos** permite fazer backup e organizar automaticamente capturas de tela e vídeos em álbuns dedicados da sua conta do Google Fotos, operando de forma 100% assíncrona e em segundo plano.

---

## 1. Princípios e Limitações da API

1. **Upload Append-Only**: O CirqueiraX cria novas mídias e gerencia apenas o conteúdo enviado por ele mesmo. Devido a limitações oficiais de segurança da Google Photos Library API (em vigor desde 2025), aplicações de terceiros não podem deletar ou alterar fotos já existentes na biblioteca do usuário fora dos itens que a própria aplicação criou.
2. **Escopos Granulares OAuth 2.0**:
   - `https://www.googleapis.com/auth/photoslibrary.appendonly` — Permite carregar bytes de fotos e vídeos e criar itens na biblioteca.
   - `https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata` — Permite listar álbuns criados pelo CirqueiraX.
   - `https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata` — Permite adicionar mídias aos álbuns criados pelo aplicativo.
   - `https://www.googleapis.com/auth/userinfo.email` — Identifica a conta vinculada.
3. **Associação por Categoria**: Cada mídia no CirqueiraX pertence a uma `Categoria`. Se a categoria tiver um `google_photos_album_id` configurado, o upload para a nuvem ocorre automaticamente após a classificação da mídia.

---

## 2. Fluxo de Autorização e Credenciais (OAuth 2.0)

### 2.1. Variáveis de Ambiente no `.env`
O arquivo `.env` do backend armazena as credenciais do aplicativo configuradas no Google Cloud Console:

```bash
GOOGLE_CLIENT_ID=seu_google_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui
```

### 2.2. Como Conectar a Conta do Google Fotos
A autorização inicial gera uma URL de consentimento do Google e salva o `refresh_token` de longa duração no banco de dados através da CLI:

```bash
# Executar comando de autorização
docker exec -it cirqueirax_symfony php bin/console app:google-fotos:autorizar
```
Ou pelo atalho do Makefile:
```bash
make google-fotos-autorizar
```

1. O comando exibirá uma URL do Google no terminal.
2. Abra a URL no navegador, faça login na sua conta do Google e autorize as permissões.
3. O Google exibirá um código de autorização ou redirecionará para a rota de callback.
4. Cole o código no terminal quando solicitado.
5. O backend troca o código pelo `refresh_token` e salva na tabela de configurações.
6. A partir desse momento, o backend renova os tokens de acesso temporários automaticamente sem necessidade de qualquer intervenção do usuário.

---

## 3. Pipeline de Sincronização Assíncrona

```
[ Mídia Classificada com Álbum ]
              │
              ▼
    EnviarGoogleFotosMessage
              │
              ▼
   [ Symfony Messenger Worker ]
              │
              ▼
   EnviarGoogleFotosMessageHandler
              │
              ▼
   GooglePhotosUploadService
       ├─ 1. Valida/Renova Access Token (GooglePhotosTokenService)
       ├─ 2. Envia bytes brutos em chunks (X-Goog-Upload-Protocol: raw)
       ├─ 3. Recebe uploadToken temporário do Google
       └─ 4. Executa batchCreate vinculando uploadToken ao albumId
              │
              ▼
   Atualiza MediaItem (status = concluido, googlePhotosMediaItemId = ...)
```

### 3.1. Tratamento de Erros e Quota
- **Falha de Rede Temporária**: O Symfony Messenger realiza até 3 retentativas automáticas com espera exponencial.
- **Quota Excedida ou Token Revogado**: O item é marcado com status `erro` e o motivo detalhado é salvo em `erro_motivo`.
- **Reprocessamento**: Pelo painel do dashboard ou pela listagem de mídias, basta clicar em **Retentar** para recolocar o upload na fila.

---

## 4. Gerenciamento de Álbuns na Interface Web (`/google-fotos`)

A tela de Google Fotos oferece gestão completa da integração:

1. **Badge de Status de Conexão**: Mostra se a conta está conectada e o e-mail da conta vinculada.
2. **Listagem de Álbuns**:
   - Título do álbum no Google Fotos.
   - Quantidade de mídias contidas no álbum.
   - Categoria do CirqueiraX vinculada (ex: `Prints`, `videos/memes`, etc.).
3. **Criação de Novos Álbuns**: Permite criar um álbum novo diretamente pelo CirqueiraX, registrando-o instantaneamente no Google Fotos.
4. **Vinculação Manual**: Permite associar qualquer categoria local a um álbum remoto existente.

---

## 5. Prevenção de Duplicatas e Deduplicação Inteligente

Para evitar consumo desnecessário de cota da API do Google Fotos e acúmulo de arquivos repetidos na nuvem e no disco, o CirqueiraX conta com uma camada robusta de **deduplicação baseada em metadados**:

1. **Extração e Persistência de Metadados (`ExtratorMetadataService`)**:
   - Cada arquivo ingerido tem seus metadados extraídos automaticamente: `hash_sha256`, `hash_md5`, `tamanho_bytes`, `mime_type`, `dimensoes` (para imagens), `data_criacao_arquivo` e `fingerprint` (`<tamanho>:<md5>`).
2. **Identificação Prévia de Duplicatas**:
   - Quando um arquivo é enviado novamente (via Upload Manual, download de vídeo com a mesma URL/conteúdo ou prints do celular), o sistema cruza os hashes e fingerprints com o banco de dados.
   - O item existente é identificado, e o arquivo temporário duplicado é descartado do disco para não ocupar espaço redundante.
3. **Bloqueio de Upload Repetido no Google Fotos (`EnviarGoogleFotosService`)**:
   - **Guarda de Idempotência**: Se o item já tiver um `googlePhotosMediaId` ou metadado `google_photos_id`, o serviço aborta imediatamente sem reenviar bytes.
   - **Reaproveitamento de IDs entre Registros**: Se um arquivo tiver conteúdo idêntico a outro já enviado anteriormente ao Google Fotos, o `googlePhotosMediaId` é reutilizado. Caso a mídia pertença a outra categoria/álbum, ela é apenas associada ao novo álbum via API, **sem fazer upload repetido dos bytes**.
4. **Confirmação e Sincronização Forçada a Pedido do Usuário**:
   - Quando uma mídia é enviada e identificada como duplicada no frontend, um modal interativo notifica o usuário e pergunta se deseja sincronizar com o Google Fotos mesmo assim.
   - Se confirmado, o endpoint `POST /api/v1/media-itens/{uuid}/forcar-google-fotos` efetua o upload e inclusão no álbum remoto ignorando o bloqueio de duplicidade e registra `google_photos_forcado: true` nos metadados.
   - O usuário também pode acionar essa sincronização a qualquer momento através do botão **Forçar Google Fotos** nos cards de triagem e na fila de upload.
5. **Comando de Indexação de Metadados**:
   - Para reindexar ou preencher metadados de itens históricos já existentes no banco de dados:
     ```bash
     docker exec -it cirqueirax_symfony php bin/console app:media:indexar-metadados
     ```
