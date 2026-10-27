<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxDestination;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxType;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderTax;
use Kirki\Ecommerce\App\Services\StoredOrderTermsService;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\collection;

class StoredOrderTermsServiceTest extends TestCase
{
    protected StoredOrderTermsService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new StoredOrderTermsService();
    }

    public function test_it_keeps_the_tax_mode_and_tax_destination_of_the_order(): void
    {
        $order = $this->make_order(['is_tax_inclusive' => true, 'tax_destination' => OrderTaxDestination::BILLING]);

        $stored = $this->service->build($order, $this->make_context());

        $this->assertTrue($stored->is_tax_inclusive);
        $this->assertSame(OrderTaxDestination::BILLING, $stored->tax_destination);
    }

    public function test_a_line_key_that_equals_another_lines_order_item_id_does_not_mix_up_the_stored_rates(): void
    {
        $order = $this->make_order([], [
            ['id' => 1, 'taxes' => [['type' => OrderTaxType::PRODUCT, 'name' => 'VAT', 'rate' => 10]]],
            ['id' => 2, 'taxes' => [['type' => OrderTaxType::PRODUCT, 'name' => 'VAT', 'rate' => 20]]],
        ]);
        $context = $this->make_context();
        $first = new CalculationItemDTO();
        $first->line_key = 2;
        $first->order_item_id = 1;
        $second = new CalculationItemDTO();
        $second->line_key = 1;
        $second->order_item_id = 2;
        $context->items = collection([$first, $second]);

        $stored = $this->service->build($order, $context);

        // Order item 1 sits at line key 2, and order item 2 at line key 1.
        $this->assertEquals([2 => [$this->make_tax_rate('VAT', 10.0)], 1 => [$this->make_tax_rate('VAT', 20.0)]], $stored->item_tax_rates);
    }

    public function test_it_keeps_the_shipping_charge_and_the_tax_rates_when_nothing_moved(): void
    {
        $order = $this->make_order(['base_shipping_total' => 1100, 'base_shipping_tax_amount' => 100], [
            ['id' => 5, 'taxes' => [['type' => OrderTaxType::PRODUCT, 'name' => 'VAT', 'rate' => 10]]],
        ], [['name' => 'Shipping Tax', 'rate' => 10, 'order_item_id' => null]]);

        $stored = $this->service->build($order, $this->make_context());

        $this->assertSame(1000, $stored->shipping_subtotal);
        $this->assertEquals([0 => [$this->make_tax_rate('VAT', 10.0)]], $stored->item_tax_rates);
        $this->assertEquals([$this->make_tax_rate('Shipping Tax', 10.0)], $stored->shipping_tax_rates);
        $this->assertFalse($stored->is_shipping_tax_split);
    }

    public function test_the_shipping_charge_adds_back_a_free_shipping_discount(): void
    {
        $order = $this->make_order(['base_shipping_total' => 0, 'base_shipping_tax_amount' => 0]);
        $order->set_relation('order_coupons', collection([$this->make_order_coupon(['code' => 'SHIPFREE', 'discount_type' => DiscountType::FREE_SHIPPING, 'base_discount_amount' => 900])]));

        $stored = $this->service->build($order, $this->make_context());

        $this->assertSame(900, $stored->shipping_subtotal);
    }

    public function test_it_lists_only_the_product_rates_of_a_line_and_flags_split_shipping_tax(): void
    {
        $order = $this->make_order([], [
            ['id' => 5, 'taxes' => [
                ['type' => OrderTaxType::PRODUCT, 'name' => 'VAT', 'rate' => 20],
                ['type' => OrderTaxType::SHIPPING, 'name' => 'VAT', 'rate' => 20],
            ]],
        ], [['name' => 'VAT', 'rate' => 20, 'order_item_id' => 5]]);

        $stored = $this->service->build($order, $this->make_context());

        $this->assertEquals([0 => [$this->make_tax_rate('VAT', 20.0)]], $stored->item_tax_rates);
        $this->assertEquals([$this->make_tax_rate('VAT', 20.0, 0)], $stored->shipping_tax_rates);
        $this->assertTrue($stored->is_shipping_tax_split);
    }

    public function test_a_line_with_no_stored_tax_has_an_empty_rate_list(): void
    {
        $stored = $this->service->build($this->make_order(), $this->make_context());

        $this->assertSame([0 => []], $stored->item_tax_rates);
    }

    public function test_it_quotes_shipping_and_tax_again_when_the_shipping_state_changed(): void
    {
        $stored = $this->service->build($this->make_order(), $this->make_context(['shipping_address' => ['country' => 'US', 'state' => 'CA']]));

        $this->assertNull($stored->shipping_subtotal);
        $this->assertNull($stored->shipping_tax_rates);
        $this->assertNull($stored->item_tax_rates);
    }

    public function test_it_quotes_shipping_and_tax_again_when_the_shipping_country_changed(): void
    {
        $stored = $this->service->build($this->make_order(), $this->make_context(['shipping_address' => ['country' => 'CA', 'state' => 'NY']]));

        $this->assertNull($stored->shipping_subtotal);
        $this->assertNull($stored->item_tax_rates);
    }

    public function test_other_address_fields_do_not_count_as_a_new_address(): void
    {
        $stored = $this->service->build($this->make_order(), $this->make_context(['shipping_address' => ['country' => 'US', 'state' => 'NY', 'city' => 'Albany', 'postal_code' => '12207']]));

        $this->assertNotNull($stored->shipping_subtotal);
        $this->assertNotNull($stored->item_tax_rates);
    }

    public function test_it_quotes_shipping_again_when_another_shipping_method_is_picked(): void
    {
        $stored = $this->service->build($this->make_order(), $this->make_context(['shipping_method_id' => 'method-0002']));

        $this->assertNull($stored->shipping_subtotal);
        $this->assertNull($stored->shipping_tax_rates);
        $this->assertNotNull($stored->item_tax_rates);
    }

    public function test_tax_that_follows_the_billing_address_is_not_quoted_again_for_a_new_shipping_state(): void
    {
        $order = $this->make_order(['tax_destination' => OrderTaxDestination::BILLING]);

        $stored = $this->service->build($order, $this->make_context(['shipping_address' => ['country' => 'US', 'state' => 'CA']]));

        $this->assertNull($stored->shipping_subtotal);
        $this->assertNotNull($stored->item_tax_rates);
        $this->assertNull($stored->shipping_tax_rates);
    }

    public function test_tax_that_follows_the_billing_address_is_quoted_again_for_a_new_billing_state(): void
    {
        $order = $this->make_order(['tax_destination' => OrderTaxDestination::BILLING]);

        $stored = $this->service->build($order, $this->make_context(['billing_address' => ['country' => 'US', 'state' => 'CA']]));

        $this->assertNotNull($stored->shipping_subtotal);
        $this->assertNull($stored->item_tax_rates);
    }

    public function test_tax_that_follows_the_store_address_is_never_quoted_again(): void
    {
        $order = $this->make_order(['tax_destination' => OrderTaxDestination::STORE]);

        $stored = $this->service->build($order, $this->make_context(['shipping_address' => ['country' => 'CA', 'state' => 'ON'], 'billing_address' => ['country' => 'CA', 'state' => 'ON']]));

        $this->assertNotNull($stored->item_tax_rates);
    }

    public function test_it_keeps_a_coupon_whose_code_is_sent_in_another_letter_case(): void
    {
        $order = $this->make_order();
        $order->set_relation('order_coupons', collection([$this->make_order_coupon(['code' => 'SPRING10'])]));

        $stored = $this->service->build($order, $this->make_context(['coupon_codes' => ['spring10']]));

        $this->assertSame(['SPRING10'], array_keys($stored->coupons));
    }

    public function test_it_keeps_only_the_coupons_the_edit_still_sends(): void
    {
        $order = $this->make_order();
        $order->set_relation('order_coupons', collection([
            $this->make_order_coupon(['code' => 'KEEP']),
            $this->make_order_coupon(['code' => 'DROP']),
        ]));

        $stored = $this->service->build($order, $this->make_context(['coupon_codes' => ['KEEP', 'NEW']]));

        $this->assertSame(['KEEP'], array_keys($stored->coupons));
        $this->assertSame('KEEP', $stored->coupons['KEEP']->code);
    }

    /**
     * Make an order placed to New York, shipped with method-0001 and taxed on its shipping address.
     *
     * @param array<string, mixed>                 $attributes   Order attributes to override.
     * @param array<int, array<string, mixed>>     $lines        Stored lines: `id` and their `taxes` rows.
     * @param array<int, array<string, mixed>>     $shipping_taxes Shipping tax rows.
     * @return Order
     */
    protected function make_order(array $attributes = [], array $lines = [['id' => 5, 'taxes' => []]], array $shipping_taxes = []): Order
    {
        $order = $this->make_model(Order::class, array_merge([
            'id' => 77,
            'is_tax_inclusive' => false,
            'tax_destination' => OrderTaxDestination::SHIPPING,
            'shipping_method' => 'method-0001',
            'shipping_country' => 'US',
            'shipping_state' => 'NY',
            'billing_country' => 'US',
            'billing_state' => 'NY',
            'base_shipping_total' => 1000,
            'base_shipping_tax_amount' => 0,
        ], $attributes));

        $order->set_relation('items', collection(array_map(function (array $line) {
            $order_item = $this->make_model(OrderItem::class, ['id' => $line['id']]);
            $order_item->set_relation('taxes', collection(array_map(fn(array $tax) => $this->make_model(OrderTax::class, $tax), $line['taxes'])));

            return $order_item;
        }, $lines)));
        $order->set_relation('shipping_taxes', collection(array_map(fn(array $tax) => $this->make_model(OrderTax::class, array_merge(['type' => OrderTaxType::SHIPPING], $tax)), $shipping_taxes)));
        $order->set_relation('order_coupons', collection([]));

        return $order;
    }

    /**
     * Make the context of an edit that sends the stored line and the order's own addresses unless told otherwise.
     *
     * @param array<string, mixed> $overrides Context fields to override.
     * @return CalculationContextDTO
     */
    protected function make_context(array $overrides = []): CalculationContextDTO
    {
        $item = new CalculationItemDTO();
        $item->line_key = 0;
        $item->order_item_id = 5;

        $context = new CalculationContextDTO();
        $context->items = collection([$item]);
        $context->shipping_address = $overrides['shipping_address'] ?? ['country' => 'US', 'state' => 'NY'];
        $context->billing_address = $overrides['billing_address'] ?? ['country' => 'US', 'state' => 'NY'];
        $context->shipping_method_id = $overrides['shipping_method_id'] ?? 'method-0001';
        $context->coupon_codes = $overrides['coupon_codes'] ?? [];

        return $context;
    }

    /**
     * @param array<string, mixed> $attributes Order coupon attributes.
     * @return OrderCoupon
     */
    protected function make_order_coupon(array $attributes): OrderCoupon
    {
        return $this->make_model(OrderCoupon::class, array_merge(['discount_type' => DiscountType::AMOUNT_OFF, 'base_discount_amount' => 0], $attributes));
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
}
