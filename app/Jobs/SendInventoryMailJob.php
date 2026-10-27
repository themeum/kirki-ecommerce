<?php

namespace Kirki\Ecommerce\App\Jobs;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Jobs\Concerns\SendsMail;
use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;
use RuntimeException;

/**
 * Sends one inventory email about a group of variants to one recipient in the background.
 *
 * @since 1.0.0
 */
class SendInventoryMailJob implements ShouldQueue
{
    use Queueable;
    use SendsMail;

    const QUEUE = 'emails';

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
     * IDs of the variants the email is about.
     *
     * @var int[]
     */
    public $variant_ids;

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
     * Only the variant IDs are stored. The variants are re-fetched when the job
     * runs, so the email shows the stock at the time it is sent.
     *
     * @since 1.0.0
     *
     * @param int[]  $variant_ids  IDs of the variants the email is about.
     * @param string $mailer_class The Mailer subclass that builds the email.
     * @param string $email        The recipient email address.
     */
    public function __construct(array $variant_ids, string $mailer_class, string $email)
    {
        $this->variant_ids = array_values(array_map('intval', $variant_ids));
        $this->mailer_class = $mailer_class;
        $this->email = $email;

        $this->on_queue(static::QUEUE);
    }

    /**
     * Send the email unless it is disabled, has no recipient, or none of its variants still exist.
     *
     * @since 1.0.0
     *
     * @return void
     * @throws RuntimeException When wp_mail() fails, so the queue retries the job.
     */
    public function handle()
    {
        if (!$this->can_send($this->mailer_class, $this->email)) {
            return;
        }

        $variants = Variant::with(['product', 'attribute_values'])->where_in('id', $this->variant_ids)->get()->all();

        if (empty($variants)) {
            return;
        }

        /** @var Mailer $mailer */
        $mailer = new $this->mailer_class(...$variants);

        $this->deliver($mailer, $this->email);
    }
}
