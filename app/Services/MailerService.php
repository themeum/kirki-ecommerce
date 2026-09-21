<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Contracts\Mailable;

/**
 * Sends mailables and renders their previews.
 *
 * @since 1.0.0
 */
class MailerService
{
    /**
     * Send a mailable to a recipient.
     *
     * @since 1.0.0
     *
     * @param Mailable $mail Email to send.
     * @param string   $to   Recipient email address.
     * @return bool True when the email was sent.
     */
    public function send(Mailable $mail, string $to)
    {
        return $mail->send($to);
    }

    /**
     * Get the preview HTML of a mailable.
     *
     * @since 1.0.0
     *
     * @param Mailable $mail Email to preview.
     * @return string Rendered email HTML.
     */
    public function get_preview(Mailable $mail)
    {
        return $mail->get_preview_html();
    }
}
