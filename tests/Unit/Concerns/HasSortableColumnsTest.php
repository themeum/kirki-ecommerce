<?php

namespace Kirki\Ecommerce\Tests\Unit\Concerns;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class HasSortableColumnsTest extends TestCase
{
    protected function make_sorter(array $columns, string $default_by = 'id', string $default_order = 'desc')
    {
        return new class ($columns, $default_by, $default_order) {
            use HasSortableColumns;

            protected $columns;
            protected $default_by;
            protected $default_order;

            public function __construct(array $columns, string $default_by, string $default_order)
            {
                $this->columns = $columns;
                $this->default_by = $default_by;
                $this->default_order = $default_order;
            }

            protected function default_sort_by()
            {
                return $this->default_by;
            }

            protected function default_sort_order()
            {
                return $this->default_order;
            }

            protected function sortable_columns()
            {
                return $this->columns;
            }

            public function sort(QueryBuilder $query, ListFilterDTO $filters)
            {
                return $this->apply_sorting($query, $filters);
            }
        };
    }

    protected function make_filters(array $overrides = []): ListFilterDTO
    {
        return ListFilterDTO::from_array($overrides);
    }

    public function test_a_declared_field_orders_by_its_mapped_column(): void
    {
        $sorter = $this->make_sorter(['name' => 'name', 'count' => 'products_count']);

        $sql = $sorter
            ->sort($this->make_query_builder()->from('brands'), $this->make_filters([
                'sort_by' => 'count',
                'sort_order' => 'asc',
            ]))
            ->to_sql();

        $this->assertStringContainsString('order by `products_count` asc', $sql);
    }

    public function test_a_field_may_map_to_a_different_column_name(): void
    {
        $sorter = $this->make_sorter(['status' => 'order_status']);

        $sql = $sorter
            ->sort($this->make_query_builder()->from('orders'), $this->make_filters([
                'sort_by' => 'status',
                'sort_order' => 'desc',
            ]))
            ->to_sql();

        $this->assertStringContainsString('order by `order_status` desc', $sql);
    }

    public function test_a_callable_receives_the_direction_and_supplies_the_ordering(): void
    {
        $received = null;

        $sorter = $this->make_sorter([
            'base_price' => function ($direction) use (&$received) {
                $received = $direction;

                return 'resolved_price';
            },
        ]);

        $sql = $sorter
            ->sort($this->make_query_builder()->from('products'), $this->make_filters([
                'sort_by' => 'base_price',
                'sort_order' => 'asc',
            ]))
            ->to_sql();

        $this->assertSame('asc', $received);
        $this->assertStringContainsString('order by `resolved_price` asc', $sql);
    }

    public function test_an_unrecognised_field_falls_back_to_the_default(): void
    {
        $sorter = $this->make_sorter(['name' => 'name'], 'ordering', 'asc');

        $sql = $sorter
            ->sort($this->make_query_builder()->from('categories'), $this->make_filters([
                'sort_by' => 'not_a_column',
                'sort_order' => 'asc',
            ]))
            ->to_sql();

        $this->assertStringContainsString('order by `ordering` asc', $sql);
    }

    public function test_a_malformed_direction_falls_back_instead_of_throwing(): void
    {
        $sorter = $this->make_sorter(['name' => 'name'], 'id', 'desc');

        $sql = $sorter
            ->sort($this->make_query_builder()->from('brands'), $this->make_filters([
                'sort_by' => 'name',
                'sort_order' => 'bogus',
            ]))
            ->to_sql();

        $this->assertStringContainsString('order by `name` desc', $sql);
    }

    public function test_an_uppercase_direction_is_accepted(): void
    {
        $sorter = $this->make_sorter(['name' => 'name']);

        $sql = $sorter
            ->sort($this->make_query_builder()->from('brands'), $this->make_filters([
                'sort_by' => 'name',
                'sort_order' => 'ASC',
            ]))
            ->to_sql();

        $this->assertStringContainsString('order by `name` asc', $sql);
    }
}
