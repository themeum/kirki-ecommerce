<?php

namespace Kirki\Ecommerce\App\Jobs;

use Kirki\Ecommerce\App\Scheduler\Concerns\Queueable;
use Exception;

class SendEmailJob
{
    use Queueable;
    protected $retry = 3;
    public function handle($args)
    {
        // $result = wp_mail($args['email'], 'Testing email', 'This is a test email: ' . $args['id']);

        // if (!$result) {
        //     throw new Exception('Failed to send email');
        // }
    }
}
