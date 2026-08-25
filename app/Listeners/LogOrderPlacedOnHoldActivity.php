<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderPlacedOnHold;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderPlacedOnHoldActivity extends Listener
{
    public function handle(OrderPlacedOnHold $event)
    {
        OrderActivity::on_hold($event->order);
    }
}
