<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderPlaced;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderPlacedActivity extends Listener
{
    public function handle(OrderPlaced $event)
    {
        OrderActivity::order_placed($event->order);
    }
}
