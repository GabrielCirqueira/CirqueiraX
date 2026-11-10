# Funcionalidade: Sincronização com Syncthing

O **Syncthing** replica as mídias organizadas pelo CirqueiraX entre a VPS, o celular Android (Syncthing-Fork) e os computadores. O CirqueiraX não transfere arquivos: ele grava na pasta compartilhada, e o Syncthing faz o resto.

> A aba **Sincronização** e as rotas `/api/v1/sync/*` são só para administradores (`ROLE_ADMIN`). Os arquivos de cada usuário ficam em `<pasta do usuário>/<pasta da categoria>`; a conta principal usa a pasta vazia, então os caminhos dela não mudaram ([MULTIUSUARIO.md](MULTIUSUARIO.md)).

---

## 1. Arquitetura

```
[ Prints classificados ]   [ Vídeos categorizados ]
                 │             │
                 ▼             ▼
       Container: /var/www/html/var/storage/
                       │ bind mount
                       ▼
       Host: ${MEDIA_STORAGE_PATH}
                       │ Syncthing
         ┌─────────────┴─────────────┐
         ▼                           ▼
 Celular (Syncthing-Fork)      Outros computadores
```

A pasta sincronizada fica **fora do repositório**. O Git do projeto nunca é monitorado pelo Syncthing.

| Ambiente | Valor de `MEDIA_STORAGE_PATH` |
| :--- | :--- |
| Desenvolvimento | Definido em `devops/ports.env` |
| Produção | Definido no `.env`; o padrão do compose é `/var/syncthing/cirqueirax` |

---

## 2. Estrutura de pastas

```text
<pasta sincronizada>/
├── .stignore
├── prints/                 Todos os prints, da empresa e pessoais
└── videos/
    ├── memes/
    ├── shingeki/
    └── onepiece/
```

As subpastas vêm do campo `pastaLocal` das [categorias](CATEGORIAS_E_REGRAS.md). Uma categoria nova cria a pasta dela automaticamente na primeira distribuição.

---

## 3. O que não é sincronizado

| Local | Conteúdo |
| :--- | :--- |
| `var/downloads` (volume `downloads_prod`) | Vídeos brutos, antes da triagem |
| `var/audios` (volume `audios_prod`) | MP3 da tela Downloads MP3 |
| Volume `thumbnails_prod` | Miniaturas |

Os downloads brutos saíram da pasta sincronizada: eles ficam em volume próprio, então nada chega ao celular antes de ser categorizado. A regra `downloads` no `.stignore` só importa para instalações antigas que ainda tenham essa pasta dentro do storage:

```text
downloads
downloads/**
(?d).DS_Store
(?d)Thumbs.db
```

---

## 4. Uma pasta raiz, não várias

O Syncthing é recursivo. Compartilhar só a pasta raiz basta para replicar toda a árvore. Pastas aninhadas geram conflitos de monitoramento, e no celular o aceite fica único. Os aplicativos de galeria tratam cada subpasta como um álbum separado.

---

## 5. Integração com o sistema

O backend conversa com a REST API do Syncthing:

```bash
SYNCTHING_API_URL=http://localhost:8384
SYNCTHING_API_KEY=<chave da API>
```

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/sync/pastas` | Estado e progresso das pastas |
| `POST` | `/api/v1/sync/pastas/{id}/sincronizar` | Dispara o rescan de uma pasta |

A aba **Sincronização** do [Dashboard](DASHBOARD.md) usa essas rotas.

---

## 6. Configuração

### Pasta no Syncthing

Na interface web do Syncthing:

- **Rótulo:** `CirqueiraX - Mídias`
- **ID da pasta:** `cirqueirax-media`
- **Caminho:** o valor de `MEDIA_STORAGE_PATH`
- **Compartilhamento:** marque os dispositivos desejados
- **Avançado:** ative **Ignorar permissões** e **Observar alterações**

### Celular

1. Abra o **Syncthing-Fork**.
2. Aceite o compartilhamento da pasta `CirqueiraX - Mídias`.
3. Escolha o destino na memória interna.
4. Marque **Ignorar permissões** e confirme.

O passo a passo completo, com pareamento e ajustes de bateria, está em [GUIA_SINCRONIZACAO_ECOSSISTEMA.md](../guias/GUIA_SINCRONIZACAO_ECOSSISTEMA.md).

---

## 7. Regras importantes

- **A limpeza não toca na pasta sincronizada.** Veja [RETENCAO_E_LIMPEZA.md](RETENCAO_E_LIMPEZA.md).
- **Datas preservadas:** rebaixar um vídeo mantém a data do arquivo, o que evita reordenação e sincronização desnecessária.
- **Remoções se propagam:** apagar um arquivo em um dispositivo pode apagá-lo nos outros, conforme o tipo de pasta configurado.
- **Limitação conhecida:** a sincronização é por pasta, não por arquivo sob demanda.
