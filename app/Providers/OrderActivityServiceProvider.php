<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\App\Managers\OrderActivityManager;

/**
 * Registers the order activity manager singleton.
 *
 * @since 1.0.0
 */
class OrderActivityServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->singleton(OrderActivityManager::class);
    }
}
