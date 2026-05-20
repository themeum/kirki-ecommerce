<?php

define('DB_NAME', getenv('DB_NAME') ?: 'kirki_ecommerce_test');
define('DB_USER', getenv('DB_USER') ?: 'wordpress');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: 'wordpress');
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1:20101');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');

define('AUTH_KEY', 'test');
define('SECURE_AUTH_KEY', 'test');
define('LOGGED_IN_KEY', 'test');
define('NONCE_KEY', 'test');
define('AUTH_SALT', 'test');
define('SECURE_AUTH_SALT', 'test');
define('LOGGED_IN_SALT', 'test');
define('NONCE_SALT', 'test');

$table_prefix = 'wptests_';

define('WP_TESTS_DOMAIN', 'example.org');
define('WP_TESTS_EMAIL', 'admin@example.org');
define('WP_TESTS_TITLE', 'Kirki Ecommerce Tests');
define('WP_PHP_BINARY', 'php');

define('WP_DEBUG', true);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);

define('WP_TESTS_FORCE_KNOWN_BUGS', true);

$wp_core_dir = getenv('WP_CORE_DIR');

if ($wp_core_dir) {
    define('ABSPATH', rtrim($wp_core_dir, '/') . '/');
} else {
    define('ABSPATH', dirname(__FILE__) . '/src/');
}
