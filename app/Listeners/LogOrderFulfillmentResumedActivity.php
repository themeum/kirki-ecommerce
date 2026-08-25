<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderFulfillmentResumed;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderFulfillmentResumedActivity extends Listener
{
    public function handle(OrderFulfillmentResumed $event)
    {
        OrderActivity::fulfillment_resumed($event->order);
    }
}
