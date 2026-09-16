<?php

namespace Kirki\Ecommerce\App\Providers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\RateLimiting\Limit;
use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\Framework\Supports\Facades\RateLimiter;

class RateLimiterServiceProvider extends ServiceProvider
{
    /**
     * Register the settings services.
     *
     * @return void
     * 
     * @since 1.0.0
     */
    public function register()
    {
        // Nothing to do here
    }

    /**
     * Boot the service prodiver. Here we are going to register
     * all the rate limiters.
     * 
     * @return void
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
