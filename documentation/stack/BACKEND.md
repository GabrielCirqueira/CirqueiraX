# Backend (`src/`)

API Symfony do CirqueiraX. Controllers ficam leves, regras de negócio vivem em services, e integrações externas ficam em `src/Infra/`.

## Tecnologias

| Tecnologia | Papel |
| :--- | :--- |
| **PHP 8.4** | Runtime |
| **Symfony 7.3** | Framework HTTP, DI e Console |
| **Doctrine ORM 3 / DBAL 3** | Persistência e migrations |
| **Symfony Messenger e Scheduler** | Filas e rotinas agendadas |
| **Lexik JWT** | Access tokens RS256 |
| **Gesdinet Refresh Token** | Refresh tokens no banco |
| **Nelmio CORS** | CORS |
| **Symfony Rate Limiter** | Limites de requisição |
| **Monolog e Sentry** | Logs e erros |
| **Guzzle** | Clientes HTTP |
| **Pentatrion Vite Bundle** | Integração com o Vite |
| **PHPStan 2** | Análise estática |
| **yt-dlp e ffmpeg** | Download e tratamento de mídia |

## Estrutura

```text
src/
├── Command/        Comandos de console
├── Controller/     Audio, Auth, Categoria, Common, Dashboard, GoogleFotos,
│                   Ingestao, LivroAudio, MediaItem, OrigemRegra, Sistema, Spotify, Sync e Video
├── DataObject/     DTOs de entrada
├── Entity/         Entidades Doctrine (ContaSpotify, ImagemSpotify, ImportacaoSpotify, ReproducaoSpotify...)
├── Enum/           Enums de domínio (FonteReproducaoSpotify, StatusContaSpotify, StatusImagemSpotify, StatusImportacaoSpotify, TipoImagemSpotify...)
├── EventListener/  Listeners
├── Exception/      Exceções por domínio (LivroAudio, Spotify, Storage, Video...)
├── Infra/          Audio (Edge TTS, Piper e roteador), GoogleFotos, GoogleOAuth,
│                   Imagem, Spotify, Storage, Syncthing e YtDlp
├── Interface/      Contratos
├── Message/        Mensagens do Messenger (BuscarImagemSpotifyMessage, ImportarHistoricoSpotifyMessage, SincronizarHistoricoSpotifyMessage...)
├── MessageHandler/ Handlers
├── Repository/     Consultas (ContaSpotifyRepository, ImagemSpotifyRepository, ImportacaoSpotifyRepository, ReproducaoSpotifyRepository...)
├── Security/       TokenAgenteAuthenticator
├── Serializer/     Contratos JSON de saída (ContaSpotifySerializer, ImportacaoSpotifySerializer, SpotifyCapsulaSerializer, SpotifyResumoSerializer...)
├── Service/        Audio, Categoria, Dashboard, Distribuicao, GoogleFotos,
│                   Ingestao, LivroAudio, MediaItem, OrigemRegra, Seguranca, Spotify, Usuario e Video
├── Support/        Utilitários, como MetadataKeys
├── Schedule.php    Rotinas do Scheduler
└── Kernel.php
```

## `DefaultController`

Controllers de API estendem `App\Controller\Common\DefaultController`.

| Método | HTTP | JSON |
| :--- | :--- | :--- |
| `$this->success($data)` | 200 | `{ success: true, data }` |
| `$this->created($data)` | 201 | `{ success: true, data }` |
| `$this->noContent()` | 204 | vazio |
| `$this->unprocessable(...)` | 422 | Erro de validação |
| `$this->error('codigo', $status, $details?)` | 4xx | `{ success: false, error, details? }` |
| `$this->paginated($itens, $total, $pagina, $porPagina)` | 200 | `{ success, data, total, pagina, porPagina }` |

## API

Prefixo: `/api/v1`. Salvo indicação, as rotas exigem JWT.

### Sistema e autenticação

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/health` | Público; banco e disco |
| `POST` | `/auth/login` | Público; login |
| `POST` | `/token/refresh` | Público; renova o token |
| `GET` | `/auth/me` | Usuário atual |

### Mídias

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/media-itens` | Lista com filtros |
| `GET` | `/media-itens/contagens` | Contadores por aba |
| `POST` | `/media-itens/upload` | Upload manual |
| `POST` | `/media-itens/edicoes` | Salva edição do editor |
| `POST` | `/media-itens/retentar` | Retenta todos os erros |
| `POST` | `/media-itens/lote/categorizar` | Categoriza em lote |
| `POST` | `/media-itens/lote/remover-categoria` | Remove categoria em lote |
| `POST` | `/media-itens/lote/rebaixar` | Rebaixa em lote |
| `POST` | `/media-itens/lote/apagar` | Apaga em lote |
| `POST` | `/media-itens/lote/distribuir-horarios` | Distribui datas |
| `GET`, `PATCH` | `/media-itens/{uuid}` | Detalhe e edição |
| `PATCH` | `/media-itens/{uuid}/categoria` | Categoriza |
| `POST` | `/media-itens/{uuid}/retentar` | Retenta |
| `POST` | `/media-itens/{uuid}/rebaixar` | Rebaixa |
| `POST` | `/media-itens/{uuid}/forcar-google-fotos` | Força o envio |
| `GET` | `/media-itens/{uuid}/stream` | Reprodução |
| `GET` | `/media-itens/{uuid}/thumbnail` | Miniatura |
| `GET` | `/media-itens/{uuid}/download` | Download |

### Downloads, áudio e ingestão

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/downloads` | Baixa um vídeo de forma síncrona (`url`, `categoriaId?`) |
| `GET`, `POST` | `/audios` | Lista ou pede um áudio |
| `POST` | `/audios/{uuid}/rebaixar` | Baixa de novo |
| `DELETE` | `/audios/{uuid}` | Apaga |
| `GET` | `/audios/{uuid}/arquivo` | Baixa o MP3 |
| `GET` | `/audios/{uuid}/stream` | Reproduz |
| `POST` | `/ingestao/print` | Recebe um print; exige `ROLE_AGENTE` |

### Livros em áudio

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/livros-audio` | Lista os livros do usuário |
| `POST` | `/livros-audio` | Upload de PDF de livro |
| `GET` | `/livros-audio/{uuid}` | Detalhes do livro |
| `PUT` | `/livros-audio/{uuid}/posicao` | Salva o marcador de leitura (página/bloco/segundos) |
| `DELETE` | `/livros-audio/{uuid}` | Apaga o livro e arquivos |
| `PUT` | `/livros-audio/{uuid}/narracao` | Salva notas e pronúncia e refaz a narração |
| `GET` | `/livros-audio/{uuid}/marcacoes` | Lista marcadores, destaques e notas |
| `POST` | `/livros-audio/{uuid}/marcacoes` | Cria marcador, destaque ou nota |
| `PATCH` | `/livros-audio/{uuid}/marcacoes/{marcacao}` | Altera a nota |
| `DELETE` | `/livros-audio/{uuid}/marcacoes/{marcacao}` | Apaga a marcação |
| `GET` | `/livros-audio/{uuid}/pdf` | Serve o arquivo PDF original |
| `GET` | `/livros-audio/{uuid}/blocos` | Lista os blocos e capítulos de áudio gerados |
| `GET` | `/livros-audio/{uuid}/blocos/{numeroBloco}/stream` | Reproduz o bloco de áudio (suporta Range; `?voz=` para outra voz) |
| `GET` | `/livros-audio/{uuid}/blocos/{numeroBloco}/trechos` | Frases do bloco com tempos e palavras (`?voz=`) |
| `GET` | `/livros-audio/{uuid}/vozes` | Vozes do livro e status |
| `POST` | `/livros-audio/{uuid}/vozes` | Gera o livro em outra voz |
| `DELETE` | `/livros-audio/{uuid}/vozes/{voz}` | Apaga uma voz adicional |
| `GET` | `/livros-audio/vozes/{voz}/amostra` | Amostra curta da voz |
| `GET` | `/livros-audio/{uuid}/links` | Links assinados das partes prontas |
| `GET` | `/livros-audio/{uuid}/pdf/link` | Link assinado do PDF |
| `GET` | `/livros-audio/vozes/amostras` | Links assinados das amostras |
| `GET` | `/livros-audio-arquivos/...` | Áudio, PDF e amostras por link assinado (público, valida `UriSigner`) |
| `GET` | `/livros-audio/fila` | Fila de geração com previsão |
| `POST` | `/livros-audio/{uuid}/fila/pausar\|retomar\|priorizar` | Controla a fila do livro |
| `POST` | `/livros-audio/{uuid}/escuta` | Soma segundos ouvidos |
| `GET` | `/livros-audio/estatisticas` | Tempo ouvido, meta e "continuar ouvindo" |
| `PUT` | `/livros-audio/meta` | Altera a meta diária |
| `GET` | `/livros-audio/disco` | Espaço livre e nível do alerta |

### Transcrições

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/transcricoes` | Lista paginada (`busca`, `filtro`, `pagina`, `limite`) |
| `GET` | `/transcricoes/resumo` | Números da conta e previsão da fila |
| `POST` | `/transcricoes` | Envia um áudio (multipart `arquivo`, `idioma`) |
| `GET` | `/transcricoes/{uuid}` | Detalhe com texto e trechos |
| `PATCH` | `/transcricoes/{uuid}` | Renomeia e favorita |
| `POST` | `/transcricoes/{uuid}/reprocessar` | Transcreve de novo (`idioma` opcional) |
| `DELETE` | `/transcricoes/{uuid}` | Apaga a transcrição e o áudio |
| `GET` | `/transcricoes/{uuid}/audio` | Áudio original (aceita `?token=`) |

### Spotify: análises

Períodos aceitos por `habitos` e `descobertas`: `periodo` = `todos`, `ano` (`ano`), `mes` (`ano`, `mes`), `dias` (`dias`) ou `intervalo`. Resultados ficam em cache por usuário (`CacheAnaliseSpotifyService`, tag `spotify_analise_{id}`), invalidado em coleta, importação e desconexão.

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/spotify/artistas/detalhe?artista=` | Detalhe do artista (404 sem reproduções) |
| `GET` | `/spotify/musicas/detalhe?nome=&artista=` | Detalhe da música (404 sem reproduções) |
| `GET` | `/spotify/habitos` | Mapa dia × hora, concentração, pulos e aleatório |
| `GET` | `/spotify/recordes` | Sequências, recordes e totais de todos os tempos |
| `GET` | `/spotify/evolucao?meses=` | Minutos e streams por mês (12, 24 ou 60) e comparação com o mesmo mês |
| `GET` | `/spotify/descobertas` | Artistas e músicas novos, redescobertas e obsessões |
| `GET` | `/spotify/retrospectiva/{ano}` | Resumo do ano |
| `GET` | `/spotify/tocando-agora` | Faixa atual (sem cache) |
| `GET` | `/spotify/ranking?tipo=todos` | Ranking de todos os tempos; a resposta traz também `topAlbuns` |

### Categorias e regras

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET`, `POST` | `/categorias` | Lista ou cria |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/categorias/{uuid}` | Detalhe, edição e remoção |
| `PATCH` | `/categorias/{uuid}/album` | Vincula álbum |
| `GET`, `POST` | `/origem-regras` | Lista ou cria |
| `GET`, `PUT`, `DELETE` | `/origem-regras/{uuid}` | Detalhe, edição e remoção |

### Dashboard e sincronização

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/dashboard/resumo` | Métricas gerais |
| `GET` | `/dashboard/categorias` | Métricas por categoria |
| `GET` | `/dashboard/erros` | Fila de erros |
| `GET` | `/dashboard/livros` | Armazenamento, memória e fila dos livros em áudio |
| `POST` | `/dashboard/erros/retentar` | Retenta os erros |
| `GET` | `/sync/pastas` | Estado do Syncthing |
| `POST` | `/sync/pastas/{id}/sincronizar` | Dispara o rescan |

### Google Fotos

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/google-fotos/status` | Estado da conexão |
| `GET` | `/google-fotos/oauth/url` | URL de consentimento |
| `POST` | `/google-fotos/oauth/concluir` | Conclui o OAuth |
| `POST` | `/google-fotos/desconectar` | Desconecta |
| `GET` | `/google-fotos/albuns` | Álbuns e vínculos |
| `GET` | `/google-fotos/envios` | Histórico |
| `GET` | `/google-fotos/envios/resumo` | Contadores |
| `POST` | `/google-fotos/envios/{uuid}/reenviar` | Reenvia |

## Entidades e enums

Entidades: `Audio`, `Categoria`, `ContaGoogleFotos`, `LivroAudio`, `LivroAudioBloco`, `LivroAudioBlocoVoz`, `MarcacaoLivroAudio`, `EscutaLivroAudioDia`, `MediaItem`, `OrigemRegra`, `RefreshToken`, `RegistroEnvioGoogleFotos`, `TokenAgente` e `Usuario`. O modelo está em [CIRQUEIRAX.md](../funcionalidades/CIRQUEIRAX.md#5-modelo-de-dados).

| Enum | Valores |
| :--- | :--- |
| `OrigemMedia` | `print_empresa`, `print_pessoal`, `bot_telegram`, `download`, `manual` |
| `StatusMediaItem` | `recebido`, `em_fila`, `sem_categoria`, `classificado`, `distribuindo`, `baixando`, `distribuido_local`, `enviando_google_fotos`, `concluido`, `erro`, `arquivo_removido`, `arquivo_expurgado` |
| `StatusAudio` | `pendente`, `baixando`, `disponivel`, `erro`, `expirado` |
| `StatusLivroAudio` | `enviado`, `extraindo`, `gerando_audio`, `parcial`, `pronto`, `erro` |
| `StatusLivroAudioBloco` | `pendente`, `gerando`, `pronto`, `erro` |
| `ModoNotasLivroAudio` | `normal`, `fim_capitulo`, `pular` |
| `TipoMarcacaoLivroAudio` | `marcador`, `destaque`, `nota` |
| `VozNarracao` | `pt-BR-AntonioNeural`, `pt-BR-FranciscaNeural`, `pt-BR-ThalitaMultilingualNeural`, `pt-PT-DuarteNeural`, `pt-PT-RaquelNeural`, `en-US-AndrewMultilingualNeural`, `en-US-BrianMultilingualNeural`, `en-US-AvaMultilingualNeural`, `en-US-EmmaMultilingualNeural` |
| `StatusEnvioGoogleFotos` | `enviado`, `reaproveitado`, `falha` |
| `OrigemEnvioGoogleFotos` | `automatico`, `retentativa`, `reenvio_manual`, `forcado` |
| `TipoCliente` | `usuario`, `agente` |

`PlataformaVideo` identifica as plataformas de vídeo.

## Comandos de console

| Comando | Função |
| :--- | :--- |
| `app:seed` | Popula dados iniciais |
| `app:seed:origem-regras` | Cria categorias e regras padrão (`--usuario`) |
| `app:usuario:criar` | Cria usuário |
| `app:agente:gerar-token` | Gera token de agente (`--usuario`) |
| `app:jwt:master` | Gera JWT administrativo |
| `app:google-fotos:autorizar-conta` | Autoriza a conta Google (`--usuario`) |
| `app:google-fotos:enviar` | Envia pendentes |
| `app:google-fotos:limpar-duplicados-franky` | Trata duplicados do Franky (`--usuario`) |
| `app:media:limpar-videos-antigos` | Limpa vídeos (`--dias`, `--dry-run`) |
| `app:media:rebaixar` | Rebaixa mídias |
| `app:media:retentar` | Retenta mídias com erro |
| `app:media:indexar-metadados` | Indexa metadados antigos |
| `app:cron:heartbeat` | Teste de agendamento |

## Regras de ouro

1. **Envelope HTTP:** controllers de API estendem `DefaultController` e respondem com seus métodos.
2. **Early return:** ordene as validações do custo menor para o maior: local, banco, API externa.
3. **Serializer obrigatório:** nunca devolva uma entidade diretamente.
4. **Readonly:** use `readonly` em DTOs e propriedades imutáveis.

## Banco de dados

```bash
make doctrine-diff      # Gera migration a partir do schema
make migrate            # Aplica migrations pendentes
make doctrine-validate  # Valida mappings e schema
make rollback           # Reverte a última migration (só em dev)
```

## Qualidade

```bash
make phpstan
make check-naming
make fix-php
```
