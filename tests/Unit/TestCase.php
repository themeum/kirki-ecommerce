<?php

namespace Kirki\Ecommerce\Tests\Unit;

use Kirki\Ecommerce\Container;
use Kirki\Ecommerce\Managers\DateManager;
use PHPUnit\Framework\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected static function plugin_path(): string
    {
        return dirname(__DIR__, 2);
    }

    protected function bind_date_manager(): void
    {
        $container = new Container();
        $container->instance('app', $container);
        $container->singleton(DateManager::class, function () {
            return new DateManager();
        });
        $container->alias('date', DateManager::class);

        $reflection = new \ReflectionClass(Container::class);
        $property = $reflection->getProperty('instance');
        $property->setAccessible(true);
        $property->setValue(null, $container);
    }
}
