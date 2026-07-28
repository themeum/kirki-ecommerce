<?php

defined('ABSPATH') || define('ABSPATH', __DIR__);

error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

$files = [
    __DIR__ . '/libraries/framework/helpers.php',
    __DIR__ . '/libraries/framework/Polyfill/Polyfill.php',
];

foreach ($files as $file) {
    if (file_exists($file)) {
        continue;
    }
    $directory = dirname($file);
    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }
    file_put_contents($file, "<?php\n");
}
