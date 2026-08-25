<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderPaymentFailed;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderPaymentFailedActivity extends Listener
{
    public function handle(OrderPaymentFailed $event)
    {
        OrderActivity::payment_failed($event->order);
    }
}
