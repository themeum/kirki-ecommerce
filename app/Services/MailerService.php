<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Contracts\Mailable;

class MailerService
{
    /**
     * Send an email
     * 
     * @param Mailable $mail
     * @param string $to
     * 
     * @return bool
     */
    public function send(Mailable $mail, string $to)
    {
        return $mail->send($to);
    }

    /**
     * Get the preview HTML
     * 
     * @param Mailable $mail
     * 
     * @return string
     */
    public function get_preview(Mailable $mail)
    {
        return $mail->get_preview_html();
    }
}
