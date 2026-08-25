<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderRefundDeleted;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderRefundDeletedActivity extends Listener
{
    public function handle(OrderRefundDeleted $event)
    {
        OrderActivity::refund_deleted($event->order, $event->refund_snapshot);
    }
}
