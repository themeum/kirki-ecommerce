<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderShipped;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderShippedActivity extends Listener
{
    public function handle(OrderShipped $event)
    {
        OrderActivity::shipped($event->order);
    }
}
