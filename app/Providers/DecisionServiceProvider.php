<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\App\Decisions\DecisionEngine;

use function Kirki\Ecommerce\Framework\config;

/**
 * Registers the decision engine singleton, built from the decisions config, and its alias.
 *
 * @since 1.0.0
 */
class DecisionServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
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
