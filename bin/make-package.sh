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
  "composer.json"
  "app"
  "bootstrap"
  "vendor"
  "assets"
  "resources/views"
)

OPTIONAL_PATHS=(
  "config"
  "database/migrations"
  "routes"
  "languages"
  "resources/data"
  "resources/images"
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
  # Regenerated before the bundle is built so the shipped settings search index
  # can never describe copy that differs from the interface shipping with it.
  # Only resources/app defines this script; --if-present makes it a no-op elsewhere.
  npm run --if-present search:index
  npm run build
  popd > /dev/null
}

echo "==> Cleaning build directory"
rm -rf "$BUILD_DIR"
mkdir -p "$STAGE_DIR"

echo "==> Cleaning generated assets"
rm -rf "$ROOT_DIR/assets/js" "$ROOT_DIR/assets/css" "$ROOT_DIR/assets/manifest.json" "$ROOT_DIR/assets/.vite"

build_frontend "resources/app"
build_frontend "resources/site"

echo "==> Installing PHP dependencies"
run_composer "$ROOT_DIR"
composer install --no-dev --optimize-autoloader --no-scripts

# The scoped framework lives at vendor/libraries/framework, but the --no-dev
# install above undoes two things `composer scope` did. It re-clones an
# unscoped copy at vendor/themeum/framework - Composer tests for an installed
# package at the path derived from its name, not at the install-path recorded
# in installed.json - and it regenerates installed.json from the lock,
# restoring the unprefixed Framework\ psr-4 map. Left alone, the build ships a
# second unscoped framework and registers it in the autoloader, where its
# Framework\ mapping can shadow a genuine Framework\ class belonging to
# another plugin on the same site. --restore undoes both, before the final dump.
echo "==> Restoring scoped framework layout"
php "$ROOT_DIR/bin/scope-framework.php" --restore
composer dump-autoload --no-dev --optimize

# Payment gateways are not bundled. They are separate plugins that the store
# installs from the remote catalog (see docs/payment-gateways.md).
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

# POT generation is off for now. Drop any template left by a manual
# `npm run make:pot` so the zip never ships an outdated one.
echo "==> Removing translation template"
rm -f "$STAGE_DIR/languages/$PLUGIN_SLUG.pot"

echo "==> Removing hidden files (not allowed by wordpress.org)"
find "$STAGE_DIR" -name ".*" -type f -delete
find "$STAGE_DIR" -depth -name ".*" -type d -exec rm -rf {} +

echo "==> Removing OS, editor and development files"
find "$STAGE_DIR" -depth \( -name "__MACOSX" -o -iname "Thumbs.db" -o -iname "desktop.ini" \
  -o -name "*.swp" -o -name "*~" -o -name "*.bak" -o -name "*.orig" -o -name "*.log" \
  -o -iname "README.md" -o -iname "CHANGELOG.md" \) -exec rm -rf {} +
# Vite HMR helper: development only.
rm -rf "$STAGE_DIR/resources/assets"
# Defines ABSPATH for the test suite only; it is in autoload-dev, which the
# --no-dev install leaves out of the autoloader.
rm -f "$STAGE_DIR/bootstrap/abspath.php"

echo "==> Pruning vendor"
# Allowlist: only the runtime packages and the autoloader ship. Anything else
# the install left behind (bin/, scoper-autoload.php, ...) is development only.
for entry in "$STAGE_DIR"/vendor/*; do
  case "$(basename "$entry")" in
    autoload.php|composer|brick|libraries) ;;
    *) rm -rf "$entry" ;;
  esac
done

# The scaffolding commands (make:*, queue:table) are the only users of the stubs, and they are not
# useful on a production site. Their registrations are dropped from the staged
# framework copy, otherwise WP-CLI would throw on the missing classes.
FRAMEWORK_SRC="$STAGE_DIR/vendor/libraries/framework/src"
rm -rf "$FRAMEWORK_SRC/Console/stubs" "$FRAMEWORK_SRC"/Console/Commands/{Make*Command,QueueTableCommand}.php
sed -i.bak -E \
  -e "/^use .*Console\\\\Commands\\\\(Make[A-Za-z]+|QueueTable)Command;/d" \
  -e "s/'[a-z]+:[a-z]+' => (Make[A-Za-z]+|QueueTable)Command::class, ?//g" \
  -e "s/, '[a-z]+:[a-z]+' => (Make[A-Za-z]+|QueueTable)Command::class\\]/]/" \
  "$FRAMEWORK_SRC/Application.php"
rm -f "$FRAMEWORK_SRC/Application.php.bak"
if grep -rqE "Make[A-Za-z]*Command|QueueTableCommand" "$FRAMEWORK_SRC"; then
  echo "Error: staged framework still references a removed make command, aborting." >&2
  exit 1
fi
php -l "$FRAMEWORK_SRC/Application.php" > /dev/null

echo "==> Removing development files from vendor packages"
find "$STAGE_DIR/vendor" -path "*/vendor/*" \( -type d \( -name bin -o -name tests -o -name docs \) \
  -o -type f \( -iname "*.md" -o -iname "phpunit.xml*" -o -name "*.dist" \) \) -prune -exec rm -rf {} +

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
