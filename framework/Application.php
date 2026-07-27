<?php

namespace Kirki\Ecommerce;

use Kirki\Ecommerce\Container;
use Kirki\Ecommerce\Contracts\Request as RequestContract;
use Kirki\Ecommerce\Console\CommandManager;
use Kirki\Ecommerce\Console\Commands\FreshCommand;
use Kirki\Ecommerce\Console\Commands\GenerateDocsCommand;
use Kirki\Ecommerce\Console\Commands\MakeApiDocCommand;
use Kirki\Ecommerce\Console\Commands\MakeClassCommand;
use Kirki\Ecommerce\Console\Commands\MakeControllerCommand;
use Kirki\Ecommerce\Console\Commands\MakeMigrationCommand;
use Kirki\Ecommerce\Console\Commands\MakeModelCommand;
use Kirki\Ecommerce\Console\Commands\MakeProviderCommand;
use Kirki\Ecommerce\Console\Commands\MakeRequestCommand;
use Kirki\Ecommerce\Console\Commands\MakeSeederCommand;
use Kirki\Ecommerce\Console\Commands\MigrateCommand;
use Kirki\Ecommerce\Console\Commands\SeedCommand;
use Kirki\Ecommerce\Database\Connection\DatabaseManager;
use Kirki\Ecommerce\Database\Schema\SchemaManager;
use Kirki\Ecommerce\Managers\EventManager;
use Kirki\Ecommerce\Managers\LogManager;
use Kirki\Ecommerce\Managers\OptionManager;
use Kirki\Ecommerce\Managers\PolicyManager;
use Kirki\Ecommerce\ServiceProvider;
use Kirki\Ecommerce\Filesystem\FileSystemServiceProvider;
use Kirki\Ecommerce\Http\Request;
use Kirki\Ecommerce\Managers\DateManager;
use Kirki\Ecommerce\Filesystem\Path;
use Kirki\Ecommerce\Http\Client\Request as ClientRequest;
use Kirki\Ecommerce\CoreServiceProvider;
use Kirki\Ecommerce\Wordpress\HookServiceProvider;
use Kirki\Ecommerce\Supports\Facades\Command;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;
use Kirki\Ecommerce\Supports\Traits\Macroable;
use Exception;
use InvalidArgumentException;
use RuntimeException;

/**
 * The main application class.
 * This class is responsible for bootstrapping the plugin and managing the plugin lifecycle.
 * 
 * @method bool is_dev_mode()
 */
class Application extends Container
{
    use Macroable;

    /**
     * Base path
     * @var string|null
     */
    protected $base_path;

    /**
     * Bootstrap path
     * @var string
     */
    protected $bootstrap_path;

    /**
     * Config path
     * @var string
     */
    protected $config_path;

    /**
     * App path
     * @var string
     */
    protected $app_path;

    /**
     * Database path
     * @var string
     */
    protected $database_path;

    /**
     * Resources path
     * @var string
     */
    protected $resource_path;

    /**
     * Service providers
     * @var array
     */
    protected $service_providers = [];

    /**
     * Mark the application booted or not
     *
     * @var bool
     */
    protected bool $booted = false;

    /**
     * Booting callbacks
     * @var array
     */
    protected array $booting_callbacks = [];

    /**
     * Booted callbacks
     * @var array
     */
    protected array $booted_callbacks = [];

    /**
     * The application namespace
     * @var string
     */
    protected string $namespace;

    /**
     * The application prefix
     * @var string
     */
    protected string $prefix = '';

    /**
     * Create a new application instance
     *
     * @return void
     */
    public function __construct(?string $base_path = null)
    {
        if ($base_path) {
            $this->set_base_path($base_path);
        }

        $this->register_base_bindings();
        $this->register_base_service_providers();
        $this->register_base_aliases();

        $this->register_app_defined_providers();
        $this->register_app_defined_aliases();
    }

    /**
     * Set the base path
     *
     * @param string $path
     * @return Application
     */
    public function set_base_path(string $path)
    {
        $this->base_path = rtrim($path, '\/');

        $this->bind_inferred_paths();

        return $this;
    }

    /**
     * Binding the inferred paths
     *
     * @return void
     */
    protected function bind_inferred_paths()
    {
        $this->instance('path', $this->path());
        $this->instance('path.base', $this->base_path());
        $this->instance('path.bootstrap', $this->bootstrap_path());
        $this->instance('path.config', $this->config_path());
        $this->instance('path.database', $this->database_path());
        $this->instance('path.resource', $this->resource_path());
    }

    /**
     * Registering the core bindings to the application container.
     *
     * @return void
     */
    protected function register_base_bindings()
    {
        $this->instance('app', $this);
        $this->instance(Container::class, $this);
    }

    /**
     * Registering the core service providers to the application container.
     *
     * @return void
     */
    protected function register_base_service_providers()
    {
        $this->register(new FileSystemServiceProvider($this));
        $this->register(new CoreServiceProvider($this));
        $this->register(new HookServiceProvider($this));
    }

    /**
     * Registering the core CLI commands.
     *
     * @return void
     */
    protected function register_base_cli_commands()
    {
        $commands = [
            'make:migration' => MakeMigrationCommand::class,
            'migrate' => MigrateCommand::class,
            'make:model' => MakeModelCommand::class,
            'make:controller' => MakeControllerCommand::class,
            'make:request' => MakeRequestCommand::class,
            'make:seeder' => MakeSeederCommand::class,
            'db:seed' => SeedCommand::class,
            'migrate:fresh' => FreshCommand::class,
            'make:provider' => MakeProviderCommand::class,
            'make:class' => MakeClassCommand::class,
            'make:api-doc' => MakeApiDocCommand::class,
            'docs:generate' => GenerateDocsCommand::class,
        ];

        foreach ($commands as $command => $class) {
            Command::register($command, $class);
        }
    }

    /**
     * Registering the core aliases for future use.
     *
     * @return void
     */
    protected function register_base_aliases()
    {
        foreach (
            [
                'db' => DatabaseManager::class,
                'schema' => SchemaManager::class,
                'option' => OptionManager::class,
                'policy' => PolicyManager::class,
                'event' => EventManager::class,
                'log' => LogManager::class,
                'date' => DateManager::class,
                'client-request' => ClientRequest::class,
                'command' => CommandManager::class,
                RequestContract::class => Request::class,
            ] as $key => $abstract
        ) {
            $this->alias($key, $abstract);
        }
    }

    /**
     * Register a service provider to the application.
     *
     * @param ServiceProvider|string $provider
     * @return ServiceProvider
     */
    public function register($provider)
    {
        $registered = $this->get_provider($provider);

        if ($registered) {
            return $registered;
        }

        if (is_string($provider)) {
            $provider = $this->resolve_provider($provider);
        }

        $provider->register();

        $this->mark_as_registered($provider);

        if ($this->is_booted()) {
            $this->boot_provider($provider);
        }

        return $provider;
    }

    /**
     * Get the registered service provider.
     *
     * @param ServiceProvider|string $provider
     * @return ServiceProvider|null
     */
    protected function get_provider($provider)
    {
        $name = is_string($provider) ? $provider : get_class($provider);

        return $this->service_providers[$name] ?? null;
    }

    /**
     * Resolve service provider from provider class name.
     *
     * @param string $provider
     * @return ServiceProvider
     */
    protected function resolve_provider(string $provider)
    {
        return new $provider($this);
    }

    /**
     * Mark the service provider as registered.
     *
     * @param ServiceProvider $provider
     * @return void
     */
    protected function mark_as_registered(ServiceProvider $provider)
    {
        $class = get_class($provider);

        $this->service_providers[$class] = $provider;
    }

    /**
     * Boot the service provider.
     *
     * @param ServiceProvider $provider
     * @return void
     */
    protected function boot_provider(ServiceProvider $provider)
    {
        if (method_exists($provider, 'boot')) {
            $provider->boot();
        }
    }

    /**
     * Check if the application is booted or not.
     *
     * @return bool
     */
    public function is_booted()
    {
        return $this->booted;
    }

    /**
     * Configure the application.
     *
     * @return self
     */
    public static function configure(string $base_path)
    {
        return static::get_instance($base_path);
    }

    /**
     * Register a route file.
     *
     * @param string $path
     * @return self
     */
    public function use_routing(string $path)
    {
        if (!file_exists($path)) {
            throw new Exception("Route file not found: $path");
        }


        include $path;

        return $this;
    }

    public function use_prefix(string $prefix)
    {
        $this->prefix = Str::snake($prefix);

        return $this;
    }

    /**
     * Get the application prefix.
     *
     * @return string
     */
    public function prefix()
    {
        return $this->prefix;
    }

    /**
     * Register a bootstrap path.
     *
     * @param string $path
     * @return self
     */
    public function use_bootstrap_path($path)
    {
        $this->bootstrap_path = $path;

        $this->instance('path.bootstrap', $path);

        return $this;
    }

    /**
     * Register a config path.
     *
     * @param string $path
     * @return self
     */
    public function use_config_path($path)
    {
        $this->config_path = $path;

        $this->instance('path.config', $path);

        return $this;
    }

    /**
     * Register an app path.
     *
     * @param string $path
     * @return self
     */
    public function use_app_path($path)
    {
        $this->app_path = $path;

        $this->instance('path', $path);

        return $this;
    }

    /**
     * Register a database path.
     *
     * @param string $path
     * @return self
     */
    public function use_database_path($path)
    {
        $this->database_path = $path;

        $this->instance('path.database', $path);

        return $this;
    }

    public function use_resource_path($path)
    {
        $this->resource_path = $path;

        $this->instance('path.resource', $path);

        return $this;
    }

    /**
     * Join paths.
     *
     * @param string $base_path
     * @param string $path
     * @return string
     */
    protected function join_paths($base_path, $path)
    {
        return Path::join($base_path, $path);
    }

    /**
     * Get the path to the app directory.
     *
     * @param string $path
     * @return string
     */
    public function path($path = '')
    {
        return $this->join_paths($this->app_path ?: $this->base_path('app'), $path);
    }

    /**
     * Get the path to the base directory.
     *
     * @param string $path
     * @return string
     */
    public function base_path($path = '')
    {
        return $this->join_paths($this->base_path, $path);
    }

    /**
     * Get the path to the bootstrap directory.
     *
     * @param string $path
     * @return string
     */
    public function bootstrap_path($path = '')
    {
        return $this->join_paths($this->bootstrap_path ?: $this->base_path('bootstrap'), $path);
    }

    /**
     * Get the path to the config directory.
     *
     * @param string $path
     * @return string
     */
    public function config_path($path = '')
    {
        return $this->join_paths($this->config_path ?: $this->base_path('config'), $path);
    }

    /**
     * Get the path to the database directory.
     *
     * @param string $path
     * @return string
     */
    public function database_path($path = '')
    {
        return $this->join_paths($this->database_path ?: $this->base_path('database'), $path);
    }

    /**
     * Get the path to the resources directory.
     *
     * @param string $path
     * @return string
     */
    public function resource_path($path = '')
    {
        return $this->join_paths($this->resource_path ?: $this->base_path('resources'), $path);
    }

    /**
     * Get the path to the bootstrap providers file.
     *
     * @return string
     */
    public function bootstrap_service_provider_path()
    {
        return $this->bootstrap_path('providers.php');
    }

    /**
     * Get the base URL of the application.
     *
     * @param string $path
     * @return string
     */
    public function base_url($path = '')
    {
        return site_url('wp-content/plugins/kirki-ecommerce/' . $path); // @todo: remove this hardcoded path
    }

    /**
     * Check if the CLI is available or not.
     *
     * @return bool
     */
    public function is_cli_available()
    {
        /** @disregard */
        return defined('WP_CLI') && WP_CLI;
    }

    /**
     * Register a booting callback.
     *
     * @param callable $callback
     * @return void
     */
    public function booting($callback)
    {
        $this->booting_callbacks[] = $callback;
    }

    /**
     * Boot the plugin application.
     *
     * @return void
     */
    public function boot()
    {
        if ($this->is_booted()) {
            return;
        }

        $this->fire_app_callbacks($this->booting_callbacks);

        array_walk($this->service_providers, function ($provider) {
            $this->boot_provider($provider);
        });

        $this->booted = true;

        $this->fire_app_callbacks($this->booted_callbacks);

        // After booting the application, register the core CLI commands.
        if ($this->is_cli_available()) {
            $this->register_base_cli_commands();
        }
    }

    /**
     * Register a booted callback.
     *
     * @param callable $callback
     * @return void
     */
    public function booted($callback)
    {
        $this->booted_callbacks[] = $callback;

        if ($this->is_booted()) {
            $callback($this);
        }
    }

    /**
     * Fire the booting callbacks.
     *
     * @return void
     */
    protected function fire_app_callbacks(array $callbacks)
    {
        foreach ($callbacks as $callback) {
            $callback($this);
        }
    }

    /**
     * Register other on demand provided providers.
     *
     * @return void
     */
    protected function register_app_defined_providers()
    {
        $path = $this->bootstrap_service_provider_path();

        if (!file_exists($path)) {
            return;
        }

        $providers = require $path;

        if (empty($providers)) {
            return;
        }

        foreach ($providers as $provider) {
            if (!class_exists($provider) || !is_subclass_of($provider, ServiceProvider::class)) {
                throw new InvalidArgumentException(
                    sprintf(
                        __('Class %s must be a subclass of %s.', 'kirki-ecommerce'),
                        $provider,
                        ServiceProvider::class
                    )
                );
            }

            $this->register(new $provider($this));
        }
    }

    /**
     * Register tha aliases defined at the application level.
     * Generally it will come from the bootstrap/aliases.php file.
     *
     * @return void
     */
    protected function register_app_defined_aliases()
    {
        $aliases_path = $this->bootstrap_path('aliases.php');

        if (!file_exists($aliases_path)) {
            return;
        }

        $aliases = require $aliases_path;

        if (empty($aliases)) {
            return;
        }

        foreach ($aliases as $alias => $abstracts) {
            foreach ($abstracts as $abstract) {
                $this->alias($alias, $abstract);
            }
        }
    }

    /**
     * Get the application namespace.
     *
     * @return string
     */
    public function get_namespace()
    {
        if (!is_null($this->namespace)) {
            return $this->namespace;
        }

        return $this->namespace = $this->parse_namespace_from_composer();
    }

    /**
     * Parse the namespace from the composer.json file.
     *
     * @return string
     */
    protected function parse_namespace_from_composer()
    {
        $composer = File::json(
            File::get($this->base_path('composer.json'))
        );

        if (empty($composer['autoload']['psr-4'])) {
            throw new RuntimeException('The composer must have a PSR-4 autoload configuration.');
        }

        $namespaces = $composer['autoload']['psr-4'];

        foreach ($namespaces as $namespace => $path) {
            if (realpath($this->path()) === realpath($this->base_path($path))) {
                return $this->namespace = $namespace;
            }
        }

        throw new RuntimeException('Unable to detect application namespace.');
    }
}
