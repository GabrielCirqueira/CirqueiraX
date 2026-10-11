#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DRY_RUN=false
USE_DIFF=false
PATHS=()

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --diff)    USE_DIFF=true ;;
    -h|--help)
      echo "Uso: $0 [--dry-run] [--diff] [arquivos ou pastas...]"
      exit 0
      ;;
    -*)
      echo "Flag desconhecida: $arg" >&2
      exit 1
      ;;
    *)
      PATHS+=("$arg")
      ;;
  esac
done

if ! command -v perl >/dev/null 2>&1; then
  echo "perl não encontrado." >&2
  exit 1
fi

if [[ ${#PATHS[@]} -gt 0 ]]; then
  echo "Modo: caminhos especificados (${PATHS[*]})"
  mapfile -t FILES < <(
    for p in "${PATHS[@]}"; do
      if [[ -f "$p" ]]; then
        realpath "$p"
      elif [[ -d "$p" ]]; then
        find "$p" \
          \( -name "*.php" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.sh" -o -name "*.yaml" -o -name "*.yml" \) \
          -not -path "*/vendor/*" \
          -not -path "*/node_modules/*" \
          -not -path "*/.git/*" \
          -not -path "*/var/*" \
          -not -path "*/build/*" \
          -not -path "*/dist/*" \
          -not -path "*/.venv/*" \
          -not -path "*/__pycache__/*" \
          -not -path "*/.ruff_cache/*"
      fi
    done | sort -u
  )
elif $USE_DIFF; then
  if ! git -C "$ROOT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
    echo "Não é um repositório git." >&2
    exit 1
  fi
  echo "Modo: arquivos staged (git diff --cached)"
  mapfile -t FILES < <(
    git -C "$ROOT_DIR" diff --cached --name-only \
      | while read -r f; do
          full="$ROOT_DIR/$f"
          [[ -f "$full" ]] && echo "$full"
        done \
      | sort
  )
else
  echo "Modo: pastas do projeto (src, web, migrations, agente, scripts)"
  SEARCH_DIRS=()
  for d in "$ROOT_DIR/src" "$ROOT_DIR/web" "$ROOT_DIR/migrations" "$ROOT_DIR/agente" "$ROOT_DIR/scripts"; do
    [[ -d "$d" ]] && SEARCH_DIRS+=("$d")
  done

  mapfile -t FILES < <(
    find "${SEARCH_DIRS[@]}" \
      \( -name "*.php" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \) \
      -not -path "*/vendor/*" \
      -not -path "*/node_modules/*" \
      -not -path "*/.git/*" \
      -not -path "*/var/*" \
      -not -path "*/build/*" \
      -not -path "*/dist/*" \
      -not -path "*/.venv/*" \
      -not -path "*/__pycache__/*" \
      -not -path "*/.ruff_cache/*" \
      | sort
  )
fi

changed=0

for FILE in "${FILES[@]}"; do
  # Não modifica a si mesmo nem arquivos de exemplo/template
  [[ "$FILE" == "$ROOT_DIR/cli/remove-comments.sh" ]] && continue
  [[ "$FILE" =~ \.example($|\.) ]] && continue

  ORIG=$(<"$FILE")
  EXT="${FILE##*.}"

  case "$EXT" in
    yaml|yml|env|conf|ini)
      NEW=$(perl -0777 -pe '
        # Preserva shebang (primeira linha #!/...)
        s/\A(#![^\n]*\n)//; my $shebang = $1 // q{};
        # Linhas inteiras de comentário #
        s/^[ \t]*#[^\n]*\n//gm;
        # Comentário inline # precedido de espaço
        s/[ \t]+#[^\n]*$//gm;
        # Colapsa linhas em branco consecutivas em no máximo uma
        s/\n{3,}/\n\n/g;
        $_ = $shebang . $_;
      ' "$FILE")
      ;;
    sh|bash)
      NEW=$(perl -0777 -pe '
        # Preserva shebang (primeira linha #!/...)
        s/\A(#![^\n]*\n)//; my $shebang = $1 // q{};
        # Linhas inteiras de comentário #
        s/^[ \t]*#[^\n]*\n//gm;
        # Comentário inline # precedido de espaço
        s/[ \t]+#[^\n]*$//gm;
        # Colapsa linhas em branco consecutivas em no máximo uma
        s/\n{3,}/\n\n/g;
        $_ = $shebang . $_;
      ' "$FILE")
      ;;
    php|ts|tsx|js|jsx)
      NEW=$(perl -0777 -pe '
        # Linhas inteiras {/* ... */} (JSX, single-line) - Pula se biome-ignore
        s/[ \t]*\{\/\*(?!\s*biome-ignore).*?\*\/\}[ \t]*\n//gm;

        # Trechos inline {/* ... */} - Pula se biome-ignore
        s/[ \t]*\{\/\*(?!\s*biome-ignore).*?\*\/\}//g;
        # Linhas inteiras de comentário // - Pula se biome-ignore
        s/^[ \t]*\/\/(?!\s*biome-ignore)[^\n]*\n//gm;
        # Comentário inline // no final (não casa :// de URLs nem /// nem biome-ignore)
        s/(?<!:)[ \t]+\/\/(?!\/)(?!\s*biome-ignore).*$//gm;
        # Colapsa linhas em branco consecutivas em no máximo uma
        s/\n{3,}/\n\n/g;
      ' "$FILE")
      ;;
    py)
      if command -v python3 >/dev/null 2>&1; then
        NEW=$(python3 -c '
import io, re, sys, tokenize, ast

caminho = sys.argv[1]
try:
    with open(caminho, "r", encoding="utf-8") as f:
        codigo = f.read()
except Exception:
    sys.exit(0)

try:
    tokens = list(tokenize.tokenize(io.BytesIO(codigo.encode("utf-8")).readline))
except Exception:
    sys.stdout.write(codigo)
    sys.exit(0)

linhas = codigo.splitlines(keepends=True)
modificacoes = []
for t in tokens:
    if t.type != tokenize.COMMENT:
        continue
    # Preserva shebang na primeira linha
    if t.start[0] == 1 and t.string.startswith("#!"):
        continue
    # Preserva diretivas de linters/formatadores
    if re.search(r"#\s*(noqa|type:\s*ignore|pragma:|fmt:|pyright:)", t.string, re.IGNORECASE):
        continue
    modificacoes.append(t)

res = list(linhas)
for tok in reversed(modificacoes):
    idx = tok.start[0] - 1
    col = tok.start[1]
    if idx < len(res):
        antes = res[idx][:col]
        if antes.strip() == "":
            res[idx] = ""
        else:
            res[idx] = antes.rstrip() + "\n"

novo = "".join(res)
novo = re.sub(r"\n{3,}", "\n\n", novo)

try:
    ast.parse(novo)
    sys.stdout.write(novo)
except Exception:
    # Se falhar qualquer validação de sintaxe, mantém intacto por segurança
    sys.stdout.write(codigo)
' "$FILE")
      else
        echo "python3 não encontrado, pulando $FILE" >&2
        continue
      fi
      ;;
    *)
      continue
      ;;
  esac

  if [[ "$NEW" != "$ORIG" ]]; then
    REL="${FILE#"$ROOT_DIR"/}"
    if $DRY_RUN; then
      echo "[dry-run] $REL"
    else
      printf '%s\n' "$NEW" > "$FILE"
      echo "  $REL"
    fi
    changed=$((changed + 1))
  fi
done

echo ""
if $DRY_RUN; then
  echo "✓ (dry-run) $changed arquivo(s) seriam alterados."
else
  echo "✓ $changed arquivo(s) alterados."
fi
