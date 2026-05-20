<?php

namespace Kirki\Ecommerce\App;

use Kirki\Ecommerce\Scheduler\Scheduler;

final class KirkiEcommerce
{
    public static function handle_activation()
    {
        Scheduler::setup();
        Scheduler::boot();
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