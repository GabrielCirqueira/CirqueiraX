# Funcionalidade: Upload Manual de Mídias

O módulo de **Upload Manual** permite enviar arquivos avulsos de imagens e vídeos diretamente pelo navegador para a biblioteca central do CirqueiraX, com validação de formato, barra de progresso em tempo real e encaminhamento automático para o pipeline de distribuição e backup.

---

## 1. Visão Geral do Fluxo

```
[ Usuário arrasta arquivos para o Dropzone ]
                    │
                    ▼
       Validação no Cliente (MIME type e tamanho)
                    │
                    ▼
     POST /api/v1/media-itens/upload-manual
     (multipart/form-data com barra de progresso)
                    │
                    ▼
          [ Backend Symfony ]
                    │
    ├─ 1. Validação de Extensão e MIME real (finfo)
    ├─ 2. Cálculo de Hash SHA-256 e Deduplicação
    ├─ 3. Gravação no Storage Local (var/storage/)
    ├─ 4. Criação do MediaItem (origem: upload_manual)
    │
    └─ 5. Disparo do Messenger Worker:
          ├─ Se categoria informada: Classifica, distribui local e envia pro Google Fotos
          └─ Se não informada: Fica como 'sem_categoria' para triagem
```

---

## 2. Formatos e Limites Suportados

### 2.1. Tipos MIME Permitidos
- **Imagens**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- **Vídeos**: `video/mp4`, `video/webm`, `video/quicktime` (.mov), `video/x-msvideo` (.avi), `video/mkv`, `video/x-matroska`.

### 2.2. Limites de Upload
- Limite configurável no PHP e Nginx: padrão de até **500 MB** por arquivo.
- Deduplicação inteligente: se você enviar uma foto ou vídeo que já existe no sistema, o CirqueiraX detecta pelo hash SHA-256 e retorna o registro já existente sem duplicar espaço em disco.

---

## 3. Interface Web (`/upload`)

A tela de upload manual conta com:

1. **Área de Dropzone Reativa**:
   - Arraste múltiplos arquivos diretamente da sua área de trabalho ou explorador de arquivos.
   - Pré-visualização de miniaturas (thumbnails) geradas localmente pelo navegador antes do envio.
2. **Seletor de Categoria Prévia**:
   - Permite escolher para onde as mídias devem ir antes de subir (ex: `Prints`, `videos/memes`, `Shingeki no Kyojin`, etc.).
   - Se nenhuma categoria for selecionada, os arquivos entram como `sem_categoria` e podem ser organizados depois.
3. **Barra de Progresso Individual e Geral**:
   - Utiliza a propriedade `onUploadProgress` do Axios para exibir porcentagem de envio real e velocidade estimada.
4. **Resumo Pós-Envio**:
   - Exibe a lista de itens enviados com sucesso, links diretos para visualização e contagem de itens duplicados detectados.
