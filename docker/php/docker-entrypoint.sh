#!/bin/sh
set -e

if [ -d /var/www/html ]; then
    chown -R www-data:www-data /var/www/html/wp-admin /var/www/html/wp-includes /var/www/html/wp-content 2>/dev/null || true
    find /var/www/html -maxdepth 1 -name '*.php' ! -name 'wp-config.php' -exec chown www-data:www-data {} + 2>/dev/null || true
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

exec docker-php-entrypoint "$@"
