<?php

namespace Kirki\Ecommerce\Tests\Unit;

use Exception;
use Kirki\Ecommerce\Framework\Container;
use LogicException;

class ContainerTest extends TestCase
{
    public function test_bind_resolves_closure_bindings(): void
    {
        $container = new Container();

        $container->bind('service', fn() => new \stdClass());

        $this->assertInstanceOf(\stdClass::class, $container->make('service'));
    }

    public function test_singleton_returns_the_same_instance(): void
    {
        $container = new Container();

        $container->singleton('counter', fn() => new \stdClass());

        $first = $container->make('counter');
        $second = $container->make('counter');

        $this->assertSame($first, $second);
    }

    public function test_instance_returns_pre_resolved_objects(): void
    {
        $container = new Container();
        $service = new \stdClass();

        $container->instance('service', $service);

        $this->assertSame($service, $container->make('service'));
        $this->assertTrue($container->bound('service'));
    }

    public function test_alias_resolves_abstract_by_alias(): void
    {
        $container = new Container();

        $container->bind('logger', fn() => 'logger-instance');
        $container->alias('log', 'logger');

        $this->assertSame('logger-instance', $container->make('log'));
    }

    public function test_alias_to_itself_throws_logic_exception(): void
    {
        $container = new Container();

        $this->expectException(LogicException::class);

        $container->alias('service', 'service');
    }

    public function test_tagged_resolves_all_registered_services(): void
    {
        $container = new Container();

        $container->bind('first', fn() => 'one');
        $container->bind('second', fn() => 'two');
        $container->tag(['first', 'second'], 'handlers');

        $this->assertSame(['one', 'two'], $container->tagged('handlers'));
    }

    public function test_autowire_resolves_typed_dependencies_and_primitives(): void
    {
        $container = new Container();

        $container->bind(ContainerNamedDependency::class, fn() => new ContainerNamedDependency('wired'));

        $service = $container->make(ContainerAutowireTarget::class, [
            'label' => 'primary',
        ]);

        $this->assertSame('primary', $service->label);
        $this->assertSame('wired', $service->dependency->name);
    }

    public function test_autowire_detects_circular_dependencies(): void
    {
        $container = new Container();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Circular dependency detected');

        $container->make(ContainerCircularA::class);
    }

    public function test_flush_clears_bindings_and_instances(): void
    {
        $container = new Container();

        $container->singleton('service', fn() => new \stdClass());
        $container->make('service');
        $container->flush();

        $this->assertFalse($container->bound('service'));
    }

    public function test_get_instance_returns_shared_container(): void
    {
        $this->reset_container_instance();

        $first = Container::get_instance(self::plugin_path());
        $second = Container::get_instance();

        $this->assertSame($first, $second);
    }
}

class ContainerNamedDependency
{
    public string $name;

    public function __construct(string $name)
    {
        $this->name = $name;
    }
}

class ContainerAutowireTarget
{
    public string $label;

    public ContainerNamedDependency $dependency;

    public function __construct(string $label, ContainerNamedDependency $dependency)
    {
        $this->label = $label;
        $this->dependency = $dependency;
    }
}

class ContainerCircularA
{
    public function __construct(ContainerCircularB $dependency)
    {
    }
}

class ContainerCircularB
{
    public function __construct(ContainerCircularA $dependency)
    {
    }
}
