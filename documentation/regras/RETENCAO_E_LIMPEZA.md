# Política de Retenção e Limpeza de Disco

> Diretrizes e políticas de ciclo de vida de armazenamento para mídias, áudios efêmeros e livros em áudio no CirqueiraX.

---

## 1. Visão Geral das Políticas de Retenção

| Módulo | Tipo de Conteúdo | Volume / Caminho | Política de Retenção | Mecanismo de Limpeza |
| :--- | :--- | :--- | :--- | :--- |
| **Downloads de Vídeos** | Arquivos MP4 / WebM | `var/storage/downloads` | Conforme comando de expurgo (`--dias`) | `app:media:limpar-videos-antigos` |
| **Downloads de Áudios** | Arquivos MP3 efêmeros | `var/audios/` | 7 dias | `ExpirarAudiosAntigosService` via Scheduler |
| **Livros em Áudio** | PDFs e Blocos MP3 sintetizados | `var/livros/{uuid}/` | **Permanente** (sem expiração automática) | Remoção manual via endpoint ou interface |
| **Central de Mídias** | Imagens e Prints | `var/storage/` | Permanente ou vinculada a regras | Regras de classificação e expurgo |

---

## 2. Decisão Arquitetural — Livros em Áudio

### Por que livros em áudio não expiram automaticamente?
1. **Custo de Processamento e TTS:**
   A síntese de voz de um livro completo envolve centenas de requisições de texto para voz (edge-tts) e divisão estruturada de dezenas a centenas de blocos. Recriar esse acervo após 7 dias representaria um desperdício massivo de I/O e processamento.
2. **Ciclo de Consumo Longo:**
   Diferente de um clipe ou áudio musical curto, a leitura e escuta de um livro estende-se frequentemente por semanas ou meses. Um expurgo temporal quebraria a experiência do leitor e a sincronização do marcador de posição.
3. **Controle no Usuário:**
   O usuário tem total controle sobre sua biblioteca através do botão de exclusão e da visualização de espaço total ocupado por cada livro.

---

## 3. Limpeza Física e Exclusão Segura

Quando um livro em áudio é excluído (`DELETE /api/v1/livros-audio/{uuid}`):
1. **Expurgo Físico em Disco:**
   O serviço `ArmazenamentoLivroClient::removerLivro` varre recursivamente a pasta `var/livros/{uuid}/`, eliminando:
   - O arquivo PDF original (`{uuid}.pdf`).
   - O subdiretório de blocos (`blocos/`).
   - Todos os fragmentos sintetizados (`bloco_1.mp3`, `bloco_2.mp3`, ...).
   - Os áudios das vozes adicionais (`blocos/vozes/{voz}/`).
   - O diretório raiz do livro.
2. **Exclusão Lógica e Relacional:**
   No banco de dados relacional, as relações `LivroAudio` → `LivroAudioBloco` → `LivroAudioBlocoVoz` possuem `onDelete: CASCADE`, garantindo a remoção atômica de todos os blocos, vozes e metadados na mesma transação.

Ao remover só uma voz adicional (`DELETE /api/v1/livros-audio/{uuid}/vozes/{voz}`), são apagadas a pasta `blocos/vozes/{voz}/` e as linhas dessa voz. As amostras de voz em `var/livros/amostras/` são compartilhadas entre livros e não expiram.

---

## 4. Monitoramento e Saúde de Disco

Para evitar saturação de disco nos ambientes de desenvolvimento e produção:
- O endpoint `/api/v1/health` monitora independentemente:
  - Partição raiz do sistema (`disk`).
  - Volume de armazenamento de livros (`disk_livros`, apontando para `var/livros`).
- O status é degradado para `critical` (HTTP 503) se o espaço livre for inferior a **100 MB**, acionando alertas antes de indisponibilizar a sintetização de novos blocos.
