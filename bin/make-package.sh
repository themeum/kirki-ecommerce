#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PLUGIN_SLUG="kirki-ecommerce"
BUILD_DIR="$ROOT_DIR/build"
STAGE_DIR="$BUILD_DIR/$PLUGIN_SLUG"

REQUIRED_PATHS=(
  "kirki-ecommerce.php"
  "readme.txt"
  "app"
  "bootstrap"
  "vendor"
  "libraries"
  "assets"
  "resources/views"
)

OPTIONAL_PATHS=(
  "config"
  "database"
  "payments"
  "routes"
  "resources/data"
  "resources/images"
  "resources/assets"
)

copy_path() {
  local rel_path="$1"
  local dest="$STAGE_DIR/$rel_path"
  mkdir -p "$(dirname "$dest")"
  cp -R "$ROOT_DIR/$rel_path" "$dest"
}

# A present composer.lock means the resolved set is re-derived with `update`,
# so a composer.json edit that outdated the lock does not abort the build.
run_composer() {
  local target_dir="$1"
  shift
  pushd "$target_dir" > /dev/null
  if [ -f composer.lock ]; then
    composer update "$@"
  else
    composer install "$@"
  fi
  popd > /dev/null
}

build_frontend() {
  local rel_path="$1"
  echo "==> Building frontend ($rel_path)"
  pushd "$ROOT_DIR/$rel_path" > /dev/null
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  npm run build
  popd > /dev/null
}

echo "==> Cleaning build directory"
rm -rf "$BUILD_DIR"
mkdir -p "$STAGE_DIR"

echo "==> Cleaning generated assets"
rm -rf "$ROOT_DIR/assets/js" "$ROOT_DIR/assets/css"

build_frontend "resources/app"
build_frontend "resources/site"

echo "==> Installing PHP dependencies"
run_composer "$ROOT_DIR"
composer install --no-dev --optimize-autoloader --no-scripts

# The --no-dev install restores vendor/themeum, but the plugin only ever uses the
# php-scoper output in libraries/framework. Composer skips packages whose install
# path is missing, so dumping the autoloader after the removal drops the stale
# Framework\ psr-4 map and the src/helpers.php + src/Polyfill/Polyfill.php file
# includes that would otherwise fatal at runtime.
echo "==> Removing unscoped framework package"
rm -rf "$ROOT_DIR/vendor/themeum"
composer dump-autoload --no-dev --optimize

echo "==> Installing payment gateway dependencies"
for gateway_manifest in "$ROOT_DIR"/payments/*/composer.json; do
  [ -e "$gateway_manifest" ] || continue
  gateway_dir="$(dirname "$gateway_manifest")"
  echo "--> $(basename "$gateway_dir")"
  run_composer "$gateway_dir" --no-dev --optimize-autoloader
done

echo "==> Assembling plugin files"
for path in "${REQUIRED_PATHS[@]}"; do
  if [ ! -e "$ROOT_DIR/$path" ]; then
    echo "Error: required path '$path' not found, aborting." >&2
    exit 1
  fi
  copy_path "$path"
done

for path in "${OPTIONAL_PATHS[@]}"; do
  if [ -e "$ROOT_DIR/$path" ]; then
    copy_path "$path"
  fi
done

# listeners.cache.php / policies.cache.php are regenerated on every request
# by CoreServiceProvider::boot() - keep the package to schema-only config.
# rm -f "$STAGE_DIR/config/listeners.cache.php" "$STAGE_DIR/config/policies.cache.php"

echo "==> Patching production flags"
STAGED_ENTRY_FILE="$STAGE_DIR/kirki-ecommerce.php"
sed -i.bak "s/define('KIRKI_ECOMMERCE_MODE', 'development');/define('KIRKI_ECOMMERCE_MODE', 'production');/" "$STAGED_ENTRY_FILE"
rm -f "$STAGED_ENTRY_FILE.bak"

echo "==> Reading plugin version"
VERSION=$(grep -m1 "Version:" "$ROOT_DIR/kirki-ecommerce.php" | sed -E 's/.*Version:[[:space:]]*([0-9][0-9A-Za-z.-]*).*/\1/')

if [ -z "$VERSION" ]; then
  echo "Error: could not determine plugin version from kirki-ecommerce.php" >&2
  exit 1
fi

echo "==> Creating zip (version $VERSION)"
ZIP_NAME="$PLUGIN_SLUG-$VERSION.zip"
pushd "$BUILD_DIR" > /dev/null
zip -rq "$ZIP_NAME" "$PLUGIN_SLUG"
popd > /dev/null

echo "==> Package created: build/$ZIP_NAME"
