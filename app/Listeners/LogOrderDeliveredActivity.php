<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderDelivered;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderDeliveredActivity extends Listener
{
    public function handle(OrderDelivered $event)
    {
        OrderActivity::delivered($event->order);
    }
}
