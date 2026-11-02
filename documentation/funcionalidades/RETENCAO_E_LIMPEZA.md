# Funcionalidade: Retenção, Limpeza e Rebaixar

Vídeos e áudios ocupam muito disco. O CirqueiraX limpa o servidor automaticamente, mantém o registro das mídias e permite baixar de novo quando necessário.

---

## 1. Limpeza de vídeos

`LimparVideosAntigosService` remove vídeos com mais de 7 dias.

### O que é removido

Somente **vídeos** que estão fora da pasta sincronizada. A proteção existe em duas camadas:

1. `MediaItemRepository::buscarVideosParaLimpezaDoSistema` já exclui esses caminhos da consulta.
2. `isPastaSincronizadaComCelular` confere de novo cada item e ignora caminhos com `/var/storage/`, `sync_media/` ou `/var/syncthing/`.

Imagens e prints nunca são tocados.

### O que acontece com cada vídeo

1. Garante a miniatura em `var/cache/thumbnails/{uuid}.jpg`.
2. Apaga o arquivo físico.
3. Guarda em `metadata` o caminho anterior, a data da remoção e o tamanho.
4. Limpa `caminhoLocal` e muda o status para `arquivo_removido`.

Registro, histórico, título e capa continuam visíveis na interface.

### Arquivos soltos

A rotina também apaga de `var/downloads` arquivos de vídeo (`mp4`, `mkv`, `webm`, `mov`, `avi`) mais antigos que o limite. Isso inclui arquivos sem registro no banco, como downloads interrompidos.

---

## 2. Expiração de áudios

`ExpirarAudiosAntigosMessage` remove MP3 com mais de 7 dias e marca os registros como `expirado`. A mesma rotina transforma em `erro` os áudios presos há mais de 1 hora. Veja [DOWNLOADS_AUDIO.md](DOWNLOADS_AUDIO.md).

---

## 3. Quando as rotinas rodam

O agendamento de produção é o Symfony Scheduler, em `src/Schedule.php`, consumido pelo processo `scheduler` do Supervisor:

| Mensagem | Frequência |
| :--- | :--- |
| `LimparVideosAntigosMessage(7)` | A cada 1 dia |
| `ExpirarAudiosAntigosMessage` | A cada 1 dia |

O schedule é `stateful` e usa `processOnlyLastMissedRun(true)`: depois de um período parado, executa apenas uma vez a rodada perdida.

O arquivo `devops/crontab` também prevê uma limpeza aos domingos às 03:00, mas a imagem de produção não inicia um processo de cron. Portanto, em produção, considere apenas o Scheduler.

### Execução manual

```bash
php bin/console app:media:limpar-videos-antigos --dias=7 --dry-run
php bin/console app:media:limpar-videos-antigos --dias=7
```

Use `--dry-run` para simular sem apagar nada.

---

## 4. Rebaixar

Baixa de novo o vídeo de um item, por exemplo depois da limpeza.

- **Individual:** síncrono, com `set_time_limit(300)`.
- **Em lote:** assíncrono, com uma `RebaixarMediaItemMessage` por item.

### Destino do arquivo

1. Pasta da categoria.
2. Pasta anterior, se não houver categoria.
3. `videos/`, como último recurso.

### Garantias

- **As datas não mudam:** os metadados e a data do arquivo são preservados, o que evita nova sincronização ou reordenação no celular.
- **Sem envio repetido:** só envia ao Google Fotos se a categoria tiver álbum e o item ainda não tiver sido enviado. Itens importados do Franky também não são reenviados.
- O status final é `concluido`.

Se o envio ao Google Fotos não encontrar o arquivo, `EnviarGoogleFotosService` também tenta rebaixá-lo automaticamente.

### Comando

```bash
php bin/console app:media:rebaixar
```
