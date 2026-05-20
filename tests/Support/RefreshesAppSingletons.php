<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\Application;
use ReflectionClass;

trait RefreshesAppSingletons
{
    protected static function forget_singleton(string $abstract): void
    {
        $app = Application::get_instance();
        $reflection = new ReflectionClass($app);
        $property = $reflection->getProperty('instances');
        $property->setAccessible(true);
        $instances = $property->getValue($app);

        unset($instances[$abstract]);

        $property->setValue($app, $instances);
    }
}
