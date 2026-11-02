# Funcionalidade: Categorias e Regras de Origem

A categoria decide o destino de cada mídia: uma **pasta local** e, opcionalmente, um **álbum do Google Fotos**. As regras de origem aplicam essa categoria automaticamente.

---

## 1. Modelo

### `Categoria`

| Campo | Descrição |
| :--- | :--- |
| `nome` | Nome único de até 100 caracteres |
| `pastaLocal` | Subpasta relativa dentro do storage |
| `googlePhotosAlbumId` | Álbum vinculado (opcional) |

### `OrigemRegra`

Liga uma origem a uma categoria.

Origens existentes em `OrigemMedia`:

| Origem | Uso |
| :--- | :--- |
| `print_empresa` | Agente do PC da empresa |
| `print_pessoal` | Agente do PC pessoal |
| `bot_telegram` | Origem de bot |
| `download` | Downloads de vídeo |
| `manual` | Upload manual |

---

## 2. Categorias iniciais

Criadas por `app:seed:origem-regras`:

| Categoria | Pasta | Regra automática |
| :--- | :--- | :--- |
| `Prints` | `prints` | `print_empresa` e `print_pessoal` |
| `videos/memes` | `videos/memes` | Manual |
| `Shingeki no Kyojin` | `videos/shingeki` | Manual |
| `One Piece` | `videos/onepiece` | Manual |

---

## 3. Como a classificação funciona

```
                [ Mídia ingerida ]
                        │
                ClassificarMediaMessage
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
   Existe OrigemRegra            Não existe
          │                           │
          ▼                           ▼
 classificado + categoria       sem_categoria
          │                     aguarda o usuário
          ▼
 DistribuirLocalMessage e EnviarGoogleFotosMessage
```

Em downloads e uploads, a categoria escolhida no pedido é aplicada sem esperar a triagem.

---

## 4. Distribuição

`DistribuirLocalService` **copia** o arquivo para `{storage}/{pastaLocal}`, criando as pastas que faltarem, reaplica os metadados e marca `distribuido_local`. Assim, categorias novas não exigem acesso ao servidor.

---

## 5. Trocar ou remover categoria

### Trocar

`ClassificarMediaItemService` também trata itens já concluídos ou distribuídos:

- move o arquivo para a nova pasta;
- troca o álbum com `adicionarItensAoAlbum` e `removerItensDoAlbum`.

A troca de álbum funciona para itens que o próprio CirqueiraX enviou.

### Remover (M87)

Disponível para itens `classificado`, `distribuido_local`, `concluido` ou `erro`:

- o item volta para `sem_categoria`;
- `categoria_removida_id` fica nos metadados;
- o arquivo permanece onde está;
- se a mídia já estiver no Google Fotos, ela precisa ser apagada lá manualmente.

---

## 6. Gestão

**Pela interface:** Dashboard, aba Categorias, onde é possível criar, editar e vincular álbum.

**Pela API:**

| Método | Rota |
| :--- | :--- |
| `GET`, `POST` | `/api/v1/categorias` |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/v1/categorias/{uuid}` |
| `PATCH` | `/api/v1/categorias/{uuid}/album` |
| `GET`, `POST` | `/api/v1/origem-regras` |
| `GET`, `PUT`, `DELETE` | `/api/v1/origem-regras/{uuid}` |

**Seed:**

```bash
docker exec -it cirqueirax_symfony php bin/console app:seed:origem-regras
```
