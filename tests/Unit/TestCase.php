<?php

namespace Kirki\Ecommerce\Tests\Unit;

use Kirki\Ecommerce\Framework\Application;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Framework\Container;
use Kirki\Ecommerce\Framework\Database\Connection\Connection;
use Kirki\Ecommerce\Framework\Facade;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Database\Query\QueryCompiler;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\App\Supports\EuropeanCountryChecker;
use Kirki\Ecommerce\Framework\Supports\Str;
use Kirki\Ecommerce\Tests\Support\Database\TestWpdb;
use PHPUnit\Framework\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function tearDown(): void
    {
        $this->reset_container_instance();
        $this->reset_european_country_checker_cache();
        $this->reset_str_macros();
        $this->reset_test_wpdb();
        $this->reset_route_state();
        $this->reset_facade_cache();

        parent::tearDown();
    }

    protected static function plugin_path(): string
    {
        return dirname(__DIR__, 2);
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

    protected function make_test_connection(array $config = []): Connection
    {
        global $wpdb;

        $wpdb = new TestWpdb($config);

        return new Connection();
    }

    protected function make_query_compiler(array $config = []): QueryCompiler
    {
        return $this->make_test_connection($config)->get_query_compiler();
    }

    protected function make_query_builder(array $config = []): QueryBuilder
    {
        $connection = $this->make_test_connection($config);

        return new QueryBuilder($connection);
    }

    protected function make_structure(string $table, array $config = []): Structure
    {
        return new Structure($table, $this->make_test_connection($config));
    }

    protected function reset_test_wpdb(): void
    {
        global $wpdb;

        $wpdb = null;
    }

    protected function reset_facade_cache(): void
    {
        $reflection = new \ReflectionClass(Facade::class);
        $property = $reflection->getProperty('resolved_instance');
        $property->setAccessible(true);
        $property->setValue(null, []);
    }

    protected function bind_money_dependencies(string $base_currency = 'USD', array $currency_settings = []): void
    {
        $defaults = [
            'decimal_separator' => '.',
            'thousand_separator' => ',',
            'currency_position' => 'before',
        ];
        $settings = array_merge($defaults, $currency_settings);

        $currency = new \stdClass();
        $currency->code = $base_currency;

        $currency_settings_object = new class($settings) {
            private array $settings;

            public function __construct(array $settings)
            {
                $this->settings = $settings;
            }

            public function get($key = null, $default = null)
            {
                if ($key === null) {
                    return $this->settings;
                }

                return $this->settings[$key] ?? $default;
            }
        };

        $settings_factory = new class($currency_settings_object) {
            private $currency_settings;

            public function __construct($currency_settings)
            {
                $this->currency_settings = $currency_settings;
            }

            public function get(string $key)
            {
                if ($key === 'currency') {
                    return $this->currency_settings;
                }

                throw new \Exception("Invalid settings key: {$key}");
            }
        };

        $currency_service = new class($currency) {
            private $currency;

            public function __construct($currency)
            {
                $this->currency = $currency;
            }

            public function get_base_currency()
            {
                return $this->currency;
            }
        };

        $container = new Container();
        $container->instance('app', $container);
        $container->bind('settings', fn() => $settings_factory);
        $container->singleton(CurrencyService::class, fn() => $currency_service);

        $this->set_container_instance($container);
    }

    protected function reset_route_state(): void
    {
        $reflection = new \ReflectionClass(Route::class);

        foreach (['namespace', 'routes', 'group_stack', 'instances'] as $property_name) {
            $property = $reflection->getProperty($property_name);
            $property->setAccessible(true);

            if ($property_name === 'namespace') {
                $property->setValue(null, '');
                continue;
            }

            $property->setValue(null, []);
        }
    }
}
