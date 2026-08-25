<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderArchived;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Listener;

class LogOrderArchivedActivity extends Listener
{
    public function handle(OrderArchived $event)
    {
        OrderActivity::archived($event->order);
    }
}
