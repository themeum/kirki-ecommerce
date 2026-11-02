<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\ListPaginator;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class ListPaginatorTest extends TestCase
{
    public function test_bool_is_passed_through(): void
    {
        $page = new Paginator(new Collection([]), 0, 10, 1);

        $this->assertTrue(ListPaginator::from($page, true)->to_array()['has_records']);
        $this->assertFalse(ListPaginator::from($page, false)->to_array()['has_records']);
    }

    public function test_query_is_not_run_when_page_has_rows(): void
    {
        $query = $this->createMock(QueryBuilder::class);
        $query->expects($this->never())->method('exists');

        $page = new Paginator(new Collection([1, 2]), 2, 10, 1);

        $this->assertTrue(ListPaginator::from($page, $query)->to_array()['has_records']);
    }

    public function test_query_result_is_used_when_total_is_zero(): void
    {
        $page = new Paginator(new Collection([]), 0, 10, 1);

        $present = $this->createMock(QueryBuilder::class);
        $present->expects($this->once())->method('exists')->willReturn(true);

        $absent = $this->createMock(QueryBuilder::class);
        $absent->expects($this->once())->method('exists')->willReturn(false);

        $this->assertTrue(ListPaginator::from($page, $present)->to_array()['has_records']);
        $this->assertFalse(ListPaginator::from($page, $absent)->to_array()['has_records']);
    }

    public function test_page_past_the_last_page_has_records(): void
    {
        $query = $this->createMock(QueryBuilder::class);
        $query->expects($this->never())->method('exists');

        $page = new Paginator(new Collection([]), 5, 10, 3);

        $this->assertTrue(ListPaginator::from($page, $query)->to_array()['has_records']);
    }

    public function test_parent_keys_are_unchanged(): void
    {
        $page = new Paginator(new Collection([1, 2]), 12, 2, 1);

        $array = ListPaginator::from($page, true)->to_array();
        $expected = $page->to_array();

        $this->assertSame($expected, array_diff_key($array, ['has_records' => true]));
        $this->assertSame(12, $array['total']);
        $this->assertSame(6, $array['last_page']);
    }
}
