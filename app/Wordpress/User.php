<?php

namespace Kirki\Ecommerce\App\Wordpress;

use Kirki\Ecommerce\App\Constants\HookNames;
use Kirki\Ecommerce\App\Constants\UserRoles;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Wordpress\User as FrameworkUser;

use function Kirki\Ecommerce\Framework\include_view;

class User extends FrameworkUser
{
    /**
     * User meta key for email verification status.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const META_EMAIL_VERIFIED = 'kecom_is_email_verified';

    /**
     * User meta key for email verification token.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const META_EMAIL_VERIFICATION_TOKEN = 'kecom_email_verification_token';

    /**
     * User meta key for email verification sent timestamp.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const META_EMAIL_VERIFICATION_SENT_AT = 'kecom_email_verification_sent_at';

    /**
     * User meta key for email verification expiration timestamp.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public const META_EMAIL_VERIFICATION_EXPIRES_AT = 'kecom_email_verification_expires_at';

    /**
     * Check if the current user is an admin.
     *
     * @return bool
     * @since 1.0.0
     */
    public function is_admin()
    {
        return $this->has_role(UserRoles::ADMIN);
    }

    /**
     * Check if the current user is a customer.
     *
     * @return bool
     * @since 1.0.0
     */
    public function is_customer()
    {
        return $this->has_role(UserRoles::CUSTOMER);
    }

    /**
     * Get the current user active role.
     *
     * @return string|null
     * @since 1.0.0
     */
    public function get_active_role()
    {
        if ($this->is_admin()) {
            return UserRoles::ADMIN;
        }

        if ($this->is_customer()) {
            return UserRoles::CUSTOMER;
        }

        return null;
    }

    /**
     * Check if the current user email is verified.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function email_verified()
    {
        return (bool) get_user_meta($this->get_id(), static::META_EMAIL_VERIFIED, true);
    }

    /**
     * Mark the current user email as verified.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function mark_email_as_verified()
    {
        $this->clear_email_verification_token();

        $updated = update_user_meta($this->get_id(), static::META_EMAIL_VERIFIED, 1);

        if ($updated) {
            do_action(HookNames::USER_EMAIL_VERIFIED, $this);
        }

        return $updated;
    }

    /**
     * Mark the current user email as unverified.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function mark_email_as_unverified()
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFIED, 0);
    }

    /**
     * Get email verification token.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    public function get_email_verification_token()
    {
        return get_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_TOKEN, true);
    }

    /**
     * Set email verification token.
     *
     * @param string $token Verification token.
     *
     * @return bool
     * @since 1.0.0
     */
    public function set_email_verification_token(string $token)
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_TOKEN, $token);
    }

    /**
     * Get email verification sent timestamp.
     *
     * @since 1.0.0
     *
     * @return int|null
     */
    public function get_email_verification_sent_at()
    {
        $val = get_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_SENT_AT, true);

        return $val !== null ? (int) $val : null;
    }

    /**
     * Set email verification sent timestamp.
     *
     * @since 1.0.0
     *
     * @param int|null $timestamp Timestamp (defaults to current time).
     *
     * @return bool
     */
    public function set_email_verification_sent_at(?int $timestamp = null)
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_SENT_AT, $timestamp ?? time());
    }

    /**
     * Get email verification expiration timestamp.
     *
     * @since 1.0.0
     *
     * @return int|null
     */
    public function get_email_verification_expires_at()
    {
        $val = get_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_EXPIRES_AT, true);

        return $val !== null ? (int) $val : null;
    }

    /**
     * Set email verification expiration timestamp.
     *
     * @since 1.0.0
     *
     * @param int $timestamp Expiry timestamp.
     *
     * @return bool
     */
    public function set_email_verification_expires_at(int $timestamp)
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_EXPIRES_AT, $timestamp);
    }

    /**
     * Check if email verification token is expired.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_email_verification_expired()
    {
        $expires_at = $this->get_email_verification_expires_at();

        if (null === $expires_at) {
            return true;
        }

        return time() > $expires_at;
    }

    /**
     * Clear all email verification token data.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function clear_email_verification_token()
    {
        delete_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_TOKEN);
        delete_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_SENT_AT);
        delete_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_EXPIRES_AT);
    }

    /**
     * Resend verification email to the user.
     *
     * @since 1.0.0
     *
     * @return bool Whether the email was sent successfully.
     */
    public function resend_verification_email()
    {
        $token = wp_generate_password(32, false);

        $this->set_email_verification_token($token);
        $this->set_email_verification_sent_at(time());
        $this->set_email_verification_expires_at(time() + DAY_IN_SECONDS);

        $verify_url = Url::add_query_params(Url::get_account_url('action'), [
            'action' => 'email_verify',
            'token' => $token,
        ]);

        $to = $this->get_email();
        $site_name = get_bloginfo('name');
        $user_name = $this->get_display_name() ?: $this->get_first_name() ?: __('Customer', 'kirki-ecommerce');

        $subject = sprintf(__('[%s] Please verify your email address', 'kirki-ecommerce'), $site_name);

        ob_start();
        include_view('emails.email-verification', [
            'user_name' => $user_name,
            'verify_url' => $verify_url,
            'site_name' => $site_name
        ]);
        $message = ob_get_clean();

        $headers = ['Content-Type: text/html; charset=UTF-8'];

        return (bool) wp_mail($to, $subject, $message, $headers);
    }

    /**
     * Verify email with token.
     *
     * @since 1.0.0
     *
     * @param string $token Verification token.
     *
     * @return bool
     */
    public function verify_email_by_token(string $token)
    {
        if (empty($token)) {
            return false;
        }

        $stored_token = $this->get_email_verification_token();

        if (empty($stored_token) || !hash_equals((string) $stored_token, (string) $token)) {
            return false;
        }

        if ($this->is_email_verification_expired()) {
            return false;
        }

        $this->mark_email_as_verified();

        return true;
    }
}
