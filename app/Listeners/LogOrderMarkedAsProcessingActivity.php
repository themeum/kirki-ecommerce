<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderMarkedAsProcessing;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderMarkedAsProcessingActivity extends Listener
{
    public function handle(OrderMarkedAsProcessing $event)
    {
        OrderActivity::processing($event->order);
    }
}
