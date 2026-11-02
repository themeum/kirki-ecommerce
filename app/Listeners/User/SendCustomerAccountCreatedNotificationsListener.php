<?php

namespace Kirki\Ecommerce\App\Listeners\User;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\User\CustomerAccountCreatedEvent;
use Kirki\Ecommerce\App\Jobs\SendUserMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewAccountMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for CustomerAccountCreatedEvent that queues the new-account email to the customer.
 *
 * @since 1.0.0
 */
class SendCustomerAccountCreatedNotificationsListener extends Listener
{
    /**
     * Handle the CustomerAccountCreatedEvent.
     *
     * @since 1.0.0
     *
     * @param CustomerAccountCreatedEvent $event The dispatched event.
     * @return void
     */
    public function handle(CustomerAccountCreatedEvent $event)
    {
        $user = get_userdata($event->user_id);

        if (empty($user)) {
            return;
        }

        SendUserMailJob::dispatch($event->user_id, CustomerNewAccountMail::class, (string) $user->user_email);
    }
}
