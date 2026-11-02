<?php

namespace Kirki\Ecommerce\App\Events\User;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for a customer who requested a password reset through WordPress.
 *
 * Dispatched only when the store's reset-password email replaces the
 * WordPress default one.
 *
 * @since 1.0.0
 */
class CustomerPasswordResetRequestedEvent
{
    use Dispatchable;

    /** @var int */
    public $user_id;

    /**
     * Create the event for a customer's password reset request.
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
