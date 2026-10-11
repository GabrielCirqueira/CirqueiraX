# Funcionalidade: Categorias e Motor de Regras de Origem

O motor de **Categorias e Regras de Origem** é o cérebro que decide para onde cada arquivo vai no CirqueiraX. Ele associa uma mídia a uma subpasta física no sistema de arquivos local (Syncthing) e a um álbum remoto no Google Fotos.

---

## 1. O Modelo de Domínio

### 1.1. Entidade `Categoria`
Cada categoria define:
- `nome`: Nome visível na interface (ex: `Prints`, `videos/memes`, `Shingeki no Kyojin`, `One Piece`).
- `pasta_local`: O caminho relativo da subpasta física dentro da pasta raiz do storage (`sync_media`).
- `google_photos_album_id`: O identificador do álbum remoto no Google Fotos (opcional).

### 1.2. Entidade `OrigemRegra`
Mapeia uma origem de ingestão para uma categoria padrão de forma totalmente automática:
- `origem`: Enum `OrigemMedia` (`print_empresa`, `print_pessoal`, etc.).
- `categoria_id`: O UUID da categoria para onde essa origem deve ser roteada imediatamente.

---

## 2. Categorias e Regras Oficiais do Sistema

| Categoria | Subpasta no Disco (`pasta_local`) | Origem Automática Vinculada | Álbum Google Fotos |
| :--- | :--- | :--- | :--- |
| **`Prints`** | `prints/` | `print_empresa` e `print_pessoal` | Álbum "Prints" |
| **`videos/memes`** | `videos/memes/` | Classificação manual | Álbum "Memes" |
| **`Shingeki no Kyojin`** | `videos/shingeki/` | Classificação manual | Álbum "Shingeki no Kyojin" |
| **`One Piece`** | `videos/onepiece/` | Classificação manual | Álbum "One Piece" |

---

## 3. Como Funciona a Decisão de Classificação

Quando uma mídia entra no sistema:

```
[ Ingestão da Mídia ] ──► Verifica Origem
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   Existe OrigemRegra?                     Não existe regra
 (ex: print_empresa / pessoal)             (ex: download yt-dlp)
            │                                     │
            ▼                                     ▼
 1. Define categoria automaticamente     1. Status = 'sem_categoria'
 2. Transiciona para 'classificado'      2. Fica aguardando na UI
 3. Dispara DistribuirLocalMessage       3. Usuário clica em 'Categorizar'
 4. Dispara EnviarGoogleFotosMessage     4. Sistema classifica e distribui
```

---

## 4. Gerenciamento e Seed no Banco de Dados

As categorias iniciais e regras de prints são cadastradas via Doctrine Migration e comando de seed:

```bash
# Executar o seed de categorias e regras padrão
docker exec -it cirqueirax_symfony php bin/console app:seed:origem-regras
```

### 4.1. Criação Automática de Subpastas Físicas
O serviço `DistribuirLocalService` cria qualquer diretório físico que ainda não exista na hora da cópia (`mkdir -p` recursivo com permissão `0775`), garantindo que novas categorias criadas via API já tenham suas pastas criadas sem necessidade de acesso SSH ao servidor.
