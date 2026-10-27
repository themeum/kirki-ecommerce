#!/bin/sh
set -e

if [ -d /var/www/html ]; then
    # Numeric 33:33 (this image's www-data) rather than by name: the
    # wordpress-init/wpcli containers are Alpine-based, where www-data is
    # 82:82, so chowning by name there gives files the wrong owner for the
    # php-fpm worker that actually serves uploads.
    # The plugin is a host bind mount (with node_modules/vendor): walking it
    # over the macOS file share takes seconds, during which php-fpm isn't
    # listening and nginx answers 502, so it's pruned.
    find /var/www/html/wp-admin /var/www/html/wp-includes /var/www/html/wp-content \
        -path /var/www/html/wp-content/plugins/kirki-ecommerce -prune \
        -o -exec chown 33:33 {} + 2>/dev/null || true
    find /var/www/html -maxdepth 1 -name '*.php' ! -name 'wp-config.php' -exec chown 33:33 {} + 2>/dev/null || true
fi

cat > /usr/local/etc/php-fpm.d/zz-docker.conf <<'EOF'
clear_env = no
listen = 9000
EOF

XDEBUG_MODE="${XDEBUG_MODE:-off}"
XDEBUG_CLIENT_HOST="${XDEBUG_CLIENT_HOST:-host.docker.internal}"
XDEBUG_CLIENT_PORT="${XDEBUG_CLIENT_PORT:-9003}"
XDEBUG_IDEKEY="${XDEBUG_IDEKEY:-PHPSTORM}"

if [ "$XDEBUG_MODE" != "off" ]; then
    docker-php-ext-enable xdebug 2>/dev/null || true
fi

cat > /usr/local/etc/php/conf.d/zz-xdebug.ini <<EOF
zend_extension=xdebug
xdebug.mode=${XDEBUG_MODE}
xdebug.start_with_request=yes
xdebug.client_host=${XDEBUG_CLIENT_HOST}
xdebug.client_port=${XDEBUG_CLIENT_PORT}
xdebug.idekey=${XDEBUG_IDEKEY}
xdebug.log_level=0
EOF

# WordPress starts WP-Cron and the plugin's queue worker with HTTP requests to
# its own URL (WP_URL). That port is published on the host by nginx, so inside
# this container nothing answers it and those loopbacks fail silently. Forward
# it to nginx, keeping the Host header, so they behave as on real hosting.
WP_URL="${WP_URL:-http://localhost:20100}"
wp_url_authority="${WP_URL#*://}"
wp_url_authority="${wp_url_authority%%/*}"
wp_url_host="${wp_url_authority%%:*}"
wp_url_port="${wp_url_authority##*:}"
if [ "$wp_url_port" = "$wp_url_authority" ]; then
    wp_url_port=80
fi

case "$wp_url_host" in
    localhost|127.0.0.1)
        socat TCP-LISTEN:"$wp_url_port",bind=127.0.0.1,fork,reuseaddr TCP:nginx:80 &
        ;;
esac

exec docker-php-entrypoint "$@"
