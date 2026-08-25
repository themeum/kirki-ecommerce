<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderCancelled;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderCancelledActivity extends Listener
{
    public function handle(OrderCancelled $event)
    {
        OrderActivity::cancelled($event->order, $event->reason);
    }
}
