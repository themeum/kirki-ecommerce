<?php

namespace Kirki\Ecommerce\App\Mails\Customers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Wordpress\User;

class CustomerEmailConfirmationMail extends Mailer
{
    /** @var User */
    protected $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function option_key()
    {
        return 'customer_emails.user_notifications.confirm_email_address';
    }

    public function with()
    {
        // @todo: add email verification url
        $verification_link = Url::add_query_params(Url::get_login_url(), [
            'action' => 'email_verification',
            'key' => 'sample-verification-token',
        ]);

        return [
            'full_name' => $this->user->get_display_name(),
            'user_name' => $this->user->get_username(),
            'user_email' => $this->user->get_email(),

            'verification_link' => '#', // @todo: add email verification url
            'verification_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Confirm Email Address', 'kirki-ecommerce'),
                'link' => '#', // @todo: add email verification url
            ]),
        ];
    }
}
