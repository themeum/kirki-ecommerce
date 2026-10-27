#!/bin/sh

WP_PATH="/var/www/html"

# Numeric 33:33 (the php-fpm image's www-data) rather than by name: this image
# is Alpine-based, where www-data is 82:82, so chowning by name here would give
# files the wrong owner for the process that actually serves uploads.
# The plugin is a host bind mount, so it is pruned to keep the host's file
# owners and to avoid walking it over the file share.
normalize_ownership() {
    find "${WP_PATH}/wp-content" \
        -path "${WP_PATH}/wp-content/plugins/kirki-ecommerce" -prune \
        -o ! -user 33 -exec chown 33:33 {} + 2>/dev/null || true
}

wp --allow-root "$@"
status=$?

normalize_ownership

exit "${status}"
