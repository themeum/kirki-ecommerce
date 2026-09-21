<?php

namespace Kirki\Ecommerce\App\Wordpress;

use Kirki\Ecommerce\App\Constants\Hooks\CustomHookNames;
use Kirki\Ecommerce\App\Constants\UserRoles;
use Kirki\Ecommerce\App\Mails\Customers\CustomerEmailConfirmationMail;
use Kirki\Ecommerce\App\Services\MailerService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Wordpress\User as FrameworkUser;

use function Kirki\Ecommerce\Framework\app;

/**
 * A WordPress user with the plugin's role checks and email verification handling.
 *
 * @since 1.0.0
 */
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
     * Check if the user has the plugin admin role.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_admin()
    {
        return $this->has_role(UserRoles::ADMIN);
    }

    /**
     * Check if the user has the customer role.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_customer()
    {
        return $this->has_role(UserRoles::CUSTOMER);
    }

    /**
     * Get the plugin role the user holds, admin taking precedence.
     *
     * @since 1.0.0
     *
     * @return string|null Null when the user has neither role.
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
     * Check if the user's email is verified.
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
     * Mark the user's email as verified and clear any pending verification token.
     *
     * @since 1.0.0
     *
     * @return int|bool Result of update_user_meta() for the verified flag.
     */
    public function mark_email_as_verified()
    {
        $this->clear_email_verification_token();

        $updated = update_user_meta($this->get_id(), static::META_EMAIL_VERIFIED, 1);

        if ($updated) {
            do_action(CustomHookNames::USER_EMAIL_VERIFIED, $this);
        }

        return $updated;
    }

    /**
     * Mark the user's email as unverified.
     *
     * @since 1.0.0
     *
     * @return int|bool Result of update_user_meta().
     */
    public function mark_email_as_unverified()
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFIED, 0);
    }

    /**
     * Get the stored email verification token.
     *
     * @since 1.0.0
     *
     * @return string Empty string when no token is stored.
     */
    public function get_email_verification_token()
    {
        return get_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_TOKEN, true);
    }

    /**
     * Store the email verification token.
     *
     * @since 1.0.0
     *
     * @param string $token Verification token.
     * @return int|bool Result of update_user_meta().
     */
    public function set_email_verification_token(string $token)
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_TOKEN, $token);
    }

    /**
     * Get the timestamp the verification email was last sent.
     *
     * @since 1.0.0
     *
     * @return int Unix timestamp, or 0 when none is stored.
     */
    public function get_email_verification_sent_at()
    {
        $val = get_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_SENT_AT, true);

        return $val !== null ? (int) $val : null;
    }

    /**
     * Store the timestamp the verification email was sent.
     *
     * @since 1.0.0
     *
     * @param int|null $timestamp Unix timestamp; defaults to the current time.
     * @return int|bool Result of update_user_meta().
     */
    public function set_email_verification_sent_at(?int $timestamp = null)
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_SENT_AT, $timestamp ?? time());
    }

    /**
     * Get the timestamp the verification token expires at.
     *
     * @since 1.0.0
     *
     * @return int Unix timestamp, or 0 when none is stored.
     */
    public function get_email_verification_expires_at()
    {
        $val = get_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_EXPIRES_AT, true);

        return $val !== null ? (int) $val : null;
    }

    /**
     * Store the timestamp the verification token expires at.
     *
     * @since 1.0.0
     *
     * @param int $timestamp Expiry Unix timestamp.
     * @return int|bool Result of update_user_meta().
     */
    public function set_email_verification_expires_at(int $timestamp)
    {
        return update_user_meta($this->get_id(), static::META_EMAIL_VERIFICATION_EXPIRES_AT, $timestamp);
    }

    /**
     * Check if the verification token has expired.
     *
     * @since 1.0.0
     *
     * @return bool True when it has expired or no expiry is stored.
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
     * Delete the verification token and its sent and expiry timestamps.
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
     * Generate and store a new verification token for the user.
     *
     * @since 1.0.0
     *
     * @param int|null $expires_in Lifetime in seconds; defaults to 24 hours.
     * @return string The generated token.
     */
    public function generate_verification_token(?int $expires_in = null): string
    {
        $token = wp_generate_password(32, false);
        $expires_in = $expires_in ?? DAY_IN_SECONDS;

        $this->set_email_verification_token($token);
        $this->set_email_verification_sent_at(time());
        $this->set_email_verification_expires_at(time() + $expires_in);

        return $token;
    }

    /**
     * Generate a new verification token and email the user a link to verify with it.
     *
     * @since 1.0.0
     *
     * @return bool Whether the email was sent successfully.
     */
    public function resend_verification_email()
    {
        $token = $this->generate_verification_token();

        $verify_url = Url::add_query_params(Url::get_account_url('action'), [
            'action' => 'email_verify',
            'token'  => $token,
        ]);

        return app(MailerService::class)->send(CustomerEmailConfirmationMail::make($this, $verify_url), $this->get_email());
    }

    /**
     * Verify the user's email if the token matches the stored one and has not expired.
     *
     * @since 1.0.0
     *
     * @param string $token Verification token from the link.
     * @return bool Whether the email is now verified.
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
