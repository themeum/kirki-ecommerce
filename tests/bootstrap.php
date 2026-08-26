<?php

error_reporting(E_ALL & ~E_DEPRECATED);

$plugin_dir = dirname(__DIR__);
$autoload = $plugin_dir . '/vendor/autoload.php';

if (!file_exists($autoload)) {
    fwrite(STDERR, "Run composer install before running tests.\n");
    exit(1);
}

$is_unit_suite = false;

foreach ($_SERVER['argv'] ?? [] as $index => $argument) {
    if ($argument === '--testsuite' && isset($_SERVER['argv'][$index + 1]) && $_SERVER['argv'][$index + 1] === 'Unit') {
        $is_unit_suite = true;
        break;
    }

    if ($argument === '--testsuite=Unit' || strpos($argument, 'tests/Unit') !== false) {
        $is_unit_suite = true;
        break;
    }
}

if ($is_unit_suite) {
    require __DIR__ . '/Unit/bootstrap.php';

    return;
}

$_tests_dir = getenv('WP_TESTS_DIR');

if (!$_tests_dir) {
    $_tests_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress-tests-lib';
}

$_core_dir = getenv('WP_CORE_DIR');

if (!$_core_dir) {
    $_core_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress';
    putenv('WP_CORE_DIR=' . $_core_dir);
}

if (!file_exists($_tests_dir . '/includes/functions.php')) {
    fwrite(STDERR, "WordPress test library not found at {$_tests_dir}.\n");
    fwrite(STDERR, "Docker (recommended): composer test:docker:install && composer test:docker:integration\n");
    fwrite(STDERR, "Host-only: bash bin/install-wp-tests.sh kirki_ecommerce_test wordpress wordpress 127.0.0.1:20101\n");
    exit(1);
}

require_once $autoload;

require_once dirname(__DIR__) . '/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';

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

\Kirki\Ecommerce\Framework\app()->singleton(
    \Kirki\Ecommerce\Framework\Database\Migrations\Migrator::class,
    function ($app) {
        return $app->make(\Kirki\Ecommerce\Tests\Support\TestMigrator::class);
    }
);

rest_get_server();
