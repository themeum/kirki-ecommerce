<?php

if (!defined('ABSPATH')) {
    $wp_core_dir = getenv('WP_CORE_DIR');

    if ($wp_core_dir) {
        define('ABSPATH', rtrim($wp_core_dir, '/') . '/');
    } else {
        define('ABSPATH', dirname(__DIR__) . '/');
    }
}
