<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * `GET /shop/products` uses the page size from the `kirki_ecommerce_shop_per_page` filter.
 */
class ShopPerPageApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Create 25 published products.
     *
     * Products that earlier tests in this class created stay in the plugin
     * tables, so the assertions use the reported total, which is 25 or more.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        for ($index = 1; $index <= 25; $index++) {
            $this->create_product(['title' => 'Shirt ' . $index]);
        }

        $this->logout();
    }

    /**
     * Remove the filter callbacks a test added.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        remove_all_filters(DevHookNames::SHOP_PER_PAGE);

        parent::tearDown();
    }

    public function test_default_page_size_is_12(): void
    {
        $payload = $this->assert_api_success($this->request('GET', 'shop/products', ['current_page' => 1]));
        $total = $payload['data']['pagination']['total'];

        $this->assertGreaterThanOrEqual(25, $total);
        $this->assertCount(12, $payload['data']['items']);
        $this->assertSame(12, $payload['data']['pagination']['per_page']);
        $this->assertSame((int) ceil($total / 12), $payload['data']['pagination']['last_page']);
    }

    public function test_filter_changes_the_page_size(): void
    {
        add_filter(DevHookNames::SHOP_PER_PAGE, fn() => 20);

        $first = $this->assert_api_success($this->request('GET', 'shop/products', ['current_page' => 1]));
        $second = $this->assert_api_success($this->request('GET', 'shop/products', ['current_page' => 2]));
        $total = $first['data']['pagination']['total'];

        $this->assertGreaterThanOrEqual(25, $total);
        $this->assertCount(20, $first['data']['items']);
        $this->assertCount(min(20, $total - 20), $second['data']['items']);
        $this->assertSame(20, $second['data']['pagination']['per_page']);
        $this->assertSame((int) ceil($total / 20), $second['data']['pagination']['last_page']);
    }

    public function test_filter_receives_the_shop_filters(): void
    {
        $received = null;

        add_filter(
            DevHookNames::SHOP_PER_PAGE,
            function ($per_page, $filters) use (&$received) {
                $received = $filters;

                return $per_page;
            },
            10,
            2
        );

        $this->assert_api_success($this->request('GET', 'shop/products', ['search' => 'Shirt', 'current_page' => 1]));

        $this->assertIsArray($received);
        $this->assertSame('Shirt', $received['search'] ?? null);
    }

    public function test_page_size_above_the_limit_becomes_100(): void
    {
        add_filter(DevHookNames::SHOP_PER_PAGE, fn() => 500);

        $payload = $this->assert_api_success($this->request('GET', 'shop/products', ['current_page' => 1]));

        $this->assertSame(100, $payload['data']['pagination']['per_page']);
        $this->assertCount(min(100, $payload['data']['pagination']['total']), $payload['data']['items']);
    }
}
