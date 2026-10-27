<?php

namespace Kirki\Ecommerce\App\Mails\Customers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Wordpress\User;

/**
 * Email sent to a customer asking them to confirm their email address.
 *
 * @since 1.0.0
 */
class CustomerEmailConfirmationMail extends Mailer
{
    /** @var User */
    protected $user;

    /** @var string */
    protected $verification_link;

    /**
     * Create the mail for the given user.
     *
     * @since 1.0.0
     *
     * @param User $user User the email is sent to.
     * @param string $verification_link Email verification link.
     */
    public function __construct(User $user, string $verification_link = '')
    {
        $this->user = $user;
        $this->verification_link = $verification_link;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function option_key()
    {
        return 'customer_emails.user_notifications.confirm_email_address';
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

            'verification_link' => $this->get_content('emails.parts.link', [
                'label' => __('Confirm Email Address', 'kirki-ecommerce'),
                'link' => $this->verification_link,
            ]),
            'verification_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Confirm Email Address', 'kirki-ecommerce'),
                'link' => $this->verification_link,
            ]),
        ];
    }
}
