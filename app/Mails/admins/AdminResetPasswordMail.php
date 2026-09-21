<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Wordpress\User;

class AdminResetPasswordMail extends Mailer
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
        return [
            'user_name' => $this->user->get_display_name(),
            'user_email' => $this->user->get_email(),
            'reset_url' => Url::add_query_params(Url::get_login_url(), [
                'action' => 'reset_password',
                'key' => 'sample-reset-token',
                'login' => $this->user->get_email(),
            ]),
        ];
    }
}
