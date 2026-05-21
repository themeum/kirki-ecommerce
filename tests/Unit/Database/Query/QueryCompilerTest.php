<?php

namespace Kirki\Ecommerce\Tests\Unit\Database\Query;

use Kirki\Ecommerce\Database\Query\Expression;
use Kirki\Ecommerce\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Database\Query\QueryCompiler;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class QueryCompilerTest extends TestCase
{
    private QueryCompiler $compiler;

    protected function setUp(): void
    {
        parent::setUp();

        $this->compiler = $this->make_query_compiler(['prefix' => 'wp_']);
    }

    public function test_wrap_value_escapes_identifiers(): void
    {
        $this->assertSame('`id`', $this->compiler->wrap_value('id'));
        $this->assertSame('*', $this->compiler->wrap_value('*'));
        $this->assertSame('`col``name`', $this->compiler->wrap_value('col`name'));
    }

    public function test_wrap_table_applies_prefix(): void
    {
        $this->assertSame('`wp_products`', $this->compiler->wrap_table('products'));
    }

    public function test_wrap_table_supports_aliases(): void
    {
        $this->assertSame(
            '`wp_products` as `wp_p`',
            $this->compiler->wrap_table('products as p')
        );
    }

    public function test_wrap_handles_expressions(): void
    {
        $this->assertSame(
            'count(*)',
            $this->compiler->wrap(new Expression('count(*)'))
        );
    }

    public function test_compile_select_builds_basic_query(): void
    {
        $query = $this->make_query('products');
        $query->select(['id', 'title'])->where('status', '=', 'published');

        $this->assertSame(
            'select `id`, `title` from `wp_products` where `status` = %s',
            $this->compiler->compile_select($query)
        );
    }

    public function test_compile_select_defaults_to_all_columns(): void
    {
        $query = $this->make_query('products');

        $this->assertSame(
            'select * from `wp_products`',
            $this->compiler->compile_select($query)
        );
    }

    public function test_compile_select_handles_distinct_and_ordering(): void
    {
        $query = $this->make_query('products');
        $query->distinct()->select('status')->order_by('status', 'desc')->limit(10)->offset(5);

        $this->assertSame(
            'select distinct `status` from `wp_products` order by `status` desc limit 10 offset 5',
            $this->compiler->compile_select($query)
        );
    }

    public function test_compile_select_handles_empty_in_and_not_in_clauses(): void
    {
        $query = $this->make_query('products');
        $query->where_in('id', [])->where_not_in('status', []);

        $this->assertSame(
            'select * from `wp_products` where 0 = 1 and 1 = 1',
            $this->compiler->compile_select($query)
        );
    }

    public function test_compile_select_handles_null_and_between_clauses(): void
    {
        $query = $this->make_query('products');
        $query
            ->where_null('deleted_at')
            ->where_between('price', [10, 20]);

        $this->assertSame(
            'select * from `wp_products` where `deleted_at` is null and `price` between %d and %d',
            $this->compiler->compile_select($query)
        );
    }

    public function test_compile_select_handles_group_by_and_having(): void
    {
        $query = $this->make_query('products');
        $query
            ->select('status')
            ->group_by('status')
            ->having_raw('`status` = %s', ['published']);

        $this->assertSame(
            'select `status` from `wp_products` group by `status` having `status` = %s',
            $this->compiler->compile_select($query)
        );
    }

    public function test_compile_insert_builds_single_row_statement(): void
    {
        $query = $this->make_query('products');

        $this->assertSame(
            'insert into `wp_products` (`title`, `status`) values (%s, %s)',
            $this->compiler->compile_insert($query, [
                'title' => 'Test',
                'status' => 'draft',
            ])
        );
    }

    public function test_compile_insert_builds_batch_statement(): void
    {
        $query = $this->make_query('products');

        $this->assertSame(
            'insert into `wp_products` (`title`) values (%s), (%s)',
            $this->compiler->compile_insert($query, [
                ['title' => 'One'],
                ['title' => 'Two'],
            ])
        );
    }

    public function test_compile_insert_without_values_uses_default_values(): void
    {
        $query = $this->make_query('products');

        $this->assertSame(
            'insert into `wp_products` default values',
            $this->compiler->compile_insert($query, [])
        );
    }

    public function test_compile_update_and_delete_statements(): void
    {
        $update_query = $this->make_query('products');
        $update_query->where('id', '=', 1);

        $this->assertSame(
            'update `wp_products` set `status` = %s where `id` = %d',
            $this->compiler->compile_update($update_query, ['status' => 'published'])
        );

        $delete_query = $this->make_query('products');
        $delete_query->where('id', '=', 1);

        $this->assertSame(
            'delete from `wp_products` where `id` = %d',
            $this->compiler->compile_delete($delete_query)
        );
    }

    public function test_compile_exists_and_truncate_statements(): void
    {
        $exists_query = $this->make_query('products');
        $exists_query->select(['id', 'title'])->where('status', '=', 'published');

        $this->assertSame(
            'select exists(select `id`, `title` from `wp_products` where `status` = %s) as `exists`',
            $this->compiler->compile_exists($exists_query)
        );

        $this->assertSame(
            'truncate table `wp_products`',
            $this->compiler->compile_truncate($this->make_query('products'))
        );
    }

    public function test_prepare_bindings_for_update_and_delete(): void
    {
        $bindings = [
            'select' => [],
            'join' => ['join-value'],
            'where' => ['where-value'],
        ];

        $this->assertSame(
            ['join-value', 'published', 'where-value'],
            $this->compiler->prepare_bindings_for_update($bindings, ['status' => 'published'])
        );

        $this->assertSame(
            ['join-value', 'where-value'],
            $this->compiler->prepare_bindings_for_delete($bindings)
        );
    }

    private function make_query(string $table): QueryBuilder
    {
        $query = $this->make_query_builder(['prefix' => 'wp_']);
        $query->from($table);

        return $query;
    }
}
