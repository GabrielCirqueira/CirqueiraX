# Funcionalidade: Prints e Capturas

O módulo de **Prints** recebe capturas de tela enviadas pelo [Agente](AGENTE.md), classifica automaticamente pela origem e exibe tudo em uma galeria no estilo Google Fotos.

---

## 1. Fluxo

```
[ PC da empresa ]               [ PC pessoal ]
 (print_empresa)                (print_pessoal)
        │                              │
        └─────────── agente ───────────┘
                       │ POST /api/v1/ingestao/print
                       │ X-Agent-Token: cx_ag_...
                       ▼
                 Backend CirqueiraX
                       │
     ├─ Autentica e identifica a origem pelo token
     ├─ IngestarPrintService: temporário em cirqueirax_prints
     │  nome print_YYYYMMDD_His_<hex>.<ext>
     ├─ Dedupe e ingestão
     └─ ClassificarMediaMessage: OrigemRegra ──► categoria Prints
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
   Copia para prints/      Envia ao álbum no Google Fotos
   (Syncthing replica)
```

A rota exige `ROLE_AGENTE` e usa o limitador `ingestao`, de 300 requisições por minuto.

---

## 2. Origens e pasta única

Prints da empresa e pessoais ficam na mesma pasta, `prints/`. A diferença é mantida no campo `origem` (`print_empresa` ou `print_pessoal`).

A tela `/prints` consulta com `origem=prints`, que reúne as duas origens. Hoje não há filtro para separá-las nessa tela.

---

## 3. Galeria (`/prints`)

- 20 itens por página.
- Visões em grade e lista.
- Busca e filtros por status e categoria.
- Seleção múltipla, com categorizar e apagar em lote.

### Ações em cada print

| Ação | Comportamento |
| :--- | :--- |
| **Copiar** | Grava a imagem na área de transferência com `navigator.clipboard.write` |
| **Baixar** | Baixa o arquivo original |
| **Categorizar** | Move para outra categoria |
| **Editar** | Abre no [Editor de Imagem](EDITOR_IMAGEM.md) |
| **Excluir** | Remove registro e arquivo |
| **Visualizar** | Abre `ModalVisualizarPrint` |

---

## 4. Instalação do agente

Veja [AGENTE.md](AGENTE.md). Em resumo:

```bash
make agente-token ARGS="\"PC Empresa\" print_empresa"
make agente-token ARGS="\"PC Pessoal\" print_pessoal"
```

Cada máquina recebe o próprio token, que define a origem dos prints dela.
