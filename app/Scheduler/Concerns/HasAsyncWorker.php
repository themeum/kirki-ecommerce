<?php

namespace Kirki\Ecommerce\App\Scheduler\Concerns;

use Kirki\Ecommerce\App\Scheduler\Constants\Config;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\with_prefix;

trait HasAsyncWorker
{
    /**
     * Trigger the async worker.
     *
     * This method initiates an asynchronous background process by sending a non-blocking
     * HTTP POST request to the WordPress AJAX handler. It uses a very short timeout
     * to ensure the current request continues execution immediately without waiting
     * for the worker to complete its task.
     *
     * @return void
     */
    public function trigger_async_worker()
    {
        $url = admin_url('admin-ajax.php');
        $args = [
            'timeout' => 0.01,
            'blocking' => false,
            'body' => [
                'action' => with_prefix(Config::ASYNC_WORKER_ACTION_NAME),
                'secret' => Option::get(Config::ASYNC_WORKER_SECRET_KEY_NAME),
            ],
            'sslverify' => apply_filters('https_local_ssl_verify', false),
        ];

        wp_remote_post($url, $args);
    }
}
