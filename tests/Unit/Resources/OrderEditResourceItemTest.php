<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Order\OrderEditResource;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

class OrderEditResourceItemTest extends TestCase
{
    protected OrderEditResource $resource;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);

        $this->resource = new OrderEditResource([
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
            'exchange_rate' => 1.0,
        ], []);
    }

    public function test_an_item_carries_the_live_stock_and_limit_values_of_its_variant(): void
    {
        $items = $this->prepare_items([$this->make_item(55, $this->make_variant())]);

        $this->assertSame(55, $items[0]['id']);
        $this->assertTrue($items[0]['is_reachable']);
        $this->assertTrue($items[0]['allow_back_order']);
        $this->assertTrue($items[0]['track_inventory']);
        $this->assertSame(4, $items[0]['available_quantity']);
        $this->assertTrue($items[0]['in_stock']);
        $this->assertTrue($items[0]['has_limit_per_order']);
        $this->assertSame(3, $items[0]['max_per_order']);
    }

    public function test_the_stock_values_follow_the_variant_not_the_order_item(): void
    {
        $variant = $this->make_variant();
        $variant->available_quantity = 0;
        $variant->in_stock = false;

        $items = $this->prepare_items([$this->make_item(55, $variant, 5)]);

        $this->assertSame(5, $items[0]['quantity']);
        $this->assertSame(0, $items[0]['available_quantity']);
        $this->assertFalse($items[0]['in_stock']);
    }

    public function test_a_line_whose_variant_was_deleted_is_not_reachable_and_has_no_stock_values(): void
    {
        $items = $this->prepare_items([$this->make_item(55, null)]);

        $this->assertFalse($items[0]['is_reachable']);

        foreach (['allow_back_order', 'track_inventory', 'available_quantity', 'in_stock', 'has_limit_per_order', 'max_per_order'] as $key) {
            $this->assertNull($items[0][$key], $key);
        }
    }

    public function test_a_line_whose_product_is_not_published_is_not_reachable_but_keeps_the_stock_values(): void
    {
        $items = $this->prepare_items([$this->make_item(55, $this->make_variant(ProductStatus::DRAFT))]);

        $this->assertFalse($items[0]['is_reachable']);
        $this->assertSame(4, $items[0]['available_quantity']);
    }

    public function test_a_line_whose_variant_is_hidden_is_not_reachable(): void
    {
        $variant = $this->make_variant();
        $variant->is_visible = false;

        $items = $this->prepare_items([$this->make_item(55, $variant)]);

        $this->assertFalse($items[0]['is_reachable']);
    }

    /**
     * @param OrderItem[] $order_items Items of the order.
     * @return array<int, array<string, mixed>>
     */
    protected function prepare_items(array $order_items): array
    {
        $method = new \ReflectionMethod(OrderEditResource::class, 'prepare_items');
        $method->setAccessible(true);

        return $method->invoke($this->resource, collection($order_items), collection());
    }

    protected function make_item(int $id, ?Variant $variant, int $quantity = 1): OrderItem
    {
        $item = new OrderItem();
        $item->id = $id;
        $item->quantity = $quantity;
        $item->base_catalog_regular_price = 1000;
        $item->base_catalog_sale_price = 1000;
        $item->base_catalog_product_coupon_discounted_subtotal = 1000 * $quantity;
        $item->invoiced_catalog_product_coupon_discounted_subtotal = 1000 * $quantity;
        $item->invoiced_tax_total = 0;
        $item->base_tax_total = 0;
        $item->set_relation('variant', $variant);
        $item->set_relation('taxes', collection());

        return $item;
    }

    protected function make_variant(string $product_status = ProductStatus::PUBLISHED): Variant
    {
        $product = new Product();
        $product->status = $product_status;

        $variant = new Variant();
        $variant->is_visible = true;
        $variant->allow_back_order = true;
        $variant->track_inventory = true;
        $variant->available_quantity = 4;
        $variant->in_stock = true;
        $variant->has_limit_per_order = true;
        $variant->max_per_order = 3;
        $variant->set_relation('product', $product);

        return $variant;
    }
}
