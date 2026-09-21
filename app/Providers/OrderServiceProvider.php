<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\App\Managers\OrderManager;
use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateOrderAction;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;

/**
 * Registers the order manager singleton.
 *
 * @since 1.0.0
 */
class OrderServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->singleton(OrderManager::class);
    }
}
