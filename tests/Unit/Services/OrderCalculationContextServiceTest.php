<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationInputDTO;
use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationLineDTO;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderCalculationContextService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Services\StoredOrderTermsService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

use function Kirki\Ecommerce\Framework\collection;

class OrderCalculationContextServiceTest extends TestCase
{
    /** @var VariantService&MockObject */
    protected $variant_service;

    /** @var ShippingService&MockObject */
    protected $shipping_service;

    protected OrderCalculationContextService $service;

    /** @var array<int, Variant> */
    protected $variants = [];

    /** @var array<int, int> Units available per variant ID; a variant that is not listed has plenty. */
    protected $available_stock = [];

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
        $this->variant_service->method('find_or_null')->willReturnCallback(fn(int $id) => $this->variants[$id] ?? null);

        $customer_service = $this->createMock(CustomerService::class);
        $customer_service->method('resolve_buyer_email')->willReturnCallback(fn($customer_id, $user_id, $email) => $email);

        $inventory_service = $this->createMock(InventoryService::class);
        $inventory_service->method('has_stock')->willReturnCallback(fn(int $variant_id, int $quantity) => ($this->available_stock[$variant_id] ?? PHP_INT_MAX) >= $quantity);

        $this->shipping_service = $this->createMock(ShippingService::class);

        $this->service = new OrderCalculationContextService($this->variant_service, $customer_service, new StoredOrderTermsService(), $inventory_service, $this->shipping_service);
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
            'weight_unit' => 'kg',
            'shipping_profile_id' => 9,
            'tax_profile_id' => null,
            'has_limit_per_order' => false,
            'max_per_order' => null,
        ], $attributes));
        $variant->set_relation('product', $product);

        return $this->variants[$id] = $variant;
    }

    /**
     * Make the payload lines the service reads.
     *
     * @param array<int|string, array<string, mixed>> $lines Attributes of each line.
     * @return array<int|string, OrderCalculationLineDTO>
     */
    protected function lines(array $lines): array
    {
        return array_map(fn(array $line) => OrderCalculationLineDTO::from_array($line), $lines);
    }

    /**
     * Make the payload input the service reads.
     *
     * @param array<string, mixed> $payload Order payload.
     * @return OrderCalculationInputDTO
     */
    protected function input(array $payload): OrderCalculationInputDTO
    {
        return OrderCalculationInputDTO::from_payload($payload);
    }

    /**
     * Make an order that holds the given lines.
     *
     * @param array<int, array<string, mixed>> $lines Attributes of each stored line; `id` is required, `variant_id` is null for a deleted variant.
     * @return Order
     */
    protected function make_order(array $lines): Order
    {
        $order = $this->make_model(Order::class, ['id' => 77, 'is_tax_inclusive' => false, 'tax_destination' => null, 'shipping_method' => null, 'shipping_country' => null, 'shipping_state' => null]);
        $order->set_relation('items', collection(array_map(function (array $line) {
            $order_item = $this->make_model(OrderItem::class, array_merge([
                'quantity' => 1,
                'product_id' => 51,
                'base_catalog_sale_price' => 2000,
                'base_catalog_regular_price' => 2400,
                'weight' => 4,
                'weight_unit' => 'lb',
            ], $line));
            $order_item->set_relation('taxes', collection([]));

            return $order_item;
        }, $lines)));
        $order->set_relation('order_coupons', collection([]));

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

    // New lines

    public function test_builds_item_prices_profiles_and_categories_from_the_variant(): void
    {
        $this->add_variant(1, ['tax_profile_id' => 12]);

        $items = $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 2]]), null);
        $item = $items->first();

        $this->assertSame(0, $item->line_key);
        $this->assertNull($item->order_item_id);
        $this->assertSame(1, $item->variant_id);
        $this->assertSame(51, $item->product_id);
        $this->assertSame(2, $item->quantity);
        $this->assertSame(2500, $item->base_unit_price);
        $this->assertSame(3000, $item->base_product_total);
        $this->assertSame(9, $item->shipping_profile_id);
        $this->assertSame(12, $item->tax_profile_id);
        $this->assertSame([3, 4], $item->product_categories);
        $this->assertSame('kg', $item->weight_unit);
        $this->assertTrue($item->is_reachable);
    }

    public function test_uses_the_regular_price_when_there_is_no_sale_price(): void
    {
        $this->add_variant(1, ['base_sale_price' => null]);

        $item = $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1]]), null)->first();

        $this->assertSame(3000, $item->base_unit_price);
    }

    public function test_falls_back_to_the_product_tax_profile(): void
    {
        $this->add_variant(1, ['tax_profile_id' => null], ['tax_profile_id' => 21]);

        $item = $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1]]), null)->first();

        $this->assertSame(21, $item->tax_profile_id);
    }

    public function test_rejects_the_same_variant_on_two_new_lines(): void
    {
        $this->add_variant(1);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1], ['variant_id' => 1, 'quantity' => 2]]), null);
    }

    public function test_rejects_a_new_line_for_a_variant_the_order_already_holds(): void
    {
        $this->add_variant(1);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1]]), $this->make_order([['id' => 5, 'variant_id' => 1]]));
    }

    public function test_rejects_a_line_without_an_order_line_or_a_variant(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['quantity' => 1]]), null);
    }

    public function test_rejects_a_missing_variant(): void
    {
        $this->expectException(NotFoundException::class);

        $this->service->build_items($this->lines([['variant_id' => 404, 'quantity' => 1]]), null);
    }

    public function test_rejects_a_variant_without_a_product(): void
    {
        $this->add_variant(1)->set_relation('product', null);

        $this->expectException(NotFoundException::class);

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1]]), null);
    }

    public function test_rejects_a_new_line_whose_product_is_not_published(): void
    {
        $this->add_variant(1, [], ['status' => ProductStatus::DRAFT]);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1]]), null);
    }

    public function test_rejects_a_new_line_in_an_edit_whose_variant_is_hidden(): void
    {
        $this->add_variant(1, ['is_visible' => false]);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1]]), $this->make_order([['id' => 5, 'variant_id' => 2]]));
    }

    public function test_enforces_the_per_order_limit_on_the_full_quantity_of_a_new_line(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 3]);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 5]]), null);
    }

    public function test_checks_stock_for_the_full_quantity_of_a_new_line(): void
    {
        $this->add_variant(1);
        $this->available_stock[1] = 2;

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Not enough stock for variant: 1');

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 3]]), null);
    }

    public function test_allows_a_new_line_up_to_the_stock(): void
    {
        $this->add_variant(1);
        $this->available_stock[1] = 3;

        $items = $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 3]]), null);

        $this->assertSame(3, $items->first()->quantity);
    }

    // Lines already on the order

    public function test_an_existing_line_is_priced_from_the_values_stored_on_it(): void
    {
        $this->add_variant(1, ['base_sale_price' => 9900, 'base_price' => 9900, 'weight' => 1]);

        $item = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 3]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 2]]))->first();

        $this->assertSame(5, $item->order_item_id);
        $this->assertSame(1, $item->variant_id);
        $this->assertSame(51, $item->product_id);
        $this->assertSame(3, $item->quantity);
        $this->assertSame(2000, $item->base_unit_price);
        $this->assertSame(2400, $item->base_product_total);
        $this->assertTrue($item->is_reachable);
    }

    public function test_an_existing_line_takes_its_profiles_and_categories_from_the_live_variant(): void
    {
        $this->add_variant(1, ['tax_profile_id' => 12]);

        $item = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 1]]), $this->make_order([['id' => 5, 'variant_id' => 1]]))->first();

        $this->assertSame(9, $item->shipping_profile_id);
        $this->assertSame(12, $item->tax_profile_id);
        $this->assertSame([3, 4], $item->product_categories);
        $this->assertEquals(1, $item->weight);
        $this->assertSame('kg', $item->weight_unit);
    }

    public function test_an_existing_line_whose_variant_was_deleted_stays_with_its_stored_values(): void
    {
        $item = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 2]]), $this->make_order([['id' => 5, 'variant_id' => null, 'quantity' => 2]]))->first();

        $this->assertSame(5, $item->order_item_id);
        $this->assertNull($item->variant_id);
        $this->assertFalse($item->is_reachable);
        $this->assertSame(2000, $item->base_unit_price);
        $this->assertEquals(4, $item->weight);
        $this->assertSame('lb', $item->weight_unit);
        $this->assertNull($item->tax_profile_id);
        $this->assertSame([], $item->product_categories);
        $this->assertSame([], $this->service->get_variants_map());
    }

    public function test_an_existing_line_whose_product_is_not_published_is_not_reachable(): void
    {
        $this->add_variant(1, [], ['status' => ProductStatus::DRAFT]);

        $item = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 1]]), $this->make_order([['id' => 5, 'variant_id' => 1]]))->first();

        $this->assertFalse($item->is_reachable);
    }

    public function test_rejects_an_order_line_that_is_not_on_the_order(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['id' => 99, 'quantity' => 1]]), $this->make_order([['id' => 5, 'variant_id' => 1]]));
    }

    public function test_rejects_an_order_line_sent_twice(): void
    {
        $this->add_variant(1);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['id' => 5, 'quantity' => 1], ['id' => 5, 'quantity' => 2]]), $this->make_order([['id' => 5, 'variant_id' => 1]]));
    }

    public function test_rejects_an_order_line_when_there_is_no_order(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['id' => 5, 'quantity' => 1]]), null);
    }

    public function test_refuses_a_quantity_change_on_a_line_that_is_not_reachable(): void
    {
        $this->add_variant(1, [], ['status' => ProductStatus::DRAFT]);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['id' => 5, 'quantity' => 2]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 1]]));
    }

    public function test_refuses_lowering_the_quantity_of_a_line_whose_variant_was_deleted(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['id' => 5, 'quantity' => 1]]), $this->make_order([['id' => 5, 'variant_id' => null, 'quantity' => 2]]));
    }

    public function test_keeps_a_line_that_is_not_reachable_when_its_quantity_is_unchanged(): void
    {
        $this->add_variant(1, [], ['status' => ProductStatus::DRAFT]);

        $items = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 1]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 1]]));

        $this->assertSame(1, $items->first()->quantity);
    }

    public function test_allows_raising_a_quantity_up_to_the_limit_as_it_is_now(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 5]);

        $items = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 5]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));

        $this->assertSame(5, $items->first()->quantity);
    }

    public function test_refuses_raising_a_quantity_over_the_limit_as_it_is_now(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 5]);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['id' => 5, 'quantity' => 6]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));
    }

    public function test_keeps_a_quantity_that_is_over_a_lowered_limit_when_it_is_not_raised(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 2]);

        $items = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 4]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));

        $this->assertSame(4, $items->first()->quantity);
    }

    public function test_allows_lowering_a_quantity_that_is_over_a_lowered_limit(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 2]);

        $items = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 3]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));

        $this->assertSame(3, $items->first()->quantity);
    }

    public function test_refuses_raising_a_quantity_when_the_limit_is_below_the_stored_quantity(): void
    {
        $this->add_variant(1, ['has_limit_per_order' => true, 'max_per_order' => 2]);

        $this->expectException(ValidationException::class);

        $this->service->build_items($this->lines([['id' => 5, 'quantity' => 5]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));
    }

    public function test_checks_stock_for_the_increase_of_an_existing_line_only(): void
    {
        $this->add_variant(1);
        $this->available_stock[1] = 2;

        $items = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 6]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));

        $this->assertSame(6, $items->first()->quantity);
    }

    public function test_refuses_raising_a_quantity_beyond_the_stock(): void
    {
        $this->add_variant(1);
        $this->available_stock[1] = 1;

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Not enough stock for variant: 1');

        $this->service->build_items($this->lines([['id' => 5, 'quantity' => 6]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));
    }

    public function test_keeps_an_unchanged_line_on_a_sold_out_variant(): void
    {
        $this->add_variant(1);
        $this->available_stock[1] = 0;

        $items = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 4]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));

        $this->assertSame(4, $items->first()->quantity);
    }

    public function test_does_not_check_stock_when_a_quantity_is_lowered(): void
    {
        $this->add_variant(1);
        $this->available_stock[1] = 0;

        $items = $this->service->build_items($this->lines([['id' => 5, 'quantity' => 2]]), $this->make_order([['id' => 5, 'variant_id' => 1, 'quantity' => 4]]));

        $this->assertSame(2, $items->first()->quantity);
    }

    // Context

    public function test_records_the_loaded_variants(): void
    {
        $variant = $this->add_variant(1);

        $this->service->build_items($this->lines([['variant_id' => 1, 'quantity' => 1]]), null);

        $this->assertSame([1 => $variant], $this->service->get_variants_map());
    }

    public function test_build_fills_the_context_from_the_payload(): void
    {
        $this->add_variant(1);

        $context = $this->service->build($this->input([
            'items' => [['id' => 5, 'quantity' => 1]],
            'customer_id' => 5,
            'customer_email' => 'buyer@example.com',
            'coupon_codes' => ['SAVE10'],
            'shipping_method' => 'method-0001',
            'shipping_city' => 'New York',
            'shipping_country' => 'US',
            'billing_country' => 'CA',
        ]), $this->make_order([['id' => 5, 'variant_id' => 1]]));

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

    public function test_build_for_an_edit_carries_the_stored_terms(): void
    {
        $this->add_variant(1);

        $context = $this->service->build($this->input(['items' => [['id' => 5, 'quantity' => 1]]]), $this->make_order([['id' => 5, 'variant_id' => 1]]));

        $this->assertNotNull($context->stored);
        $this->assertFalse($context->stored->is_tax_inclusive);
    }

    public function test_build_without_an_order_has_no_order_id_and_no_stored_terms(): void
    {
        $this->add_variant(1);

        $context = $this->service->build($this->input(['items' => [['variant_id' => 1, 'quantity' => 1]]]), null);

        $this->assertNull($context->order_id);
        $this->assertNull($context->stored);
        $this->assertSame(0, $context->customer_id);
    }

    // Checks that only an edit has

    public function test_validate_edit_refuses_another_currency(): void
    {
        $order = $this->make_order([]);
        $order->currency_code = 'EUR';
        $input = $this->input(['currency_code' => 'USD']);

        $this->expectException(ValidationException::class);

        $this->service->validate_edit($order, $input);
    }

    public function test_validate_edit_accepts_the_order_currency_and_no_currency(): void
    {
        $order = $this->make_order([]);
        $order->currency_code = 'EUR';

        foreach ([['currency_code' => 'EUR'], []] as $payload) {
            $this->service->validate_edit($order, $this->input($payload));
        }

        $this->addToAssertionCount(1);
    }

    public function test_validate_edit_shipping_method_refuses_a_method_that_is_not_available(): void
    {
        $order = $this->make_order([]);
        $input = $this->input(['shipping_method' => 'method-0002']);
        $context = $this->service->build($input, $order);
        $this->shipping_service->method('has_valid_shipping_method')->willReturn(false);

        $this->expectException(ValidationException::class);

        $this->service->validate_edit_shipping_method($context);
    }

    public function test_validate_edit_shipping_method_checks_the_method_when_the_address_and_method_did_not_change(): void
    {
        $order = $this->make_order([]);
        $order->shipping_method = 'method-0001';
        $order->shipping_country = 'US';
        $order->shipping_state = 'NY';
        $input = $this->input(['shipping_method' => 'method-0001', 'shipping_country' => 'US', 'shipping_state' => 'NY']);
        $context = $this->service->build($input, $order);
        $this->shipping_service->expects($this->once())->method('has_valid_shipping_method')->willReturn(false);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Select another shipping method.');

        $this->service->validate_edit_shipping_method($context);
    }
}
