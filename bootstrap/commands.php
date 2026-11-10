<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Console\Commands\CachePresetsCommand;
use Kirki\Ecommerce\App\Console\Commands\ClearOptionsCommand;

/**
 * The plugin CLI commands, keyed by the name they run under: `wp kirki <name>`.
 */
return [
    'options:clear' => ClearOptionsCommand::class,
    'presets:cache' => CachePresetsCommand::class,
];
