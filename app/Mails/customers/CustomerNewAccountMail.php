<?php

namespace Kirki\Ecommerce\App\Mails\Customers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Wordpress\User;

/**
 * Email sent to a customer when their account is created.
 *
 * @since 1.0.0
 */
class CustomerNewAccountMail extends Mailer
{
    /** @var User */
    protected $user;

    /**
     * Create the mail for the given user.
     *
     * @since 1.0.0
     *
     * @param User $user User the email is sent to.
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function option_key()
    {
        return 'customer_emails.user_notifications.new_account';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function with()
    {
        return [
            'full_name' => $this->user->get_display_name(),
            'user_name' => $this->user->get_username(),
            'user_email' => $this->user->get_email(),
            'user_info_table' => $this->get_content('emails.parts.user.info-table', ['user_name' => $this->user->get_username()]),
        ];
    }
}
