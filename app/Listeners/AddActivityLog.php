<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderShipped;
use Kirki\Ecommerce\Listener;
use Kirki\Ecommerce\Supports\Facades\Log;

class AddActivityLog extends Listener
{
    public function handle(OrderShipped $event)
    {
        // do something
        Log::debug('Activity Log: ' . print_r($event->order, true));
    }
}
