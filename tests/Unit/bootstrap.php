<?php

error_reporting(E_ALL & ~E_DEPRECATED);

$plugin_dir = dirname(__DIR__, 2);
$autoload = $plugin_dir . '/vendor/autoload.php';

if (!file_exists($autoload)) {
    fwrite(STDERR, "Run composer install before running tests.\n");
    exit(1);
}

if (!defined('ABSPATH')) {
    define('ABSPATH', $plugin_dir . '/');
}

require_once $autoload;

require_once dirname(__DIR__) . '/Support/StubsWordPressFunctions.php';

require_once dirname(__DIR__, 2) . '/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';

define('KIRKI_ECOMMERCE_UNIT_TESTS', true);
