<?php

namespace Kirki\Ecommerce\Tests\Unit\Collections;

use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class CollectionTest extends TestCase
{
    public function test_range_first_and_last_return_expected_items(): void
    {
        $collection = Collection::range(1, 3);

        $this->assertSame([1, 2, 3], $collection->all());
        $this->assertSame(1, $collection->first());
        $this->assertSame(3, $collection->last());
        $this->assertNull((new Collection())->first());
    }

    public function test_contains_supports_values_and_closures(): void
    {
        $collection = new Collection([1, 2, 3]);

        $this->assertTrue($collection->contains(2));
        $this->assertTrue($collection->contains(fn($value) => $value > 2));
        $this->assertFalse($collection->contains(4));
    }

    public function test_map_filter_and_reject_do_not_mutate_original(): void
    {
        $original = new Collection([1, 2, 3, 4]);

        $mapped = $original->map(fn($value) => $value * 2);
        $filtered = $original->filter(fn($value) => $value % 2 === 0);
        $rejected = $original->reject(fn($value) => $value % 2 === 0);

        $this->assertSame([2, 4, 6, 8], $mapped->all());
        $this->assertSame([1 => 2, 3 => 4], $filtered->all());
        $this->assertSame([0 => 1, 2 => 3], $rejected->all());
        $this->assertSame([1, 2, 3, 4], $original->all());
    }

    public function test_each_stops_when_callback_returns_false(): void
    {
        $seen = [];

        (new Collection([1, 2, 3]))->each(function ($value) use (&$seen) {
            $seen[] = $value;

            return $value !== 2;
        });

        $this->assertSame([1, 2], $seen);
    }

    public function test_pluck_extracts_array_keys_and_object_properties(): void
    {
        $collection = new Collection([
            ['name' => 'Jane'],
            (object) ['name' => 'John'],
            ['name' => null],
        ]);

        $this->assertSame(['Jane', 'John', null], $collection->pluck('name')->all());
    }

    public function test_only_requires_at_least_one_key(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new Collection(['name' => 'Jane']))->only([]);
    }

    public function test_percentage_returns_null_for_empty_collections(): void
    {
        $this->assertNull((new Collection())->percentage(fn($value) => $value > 0));
    }

    public function test_percentage_calculates_matching_ratio(): void
    {
        $collection = new Collection([1, 2, 3, 4]);

        $this->assertSame(50.0, $collection->percentage(fn($value) => $value % 2 === 0));
    }

    public function test_when_runs_callback_when_condition_is_truthy(): void
    {
        $collection = new Collection([1, 2, 3]);

        $result = $collection->when(true, fn($items) => $items->push(4));

        $this->assertSame([1, 2, 3, 4], $result->all());
    }

    public function test_unless_skips_callback_when_condition_is_truthy(): void
    {
        $collection = new Collection([1, 2, 3]);

        $result = $collection->unless(true, fn($items) => $items->push(5));

        $this->assertSame([1, 2, 3], $result->all());
    }
}
