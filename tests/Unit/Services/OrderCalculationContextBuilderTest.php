<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\OrderCalculationContextBuilder;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

use function Kirki\Ecommerce\Framework\collection;

class OrderCalculationContextBuilderTest extends TestCase
{
    /** @var VariantService&MockObject */
    protected $variant_service;

    protected OrderCalculationContextBuilder $builder;

    /** @var array<int, Variant> */
    protected $variants = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->variant_service = $this->createMock(VariantService::class);
        $this->variant_service->method('find')->willReturnCallback(function (int $id) {
            if (!isset($this->variants[$id])) {
                throw new NotFoundException('Variant not found.');
            }

            return $this->variants[$id];
        });

        $customer_service = $this->createMock(CustomerService::class);
        $customer_service->method('resolve_buyer_email')->willReturnCallback(fn($customer_id, $user_id, $email) => $email);

        $this->builder = new OrderCalculationContextBuilder($this->variant_service, $customer_service);
    }

    /**
     * Register a variant the variant service can find.
     *
     * @param int                  $id                 Variant ID.
     * @param array<string, mixed> $attributes         Variant attributes.
     * @param array<string, mixed> $product_attributes Product attributes.
     * @return Variant
     */
    protected function add_variant(int $id, array $attributes = [], array $product_attributes = []): Variant
    {
        $product = $this->make_model(Product::class, array_merge(['id' => 50 + $id, 'status' => ProductStatus::PUBLISHED, 'tax_profile_id' => null], $product_attributes));
        $product->set_relation('categories', collection([$this->make_model(Category::class, ['id' => 3]), $this->make_model(Category::class, ['id' => 4])]));

        $variant = $this->make_model(Variant::class, array_merge([
            'id' => $id,
            'product_id' => $product->id,
            'is_visible' => true,
            'base_price' => 3000,
            'base_sale_price' => 2500,
            'weight' => 1,
            'shipping_profile_id' => 9,
            'tax_profile_id' => null,
            'has_limit_per_order' => false,
            'max_per_order' => null,
        ], $attributes));
        $variant->set_relation('product', $product);

        return $this->variants[$id] = $variant;
    }

    /**
     * Make an order that already holds lines for the given variant IDs (null for a deleted variant).
     *
     * @param array<int, int|null> $variant_ids Variant IDs on the order.
     * @return Order
     */
    protected function make_order(array $variant_ids): Order
    {
        $order = $this->make_model(Order::class, ['id' => 77]);
        $order->set_relation('items', collection(array_map(fn($variant_id) => new OrderItem(['variant_id' => $variant_id, 'quantity' => 1]), $variant_ids)));

        return $order;
    }

    /**
     * Make a model with each attribute set directly, including the ones that are not mass assignable.
     *
     * @param string               $class      Model class.
     * @param array<string, mixed> $attributes Attributes to set.
     * @return mixed
     */
    protected function make_model(string $class, array $attributes)
    {
        $model = new $class();

        foreach ($attributes as $key => $value) {
            $model->$key = $value;
        }

        return $model;
    }

    public function test_builds_item_prices_profiles_and_categories_from_the_variant(): void
    {
        $this->add_variant(1, ['tax_profile_id' => 12]);

        $items = $this->builder->build_items([['variant_id' => 1, 'quantity' => 2]], null, false);
        $item = $items->first();

        $this->assertSame(0, $item->id);
        $this->assertSame(1, $item->variant_id);
        $this->assertSame(51, $item->product_id);
        $this->assertSame(2, $item->quantity);
        $this->assertSame(2500, $item->base_unit_price);
        $this->assertSame(3000, $item->base_product_total);
        $this->assertSame(9, $item->shipping_profile_id);
        $this->assertSame(12, $item->tax_profile_id);
        $this->assertSame([3, 4], $item->product_categories);
    }

    public function test_uses_the_regular_price_when_there_is_no_sale_price(): void
    {
        $this->add_variant(1, ['base_sale_price' => null]);

        $item = $this->builder->build_items([['variant_id' => 1, 'quantity' => 1]], null, false)->first();

        $this->assertSame(3000, $item->base_unit_price);
    }

    public function test_falls_back_to_the_product_tax_profile(): void
    {
        $this->add_variant(1, ['tax_profile_id' => null], ['tax_profile_id' => 21]);

        $item = $this->builder->build_items([['variant_id' => 1, 'quantity' => 1]], null, false)->first();

        $this->assertSame(21, $item->tax_profile_id);
    }

    public function test_rejects_the_same_variant_on_two_lines(): void
    {
        $this->add_variant(1);

        $this->expectException(ValidationException::class);

        $this->builder->build_items([['variant_id' => 1, 'quantity' => 1], ['variant_id' => 1, 'quantity' => 2]], null, false);
    }

    public function test_rejects_a_missing_variant(): void
    {
        $this->expectException(NotFoundException::class);

        $this->builder->build_items([['variant_id' => 404, 'quantity' => 1]], null, false);
    }

    public function test_rejects_a_variant_without_a_product(): void
    {
        $this->add_variant(1)->set_relation('product', null);

        $this->expectException(NotFoundException::class);

        $this->builder->build_items([['variant_id' => 1, 'quantity' => 1]], null, false);
    }

    public function test_rejects_a_new_line_whose_product_is_not_published(): void
    {
        $this->add_variant(1, [], ['status' => ProductStatus::DRAFT]);

        $this->expectException(ValidationException::class);

        $this->builder->build_items([['variant_id' => 1, 'quantity' => 1]], null, false);
    }

    public function test_rejects_a_new_line_in_an_edit_whose_variant_is_hidden(): void
    {
        $this->add_variant(1, ['is_visible' => false]);

        $this->expectException(ValidationException::class);

        $this->builder->build_items([['variant_id' => 1, 'quantity' => 1]], $this->make_order([2, null]), false);
    }

    public function test_keeps_an_existing_line_whose_product_is_not_published(): void
    {
        $this->add_variant(1, [], ['status' => ProductStatus::DRAFT]);

        $items = $this->builder->build_items([['variant_id' => 1, 'quantity' => 3]], $this->make_order([1, null]), true);

        $this->assertSame(3, $items->first()->quantity);
    }

    public function test_preview_does_not_enforce_the_per_order_limit(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 3]);

        $items = $this->builder->build_items([['variant_id' => 1, 'quantity' => 5]], null, false);

        $this->assertSame(5, $items->first()->quantity);
    }

    public function test_save_enforces_the_per_order_limit_on_the_full_quantity(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 3]);

        $this->expectException(ValidationException::class);

        $this->builder->build_items([['variant_id' => 1, 'quantity' => 5]], $this->make_order([1]), true);
    }

    public function test_records_the_loaded_variants(): void
    {
        $variant = $this->add_variant(1);

        $this->builder->build_items([['variant_id' => 1, 'quantity' => 1]], null, false);

        $this->assertSame([1 => $variant], $this->builder->get_variants_map());
    }

    public function test_build_fills_the_context_from_the_payload(): void
    {
        $this->add_variant(1);

        $context = $this->builder->build([
            'items' => [['variant_id' => 1, 'quantity' => 1]],
            'customer_id' => 5,
            'customer_email' => 'buyer@example.com',
            'coupon_codes' => ['SAVE10'],
            'shipping_method' => 'method-0001',
            'shipping_city' => 'New York',
            'shipping_country' => 'US',
            'billing_country' => 'CA',
        ], $this->make_order([1]), false);

        $this->assertSame(77, $context->order_id);
        $this->assertSame(5, $context->customer_id);
        $this->assertSame('buyer@example.com', $context->customer_email);
        $this->assertSame(['SAVE10'], $context->coupon_codes);
        $this->assertSame('method-0001', $context->shipping_method_id);
        $this->assertSame('New York', $context->shipping_address['city']);
        $this->assertSame('US', $context->shipping_address['country']);
        $this->assertSame('CA', $context->billing_address['country']);
        $this->assertCount(1, $context->items);
    }

    public function test_build_without_an_order_has_no_order_id(): void
    {
        $this->add_variant(1);

        $context = $this->builder->build(['items' => [['variant_id' => 1, 'quantity' => 1]]], null, false);

        $this->assertNull($context->order_id);
        $this->assertSame(0, $context->customer_id);
    }
}
