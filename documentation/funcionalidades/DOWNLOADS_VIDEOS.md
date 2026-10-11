# Funcionalidade: Download e Triagem de Vídeos

O módulo de **Downloads de Vídeos** do CirqueiraX gerencia o download automatizado de vídeos da internet (TikTok, YouTube Shorts, Twitter/X, Instagram, etc.), a extração de metadados, a visualização com player embutido, a edição de horários e a distribuição para as pastas do Syncthing.

---

## 1. Fluxo de Vida do Download

```
[ Usuário cola URL no /downloads ] ──► (Opcional: escolhe Categoria)
                    │
                    ▼
         POST /api/v1/downloads
                    │
                    ▼
      Enfileira BaixarVideoMessage (Messenger)
                    │
                    ▼
          [ Worker em Background ]
                    │
    ├─ 1. Extração de Metadata (yt-dlp --dump-json)
    │     Título, Uploader, Duração, Thumbnail, Data original
    │
    ├─ 2. Download do Arquivo (.mp4)
    │     Salva temporariamente em: var/storage/downloads/<id>.mp4
    │     (Protegido por .stignore para NÃO sincronizar antes da triagem)
    │
    ├─ 3. Ingestão do MediaItem no Banco
    │     Cálculo de SHA-256 para deduplicação
    │
    └─ 4. Classificação:
          ├─ Se categoria informada: Classifica e distribui para pasta final
          └─ Se não informada: Fica como 'sem_categoria' aguardando triagem
```

---

## 2. Tecnologias Envolvidas

- **`yt-dlp`**: Extrator universal de mídia em linha de comando integrado via [`YtDlpClient`](file:///home/gabriel/dev/CirqueiraX/src/Infra/YtDlp/YtDlpClient.php).
- **Formato Padronizado**: Configurado com seletor de formato preferencial:
  ```text
  bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best
  ```
- **Assincronismo**: O endpoint responde em milissegundos com status HTTP 202/201 enquanto o worker processa o download em background.

---

## 3. Recursos na Interface Web (`/downloads`)

### 3.1. Campo Novo Link
- Suporta colar URLs diretamente com validação instantânea de plataforma.
- Menu suspenso para definir a categoria no momento da submissão ou deixar sem categoria para triagem posterior.

### 3.2. Visualização em Grid vs. Tabela
- **Grid de Cards**:
  - Miniatura com tempo de duração no canto inferior direito.
  - Hover dinâmico revelando o player de vídeo HTML5 integrado com controles de reprodução.
  - Badges coloridos indicando o status do item (`Baixado`, `Distribuído`, `Processando`, `Erro`).
- **Tabela**:
  - Linhas compactas para gerenciar grandes volumes de itens.
  - Colunas com título, uploader, duração, data de captura, tamanho em bytes e ações.

### 3.3. Edição de Metadados e Distribuição de Horários
1. **Modal de Edição Individual (`ModalEditarMetadata.tsx`)**:
   - Permite ajustar título, uploader, data e hora da captura do vídeo.
2. **Distribuição de Horários em Lote (`ModalDistribuirHorariosLote.tsx`)**:
   - Selecione múltiplos vídeos com as caixas de seleção.
   - Abra a ação **"Distribuir Horários"** na barra inferior.
   - Defina a data/hora inicial e o intervalo entre postagens (ex: a cada 30 minutos ou 1 hora).
   - O sistema calcula e salva os horários escalonados para todos os vídeos selecionados de uma só vez.

### 3.4. Barra de Ações em Lote (`BarraAcoesEmLote.tsx`)
Quando um ou mais vídeos estão selecionados:
- **Categorizar**: Atribui uma categoria em lote para todos os vídeos selecionados, disparando a cópia para a respectiva subpasta do Syncthing.
- **Distribuir Horários**: Abre o modal de distribuição cronológica.
- **Rebaixar**: Remove o arquivo físico e reinjeta o job de download para baixar novamente.
- **Apagar**: Remove o registro do banco e o arquivo do storage.

---

## 4. Pastas Físicas e Sincronização

1. **Armazenamento Inicial**:
   O download bruto vai para `var/storage/downloads/`. O arquivo `.stignore` impede que esse diretório seja transmitido pelo Syncthing antes da triagem.
2. **Transferência para a Pasta Final**:
   Ao categorizar o vídeo (ex: `One Piece`), o serviço `DistribuirLocalService` copia o arquivo para:
   ```
   ~/cirqueirax/sync_media/videos/onepiece/<arquivo>.mp4
   ```
3. **Detecção do Syncthing**:
   O Syncthing identifica o novo arquivo na subpasta categorizada e replica automaticamente para o celular e demais dispositivos pareados.
