<?php

namespace Kirki\Ecommerce\Tests\Unit;

use Kirki\Ecommerce\Application;
use Kirki\Ecommerce\Container;
use Kirki\Ecommerce\Managers\DateManager;
use Kirki\Ecommerce\Supports\EuropeanCountryChecker;
use Kirki\Ecommerce\Supports\Str;
use PHPUnit\Framework\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function tearDown(): void
    {
        $this->reset_container_instance();
        $this->reset_european_country_checker_cache();
        $this->reset_str_macros();

        parent::tearDown();
    }

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

        $this->set_container_instance($container);
    }

    protected function bootstrap_application(): Application
    {
        $this->reset_container_instance();

        return Application::get_instance(self::plugin_path());
    }

    protected function reset_container_instance(): void
    {
        $this->set_container_instance(null);
    }

    protected function set_container_instance(?Container $container): void
    {
        $reflection = new \ReflectionClass(Container::class);
        $property = $reflection->getProperty('instance');
        $property->setAccessible(true);
        $property->setValue(null, $container);
    }

    protected function reset_european_country_checker_cache(): void
    {
        $this->set_european_country_checker_data([]);
    }

    protected function set_european_country_checker_data(array $countries): void
    {
        $reflection = new \ReflectionClass(EuropeanCountryChecker::class);
        $property = $reflection->getProperty('eu_countries');
        $property->setAccessible(true);
        $property->setValue(null, $countries);
    }

    protected function reset_str_macros(): void
    {
        $reflection = new \ReflectionClass(Str::class);
        $property = $reflection->getProperty('macros');
        $property->setAccessible(true);
        $property->setValue(null, []);
    }
}
