<?php

namespace Kirki\Ecommerce\Tests\Unit;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Contracts\Request as RequestContract;
use Kirki\Ecommerce\Route;

class RouteDiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->reset_route_state();
        Route::set_namespace('kirki-ecommerce/v1');
    }

    public function test_group_applies_prefix_and_middleware_to_routes(): void
    {
        Route::group([
            'prefix' => 'products',
            'middleware' => [RouteDiTestMiddleware::class],
        ], function () {
            Route::get('{id}', [RouteDiTestController::class, 'show']);
        });

        $routes = Route::get_routes();

        $this->assertCount(1, $routes);
        $this->assertSame('products/{id}', $routes[0]->endpoint ?? $this->read_route_property($routes[0], 'endpoint'));
        $this->assertSame(
            [RouteDiTestMiddleware::class],
            $this->read_route_property($routes[0], 'middlewares')
        );
    }

    public function test_where_replaces_route_parameter_pattern(): void
    {
        $route = Route::get('products/{id}', [RouteDiTestController::class, 'show'])
            ->where('id', '[0-9]+');

        $formatted = $this->invoke_route_method($route, 'get_formatted_endpoint');

        $this->assertSame('products/(?P<id>[0-9]+)', $formatted);
    }

    public function test_make_resolves_constructor_dependencies_and_caches_instances(): void
    {
        $route = Route::get('ping', [RouteDiTestController::class, 'show']);

        $first = $this->invoke_route_method($route, 'make', RouteDiServiceWithDependency::class);
        $second = $this->invoke_route_method($route, 'make', RouteDiServiceWithDependency::class);

        $this->assertInstanceOf(RouteDiServiceWithDependency::class, $first);
        $this->assertSame($first, $second);
        $this->assertSame($first->leaf, $second->leaf);
    }

    public function test_make_detects_circular_dependencies(): void
    {
        $route = Route::get('ping', [RouteDiTestController::class, 'show']);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Circular dependency detected');

        $this->invoke_route_method($route, 'make', RouteDiCircularA::class);
    }

    public function test_resolve_method_dependencies_categorizes_parameters(): void
    {
        $route = Route::get('products/{id}', [RouteDiControllerWithDependencies::class, 'update']);

        $dependencies = $this->invoke_route_method(
            $route,
            'resolve_method_dependencies',
            RouteDiControllerWithDependencies::class,
            'update'
        );

        $this->assertCount(1, $dependencies['requests']);
        $this->assertSame(RequestContract::class, $dependencies['requests'][0]['type']);
        $this->assertCount(1, $dependencies['builtins']);
        $this->assertSame('bool', $dependencies['builtins'][0]['type']);
        $this->assertCount(1, $dependencies['abstracts']);
        $this->assertSame(RouteDiDependentService::class, $dependencies['abstracts'][0]['type']);
    }

    public function test_resolve_method_dependencies_requires_single_request_parameter(): void
    {
        $route = Route::get('ping', [RouteDiControllerWithMultipleRequests::class, 'handle']);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('must have only one request dependency');

        $this->invoke_route_method(
            $route,
            'resolve_method_dependencies',
            RouteDiControllerWithMultipleRequests::class,
            'handle'
        );
    }

    public function test_sort_dependencies_orders_by_parameter_position(): void
    {
        $route = Route::get('ping', [RouteDiTestController::class, 'show']);
        $dependencies = [
            ['resolved' => 'second', 'position' => 1],
            ['resolved' => 'first', 'position' => 0],
        ];

        $sorted = $this->invoke_route_method($route, 'sort_dependencies', $dependencies);

        $this->assertSame(['first', 'second'], array_column($sorted, 'resolved'));
    }

    public function test_update_request_appends_resolved_request_to_dependencies(): void
    {
        $route = Route::get('ping', [RouteDiTestController::class, 'show']);
        $dependencies = [
            ['resolved' => 'service', 'position' => 1],
        ];
        $request = ['resolved' => 'request', 'position' => 0];

        $updated = $this->invoke_route_method($route, 'update_request', $dependencies, $request);

        $this->assertCount(2, $updated);
        $this->assertSame('request', $updated[1]['resolved']);
    }

    private function invoke_route_method(Route $route, string $method, ...$arguments)
    {
        $reflection = new \ReflectionClass(Route::class);
        $method_reflection = $reflection->getMethod($method);
        $method_reflection->setAccessible(true);

        return $method_reflection->invoke($route, ...$arguments);
    }

    private function read_route_property(Route $route, string $property)
    {
        $reflection = new \ReflectionClass(Route::class);
        $property_reflection = $reflection->getProperty($property);
        $property_reflection->setAccessible(true);

        return $property_reflection->getValue($route);
    }
}

class RouteDiTestMiddleware
{
    public function handle($request, callable $next)
    {
        return $next($request);
    }
}

class RouteDiTestController
{
    public function show(RequestContract $request)
    {
        return $request;
    }
}

class RouteDiControllerWithDependencies
{
    public function update(RequestContract $request, bool $force, RouteDiDependentService $service)
    {
        return compact('request', 'force', 'service');
    }
}

class RouteDiControllerWithMultipleRequests
{
    public function handle(RequestContract $first, RequestContract $second)
    {
        return compact('first', 'second');
    }
}

class RouteDiLeafService
{
}

class RouteDiServiceWithDependency
{
    public RouteDiLeafService $leaf;

    public function __construct(RouteDiLeafService $leaf)
    {
        $this->leaf = $leaf;
    }
}

class RouteDiDependentService
{
    public string $label = 'wired';
}

class RouteDiCircularA
{
    public function __construct(RouteDiCircularB $dependency)
    {
    }
}

class RouteDiCircularB
{
    public function __construct(RouteDiCircularA $dependency)
    {
    }
}
