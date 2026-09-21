<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Wordpress\User;

use function Kirki\Ecommerce\Framework\include_view;

/**
 * Sends the plugin's transactional emails through wp_mail().
 *
 * @since 1.0.0
 */
class EmailService
{
    /**
     * Send an HTML email using a view template.
     *
     * @since 1.0.0
     *
     * @param string   $to       Recipient email address.
     * @param string   $subject  Email subject.
     * @param string   $template View template name.
     * @param array    $data     Data to pass to the view.
     * @param string[] $headers  Custom headers; defaults to an HTML content type header.
     * @return bool Whether the email was sent successfully.
     */
    public function send_html_email(string $to, string $subject, string $template, array $data = [], array $headers = [])
    {
        if (empty($to)) {
            return false;
        }

        ob_start();
        include_view($template, $data);
        $message = ob_get_clean();

        $default_headers = ['Content-Type: text/html; charset=UTF-8'];
        $headers = !empty($headers) ? $headers : $default_headers;

        return (bool) wp_mail($to, $subject, $message, $headers);
    }

    /**
     * Send the email verification notification to a user.
     *
     * @since 1.0.0
     *
     * @param User   $user       Recipient.
     * @param string $verify_url Verification URL.
     * @return bool False when the user has no email address or sending fails.
     */
    public function send_verification_email(User $user, string $verify_url)
    {
        $to = $user->get_email();
        if (empty($to)) {
            return false;
        }

        $site_name = get_bloginfo('name');
        $user_name = $user->get_display_name() ?: $user->get_first_name() ?: __('Customer', 'kirki-ecommerce');
        /* translators: %s: site name */
        $subject = sprintf(__('[%s] Please verify your email address', 'kirki-ecommerce'), $site_name);

        $data = [
            'user_name'  => $user_name,
            'verify_url' => $verify_url,
            'site_name'  => $site_name,
        ];

        return $this->send_html_email($to, $subject, 'emails.email-verification', $data);
    }
}
