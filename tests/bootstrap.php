<?php

$plugin_dir = dirname(__DIR__);
$autoload = $plugin_dir . '/vendor/autoload.php';

if (!file_exists($autoload)) {
    fwrite(STDERR, "Run composer install before running tests.\n");
    exit(1);
}

require_once $autoload;

require_once dirname(__DIR__) . '/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';

$_tests_dir = getenv('WP_TESTS_DIR');

if (!$_tests_dir) {
    $_tests_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress-tests-lib';
}

if (!getenv('WP_CORE_DIR')) {
    putenv('WP_CORE_DIR=' . rtrim(sys_get_temp_dir(), '/\\') . '/wordpress');
}

if (!file_exists($_tests_dir . '/includes/functions.php')) {
    fwrite(STDERR, "WordPress test library not found. Run: bash bin/install-wp-tests.sh\n");
    exit(1);
}

require_once $_tests_dir . '/includes/functions.php';

if (!function_exists('tests_add_filter')) {
    function tests_add_filter($hook_name, $callback, $priority = 10, $accepted_args = 1)
    {
        global $wp_filter;

        if (function_exists('add_filter')) {
            add_filter($hook_name, $callback, $priority, $accepted_args);
        } else {
            $wp_filter[$hook_name][$priority][] = [
                'function' => $callback,
                'accepted_args' => $accepted_args,
            ];
        }

        return true;
    }
}

tests_add_filter('muplugins_loaded', function () use ($plugin_dir) {
    require $plugin_dir . '/kirki-ecommerce.php';
});

require $_tests_dir . '/includes/bootstrap.php';

rest_get_server();
