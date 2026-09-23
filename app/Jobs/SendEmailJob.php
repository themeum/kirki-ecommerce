<?php

namespace Kirki\Ecommerce\App\Jobs;

use Kirki\Ecommerce\App\Scheduler\Concerns\Queueable;
use Exception;

/**
 * Queued job for sending an email, currently a placeholder with the send logic commented out.
 *
 * @since 1.0.0
 */
class SendEmailJob
{
    use Queueable;

    /** @var int */
    protected $retry = 3;

    /**
     * Run the job with the arguments it was queued with.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $args Decoded job arguments.
     * @return void
     */
    public function handle($args)
    {
        // $result = wp_mail($args['email'], 'Testing email', 'This is a test email: ' . $args['id']);

        // if (!$result) {
        //     throw new Exception('Failed to send email');
        // }
    }
}
