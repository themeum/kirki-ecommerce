<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\ServiceProvider;
use Kirki\Ecommerce\App\Managers\OrderManager;
use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateOrderAction;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;

class OrderServiceProvider extends ServiceProvider
{
    /**
     * Register the hooks to the application.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(OrderManager::class);
    }
}
