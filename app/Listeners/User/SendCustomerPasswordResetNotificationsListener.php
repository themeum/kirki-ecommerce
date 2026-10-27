<?php

namespace Kirki\Ecommerce\App\Listeners\User;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\User\CustomerPasswordResetRequestedEvent;
use Kirki\Ecommerce\App\Jobs\SendUserMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerResetPasswordMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for CustomerPasswordResetRequestedEvent that queues the reset-password email to the customer.
 *
 * @since 1.0.0
 */
class SendCustomerPasswordResetNotificationsListener extends Listener
{
    /**
     * Handle the CustomerPasswordResetRequestedEvent.
     *
     * @since 1.0.0
     *
     * @param CustomerPasswordResetRequestedEvent $event The dispatched event.
     * @return void
     */
    public function handle(CustomerPasswordResetRequestedEvent $event)
    {
        $user = get_userdata($event->user_id);

        if (empty($user)) {
            return;
        }

        SendUserMailJob::dispatch($event->user_id, CustomerResetPasswordMail::class, (string) $user->user_email);
    }
}
