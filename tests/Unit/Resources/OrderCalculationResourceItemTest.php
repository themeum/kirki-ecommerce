<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Order\OrderCalculationResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;

class OrderCalculationResourceItemTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);
    }

    public function test_an_item_of_an_edit_carries_its_stored_line_and_reachability(): void
    {
        $items = $this->prepare_items([$this->make_item(0, 7, 55, true)], [7 => $this->make_variant()]);

        $this->assertSame(0, $items[0]['line_key']);
        $this->assertSame(55, $items[0]['order_item_id']);
        $this->assertTrue($items[0]['is_reachable']);
    }

    public function test_an_item_carries_the_live_stock_and_limit_values_of_its_variant(): void
    {
        $items = $this->prepare_items([$this->make_item(0, 7, null, true)], [7 => $this->make_variant()]);

        $this->assertNull($items[0]['order_item_id']);
        $this->assertTrue($items[0]['allow_back_order']);
        $this->assertTrue($items[0]['track_inventory']);
        $this->assertSame(4, $items[0]['available_quantity']);
        $this->assertTrue($items[0]['in_stock']);
        $this->assertTrue($items[0]['has_limit_per_order']);
        $this->assertSame(3, $items[0]['max_per_order']);
    }

    public function test_a_line_whose_variant_was_deleted_is_not_reachable_and_has_no_stock_values(): void
    {
        $items = $this->prepare_items([$this->make_item(0, null, 55, false)], []);

        $this->assertFalse($items[0]['is_reachable']);
        $this->assertSame(55, $items[0]['order_item_id']);

        foreach (['allow_back_order', 'track_inventory', 'available_quantity', 'in_stock', 'has_limit_per_order', 'max_per_order'] as $key) {
            $this->assertNull($items[0][$key], $key);
        }
    }

    public function test_every_calculated_item_is_listed_in_order(): void
    {
        $items = $this->prepare_items([$this->make_item(0, 7, 55, true), $this->make_item(1, null, 56, false)], [7 => $this->make_variant()]);

        $this->assertSame([55, 56], array_column($items, 'order_item_id'));
        $this->assertSame([true, false], array_column($items, 'is_reachable'));
    }

    /**
     * @param CalculationItemDTO[]  $calculated_items Calculated items.
     * @param array<int, Variant>   $variants         Variants of the lines, keyed by ID.
     * @return array<int, array<string, mixed>>
     */
    protected function prepare_items(array $calculated_items, array $variants): array
    {
        $result = new CalculationResultDTO();
        $result->items = array_column(array_map(fn($item) => ['key' => $item->line_key, 'item' => $item], $calculated_items), 'item', 'key');

        $resource = new OrderCalculationResource(['variants' => $variants]);
        $method = new \ReflectionMethod(OrderCalculationResource::class, 'prepare_items');
        $method->setAccessible(true);

        return $method->invoke($resource, $result->items, $result);
    }

    protected function make_item(int $line_key, ?int $variant_id, ?int $order_item_id, bool $is_reachable): CalculationItemDTO
    {
        $item = new CalculationItemDTO();
        $item->line_key = $line_key;
        $item->variant_id = $variant_id;
        $item->order_item_id = $order_item_id;
        $item->is_reachable = $is_reachable;
        $item->quantity = 1;
        $item->base_catalog_regular_price = 1000;
        $item->base_catalog_sale_price = 1000;
        $item->base_catalog_product_coupon_discounted_subtotal = 1000;

        return $item;
    }

    protected function make_variant(): Variant
    {
        $variant = new Variant();
        $variant->allow_back_order = true;
        $variant->track_inventory = true;
        $variant->available_quantity = 4;
        $variant->in_stock = true;
        $variant->has_limit_per_order = true;
        $variant->max_per_order = 3;

        return $variant;
    }
}
