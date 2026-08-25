<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderTrackingAdded;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderTrackingAddedActivity extends Listener
{
    public function handle(OrderTrackingAdded $event)
    {
        OrderActivity::tracking_added($event->order, $event->tracking);
    }
}
