<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\ServiceProvider;
use Kirki\Ecommerce\App\Decisions\DecisionEngine;

use function Kirki\Ecommerce\config;

class DecisionServiceProvider extends ServiceProvider
{
    /**
     * Register the hooks to the application.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(
            DecisionEngine::class,
            fn() => new DecisionEngine(config('decisions.conditions'), config('decisions.actions'))
        );

        $this->app->alias('decision_engine', DecisionEngine::class);
    }
}
