<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use ArrayAccess;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class ArrTest extends TestCase
{
    public function test_from_returns_arrays_and_arrayable_values(): void
    {
        $arrayable = new class (['name' => 'Widget']) implements Arrayable {
            private array $items;

            public function __construct(array $items)
            {
                $this->items = $items;
            }

            public function to_array(): array
            {
                return $this->items;
            }
        };

        $this->assertSame(['name' => 'Widget'], Arr::from(['name' => 'Widget']));
        $this->assertSame(['name' => 'Widget'], Arr::from($arrayable));
        $this->assertSame(['a', 'b'], Arr::from(new Collection(['a', 'b'])));
    }

    public function test_from_throws_for_scalar_values(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Arr::from('scalar');
    }

    public function test_wrap_handles_null_scalar_and_array_values(): void
    {
        $this->assertSame([], Arr::wrap(null));
        $this->assertSame(['value'], Arr::wrap('value'));
        $this->assertSame(['a', 'b'], Arr::wrap(['a', 'b']));
    }

    public function test_flatten_flattens_nested_arrays_with_depth(): void
    {
        $nested = [
            ['a', ['b', 'c']],
            'd',
        ];

        $this->assertSame(['a', 'b', 'c', 'd'], Arr::flatten($nested));
        $this->assertSame(['a', ['b', 'c'], 'd'], Arr::flatten($nested, 1));
    }

    public function test_is_associative_detects_keyed_arrays(): void
    {
        $this->assertFalse(Arr::is_associative(['a', 'b']));
        $this->assertTrue(Arr::is_associative(['first' => 'a', 'second' => 'b']));
    }

    public function test_instance_methods_manage_items(): void
    {
        $array = new Collection(['one']);

        $array->push('two');
        $array->push('three');

        $this->assertTrue($array->offsetExists(0));
        $this->assertSame('one', $array->offsetGet(0));
        $this->assertSame('three', $array->pop());
        $this->assertSame('two', $array->last());
        $this->assertSame('one', $array->first());
    }

    public function test_filter_and_map_return_new_instances(): void
    {
        $original = new Collection([1, 2, 3, 4]);

        $filtered = $original->filter(fn($value) => $value % 2 === 0);
        $mapped = $original->map(fn($value) => $value * 2);

        $this->assertSame([2, 4], $filtered->values()->all());
        $this->assertSame([2, 4, 6, 8], $mapped->all());
        $this->assertSame([1, 2, 3, 4], $original->all());
    }

    public function test_exists_supports_arrays_and_array_access(): void
    {
        $arrayAccess = new class implements ArrayAccess {
            private array $items = ['key' => 'value'];

            public function offsetExists($offset): bool
            {
                return array_key_exists($offset, $this->items);
            }

            #[\ReturnTypeWillChange]
            public function offsetGet($offset)
            {
                return $this->items[$offset];
            }

            public function offsetSet($offset, $value): void
            {
                $this->items[$offset] = $value;
            }

            public function offsetUnset($offset): void
            {
                unset($this->items[$offset]);
            }
        };

        $this->assertTrue(Arr::exists(['name' => 'Jane'], 'name'));
        $this->assertTrue(Arr::exists($arrayAccess, 'key'));
        $this->assertFalse(Arr::exists(['name' => 'Jane'], 'missing'));
    }

    public function test_json_encode_uses_wp_json_encode(): void
    {
        $this->assertSame(
            '{"name":"Widget"}',
            Arr::json_encode(['name' => 'Widget'])
        );
    }
}
