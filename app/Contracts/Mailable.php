<?php

namespace Kirki\Ecommerce\App\Contracts;

defined('ABSPATH') || exit;

/**
 * Contract for an email that can be sent or previewed.
 *
 * @since 1.0.0
 */
interface Mailable
{
    /**
     * Send the email to a recipient.
     *
     * @since 1.0.0
     *
     * @param string $to Recipient email address.
     * @return bool Whether the email was accepted for delivery.
     */
    public function send(string $to);

    /**
     * Get the rendered HTML body of the email for previewing.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_preview_html();
}
