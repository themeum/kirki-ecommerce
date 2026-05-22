<?php

namespace Kirki\Ecommerce\App;

use Kirki\Ecommerce\Scheduler\Scheduler;
use function Kirki\Ecommerce\migrator;

final class KirkiEcommerce
{
    public static function handle_activation()
    {
        require_once KIRKI_ECOMMERCE_PLUGIN_PATH . '/bootstrap/app.php';

        migrator()->run();
        Scheduler::setup();
    }

    public static function handle_deactivation()
    {
        // Deactivation logic here
    }

    public static function handle_uninstallation()
    {
        // Uninstallation logic here
    }
}
