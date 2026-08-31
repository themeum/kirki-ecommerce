<?php

namespace Kirki\Ecommerce\App\Services;

use Exception;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

class UserService
{
    /**
     * Email service instance.
     *
     * @var EmailService
     */
    protected EmailService $email_service;

    /**
     * Constructor.
     *
     * @param EmailService|null $email_service
     */
    public function __construct(?EmailService $email_service = null)
    {
        $this->email_service = $email_service ?? new EmailService();
    }

    /**
     * Change a WordPress user's password after verifying their current password.
     *
     * wp_set_password() invalidates the user's auth cookie as a side effect,
     * so the session is re-issued afterward to keep the requesting browser logged in.
     *
     * @param int $user_id
     * @param string $current_password
     * @param string $new_password
     * @throws ValidationException
     * @return void
     */
    public function update_password(int $user_id, string $current_password, string $new_password)
    {
        $user = get_userdata($user_id);

        if (empty($user) || !wp_check_password($current_password, $user->user_pass, $user_id)) {
            throw ValidationException::with_errors([
                'current_password' => [__('Current password is incorrect.', 'kirki-ecommerce')],
            ]);
        }

        wp_set_password($new_password, $user_id);
        wp_set_auth_cookie($user_id);
    }

    /**
     * Update a WordPress user's fields.
     *
     * @param int $user_id
     * @param array $fields
     * @throws ValidationException
     * @return void
     */
    public function partial_update(int $user_id, array $fields)
    {
        $result = wp_update_user(array_merge(['ID' => $user_id], $fields));

        if (is_wp_error($result)) {
            throw new Exception(esc_html($result->get_error_message()));
        }
    }

    /**
     * Resend verification email to user.
     *
     * @since 1.0.0
     *
     * @param int $user_id User ID.
     *
     * @throws ValidationException
     * @throws Exception
     *
     * @return bool
     */
    public function resend_verification_email(int $user_id)
    {
        $user = new User($user_id);

        if (empty($user->get_id())) {
            throw ValidationException::with_errors([
                'user' => [__('User not found.', 'kirki-ecommerce')],
            ]);
        }

        if ($user->email_verified()) {
            throw ValidationException::with_errors([
                'email' => [__('Email address is already verified.', 'kirki-ecommerce')],
            ]);
        }

        $token = $user->generate_verification_token();

        $verify_url = Url::add_query_params(Url::get_account_url('action'), [
            'action' => 'email_verify',
            'token'  => $token,
        ]);

        $sent = $this->email_service->send_verification_email($user, $verify_url);

        if (!$sent) {
            throw new Exception(__('Failed to send verification email. Please try again later.', 'kirki-ecommerce'));
        }

        return true;
    }

    /**
     * Verify email with token and link past guest orders.
     *
     * @since 1.0.0
     *
     * @param int $user_id User ID.
     * @param string $token Verification token.
     *
     * @return bool
     */
    public function verify_email_token(int $user_id, string $token)
    {
        $user = new User($user_id);

        if (empty($user->get_id())) {
            return false;
        }

        return $user->verify_email_by_token($token);
    }
}
