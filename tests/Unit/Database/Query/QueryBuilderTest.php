<?php

namespace Kirki\Ecommerce\Tests\Unit\Database\Query;

use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class QueryBuilderTest extends TestCase
{
    private QueryBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();

        $this->builder = $this->make_query_builder(['prefix' => 'wp_']);
    }

    public function test_from_and_select_compile_to_sql(): void
    {
        $sql = $this->builder
            ->from('products')
            ->select(['id', 'title'])
            ->where('status', '=', 'published')
            ->to_sql();

        $this->assertSame(
            'select `id`, `title` from `wp_products` where `status` = %s',
            $sql
        );
    }

    public function test_where_helpers_compile_expected_sql(): void
    {
        $sql = $this->builder
            ->from('products')
            ->where_in('id', [1, 2, 3])
            ->where_null('deleted_at')
            ->where_between('price', [10, 20])
            ->to_sql();

        $this->assertSame(
            'select * from `wp_products` where `id` in (%d, %d, %d) and `deleted_at` is null and `price` between %d and %d',
            $sql
        );
    }

    public function test_order_group_limit_and_offset_compile_to_sql(): void
    {
        $sql = $this->builder
            ->from('products')
            ->select('status')
            ->distinct()
            ->group_by('status')
            ->order_by_desc('status')
            ->limit(10)
            ->offset(20)
            ->to_sql();

        $this->assertSame(
            'select distinct `status` from `wp_products` group by `status` order by `status` desc limit 10 offset 20',
            $sql
        );
    }

    public function test_join_compiles_on_conditions(): void
    {
        $sql = $this->builder
            ->from('products')
            ->select(['products.id', 'brands.name'])
            ->join('brands', 'products.brand_id', '=', 'brands.id')
            ->where('products.status', '=', 'published')
            ->to_sql();

        $this->assertSame(
            'select `wp_products`.`id`, `wp_brands`.`name` from `wp_products` inner join `wp_brands` on `wp_products`.`brand_id` = `wp_brands`.`id` where `wp_products`.`status` = %s',
            $sql
        );
    }

    public function test_get_bindings_flattens_bound_values(): void
    {
        $this->builder
            ->from('products')
            ->where('status', '=', 'published')
            ->where_in('id', [1, 2]);

        $this->assertSame(
            ['published', 1, 2],
            $this->builder->get_bindings()
        );
    }

    public function test_when_and_unless_support_conditional_query_building(): void
    {
        $filtered = $this->builder
            ->from('products')
            ->when(true, function (QueryBuilder $query) {
                return $query->where('status', '=', 'published');
            })
            ->unless(false, function (QueryBuilder $query) {
                return $query->where_null('deleted_at');
            });

        $this->assertSame(
            'select * from `wp_products` where `status` = %s and `deleted_at` is null',
            $filtered->to_sql()
        );
    }
}
