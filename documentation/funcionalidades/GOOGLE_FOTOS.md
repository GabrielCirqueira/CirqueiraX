# Funcionalidade: Google Fotos

A integração faz o backup das mídias em álbuns do Google Fotos. O envio roda em segundo plano, por categoria, e cada tentativa fica registrada no **Histórico de Envios**.

---

## 1. Princípios e limitações

- **Só o que o app criou:** a Google Photos Library API só dá acesso ao conteúdo enviado pelo próprio CirqueiraX.
- **Sem apagar e sem mudar data (M84):** a API não exclui mídias nem altera a data de itens já enviados. Por isso, apagar no CirqueiraX não apaga no Google Fotos.
- **Conta única:** o sistema trabalha com uma conta principal (`ContaGoogleFotos`).

### Escopos OAuth

| Escopo | Uso |
| :--- | :--- |
| `photoslibrary.appendonly` | Enviar mídias e criar álbuns |
| `photoslibrary.readonly.appcreateddata` | Listar o que o app criou |
| `photoslibrary.edit.appcreateddata` | Gerenciar itens e álbuns do app |
| `photoslibrary` e `photoslibrary.sharing` | Também solicitados na autorização |
| `userinfo.email` e `openid` | Identificar a conta |

A lista oficial está em `AutorizarContaGoogleFotosService::SCOPES`.

---

## 2. Conectar a conta

### Pela tela `/google-fotos`

1. Clique em conectar. `ModalConectarGoogleFotos` abre a URL de consentimento (`GET /api/v1/google-fotos/oauth/url`).
2. Autorize no Google.
3. Copie a URL final ou o código (`http://localhost/?code=...`) e cole no modal.
4. O sistema conclui com `POST /api/v1/google-fotos/oauth/concluir`.

Com o token expirado, a tela mostra **Reconectar**. **Desconectar** usa `POST /api/v1/google-fotos/desconectar`.

### Pelo terminal

```bash
make google-fotos-autorizar
# ou
php bin/console app:google-fotos:autorizar-conta
```

### Credenciais

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 3. Envio

```
[ Mídia classificada com álbum ]
              │
    EnviarGoogleFotosMessage
              │
    EnviarGoogleFotosService
       ├─ Já enviado ou Franky? ──► ignora, sem registro
       ├─ Conteúdo igual já enviado? ──► reaproveita o mediaId e associa ao álbum
       ├─ Arquivo faltando? ──► tenta rebaixar
       ├─ PNG? ──► cópia temporária com data em eXIf/XMP
       └─ Sobe os bytes e cria o item no álbum
              │
    RegistrarEnvioGoogleFotosService
              │
    status concluido
```

- `GoogleFotosAlbumService::obterOuCriarAlbumId` cria o álbum automaticamente quando a categoria ainda não tem um.
- O envio inclui `fileName`, para o Google mostrar o nome do arquivo.
- A descrição fica no formato `CirqueiraX | Categoria: X | Origem: Y`.
- Vídeos e imagens saem com a data gravada no arquivo. Em PNG, ela é aplicada por `MetadataImagemClient::gerarCopiaPngComData`.

### Controle de concorrência

`GoogleFotosAPI::executarComSemaforoERetry` serializa as escritas com um lock de arquivo, espera 300 ms entre elas e faz até 4 tentativas em respostas 429, com espera progressiva e aleatória. Isso evita o erro de escrita concorrente mesmo com dois workers.

### Falhas

O Messenger faz até 3 novas tentativas com espera crescente. Se a falha persistir, o item fica como `erro`, com o motivo em `erroMotivo`, e pode ser retentado pela interface. Veja [MESSENGER.md](../stack/MESSENGER.md).

---

## 4. Tela `/google-fotos`

### Álbuns

- `GateConexaoGoogle` mostra o estado da conexão.
- `GridAlbuns` cruza os álbuns do Google com as categorias e identifica vinculados e órfãos.
- `ModalVincularAlbum` liga categorias e álbuns via `PATCH /api/v1/categorias/{uuid}/album`.
- `AvisoMigracaoAlbuns` explica a migração de fotos antigas.

A tela não cria álbuns: eles nascem no primeiro envio de cada categoria.

### Migrar álbuns antigos

1. Crie a categoria no CirqueiraX e gere o álbum.
2. Abra o álbum antigo em [photos.google.com](https://photos.google.com) e selecione as mídias.
3. Use **Adicionar a** e escolha o álbum do CirqueiraX.

### Histórico de Envios

Entidade `RegistroEnvioGoogleFotos`, criada na migration `Version20261021112252`.

- Tabela com filtro por status e contadores das últimas 24 horas.
- Link para o item no Google Fotos.
- Botão **Reenviar**.
- Atualização automática a cada 15 segundos.

| Status | Significado |
| :--- | :--- |
| `enviando` | Em andamento |
| `enviado` | Bytes enviados com sucesso |
| `reaproveitado` | Usou um item já enviado |
| `falha` | Não foi concluído |

| Origem do envio | Significado |
| :--- | :--- |
| `automatico` | Pipeline normal |
| `retentativa` | Retentativa de erro |
| `reenvio_manual` | Botão Reenviar |
| `forcado` | Forçar Google Fotos |

---

## 5. Duplicados

1. Na ingestão, o sistema compara SHA-256, MD5, hash visual e URL. Quando encontra um item igual, descarta o temporário e devolve o existente.
2. No envio, um item com `googlePhotosMediaId` não sobe de novo.
3. Conteúdo igual em outra categoria só é associado ao álbum novo, sem novo upload.
4. **Forçar Google Fotos** ignora esse bloqueio e grava `google_photos_forcado: true`.

Para indexar metadados de itens antigos:

```bash
php bin/console app:media:indexar-metadados
```

---

## 6. API

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/google-fotos/status` | Estado da conexão |
| `GET` | `/api/v1/google-fotos/oauth/url` | URL de consentimento |
| `POST` | `/api/v1/google-fotos/oauth/concluir` | Conclui a autorização |
| `POST` | `/api/v1/google-fotos/desconectar` | Desconecta a conta |
| `GET` | `/api/v1/google-fotos/albuns` | Lista álbuns e vínculos |
| `GET` | `/api/v1/google-fotos/envios` | Histórico |
| `GET` | `/api/v1/google-fotos/envios/resumo` | Contadores |
| `POST` | `/api/v1/google-fotos/envios/{uuid}/reenviar` | Reenvia |
| `POST` | `/api/v1/media-itens/{uuid}/forcar-google-fotos` | Força o envio |

---

## 7. Comandos

| Comando | Função |
| :--- | :--- |
| `app:google-fotos:autorizar-conta` | Autoriza a conta pelo terminal |
| `app:google-fotos:enviar` | Envia mídias pendentes |
| `app:google-fotos:limpar-duplicados-franky` | Trata duplicados de itens importados do Franky |
| `app:media:indexar-metadados` | Preenche metadados de itens antigos |
