#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PLUGIN_SLUG="load-kirki-payment-gateways"
PLUGIN_FILE="$SCRIPT_DIR/$PLUGIN_SLUG.php"
BUILD_DIR="$SCRIPT_DIR/build"
STAGE_DIR="$BUILD_DIR/$PLUGIN_SLUG"

echo "==> Reading plugin version"
VERSION=$(grep -m1 "Version:" "$PLUGIN_FILE" | sed -E 's/.*Version:[[:space:]]*([0-9][0-9A-Za-z.-]*).*/\1/')

if [ -z "$VERSION" ]; then
  echo "Error: could not determine plugin version from $PLUGIN_SLUG.php" >&2
  exit 1
fi

echo "==> Cleaning build directory"
rm -rf "$BUILD_DIR"
mkdir -p "$STAGE_DIR"

echo "==> Assembling plugin files"
cp "$PLUGIN_FILE" "$STAGE_DIR/"

echo "==> Creating zip (version $VERSION)"
ZIP_NAME="$PLUGIN_SLUG-$VERSION.zip"
pushd "$BUILD_DIR" > /dev/null
zip -rq "$ZIP_NAME" "$PLUGIN_SLUG"
popd > /dev/null

rm -rf "$STAGE_DIR"

echo "==> Package created: dev-tools/$PLUGIN_SLUG/build/$ZIP_NAME"
