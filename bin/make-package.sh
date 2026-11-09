#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PLUGIN_SLUG="kirki-ecommerce"
BUILD_DIR="$ROOT_DIR/build"
STAGE_DIR="$BUILD_DIR/$PLUGIN_SLUG"

usage() {
  echo "Usage: $0 [--version <x.y.z> [--keep-source]]" >&2
  echo "  --version <x.y.z>  write the version into kirki-ecommerce.php and readme.txt" >&2
  echo "  --keep-source      write it only into the staged build copy (used by deploy.yml)" >&2
}

NEW_VERSION=""
KEEP_SOURCE=false
while [ $# -gt 0 ]; do
  case "$1" in
    --version)
      if [ $# -lt 2 ]; then
        echo "Error: --version needs a value." >&2
        usage
        exit 1
      fi
      NEW_VERSION="$2"
      shift 2
      ;;
    --keep-source)
      KEEP_SOURCE=true
      shift
      ;;
    *)
      echo "Error: unknown argument '$1'." >&2
      usage
      exit 1
      ;;
  esac
done

if [ "$KEEP_SOURCE" = true ] && [ -z "$NEW_VERSION" ]; then
  echo "Error: --keep-source needs --version." >&2
  usage
  exit 1
fi

if [ -n "$NEW_VERSION" ] && ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Error: '$NEW_VERSION' is not a valid version (expected x.y.z or x.y.z-suffix, without 'v')." >&2
  exit 1
fi

REQUIRED_PATHS=(
  "kirki-ecommerce.php"
  "readme.txt"
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

read_header_version() {
  grep -m1 "Version:" "$1/kirki-ecommerce.php" | sed -E 's/.*Version:[[:space:]]*([0-9][0-9A-Za-z.-]*).*/\1/' || true
}

# Writes the version into the three places the plugin declares it, inside
# the given folder, then checks that each one now holds it. A value the sed
# expressions cannot find stays unchanged, so the check also catches it.
set_version() {
  local dir="$1"
  local version="$2"
  local entry_file="$dir/kirki-ecommerce.php"
  local readme_file="$dir/readme.txt"

  sed -i.bak -E \
    -e "s/^([[:space:]]*\*[[:space:]]*Version:[[:space:]]*).*$/\1$version/" \
    -e "s/define\('KIRKI_ECOMMERCE_VERSION', '[^']*'\);/define('KIRKI_ECOMMERCE_VERSION', '$version');/" \
    "$entry_file"
  sed -i.bak -E "s/^Stable tag:.*$/Stable tag: $version/" "$readme_file"
  rm -f "$entry_file.bak" "$readme_file.bak"

  local header constant stable
  header=$(read_header_version "$dir")
  constant=$(grep -m1 "define('KIRKI_ECOMMERCE_VERSION'" "$entry_file" | sed -E "s/.*'KIRKI_ECOMMERCE_VERSION',[[:space:]]*'([^']*)'.*/\1/" || true)
  stable=$(grep -m1 "^Stable tag:" "$readme_file" | sed -E 's/^Stable tag:[[:space:]]*//' || true)

  local failed=0
  [ "$header" = "$version" ] || { echo "Error: could not set the Version header in $entry_file." >&2; failed=1; }
  [ "$constant" = "$version" ] || { echo "Error: could not set KIRKI_ECOMMERCE_VERSION in $entry_file." >&2; failed=1; }
  [ "$stable" = "$version" ] || { echo "Error: could not set Stable tag in $readme_file." >&2; failed=1; }
  if [ "$failed" -ne 0 ]; then
    exit 1
  fi
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

if [ -n "$NEW_VERSION" ] && [ "$KEEP_SOURCE" = false ]; then
  echo "==> Setting version $NEW_VERSION in the source files"
  set_version "$ROOT_DIR" "$NEW_VERSION"
fi

echo "==> Cleaning build directory"
rm -rf "$BUILD_DIR"
mkdir -p "$STAGE_DIR"

echo "==> Cleaning generated assets"
rm -rf "$ROOT_DIR/assets/js" "$ROOT_DIR/assets/css" "$ROOT_DIR/assets/manifest.json" "$ROOT_DIR/assets/.vite"

build_frontend "resources/app"
build_frontend "resources/site"

echo "==> Installing PHP dependencies"
# Install from the committed composer.lock only, so the package ships the
# versions that were tested. A lock that no longer satisfies composer.json
# fails here: run `composer update`, commit the lock, then build again.
composer install
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
# Preset data and sample product images: the plugin reads them from S3, and
# `npm run publish:presets` uploads them from here.
rm -rf "$STAGE_DIR/resources/data/preconfigured-data"
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
# Only the Composer CLI reads installed.json. At runtime, InstalledVersions
# reads installed.php.
rm -f "$STAGE_DIR/vendor/composer/installed.json"

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

if [ "$KEEP_SOURCE" = true ]; then
  echo "==> Setting version $NEW_VERSION in the staged copy only"
  set_version "$STAGE_DIR" "$NEW_VERSION"
fi

echo "==> Reading plugin version"
VERSION=$(read_header_version "$STAGE_DIR")

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
