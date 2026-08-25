<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderRefunded;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderRefundedActivity extends Listener
{
    public function handle(OrderRefunded $event)
    {
        OrderActivity::refunded($event->order, $event->refund);
    }
}
