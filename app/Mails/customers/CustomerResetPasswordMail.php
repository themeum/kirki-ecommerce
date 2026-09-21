<?php

namespace Kirki\Ecommerce\App\Mails\Customers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Wordpress\User;

class CustomerResetPasswordMail extends Mailer
{
    /** @var User */
    protected $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function option_key()
    {
        return 'customer_emails.user_notifications.reset_password';
    }

    public function with()
    {
        // @todo: add reset password url
        $reset_link = Url::add_query_params(Url::get_login_url(), [
            'action' => 'reset_password',
            'key' => 'sample-reset-token',
            'login' => $this->user->get_email(),
        ]);

        return [
            'full_name' => $this->user->get_display_name(),
            'user_name' => $this->user->get_username(),
            'user_email' => $this->user->get_email(),
            'user_info_table' => $this->get_content('emails.parts.user.info-table', ['user_name' => $this->user->get_username()]),
            'reset_link' => '#', // @todo: add reset password url
            'reset_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Reset Your Password', 'kirki-ecommerce'),
                'link' => '#', // @todo: add reset password url
            ]),
        ];
    }
}
