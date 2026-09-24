<?php

namespace Kirki\Ecommerce\App\Services;

use Exception;
use Kirki\Ecommerce\App\Mails\Customers\CustomerEmailConfirmationMail;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Handles WordPress user account changes: password, profile fields and email verification.
 *
 * @since 1.0.0
 */
class UserService
{
    /** @var EmailService */
    protected EmailService $email_service;

    /**
     * Create the service.
     *
     * @since 1.0.0
     *
     * @param EmailService|null $email_service Mailer for verification emails; a new EmailService when omitted.
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
     * @since 1.0.0
     *
     * @param int    $user_id          WordPress user ID.
     * @param string $current_password Password the user currently has.
     * @param string $new_password     Password to set.
     * @return void
     * @throws ValidationException When the current password is incorrect.
     */
    public function update_password(int $user_id, string $current_password, string $new_password)
    {
        $user = get_userdata($user_id);

        if (empty($user) || !wp_check_password($current_password, $user->user_pass, $user_id)) {
            throw ValidationException::with_errors([
                'current_password' => [__('Current password is incorrect.', 'kirki-ecommerce')], // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
            ]);
        }

        wp_set_password($new_password, $user_id);
        wp_set_auth_cookie($user_id);
    }

    /**
     * Update a WordPress user's fields.
     *
     * @since 1.0.0
     *
     * @param int                  $user_id WordPress user ID.
     * @param array<string, mixed> $fields  Fields accepted by wp_update_user().
     * @return void
     * @throws Exception When WordPress fails to update the user.
     */
    public function partial_update(int $user_id, array $fields)
    {
        $result = wp_update_user(array_merge(['ID' => $user_id], $fields));

        if (is_wp_error($result)) {
            throw_anyway($result->get_error_message());
        }
    }

    /**
     * Resend the email verification message to a user.
     *
     * Refuses when the user is missing or already verified, or when the last
     * message was sent less than two minutes ago.
     *
     * @since 1.0.0
     *
     * @param int $user_id WordPress user ID.
     * @return bool Always true; failure throws.
     * @throws Exception When the user is unknown or verified, the cooldown has not elapsed, or the email fails to send.
     */
    public function resend_verification_email(int $user_id)
    {
        $user = new User($user_id);

        throw_if(empty($user->get_id()), __('User not found.', 'kirki-ecommerce'));

        throw_if($user->email_verified(), __('Email address is already verified.', 'kirki-ecommerce'));

        /*
         * This cooldown provides an additional layer of protection against abuse,
         * in case the route-level rate limit is bypassed or the service is invoked
         * directly by a CLI command, cron job, or other non-HTTP entry point.
         */
        $last_sent = $user->get_email_verification_sent_at();
        $cooldown_period = MINUTE_IN_SECONDS * 2;
        if ($last_sent && (time() - $last_sent) < $cooldown_period) {
            $remaining = $cooldown_period - (time() - $last_sent);
            /* translators: %d: number of seconds to wait */
            throw_anyway(sprintf(__('Please wait %d seconds before requesting another verification email.', 'kirki-ecommerce'), $remaining));
        }

        $token = $user->generate_verification_token();

        $verify_url = Url::add_query_params(Url::get_account_url('action'), [
            'action' => 'email_verify',
            'token'  => $token,
        ]);

        $sent = app(MailerService::class)->send(CustomerEmailConfirmationMail::make($user, $verify_url), $user->get_email());

        throw_if(!$sent, __('Failed to send verification email. Please try again later.', 'kirki-ecommerce'));

        return true;
    }

    /**
     * Verify a user's email address with a token.
     *
     * On success the kecom_user_email_verified action fires, which links past guest orders.
     *
     * @since 1.0.0
     *
     * @param int    $user_id WordPress user ID.
     * @param string $token   Verification token.
     * @return bool False when the user does not exist or the token is not accepted.
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
