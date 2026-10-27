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

    /** @var string */
    protected $reset_link;

    /**
     * Create the mail for the given user.
     *
     * @since 1.0.0
     *
     * @param User $user User who requested the password reset.
     * @param string $reset_link Password reset link.
     */
    public function __construct(User $user, string $reset_link = '')
    {
        $this->user = $user;
        $this->reset_link = $reset_link;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function option_key()
    {
        return 'admin_emails.user_notifications.reset_password';
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
            'reset_link' => $this->get_content('emails.parts.link', [
                'label' => __('Reset Your Password', 'kirki-ecommerce'),
                'link' => $this->reset_link
            ]),
            'reset_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Reset Your Password', 'kirki-ecommerce'),
                'link' => $this->reset_link
            ]),
        ];
    }
}
