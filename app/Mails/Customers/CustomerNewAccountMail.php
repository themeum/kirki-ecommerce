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

    /** @var string */
    protected $set_password_link;

    /**
     * Create the mail for the given user.
     *
     * @since 1.0.0
     *
     * @param User   $user              User the email is sent to.
     * @param string $set_password_link Link where the user sets their password.
     */
    public function __construct(User $user, string $set_password_link = '')
    {
        $this->user = $user;
        $this->set_password_link = $set_password_link;
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
            'set_password_link' => $this->get_content('emails.parts.link-button', [
                'label' => __('Set Your Password', 'kirki-ecommerce'),
                'link' => $this->set_password_link,
            ]),
        ];
    }
}
