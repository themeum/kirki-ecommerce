#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

trap 'echo "Error: make-pot failed at line $LINENO: $BASH_COMMAND" >&2' ERR

TEXT_DOMAIN="kirki-ecommerce"
POT_FILE="languages/$TEXT_DOMAIN.pot"
JS_STAGE_DIR="build/pot-js"
ESBUILD="$ROOT_DIR/resources/app/node_modules/.bin/esbuild"
INCLUDES="kirki-ecommerce.php,app,bootstrap,config,database,routes,resources/views,resources/data,resources/app,resources/site"
EXCLUDES="vendor,node_modules,build,assets,tests,docker,payments,openspec,docs,kirki-test,dev-tools,sidebar-references,wpcli"

# WP-CLI's string extractor reads .js and .jsx only, so the TypeScript sources
# are transpiled into a staging folder first and merged into the PHP template.
cleanup() {
  rm -rf "$ROOT_DIR/$JS_STAGE_DIR"
}
trap cleanup EXIT

wp_cli() {
  if command -v wp > /dev/null 2>&1; then
    php -d memory_limit=1G "$(command -v wp)" "$@"
  else
    docker run --rm \
      -v "$ROOT_DIR":/code \
      -w /code \
      wordpress:cli \
      php -d memory_limit=1G /usr/local/bin/wp --allow-root "$@"
  fi
}

if [ ! -x "$ESBUILD" ]; then
  echo "Error: esbuild not found. Run 'npm ci' in resources/app first." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/languages"

rm -f "$POT_FILE"
rm -rf "$JS_STAGE_DIR"

echo "==> Extracting PHP strings"
wp_cli i18n make-pot . "$POT_FILE" \
  --slug="$TEXT_DOMAIN" \
  --domain="$TEXT_DOMAIN" \
  --package-name="Kirki eCommerce" \
  --include="$INCLUDES" \
  --exclude="$EXCLUDES" \
  --skip-js

echo "==> Transpiling TypeScript sources"
find resources/app resources/site/ts \
  -type d \( -name node_modules -o -name tests \) -prune -o \
  -type f \( -name '*.ts' -o -name '*.tsx' \) \
  ! -name '*.d.ts' ! -name '*.test.*' -print0 |
  xargs -0 "$ESBUILD" \
    --outdir="$JS_STAGE_DIR" \
    --outbase=. \
    --format=esm \
    --log-level=error

echo "==> Extracting TypeScript strings"
wp_cli i18n make-pot "$JS_STAGE_DIR" "$POT_FILE" \
  --slug="$TEXT_DOMAIN" \
  --domain="$TEXT_DOMAIN" \
  --package-name="Kirki eCommerce" \
  --include="$INCLUDES" \
  --merge="$POT_FILE" \
  --skip-php

echo "==> POT file created: $POT_FILE"
