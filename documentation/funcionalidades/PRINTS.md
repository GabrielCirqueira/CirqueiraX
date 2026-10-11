# Funcionalidade: Captura, Ingestão e Galeria de Prints

O módulo de **Prints** é o sistema automatizado do CirqueiraX para capturar telas em computadores locais e corporativos, ingeri-las de forma transparente e organizá-las em uma galeria moderna e minimalista inspirada no Google Fotos.

---

## 1. Visão Geral da Arquitetura

```
[ Computador do Trabalho ]        [ Computador Pessoal ]
  (print_empresa)                  (print_pessoal)
         │                                │
         ▼                                ▼
   [ agente.py ]                    [ agente.py ]
         │                                │
         └────────────────┬───────────────┘
                          │ POST /api/v1/ingestao/print
                          │ Header: X-Agent-Token: cx_ag_...
                          ▼
             [ Backend CirqueiraX ]
                          │
     ├─ TokenAgenteAuthenticator valida e identifica a origem
     ├─ Calcula SHA-256 e deduplica
     ├─ OrigemRegra mapeia ambas as origens ──► Categoria 'Prints'
     │
     ├─ Salva em disco: ~/cirqueirax/sync_media/prints/print_<data>_<hash>.png
     │
     ├─ Syncthing detecta via fsWatcher ──► Sincroniza para o Celular
     │
     └─ Messenger worker ──► Upload para o Álbum 'Prints' no Google Fotos
```

---

## 2. Regra das Origens e Pasta Única

- **Pasta Única no Disco**: Não existem pastas separadas de trabalho e pessoal. Todas as capturas de tela são consolidadas em:
  ```
  sync_media/prints/
  ```
- **Diferenciação por Metadados no Banco de Dados**:
  A distinção entre prints da empresa e de casa é mantida no campo `origem` do banco (`print_empresa` vs `print_pessoal`).
- **Filtros e Badges na Interface**:
  Na galeria de prints, você pode filtrar apenas capturas do trabalho, apenas de casa ou visualizar todas juntas.

---

## 3. Galeria de Prints na Web (`/prints`)

A interface foi projetada com foco em **clareza visual e produtividade**:

### 3.1. Design Minimalista (Estilo Google Fotos)
- **Cards Limpos**: As imagens ocupam o espaço visual principal sem bordas pesadas ou poluição de botões estáticos.
- **Micro-ações no Hover**: Ao passar o cursor do mouse sobre o card, surgem ícones discretos e com cantos arredondados na parte inferior:
  - 📋 **Copiar Imagem**: Escreve o binário da imagem diretamente na área de transferência do sistema operacional (`navigator.clipboard.write`). Você pode colar imediatamente (`Ctrl + V`) no Discord, Slack, WhatsApp ou qualquer outro aplicativo.
  - ⬇️ **Download Direto**: Baixa o arquivo PNG original para o seu navegador.
  - 📁 **Categorizar**: Permite mover o print para outra categoria.
  - 🗑️ **Excluir**: Remove a captura do banco e do disco.

### 3.2. Visualizador em Tela Cheia (Lightbox)
- Ao clicar em qualquer print, ele se expande em um visualizador escuro de alta definição.
- Suporte a zoom, navegação por teclado (setas esquerda/direita para navegar entre prints) e visualização de metadados completos (data exata, resolução, tamanho e hash).

---

## 4. Agentes Clientes (`agente/agente.py`)

Para que as capturas cheguem ao servidor sem nenhuma intervenção manual:

1. **Gere o token de cada máquina no servidor**:
   ```bash
   make agente-token ARGS="\"PC Empresa\" print_empresa"
   make agente-token ARGS="\"PC Pessoal\" print_pessoal"
   ```
2. **Configure o `.env` do agente na máquina**:
   ```bash
   SERVER_URL=http://localhost:4010/api/v1/ingestao/print
   AGENT_TOKEN=cx_ag_...
   WATCH_DIR=/mnt/c/Users/<usuario>/Pictures/Screenshots # (ou ~/Pictures/Screenshots)
   ```
3. **Instale como serviço em segundo plano**:
   - No WSL2: `python3 agente.py install`
   - No Linux nativo: `./servico/instalar-servico-linux.sh`
   - No Windows nativo: `servico\instalar-servico-windows.bat`

Sempre que você pressionar a tecla de PrintScreen no sistema operacional, a imagem é detectada em menos de 3 segundos e despachada automaticamente.
