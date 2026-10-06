#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PLUGIN_SLUG="kirki-ecommerce"
POT_FILE="languages/$PLUGIN_SLUG.pot"

# JS strings come from the built bundles in assets/js, the same files that
# translate.wordpress.org scans. Their references then name the shipped scripts,
# which `wp i18n make-json` needs. The Vite configs keep the i18n calls readable
# there; see docs/translations.md.
REQUIRED_BUILD_FILES=(
  "assets/.vite/manifest.json"
  "assets/js/site.js"
)

# make-pot already skips node_modules, vendor, tests and *.min.js. These are
# the other paths that never ship in the wordpress.org package, including the
# payment gateway add-ons that the org build leaves out and the TypeScript
# sources of the bundles.
EXCLUDE_PATHS=(
  "build"
  "payments"
  "resources/app"
  "resources/site"
  "docker"
  "wpcli"
  "kirki-test"
  "openspec"
  "sidebar-references"
  "phpcs"
)

if ! command -v wp > /dev/null 2>&1; then
  echo "Error: WP-CLI ('wp') not found. Install it from https://wp-cli.org to generate $POT_FILE." >&2
  exit 1
fi

for build_file in "${REQUIRED_BUILD_FILES[@]}"; do
  if [ ! -f "$ROOT_DIR/$build_file" ]; then
    echo "Error: '$build_file' not found. Run a frontend build first ('npm run build' in resources/app and resources/site)." >&2
    exit 1
  fi
done

echo "==> Generating $POT_FILE"
mkdir -p "$ROOT_DIR/languages"
EXCLUDE_LIST="$(IFS=,; echo "${EXCLUDE_PATHS[*]}")"
wp i18n make-pot "$ROOT_DIR" "$ROOT_DIR/$POT_FILE" \
  --slug="$PLUGIN_SLUG" \
  --domain="$PLUGIN_SLUG" \
  --exclude="$EXCLUDE_LIST"
