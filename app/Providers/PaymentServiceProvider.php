<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\App\Payment\PaymentManager;

/**
 * Registers the payment manager singleton.
 *
 * @since 1.0.0
 */
class PaymentServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->singleton(PaymentManager::class);
    }
}
