<?php

namespace Kirki\Ecommerce;

use Closure;
use Kirki\Ecommerce\Contracts\Request as RequestContract;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Model;
use Exception;
use Kirki\Ecommerce\Exceptions\InvalidRoutActionException;
use Kirki\Ecommerce\Exceptions\ModelNotFoundException;
use Kirki\Ecommerce\Http\Request;
use InvalidArgumentException;
use ReflectionClass;
use ReflectionMethod;
use ReflectionNamedType;
use WP_REST_Request;

use function Kirki\Ecommerce\app;

/**
 * Handles route registration and middleware for the Ecommerce REST API.
 *
 * @since 1.0.0
 */
class Route
{
    /**
     * REST API namespace.
     *
     * @since 1.0.0
     * @var string
     */
    protected static $namespace = '';

    /**
     * Array of registered routes.
     *
     * @since 1.0.0
     * @var array
     */
    protected static $routes = [];

    /**
     * Group stack to hold the group options.
     *
     * @since 1.0.0
     * @var array
     */
    protected static $group_stack = [];

    /**
     * HTTP method for the route.
     *
     * @since 1.0.0
     * @var string
     */
    protected $method;

    /**
     * The endpoint path for the route.
     *
     * @since 1.0.0
     * @var string
     */
    protected $endpoint;

    /**
     * Controller class and method for handling the route.
     *
     * @since 1.0.0
     * @var array
     */
    protected $action;

    /**
     * Array of middleware classes.
     *
     * @since 1.0.0
     * @var array
     */
    protected $middlewares = [];

    /**
     * Regex patterns.
     *
     * @since 1.0.0
     * @var array
     */
    protected $patterns = [];

    /**
     * Array of class instances.
     *
     * @since 1.0.0
     * @var array
     */
    protected static $instances = [];

    /**
     * Set the API namespace for all registered routes.
     *
     * @since 1.0.0
     *
     * @param string $namespace The namespace for REST API routes.
     * @return void
     */
    public static function set_namespace(string $namespace)
    {
        static::$namespace = $namespace;
    }

    /**
     * Get the API namespace.
     *
     * @since 1.0.0
     * @return string
     */
    public static function get_namespace()
    {
        return static::$namespace;
    }

    /**
     * Get the URL for a specific route.
     *
     * @since 1.0.0
     *
     * @param string $path The route path.
     * @return string The URL for the route.
     */
    public static function url(string $path)
    {
        return rest_url('/' . static::$namespace . '/' . $path);
    }

    /**
     * Attach middleware to the current route.
     *
     * @since 1.0.0
     *
     * @param string|array $middleware The fully qualified class name of the middleware.
     * @return $this
     */
    public function middleware($middleware)
    {
        if (is_array($middleware)) {
            $this->middlewares = array_merge($this->middlewares, $middleware);

            return $this;
        }

        $this->middlewares[] = $middleware;

        return $this;
    }

    /**
     * Set a regex pattern for the specific route param.
     *
     * @since 1.0.0
     *
     * @param string $name
     * @param string $regex
     * @return static
     */
    public function where(string $name, string $regex)
    {
        $this->patterns[$name] = $regex;

        return $this;
    }

    /**
     * Get the endpoint in proper format that register_rest_route() expects.
     *
     * @return void
     */
    protected function get_formatted_endpoint()
    {
        return preg_replace_callback('/\{(\w+)\}/', function ($matches) {
            $param = $matches[1];
            $pattern = isset($this->patterns[$param]) ? $this->patterns[$param] : '[^/]+';
            return '(?P<' . $param . '>' . $pattern . ')';
        }, $this->endpoint);
    }

    /**
     * Register a GET route.
     *
     * @since 1.0.0
     *
     * @param string        $endpoint The route endpoint.
     * @param array|Closure $action   The controller and method to handle the route.
     * @return static
     */
    public static function get(string $endpoint, $action)
    {
        $instance = new static();
        $instance->method = 'get';
        $instance->endpoint = $endpoint;
        $instance->action = $action;

        $instance->apply_group_options();

        static::$routes[] = $instance;

        return $instance;
    }

    /**
     * Register a POST route.
     *
     * @since 1.0.0
     *
     * @param string        $endpoint   The route endpoint.
     * @param array|Closure $action     The controller and method to handle the route.
     * @return static
     */
    public static function post(string $endpoint, $action)
    {
        $instance = new static();
        $instance->method = 'post';
        $instance->endpoint = $endpoint;
        $instance->action = $action;

        $instance->apply_group_options();

        static::$routes[] = $instance;

        return $instance;
    }

    /**
     * Register a PUT route.
     *
     * @since 1.0.0
     *
     * @param string        $endpoint   The route endpoint.
     * @param array|Closure $action     The controller and method to handle the route.
     * @return static
     */
    public static function put(string $endpoint, $action)
    {
        $instance = new static();
        $instance->method = 'put';
        $instance->endpoint = $endpoint;
        $instance->action = $action;

        $instance->apply_group_options();

        static::$routes[] = $instance;

        return $instance;
    }

    /**
     * Register a PATCH route.
     *
     * @since 1.0.0
     *
     * @param string        $endpoint   The route endpoint.
     * @param array|Closure $action     The controller and method to handle the route.
     * @return static
     */
    public static function patch(string $endpoint, $action)
    {
        $instance = new static();
        $instance->method = 'patch';
        $instance->endpoint = $endpoint;
        $instance->action = $action;

        $instance->apply_group_options();

        static::$routes[] = $instance;

        return $instance;
    }

    /**
     * Register a DELETE route.
     *
     * @since 1.0.0
     *
     * @param string        $endpoint   The route endpoint.
     * @param array|Closure $action     The controller and method to handle the route.
     * @return static
     */
    public static function delete(string $endpoint, $action)
    {
        $instance = new static();
        $instance->method = 'delete';
        $instance->endpoint = $endpoint;
        $instance->action = $action;

        $instance->apply_group_options();

        static::$routes[] = $instance;

        return $instance;
    }

    /**
     * Register a group of routes with shared options.
     *
     * This method allows grouping routes under common configuration options 
     * like middleware, or prefix. The closure receives the context 
     * of the group and defines the routes within it.
     *
     * @since 1.0.0
     *
     * @param array   $options  The shared configuration options for the group.
     * @param \Closure $closure The callback that defines the grouped routes.
     *
     * @return void
     */
    public static function group(array $options, Closure $closure)
    {
        static::$group_stack[] = $options;

        $closure();

        array_pop(static::$group_stack);
    }

    /**
     * Get all registered routes.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public static function get_routes()
    {
        return static::$routes;
    }

    /**
     * Apply route group options like prefix and middleware to the route.
     *
     * This method is typically called when a route is defined within a group,
     * applying any shared prefix or middleware from the group stack.
     * 
     * @since 1.0.0
     *
     * @return void
     */
    public function apply_group_options()
    {
        if (!empty(static::$group_stack)) {
            $group = end(static::$group_stack);

            if (!empty($group['prefix'])) {
                $this->endpoint = rtrim($group['prefix'], '/') . '/' . ltrim($this->endpoint, '/');
            }

            if (!empty($group['middleware'])) {
                $this->middleware($group['middleware']);
            }
        }
    }

    /**
     * Register the route with WordPress.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function register()
    {
        register_rest_route(static::$namespace, $this->get_formatted_endpoint(), [
            'methods' => strtoupper($this->method),
            'callback' => $this->resolve_route(),
            'permission_callback' => '__return_true'
        ]);
    }

    /**
     * Cache a class instance.
     *
     * @since 1.0.0
     *
     * @param string $abstract The class name to bind
     * @param object $instance The instance of the class
     * @return void
     */
    protected function cache(string $abstract, $instance)
    {
        static::$instances[$abstract] = $instance;
    }

    /**
     * Check if a class instance is cached.
     *
     * @since 1.0.0
     *
     * @param string $abstract The class name to check
     * @return bool
     */
    protected function is_cached(string $abstract)
    {
        return isset(static::$instances[$abstract]);
    }

    /**
     * Get a cached class instance.
     *
     * @since 1.0.0
     *
     * @param string $abstract The class name to get
     * @return object
     */
    protected function get_cached(string $abstract)
    {
        return static::$instances[$abstract];
    }

    /**
     * Resolve a class and its dependencies.
     *
     * @param string $abstract The class name to resolve
     * @param array $resolving Stack of classes being resolved (for 
     * circular dependency detection)
     *
     * @return object The resolved instance
     * @throws Exception When class doesn't exist, has circular dependencies, or other resolution errors
     *
     * @example
     * $instance = $this->make(MyClass::class);
     */
    protected function make(string $abstract, array $resolving = [])
    {
        if ($this->is_cached($abstract)) {
            return $this->get_cached($abstract);
        }

        if (in_array($abstract, $resolving, true)) {
            throw new Exception(sprintf(__('Circular dependency detected for class "%s".', 'kirki-ecommerce'), $abstract));
        }

        if (!class_exists($abstract)) {
            throw new Exception(sprintf(__('Class "%s" does not exist.', 'kirki-ecommerce'), $abstract));
        }

        $reflector = new ReflectionClass($abstract);

        if ($reflector->isAbstract()) {
            throw new Exception(sprintf(__('Class "%s" is abstract and cannot be instantiated.', 'kirki-ecommerce'), $abstract));
        }

        $constructor = $reflector->getConstructor();

        if (!$constructor) {
            return new $abstract();
        }

        if (!$constructor->isPublic()) {
            throw new Exception(sprintf(__('Class "%s" has a non-public constructor and cannot be instantiated.', 'kirki-ecommerce'), $abstract));
        }

        $dependencies = [];
        $resolving[] = $abstract;

        foreach ($constructor->getParameters() as $parameter) {
            $type = $parameter->getType();

            if (!$type) {
                throw new Exception(sprintf(__('Parameter "%s" is missing a type hint in the constructor. Please add a class type hint.', 'kirki-ecommerce'), $parameter->getName()));
            }

            if ($type->isBuiltin()) {
                throw new Exception(sprintf(__('Parameter "%s" must be a class type, not a built-in type. Please specify a valid class dependency.', 'kirki-ecommerce'), $parameter->getName()));
            }

            $dependencies[] = $this->is_cached($type->getName())
                ? $this->get_cached($type->getName())
                : $this->make($type->getName(), $resolving);
        }

        $instance = $reflector->newInstanceArgs($dependencies);
        $this->cache($abstract, $instance);

        return $instance;
    }

    /**
     * Make the method dependencies.
     *
     * @since 1.0.0
     *
     * @param string $abstract The class name to make the dependencies.
     * @param string $method The method name to make the dependencies.
     * @return array
     */
    protected function resolve_method_dependencies($abstract, $method)
    {
        $method_reflection = new ReflectionMethod($abstract, $method);

        if (!$method_reflection->isPublic()) {
            throw new Exception(sprintf(__('Method "%s" is not public and cannot be called.', 'kirki-ecommerce'), $method));
        }

        $parameters = $method_reflection->getParameters();
        $dependencies = [
            'requests' => [],
            'builtins' => [],
            'models' => [],
            'abstracts' => [],
        ];

        foreach ($parameters as $parameter) {
            $type = $parameter->getType() ?? 'string';
            $variable = $parameter->getName();
            $position = $parameter->getPosition();

            $type_name = $type instanceof ReflectionNamedType
                ? $type->getName()
                : (string) $type;

            if ($type === 'string' || $type->isBuiltin()) {
                $dependencies['builtins'][] = $this->add_dependency($type_name, $variable, $position);
            } elseif ($type_name === Request::class || $type_name === RequestContract::class || is_subclass_of($type_name, Request::class)) {
                $dependencies['requests'][] = $this->add_dependency($type_name, $variable, $position);
            } elseif (is_subclass_of($type_name, Model::class)) {
                $dependencies['models'][] = $this->add_dependency($type_name, $variable, $position);
            } else {
                $dependencies['abstracts'][] = $this->add_dependency($type_name, $variable, $position);
            }
        }

        if (count($dependencies['requests']) < 1) {
            throw new InvalidArgumentException(sprintf(__('The method "%s" must have at least one request dependency.', 'kirki-ecommerce'), $method));
        }

        if (count($dependencies['requests']) > 1) {
            throw new InvalidArgumentException(sprintf(__('The method "%s" must have only one request dependency.', 'kirki-ecommerce'), $method));
        }

        return $dependencies;
    }

    /**
     * Add a dependency to the dependencies array.
     *
     * @since 1.0.0
     *
     * @param string $type The type of the dependency.
     * @param string $variable The variable name of the dependency.
     * @param int $position The position of the dependency.
     * @return array
     */
    protected function add_dependency($type, $variable, $position)
    {
        return compact('type', 'variable', 'position');
    }

    /**
     * Add a resolved dependency to the dependencies array.
     *
     * @since 1.0.0
     *
     * @param mixed $resolved The resolved dependency.
     * @param int $position The position of the dependency.
     * @return array
     */
    protected function add_resolved_dependency($resolved, int $position)
    {
        return compact('resolved', 'position');
    }

    /**
     * Resolve the requests.
     *
     * @since 1.0.0
     *
     * @param array $requests The requests to resolve.
     * @param WP_REST_Request $rest_request The REST request object.
     * @return array
     */
    protected function resolve_requests(array $requests, WP_REST_Request $rest_request)
    {
        $resolved_requests = [];

        foreach ($requests as $request) {
            $position = $request['position'];
            $type = $request['type'];
            $request = app()->make($type);
            $resolved = $request->make_request($rest_request);

            $resolved_requests[] = $this->add_resolved_dependency($resolved, $position);
        }

        return $resolved_requests;
    }

    /**
     * Resolve the models.
     *
     * @since 1.0.0
     *
     * @param array $models The models to resolve.
     * @param Request $request The request object.
     * @return array
     */
    protected function resolve_models(array $models, Request $request)
    {
        $resolved_models = [];

        foreach ($models as $model) {
            $position = $model['position'];
            $type = $model['type'];
            $variable = $model['variable'];
            $value = $request->get($variable);

            $model = $this->resolve_model($type, $value);
            $resolved_models[] = $this->add_resolved_dependency($model, $position);
        }

        return $resolved_models;
    }

    /**
     * Resolve the built-in types.
     *
     * @since 1.0.0
     *
     * @param array $builtins The built-in types to resolve.
     * @param Request $request The request object.
     * @return array
     */
    protected function resolve_builtins(array $builtins, Request $request)
    {
        $resolved_builtins = [];

        foreach ($builtins as $builtin) {
            $type = $builtin['type'];
            $variable = $builtin['variable'];
            $position = $builtin['position'];
            $value = $request->get($variable, null, $type);
            $resolved_builtins[] = $this->add_resolved_dependency($value, $position);
        }

        return $resolved_builtins;
    }

    /**
     * Resolve the abstracts.
     *
     * @since 1.0.0
     *
     * @param array $abstracts The abstracts to resolve.
     * @param Request $request The request object.
     * @return array
     */

    protected function resolve_abstracts(array $abstracts, Request $request)
    {
        $resolved_abstracts = [];

        foreach ($abstracts as $abstract) {
            $position = $abstract['position'];
            $resolved = app()->make($abstract['type']);
            $resolved_abstracts[] = $this->add_resolved_dependency($resolved, $position);
        }

        return $resolved_abstracts;
    }

    /**
     * Resolve a model from the request.
     *
     * @since 1.0.0
     *
     * @param string $model The model class name
     * @param mixed $value The value of the model
     * @throws ModelNotFoundException
     *
     * @return Model
     */
    protected function resolve_model($model, $value)
    {
        $key_name = (new $model())->get_route_key();

        try {
            return $model::where($key_name, $value)->first_or_fail();
        } catch (ModelNotFoundException $exception) {
            $exception->set_model($model);
            $exception->set_ids($value);

            throw $exception;
        }
    }


    /**
     * Resolve the route handler.
     *
     * @since 1.0.0
     *
     * @return callable
     * @throws InvalidRoutActionException
     */
    protected function resolve_route()
    {
        if ($this->action instanceof Closure) {
            return $this->action;
        }

        return function ($rest_request) {
            if (!is_array($this->action)) {
                throw new InvalidRoutActionException(sprintf(__('Invalid method registered for the route %s', 'kirki-ecommerce'), $this->endpoint));
            }

            if (count($this->action) !== 2) {
                throw new InvalidRoutActionException(sprintf(__('Invalid controller syntax for the route %s', 'kirki-ecommerce'), $this->endpoint));
            }

            [$controller, $method] = $this->action;

            if (!class_exists($controller)) {
                throw new InvalidRoutActionException(sprintf(__('Controller %s not found', 'kirki-ecommerce'), $controller));
            }

            $controller_instance = $this->make($controller);

            if (!method_exists($controller_instance, $method)) {
                throw new InvalidRoutActionException(sprintf(__('The method %s is missing in the controller %s', 'kirki-ecommerce'), $method, $controller));
            }

            try {
                $dependencies = $this->resolve_method_dependencies($controller_instance, $method);
                $requests = $this->resolve_requests($dependencies['requests'], $rest_request);

                $first_request = reset($requests);
                $request_position = $first_request['position'];
                $request = $first_request['resolved'];

                $dependency_array = $this->resolve_dependencies($dependencies, $request);

                $pipeline = array_reduce(
                    array_reverse($this->middlewares),
                    function ($next, $middleware) {
                        return function ($request) use ($next, $middleware) {
                            return (new $middleware)->handle($request, $next);
                        };
                    },
                    function ($request) use ($controller_instance, $method, $dependency_array, $request_position) {
                        $dependency_array = $this->update_request(
                            $dependency_array,
                            $this->add_resolved_dependency($request, $request_position)
                        );
                        $dependency_array = $this->sort_dependencies($dependency_array);
                        $parameters = collection($dependency_array)->pluck('resolved')->all();

                        return $controller_instance->$method(...$parameters);
                    }
                );

                // We are passing the request only while initiating the middleware pipeline
                return $pipeline($request);
            } catch (Exception $exception) {
                return ApiExceptionHandler::get_response($exception);
            }
        };
    }

    /**
     * Prepare the dependencies for the route. This will resolved the models, 
     * abstract classes like services, repositories, built-in types and requests.
     * We are not appending the requests to the dependencies array because we will resolve them later
     * after all the middlewares are handled.
     *
     * @since 1.0.0
     *
     * @param array $dependencies The dependencies of the route.
     * @param Request $request The request object.
     * @return array
     * @throws Exception When the dependencies are not valid.
     */
    protected function resolve_dependencies(array $dependencies, Request $request)
    {
        $models = $this->resolve_models($dependencies['models'], $request);
        $builtins = $this->resolve_builtins($dependencies['builtins'], $request);
        $abstracts = $this->resolve_abstracts($dependencies['abstracts'], $request);

        return array_values(
            array_merge(
                $models,
                $builtins,
                $abstracts
            )
        );
    }

    /**
     * Update the dependencies array with the resolved request.
     * Here we are attaching the request with the dependencies.
     * And this request is the request object after passing all the middlewares.
     *
     * @since 1.0.0
     *
     * @param array $dependencies The dependencies of the route.
     * @param array $resolved_request The resolved request.
     * @return array
     */
    protected function update_request(array $dependencies, array $resolved_request)
    {
        return array_merge(
            $dependencies,
            [$resolved_request]
        );
    }

    /**
     * Sort the dependencies array by position so that it matches the original sequence of the dependencies.
     *
     * @since 1.0.0
     *
     * @param array $dependencies The dependencies of the route.
     * @return array
     */
    protected function sort_dependencies(array $dependencies)
    {
        usort($dependencies, function ($first, $second) {
            return $first['position'] - $second['position'];
        });

        return $dependencies;
    }
}
