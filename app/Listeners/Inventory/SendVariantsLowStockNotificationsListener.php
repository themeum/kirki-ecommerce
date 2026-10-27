<?php

namespace Kirki\Ecommerce\App\Listeners\Inventory;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Inventory\VariantsLowStockEvent;
use Kirki\Ecommerce\App\Jobs\SendInventoryMailJob;
use Kirki\Ecommerce\App\Listeners\Concerns\ResolvesStoreAdminEmail;
use Kirki\Ecommerce\App\Mails\Admins\AdminLowStockMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for VariantsLowStockEvent that queues one low-stock alert listing every affected variant to the store admin.
 *
 * May run inside an order's transaction, so it only queues jobs: the queued
 * rows roll back with a failed order.
 *
 * @since 1.0.0
 */
class SendVariantsLowStockNotificationsListener extends Listener
{
    use ResolvesStoreAdminEmail;

    /**
     * Handle the VariantsLowStockEvent.
     *
     * @since 1.0.0
     *
     * @param VariantsLowStockEvent $event The dispatched event.
     * @return void
     */
    public function handle(VariantsLowStockEvent $event)
    {
        SendInventoryMailJob::dispatch($event->variant_ids, AdminLowStockMail::class, $this->get_admin_email());
    }
}
