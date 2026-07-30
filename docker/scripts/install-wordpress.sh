#!/usr/bin/env bash
set -euo pipefail

WP_PATH="/var/www/html"

echo "Ensuring WordPress core is present..."
if [ ! -f "${WP_PATH}/wp-includes/version.php" ]; then
    echo "Downloading WordPress..."
    wp core download --path="${WP_PATH}" --allow-root
fi

echo "Waiting for database..."
until wp db check --path="${WP_PATH}" --allow-root 2>/dev/null; do
    echo "Database not ready, retrying in 2s..."
    sleep 2
done

if wp core is-installed --path="${WP_PATH}" --allow-root 2>/dev/null; then
    echo "WordPress is already installed."
else
    echo "Installing WordPress..."
    wp core install \
        --path="${WP_PATH}" \
        --url="${WP_URL}" \
        --title="${WP_TITLE}" \
        --admin_user="${WP_ADMIN_USER}" \
        --admin_password="${WP_ADMIN_PASSWORD}" \
        --admin_email="${WP_ADMIN_EMAIL}" \
        --skip-email \
        --allow-root
fi

if wp plugin is-active kirki-ecommerce --path="${WP_PATH}" --allow-root 2>/dev/null; then
    echo "Plugin kirki-ecommerce is already active."
else
    echo "Activating kirki-ecommerce plugin..."
    wp plugin activate kirki-ecommerce --path="${WP_PATH}" --allow-root
fi

wp rewrite structure '/%postname%/' --path="${WP_PATH}" --allow-root 2>/dev/null || true
wp rewrite flush --path="${WP_PATH}" --allow-root

# Use the numeric uid/gid of www-data from the php-fpm container (33:33 on
# php:7.4-fpm/Debian). This image is Alpine-based, where www-data is 82:82,
# so chowning by name here would give files the wrong owner for the process
# that actually serves uploads.
chown -R 33:33 "${WP_PATH}/wp-admin" "${WP_PATH}/wp-includes" "${WP_PATH}/wp-content" 2>/dev/null || true
find "${WP_PATH}" -maxdepth 1 -name '*.php' ! -name 'wp-config.php' -exec chown 33:33 {} + 2>/dev/null || true

echo "WordPress setup complete."
