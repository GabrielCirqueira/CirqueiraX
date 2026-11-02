# CirqueiraX — Visão Geral Técnica

**Última atualização:** 02/11/2026
**Situação:** 140 tópicos de roadmap e 95 melhorias concluídos ([progresso](../progresso/README.md))
**Produção:** https://x.cirqueira.com

Para uma visão voltada ao usuário final, veja [FUNCIONALIDADES_DO_SISTEMA.md](FUNCIONALIDADES_DO_SISTEMA.md).

---

## 1. O que é

CirqueiraX é um hub pessoal de mídias. Ele recebe arquivos de várias origens, elimina duplicados, classifica por categoria, distribui para pastas sincronizadas com Syncthing e envia para álbuns do Google Fotos.

### Princípios de design

1. **Fonte única de verdade:** só o backend escreve estado. O frontend nunca fala direto com Syncthing ou Google Fotos.
2. **A categoria decide o destino:** ela concentra a pasta local e o álbum.
3. **Reprocessar não duplica:** hash e registros de envio tornam as etapas repetíveis.
4. **Limites da API são aceitos:** o sistema só gerencia no Google Fotos o que ele mesmo enviou.
5. **Trabalho pesado em segundo plano:** classificação, distribuição e envio rodam no Messenger.

Há duas exceções ao princípio 5. O download de vídeo e o rebaixar individual rodam dentro da requisição, com timeout de 300 s. O pipeline depois do download continua assíncrono.

---

## 2. Arquitetura

```
Fontes
├── Tela de Downloads (link ──► vídeo)
├── Agente de prints (PC empresa e PC pessoal)
├── Upload manual
└── Editor de imagem (nova mídia)
        │
        ▼
Ingestão (dedupe: SHA-256 ► MD5 ► hash visual ► URL)
        │
        ▼
Classificação (OrigemRegra ou decisão manual)
        │
        ├──► Distribuição local ──► Syncthing ──► Celular e PCs
        └──► Envio ao Google Fotos ──► Álbum da categoria

Rotinas diárias: limpeza de vídeos e expiração de áudios
Módulo separado: Downloads MP3 (entidade Audio)
```

### Stack

| Camada | Tecnologia |
| :--- | :--- |
| Backend | PHP 8.4, Symfony 7.3, Doctrine ORM 3 |
| Assíncrono | Symfony Messenger (transporte Doctrine) e Scheduler |
| Frontend | React 19, TypeScript 5.9, Vite 7, Chakra UI 3 |
| Banco | MySQL 8.3 |
| Mídia | yt-dlp, ffmpeg, TikWM, FxTwitter |
| Integrações | Syncthing REST API, Google Photos Library API |
| Agente | Python (requests, watchdog, python-dotenv) |

Detalhes em [BACKEND.md](../stack/BACKEND.md), [FRONTEND.md](../stack/FRONTEND.md), [AUTH.md](../stack/AUTH.md) e [MESSENGER.md](../stack/MESSENGER.md).

---

## 3. Páginas e módulos

| Rota | Tela | Documento |
| :--- | :--- | :--- |
| `/login` | Login | [AUTH.md](../stack/AUTH.md) |
| `/`, `/dashboard`, `/app` | Dashboard | [DASHBOARD.md](DASHBOARD.md) |
| `/central-midias`, `/todas-midias` | Central de Mídias | [CENTRAL_MIDIAS.md](CENTRAL_MIDIAS.md) |
| `/downloads` | Downloads de vídeo | [DOWNLOADS_VIDEOS.md](DOWNLOADS_VIDEOS.md) |
| `/downloads-mp3` | Downloads MP3 | [DOWNLOADS_AUDIO.md](DOWNLOADS_AUDIO.md) |
| `/prints` | Prints & Capturas | [PRINTS.md](PRINTS.md) |
| `/editor-imagem` | Editor de Imagem | [EDITOR_IMAGEM.md](EDITOR_IMAGEM.md) |
| `/upload-manual` | Upload Manual | [UPLOAD_MANUAL.md](UPLOAD_MANUAL.md) |
| `/google-fotos` | Google Fotos | [GOOGLE_FOTOS.md](GOOGLE_FOTOS.md) |

Processos sem tela própria:

- [Categorias e regras](CATEGORIAS_E_REGRAS.md)
- [Agente de prints](AGENTE.md)
- [Syncthing](SYNCTHING.md)
- [Retenção, limpeza e rebaixar](RETENCAO_E_LIMPEZA.md)

---

## 4. Ciclo de vida de uma mídia

```
recebido ──► em_fila ──► sem_categoria (aguarda o usuário)
                    └──► classificado ──► distribuindo ──► distribuido_local
                                                                 │
                                       enviando_google_fotos ◄───┘
                                                 │
                                             concluido ──► arquivo_removido
                                                                 │
                                                baixando ◄───────┘ (rebaixar)

Qualquer etapa pode terminar em erro, com o motivo salvo em erroMotivo.
```

| Status | Significado |
| :--- | :--- |
| `recebido`, `em_fila` | Entrada no pipeline |
| `sem_categoria` | Aguarda decisão manual |
| `classificado` | Categoria definida |
| `distribuindo`, `distribuido_local` | Cópia para a pasta da categoria |
| `baixando` | Download ou rebaixar em andamento |
| `enviando_google_fotos` | Envio ao álbum |
| `concluido` | Pipeline completo |
| `erro` | Falha, com motivo |
| `arquivo_removido` | Arquivo removido pela retenção; o registro permanece |
| `arquivo_expurgado` | Nome legado, mantido por compatibilidade |

As mudanças de status ficam em `historicoStatus`, com data e hora.

---

## 5. Modelo de dados

| Entidade | Finalidade |
| :--- | :--- |
| `MediaItem` | Mídia e todo o seu estado |
| `Categoria` | Destino: pasta e álbum |
| `OrigemRegra` | Categoria automática por origem |
| `Audio` | MP3 baixado por um usuário |
| `ContaGoogleFotos` | Conta conectada e tokens |
| `RegistroEnvioGoogleFotos` | Histórico de envios |
| `TokenAgente` | Credencial de cada agente |
| `Usuario` | Usuários do sistema |
| `RefreshToken` | Renovação de sessão |

### Campos principais de `MediaItem`

| Campo | Descrição |
| :--- | :--- |
| `uuid` | Identificador UUID v7 |
| `hash` | Hash único, usado na deduplicação |
| `origem` | `print_empresa`, `print_pessoal`, `bot_telegram`, `download` ou `manual` |
| `status` | Veja a seção 4 |
| `categoriaId` | Categoria, se houver |
| `caminhoLocal` | Arquivo no disco; nulo depois da retenção |
| `googlePhotosMediaId` | ID retornado pelo Google |
| `thumbnailUrl` | Miniatura |
| `metadata` | JSON com título, autor, datas, tamanho, plataforma e demais dados |
| `erroMotivo` | Último erro |
| `historicoStatus` | Histórico de transições |
| `criadoEm`, `atualizadoEm` | Datas de controle |
| `dataExibicao` | Data usada na ordenação da tela de Downloads |

---

## 6. Armazenamento

| Local | Conteúdo | Produção |
| :--- | :--- | :--- |
| `var/storage` | Pastas das categorias, sincronizadas | `${MEDIA_STORAGE_PATH:-/var/syncthing/cirqueirax}` |
| `var/downloads` | Vídeos baixados | Volume `downloads_prod` |
| `var/audios` | MP3 | Volume `audios_prod` |
| Miniaturas | Capas em cache | Volume `thumbnails_prod` |
| `var/cookies` | Cookies para o yt-dlp | Pasta montada a partir de `../var/cookies` |

---

## 7. Fora do escopo

- Ler ou auditar a biblioteca existente no Google Fotos, por limitação da API.
- Apagar mídias ou mudar datas no Google Fotos pela API.
- Várias categorias por item: cada mídia tem uma só.
- Sincronização sob demanda de arquivo individual, por limitação do Syncthing.
- Cadastro público de usuários.

---

## 8. Pontos conhecidos

- O download de vídeo é síncrono, e `BaixarVideoMessage` não é despachada pela aplicação.
- A fila de downloads depende da aba aberta e não recomeça sozinha depois de recarregar a página.
- `devops/crontab` existe, mas a imagem de produção não inicia cron. As rotinas de produção usam o Scheduler.
- `web/features/home/Home.tsx` não está ligada a nenhuma rota.
- A origem `bot_telegram` continua no modelo e nos filtros, mas este repositório não contém um bot.
