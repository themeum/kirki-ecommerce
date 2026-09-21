<?php

namespace Kirki\Ecommerce\App\Scheduler\Concerns;

use Kirki\Ecommerce\App\Scheduler\Constants\Config;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\with_prefix;

/**
 * Adds the ability to kick off the scheduler's async worker request.
 *
 * @since 1.0.0
 */
trait HasAsyncWorker
{
    /**
     * Trigger the async worker.
     *
     * Sends a non-blocking POST to the WordPress AJAX handler with a very short timeout,
     * so the current request continues without waiting for the worker to finish.
     *
     * @since 1.0.0
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
