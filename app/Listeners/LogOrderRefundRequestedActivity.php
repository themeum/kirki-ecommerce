<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderRefundRequested;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderRefundRequestedActivity extends Listener
{
    public function handle(OrderRefundRequested $event)
    {
        OrderActivity::refund_requested($event->order, $event->refund);
    }
}
