<?php

namespace Kirki\Ecommerce\App\Contracts;

defined('ABSPATH') || exit;

interface Mailable
{
    /**
     * Send the email
     * 
     * @param string $to
     * @return bool
     */
    public function send(string $to);

    /**
     * Get the preview HTML
     * 
     * @return string
     */
    public function get_preview_html();
}
