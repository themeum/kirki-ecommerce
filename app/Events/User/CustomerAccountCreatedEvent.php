<?php

namespace Kirki\Ecommerce\App\Events\User;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for a WordPress user account created for a customer.
 *
 * Dispatched for self-registered and admin-created customers alike,
 * only when the store's new-account email replaces the WordPress default one.
 *
 * @since 1.0.0
 */
class CustomerAccountCreatedEvent
{
    use Dispatchable;

    /** @var int */
    public $user_id;

    /**
     * Create the event for a new customer account.
     *
     * @since 1.0.0
     *
     * @param int $user_id The customer's WordPress user ID.
     */
    public function __construct(int $user_id)
    {
        $this->user_id = $user_id;
    }
}
