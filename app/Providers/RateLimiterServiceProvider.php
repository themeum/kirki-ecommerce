<?php

namespace Kirki\Ecommerce\App\Providers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\RateLimiting\Limit;
use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\Framework\Supports\Facades\RateLimiter;

/**
 * Registers the application rate limiters, currently the login limiter.
 *
 * @since 1.0.0
 */
class RateLimiterServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        // Nothing to do here
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function boot()
    {
        RateLimiter::for('login', function (Request $request) {
            $email = $request->input('email');

            return [
                Limit::per_minute(5)->by($email . '|' . $request->ip()),
                Limit::per_minute(20)->by('ip:' . $request->ip()),
            ];
        });
    }
}
