<?php

namespace Kirki\Ecommerce\App\Jobs\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use RuntimeException;

/**
 * Shared delivery logic for the jobs that send one notification email to one recipient.
 *
 * A mail disabled in the email settings is skipped when the job runs, so
 * toggling it off also stops queued sends. A failed send throws, so the
 * queue retries the job.
 *
 * @since 1.0.0
 */
trait SendsMail
{
    /**
     * Determine whether the job has a recipient and a valid mailer class to send with.
     *
     * @since 1.0.0
     *
     * @param string $mailer_class The Mailer subclass that builds the email.
     * @param string $email        The recipient email address.
     * @return bool
     */
    protected function can_send(string $mailer_class, string $email)
    {
        return !empty($email) && is_subclass_of($mailer_class, Mailer::class);
    }

    /**
     * Send the email unless its notification is disabled.
     *
     * @since 1.0.0
     *
     * @param Mailer $mailer The mail to send.
     * @param string $email  The recipient email address.
     * @return void
     * @throws RuntimeException When wp_mail() fails, so the queue retries the job.
     */
    protected function deliver(Mailer $mailer, string $email)
    {
        if (!$mailer->is_enabled()) {
            return;
        }

        if (!$mailer->send($email)) {
            throw new RuntimeException(
                esc_html(
                    /* translators: 1: mailer class, 2: recipient email */
                    sprintf(__('Failed to send %1$s to %2$s.', 'kirki-ecommerce'), get_class($mailer), $email)
                )
            );
        }
    }
}
