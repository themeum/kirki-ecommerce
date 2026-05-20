<?php

namespace Kirki\Ecommerce\Discovery;

use Kirki\Ecommerce\Contracts\Cacheable;
use Kirki\Ecommerce\Contracts\Discoverable;
use Kirki\Ecommerce\Collections\Collection;
use ReflectionClass;
use ReflectionMethod;
use ReflectionNamedType;

use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\app_path;
use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\config_path;

class ListenerDiscovery implements Discoverable, Cacheable
{
    /**
     * The discovered listeners array .
     *
     * @var array
     */
    protected array $listeners = [];

    /**
     * Discover the listeners from the file system.
     *
     * @return self
     */
    public function discover()
    {
        // For the production mode we will cache the listeners to improve the performance.
        // So don't need to discover the listeners from the filesystem.
        if (!app()->is_dev_mode()) {
            return $this;
        }

        $listeners_directory = app_path('Listeners');

        if (!file_exists($listeners_directory)) {
            return $this;
        }

        $listeners_files = glob($listeners_directory . '/*.php');

        if (empty($listeners_files)) {
            return $this;
        }

        foreach ($listeners_files as $file) {
            $listener = $this->listener_class(
                $this->filename($file)
            );

            if (!$this->is_valid_listener($listener)) {
                continue;
            }

            $event = $this->event_class($listener);

            if (is_null($event)) {
                continue;
            }

            $priority = $this->priority($listener);

            $this->listeners[$event][] = compact(
                'listener',
                'priority',
            );
        }

        return $this;
    }

    /**
     * Get the listeners array.
     *
     * @return array
     */
    public function listeners()
    {
        return $this->prepare($this->listeners);
    }

    /**
     * Get the priority of the listener.
     *
     * @param string $listener
     * @return int
     */
    protected function priority(string $listener)
    {
        $reflection = new ReflectionClass($listener);
        $method = $reflection->getMethod('priority');

        return $method->invoke(
            $reflection->newInstanceWithoutConstructor()
        );
    }

    /**
     * Get the event class of the listener.
     *
     * @param string $listener
     * @return string|null
     */
    protected function event_class(string $listener)
    {
        $method = new ReflectionMethod($listener, 'handle');
        $parameters = $method->getParameters();

        if (empty($parameters) || count($parameters) !== 1) {
            return null;
        }

        $parameter = $parameters[0];
        $type = $parameter->getType();
        $type_name = $type instanceof ReflectionNamedType ? $type->getName() : (string) $type;

        if (!class_exists($type_name)) {
            return null;
        }

        return $type_name;
    }

    /**
     * Get the filename of the listener.
     *
     * @param string $file
     * @return string
     */
    protected function filename(string $file)
    {
        return basename($file, '.php');
    }

    /**
     * Get the listener class of the filename.
     *
     * @param string $filename
     * @return string
     */
    protected function listener_class(string $filename)
    {
        $namespace = 'Ecommerce\\App\\Listeners\\';

        return $namespace . $filename;
    }

    /**
     * Check if the listener is valid.
     *
     * @param string $listener
     * @return bool
     */
    protected function is_valid_listener(string $listener)
    {
        if (!class_exists($listener)) {
            return false;
        }

        $reflection = new ReflectionClass($listener);

        if (!$reflection->hasMethod('handle')) {
            return false;
        }

        return true;
    }

    /**
     * Cache the listeners.
     *
     * @param string|null $path
     * @return $this
     */
    public function cache(?string $path = null)
    {
        // We only cache the listeners in the development mode.
        // For the production mode we will use the cached listeners.
        if (!app()->is_dev_mode()) {
            return $this;
        }

        $path = $path ?? config_path('listeners.cache.php');

        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, '<?php return ' . var_export($this->listeners(), true) . ';');

        return $this;
    }

    /**
     * Prioritize the listeners.
     *
     * @param array $listeners
     * @return array
     */
    protected function prioritize(array $listeners)
    {
        usort($listeners, function ($first, $second) {
            return $second['priority'] - $first['priority'];
        });

        return $listeners;
    }

    /**
     * Prepare the listeners.
     *
     * @param array $listeners
     * @return array
     */
    protected function prepare(array $listeners)
    {
        $prepared = [];

        foreach ($listeners as $event => $listener) {
            $prepared[$event] = collection($this->prioritize($listener))
                ->pluck('listener')
                ->all();
        }

        return $prepared;
    }
}
