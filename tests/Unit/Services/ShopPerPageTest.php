<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\Tests\Unit\TestCase;

/**
 * The value from the `kirki_ecommerce_shop_per_page` filter becomes a page size from 1 to 100.
 */
class ShopPerPageTest extends TestCase
{
    /**
     * @dataProvider per_page_cases
     *
     * @param mixed $filtered The value a filter callback returns.
     * @param int   $expected The page size the shop uses.
     */
    public function test_filtered_value_becomes_a_usable_page_size($filtered, int $expected): void
    {
        $service = new class extends ProductService {
            public function resolve($per_page)
            {
                return $this->resolve_shop_per_page($per_page);
            }
        };

        $this->assertSame($expected, $service->resolve($filtered));
    }

    /**
     * @return array<string, array{0: mixed, 1: int}>
     */
    public function per_page_cases(): array
    {
        return [
            'integer'        => [20, 20],
            'numeric string' => ['20', 20],
            'above limit'    => [500, 100],
            'at limit'       => [100, 100],
            'lowest'         => [1, 1],
            'zero'           => [0, 12],
            'negative'       => [-5, 12],
            'null'           => [null, 12],
            'word'           => ['many', 12],
            'float'          => [12.7, 12],
        ];
    }
}
