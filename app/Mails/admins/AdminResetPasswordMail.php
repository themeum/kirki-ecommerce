<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Wordpress\User;

/**
 * Email sent to an admin user with a link to reset their password.
 *
 * @since 1.0.0
 */
class AdminResetPasswordMail extends Mailer
{
    /** @var User */
    protected $user;

    /**
     * Create the mail for the given user.
     *
     * @since 1.0.0
     *
     * @param User $user User who requested the password reset.
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
        return 'customer_emails.user_notifications.reset_password';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
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
