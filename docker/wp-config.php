<?php

define('DB_NAME', getenv('DB_NAME') ?: 'kirki_ecommerce');
define('DB_USER', getenv('DB_USER') ?: 'wordpress');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: 'wordpress');
define('DB_HOST', getenv('DB_HOST') ?: 'mariadb');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

define('AUTH_KEY',         'dev-docker-auth-key-change-me');
define('SECURE_AUTH_KEY',  'dev-docker-secure-auth-key-change-me');
define('LOGGED_IN_KEY',    'dev-docker-logged-in-key-change-me');
define('NONCE_KEY',        'dev-docker-nonce-key-change-me');
define('AUTH_SALT',        'dev-docker-auth-salt-change-me');
define('SECURE_AUTH_SALT', 'dev-docker-secure-auth-salt-change-me');
define('LOGGED_IN_SALT',   'dev-docker-logged-in-salt-change-me');
define('NONCE_SALT',       'dev-docker-nonce-salt-change-me');

$table_prefix = 'wp_';

define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', true);
define('SCRIPT_DEBUG', true);
define('WP_ENVIRONMENT_TYPE', 'local');

$wp_url = getenv('WP_URL') ?: 'http://localhost:20100';
define('WP_HOME', $wp_url);
define('WP_SITEURL', $wp_url);

define('FS_METHOD', 'direct');

if (! defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

require_once ABSPATH . 'wp-settings.php';
