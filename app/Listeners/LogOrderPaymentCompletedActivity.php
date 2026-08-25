<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderPaymentCompleted;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderPaymentCompletedActivity extends Listener
{
    public function handle(OrderPaymentCompleted $event)
    {
        OrderActivity::payment_completed($event->order, $event->provider);
    }
}
