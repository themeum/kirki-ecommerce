<?php

namespace Kirki\Ecommerce\App\Jobs;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;
use Kirki\Ecommerce\Framework\Queue\Concerns\SerializesModels;
use RuntimeException;

/**
 * Sends one order email to one recipient in the background.
 *
 * The mailer class decides the email content, so any order email (new order,
 * shipped, ...) can reuse this job. A mail disabled in the email settings is
 * skipped when the job runs, so toggling it off also stops queued sends.
 *
 * @since 1.0.0
 */
class SendOrderMailJob implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    const QUEUE = 'emails';

    /**
     * Delete the job if the order no longer exists.
     *
     * @var bool
     */
    protected $delete_when_missing_models = true;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    protected $tries = 3;

    /**
     * The seconds to wait before retrying a failed attempt.
     *
     * @var int
     */
    protected $backoff = 60;

    /**
     * The order the email is about.
     *
     * @var Order
     */
    public $order;

    /**
     * The Mailer subclass that builds the email content.
     *
     * @var string
     */
    public $mailer_class;

    /**
     * The recipient email address.
     *
     * @var string
     */
    public $email;

    /**
     * Create a new job instance.
     *
     * The order is stored as an identifier and re-fetched when the job runs.
     * The job always goes to the emails queue, whichever call site dispatches it.
     *
     * @since 1.0.0
     *
     * @param Order  $order        The order the email is about.
     * @param string $mailer_class The Mailer subclass that builds the email.
     * @param string $email        The recipient email address.
     */
    public function __construct(Order $order, string $mailer_class, string $email)
    {
        $this->order = $order;
        $this->mailer_class = $mailer_class;
        $this->email = $email;

        $this->on_queue(static::QUEUE);
    }

    /**
     * Send the email unless it is disabled or has no recipient.
     *
     * @since 1.0.0
     *
     * @return void
     * @throws RuntimeException When wp_mail() fails, so the queue retries the job.
     */
    public function handle()
    {
        if (empty($this->email) || !is_subclass_of($this->mailer_class, Mailer::class)) {
            return;
        }

        /** @var Mailer $mailer */
        $mailer = new $this->mailer_class($this->order);

        if (!$mailer->is_enabled()) {
            return;
        }

        if (!$mailer->send($this->email)) {
            throw new RuntimeException(
                esc_html(
                    /* translators: 1: mailer class, 2: recipient email */
                    sprintf(__('Failed to send %1$s to %2$s.', 'kirki-ecommerce'), $this->mailer_class, $this->email)
                )
            );
        }
    }
}
