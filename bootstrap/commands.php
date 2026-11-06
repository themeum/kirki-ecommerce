<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Console\Commands\ResetOnboardingCommand;

/**
 * The plugin CLI commands, keyed by the name they run under: `wp kirki <name>`.
 */
return [
    'onboarding:reset' => ResetOnboardingCommand::class,
];
