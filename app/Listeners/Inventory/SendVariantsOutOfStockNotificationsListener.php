<?php

namespace Kirki\Ecommerce\App\Listeners\Inventory;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Inventory\VariantsOutOfStockEvent;
use Kirki\Ecommerce\App\Jobs\SendInventoryMailJob;
use Kirki\Ecommerce\App\Listeners\Concerns\ResolvesStoreAdminEmail;
use Kirki\Ecommerce\App\Mails\Admins\AdminOutOfStockMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for VariantsOutOfStockEvent that queues one out-of-stock alert listing every affected variant to the store admin.
 *
 * May run inside an order's transaction, so it only queues jobs: the queued
 * rows roll back with a failed order.
 *
 * @since 1.0.0
 */
class SendVariantsOutOfStockNotificationsListener extends Listener
{
    use ResolvesStoreAdminEmail;

    /**
     * Handle the VariantsOutOfStockEvent.
     *
     * @since 1.0.0
     *
     * @param VariantsOutOfStockEvent $event The dispatched event.
     * @return void
     */
    public function handle(VariantsOutOfStockEvent $event)
    {
        SendInventoryMailJob::dispatch($event->variant_ids, AdminOutOfStockMail::class, $this->get_admin_email());
    }
}
