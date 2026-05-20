<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderShipped;
use Kirki\Ecommerce\Listener;
use Kirki\Ecommerce\Supports\Facades\Log;

class SendNotificationEmail extends Listener
{
    public function priority()
    {
        return 0;
    }

    public function handle(OrderShipped $event)
    {
        // Handle sending notification
    }
}
