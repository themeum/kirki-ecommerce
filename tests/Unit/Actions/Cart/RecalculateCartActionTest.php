<?php

namespace Kirki\Ecommerce\Tests\Unit\Actions\Cart;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Discount\DiscountCalculationResultDTO;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Tests\Support\BindsTaxDependencies;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\collection;

class RecalculateCartActionTest extends TestCase
{
    use BindsTaxDependencies;

    /**
     * A single exclusive-tax item, no discount, no shipping: tax is added
     * on top of the subtotal.
     *
     * @return void
     */
    public function test_exclusive_tax_adds_tax_on_top_of_the_subtotal(): void
    {
        $this->bind_default_region(15, 0, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
        ]);

        $result = $this->make_action()->execute($context);
        $item = $result->items[1];

        $this->assertSame(10000, $item->base_subtotal);
        $this->assertSame(1500, $item->base_tax_amount);
        $this->assertSame(0, $item->base_discount_amount);
        $this->assertSame(11500, $item->base_total);
        $this->assertSame(1, $item->tax_lines[0]->item_id);

        $this->assertSame(10000, $result->base_subtotal);
        $this->assertSame(1500, $result->base_tax_total);
        $this->assertSame(11500, $result->base_total);
    }

    /**
     * A single inclusive-tax item: the tax is extracted from (not added on
     * top of) the subtotal, so the total equals the subtotal minus any
     * discount - tax is already inside it.
     *
     * @return void
     */
    public function test_inclusive_tax_extracts_tax_without_adding_it(): void
    {
        $this->bind_default_region(20, 0, true);

        $context = $this->make_context([$this->make_item(1, 12000)], [
            'shipping_address' => ['country' => 'BD'],
        ]);

        $result = $this->make_action()->execute($context);
        $item = $result->items[1];

        $this->assertSame(12000, $item->base_subtotal);
        $this->assertSame(2000, $item->base_tax_amount);
        $this->assertSame(12000, $item->base_total);
        $this->assertSame(10000, $item->base_total - $item->base_tax_amount);

        $this->assertSame(12000, $result->base_total);
        $this->assertSame(2000, $result->base_tax_total);
    }

    /**
     * The amount-consistency invariant that must hold in exclusive mode:
     * total = subtotal - discount + tax (tax genuinely added on top).
     *
     * @return void
     */
    public function test_total_reconciles_with_subtotal_discount_and_tax_in_exclusive_mode(): void
    {
        $item = $this->calculate_reconciliation_item(false);

        $this->assertSame($item->base_subtotal - $item->base_discount_amount + $item->base_tax_amount, $item->base_total);
    }

    /**
     * The same invariant in inclusive mode: total = subtotal - discount:
     * tax is already embedded in the subtotal, never added a second time.
     *
     * @return void
     */
    public function test_total_reconciles_with_subtotal_and_discount_in_inclusive_mode(): void
    {
        $item = $this->calculate_reconciliation_item(true);

        $this->assertSame($item->base_subtotal - $item->base_discount_amount, $item->base_total);
    }

    protected function calculate_reconciliation_item(bool $is_tax_inclusive_price): CalculationItemDTO
    {
        $this->bind_default_region(15, 0, $is_tax_inclusive_price);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
        ]);

        $discount_service = $this->createMock(DiscountService::class);
        $discount_service->method('calculate')->willReturn(
            $this->make_discount_result(0, [1 => 1000])
        );

        $result = $this->make_action(['discount_service' => $discount_service])->execute($context);

        return $result->items[1];
    }

    /**
     * should_calculate_tax = false skips tax entirely, without touching the
     * tax strategy at all.
     *
     * @return void
     */
    public function test_should_calculate_tax_false_skips_tax_entirely(): void
    {
        $this->bind_default_region(15, 5, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
            'should_calculate_tax' => false,
        ]);

        $shipping_service = $this->make_taxable_shipping_service(2000);

        $result = $this->make_action(['shipping_service' => $shipping_service])->execute($context);

        $this->assertSame(0, $result->items[1]->base_tax_amount);
        $this->assertSame([], $result->items[1]->tax_lines);
        $this->assertSame(0, $result->base_shipping_tax);
        $this->assertSame([], $result->shipping_tax_lines);
        $this->assertSame(0, $result->base_tax_total);
    }

    /**
     * An address whose country has no configured tax region degrades to
     * zero tax rather than throwing - checkout must not break for an
     * unconfigured destination.
     *
     * @return void
     */
    public function test_unconfigured_country_produces_zero_tax_without_error(): void
    {
        $this->bind_full_tax_settings([
            ['code' => 'BD', 'is_enabled' => true, 'is_central_tax_enabled' => true, 'central_product_tax' => 15, 'central_shipping_tax' => 5, 'rules' => [], 'states' => []],
        ]);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'US'],
        ]);

        $result = $this->make_action()->execute($context);

        $this->assertSame(0, $result->items[1]->base_tax_amount);
        $this->assertSame(10000, $result->items[1]->base_total);
        $this->assertSame(0, $result->base_tax_total);
    }

    /**
     * No shipping address or no shipping method selected: shipping subtotal
     * is zero and the shipping service is never consulted.
     *
     * @return void
     */
    public function test_missing_shipping_address_or_method_skips_shipping_entirely(): void
    {
        $this->bind_default_region(15, 5, false);

        // No shipping_address at all: the tax strategy is resolved from
        // this same address, so item tax is unresolvable too - not just
        // shipping. This matches real checkout UX (no tax shown until a
        // destination is known), not a bug.
        $context = $this->make_context([$this->make_item(1, 10000)]);

        $shipping_service = $this->createMock(ShippingService::class);
        $shipping_service->expects($this->never())->method('calculate');
        $shipping_service->expects($this->never())->method('get_selected_shipping_method');

        $result = $this->make_action(['shipping_service' => $shipping_service])->execute($context);

        $this->assertSame(0, $result->base_shipping_subtotal);
        $this->assertSame(0, $result->base_shipping_tax);
        $this->assertSame(0, $result->base_tax_total);
        $this->assertSame(10000, $result->base_total);
    }

    /**
     * A taxable shipping method: shipping tax is computed on the shipping
     * subtotal and folded into the order totals.
     *
     * @return void
     */
    public function test_shipping_tax_applied_when_shipping_method_is_taxable(): void
    {
        $this->bind_default_region(15, 5, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
            'shipping_method_id' => 7,
        ]);

        $shipping_service = $this->make_taxable_shipping_service(2000);

        $result = $this->make_action(['shipping_service' => $shipping_service])->execute($context);

        $this->assertSame(2000, $result->base_shipping_subtotal);
        $this->assertSame(100, $result->base_shipping_tax);
        $this->assertSame(2100, $result->base_shipping_total);
        $this->assertNull($result->shipping_tax_lines[0]->item_id);
        $this->assertSame(1600, $result->base_tax_total);
    }

    /**
     * A non-taxable shipping method produces no shipping tax at all.
     *
     * @return void
     */
    public function test_shipping_tax_not_applied_when_shipping_method_is_not_taxable(): void
    {
        $this->bind_default_region(15, 5, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
            'shipping_method_id' => 7,
        ]);

        $shipping_service = $this->createMock(ShippingService::class);
        $shipping_service->method('calculate')->willReturn(2000);
        $shipping_service->method('get_selected_shipping_method')->willReturn(['is_taxable' => false, 'base_cost' => 2000]);

        $result = $this->make_action(['shipping_service' => $shipping_service])->execute($context);

        $this->assertSame(0, $result->base_shipping_tax);
        $this->assertSame([], $result->shipping_tax_lines);
        $this->assertSame(2000, $result->base_shipping_total);
    }

    /**
     * Totals aggregate correctly across more than one item.
     *
     * @return void
     */
    public function test_aggregates_totals_across_multiple_items(): void
    {
        $this->bind_default_region(10, 0, false);

        $context = $this->make_context([
            $this->make_item(1, 10000, 2),
            $this->make_item(2, 5000, 1),
        ], [
            'shipping_address' => ['country' => 'BD'],
        ]);

        $result = $this->make_action()->execute($context);

        $this->assertSame(25000, $result->base_subtotal);
        $this->assertSame(2500, $result->base_tax_total);
        $this->assertSame(27500, $result->base_total);
        $this->assertSame(3, $result->items_count);
    }

    /**
     * An item discount reduces the base tax is computed on, not just the
     * final total.
     *
     * @return void
     */
    public function test_item_discount_reduces_the_taxable_base(): void
    {
        $this->bind_default_region(10, 0, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
        ]);

        $discount_service = $this->createMock(DiscountService::class);
        $discount_service->method('calculate')->willReturn($this->make_discount_result(0, [1 => 4000]));

        $result = $this->make_action(['discount_service' => $discount_service])->execute($context);
        $item = $result->items[1];

        $this->assertSame(4000, $item->base_discount_amount);
        // Tax at 10% of the discounted 6000 base, not the raw 10000 subtotal.
        $this->assertSame(600, $item->base_tax_amount);
        $this->assertSame(6600, $item->base_total);
    }

    /**
     * A discount larger than the item's own subtotal is capped there - the
     * item's taxable base (and its tax) floors at zero, never negative.
     *
     * @return void
     */
    public function test_item_discount_is_capped_at_the_item_subtotal(): void
    {
        $this->bind_default_region(10, 0, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
        ]);

        $discount_service = $this->createMock(DiscountService::class);
        $discount_service->method('calculate')->willReturn($this->make_discount_result(0, [1 => 50000]));

        $result = $this->make_action(['discount_service' => $discount_service])->execute($context);
        $item = $result->items[1];

        $this->assertSame(10000, $item->base_discount_amount);
        $this->assertSame(0, $item->base_tax_amount);
        $this->assertSame(0, $item->base_total);
    }

    /**
     * A shipping discount reduces the taxable base shipping tax is computed
     * on - a free-shipping coupon zeroes the shipping tax too.
     *
     * @return void
     */
    public function test_shipping_discount_reduces_the_shipping_taxable_base(): void
    {
        $this->bind_default_region(0, 10, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
            'shipping_method_id' => 7,
        ]);

        $shipping_service = $this->make_taxable_shipping_service(2000);

        $discount_service = $this->createMock(DiscountService::class);
        $discount_service->method('calculate')->willReturn($this->make_discount_result(2000, []));

        $result = $this->make_action([
            'shipping_service' => $shipping_service,
            'discount_service' => $discount_service,
        ])->execute($context);

        $this->assertSame(2000, $result->base_shipping_discount);
        $this->assertSame(0, $result->base_shipping_tax);
        $this->assertSame(0, $result->base_shipping_total);
    }

    /**
     * End-to-end smoke test with a real DiscountService and a real (but
     * unsaved) FREE_SHIPPING coupon: the discount computed for real flows
     * into the shipping tax base, not just a mocked number.
     *
     * @return void
     */
    public function test_real_free_shipping_coupon_flows_into_shipping_tax(): void
    {
        $this->bind_default_region(0, 10, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
            'shipping_method_id' => 7,
            'coupon_codes' => ['FREESHIP'],
        ]);

        $shipping_service = $this->make_taxable_shipping_service(2000);

        $coupon = new Coupon();
        $coupon->code = 'FREESHIP';
        $coupon->is_active = true;
        $coupon->discount_type = DiscountType::FREE_SHIPPING;

        $coupon_service = $this->createMock(CouponService::class);
        $coupon_service->method('find_by_codes')->willReturn(collection([$coupon]));

        $action = $this->make_action([
            'shipping_service' => $shipping_service,
            'discount_service' => new DiscountService(),
            'coupon_service' => $coupon_service,
        ]);

        $result = $action->execute($context);

        $this->assertSame(2000, $result->base_shipping_discount);
        $this->assertSame(0, $result->base_shipping_tax);
        $this->assertSame(0, $result->base_shipping_total);
        $this->assertCount(1, $result->coupon_results);
    }

    /**
     * A discount larger than the whole cart's total floors the grand total
     * at zero rather than going negative.
     *
     * @return void
     */
    public function test_grand_total_floors_at_zero(): void
    {
        $this->bind_default_region(0, 0, false);

        $context = $this->make_context([$this->make_item(1, 10000)], [
            'shipping_address' => ['country' => 'BD'],
        ]);

        $discount_service = $this->createMock(DiscountService::class);
        $discount_service->method('calculate')->willReturn($this->make_discount_result(0, [1 => 10000]));

        $result = $this->make_action(['discount_service' => $discount_service])->execute($context);

        $this->assertSame(0, $result->base_total);
    }

    /**
     * EU shipping tax splits proportionally across items with mixed VAT
     * rates, end to end through the real action - not just at the strategy
     * level.
     *
     * @return void
     */
    public function test_eu_shipping_tax_splits_proportionally_end_to_end(): void
    {
        $this->bind_full_tax_settings([
            [
                'code' => 'EU',
                'is_enabled' => true,
                'type' => 'oss',
                'rules' => [$this->set_product_tax_rate_rule('digital', 5)],
                'countries' => [['code' => 'AT', 'name' => 'Austria', 'rate' => 20]],
            ],
        ]);

        $context = $this->make_context([
            $this->make_item(1, 10000, 1, ['tax_profile_id' => 'digital']),
            $this->make_item(2, 10000, 1, ['tax_profile_id' => 'physical']),
        ], [
            'shipping_address' => ['country' => 'AT'],
            'shipping_method_id' => 7,
        ]);

        $shipping_service = $this->make_taxable_shipping_service(10000);

        $result = $this->make_action(['shipping_service' => $shipping_service])->execute($context);

        $this->assertSame(500, $result->items[1]->base_tax_amount);
        $this->assertSame(2000, $result->items[2]->base_tax_amount);

        $this->assertCount(2, $result->shipping_tax_lines);
        $this->assertSame(1, $result->shipping_tax_lines[0]->item_id);
        $this->assertSame(250, $result->shipping_tax_lines[0]->base_amount);
        $this->assertSame(2, $result->shipping_tax_lines[1]->item_id);
        $this->assertSame(1000, $result->shipping_tax_lines[1]->base_amount);

        $this->assertSame(1250, $result->base_shipping_tax);
        $this->assertSame(3750, $result->base_tax_total);
        // items: (10000+500) + (10000+2000) = 22500; shipping: 10000+1250 = 11250
        $this->assertSame(33750, $result->base_total);
    }

    /**
     * Bind a "BD" central tax region with the given rates, wired through
     * `bind_full_tax_settings()`.
     *
     * @param int|float $product_tax_rate
     * @param int|float $shipping_tax_rate
     * @param bool $is_tax_inclusive_price
     * @return void
     */
    protected function bind_default_region($product_tax_rate, $shipping_tax_rate, bool $is_tax_inclusive_price): void
    {
        $this->bind_full_tax_settings([
            [
                'code' => 'BD',
                'is_enabled' => true,
                'is_central_tax_enabled' => true,
                'central_product_tax' => $product_tax_rate,
                'central_shipping_tax' => $shipping_tax_rate,
                'rules' => [],
                'states' => [],
            ],
        ], $is_tax_inclusive_price);
    }

    /**
     * @param array<int, CalculationItemDTO> $items
     * @param array $overrides
     * @return CalculationContextDTO
     */
    protected function make_context(array $items, array $overrides = []): CalculationContextDTO
    {
        $context = new CalculationContextDTO();
        $context->items = $items;
        $context->cart_id = $overrides['cart_id'] ?? null;
        $context->shipping_address = $overrides['shipping_address'] ?? [];
        $context->billing_address = $overrides['billing_address'] ?? [];
        $context->customer_id = $overrides['customer_id'] ?? null;
        $context->coupon_codes = $overrides['coupon_codes'] ?? [];
        $context->shipping_method_id = $overrides['shipping_method_id'] ?? null;
        $context->should_calculate_tax = $overrides['should_calculate_tax'] ?? true;

        return $context;
    }

    protected function make_item(int $variant_id, int $base_unit_price, int $quantity = 1, array $overrides = []): CalculationItemDTO
    {
        $item = new CalculationItemDTO();
        $item->id = $overrides['id'] ?? $variant_id;
        $item->variant_id = $variant_id;
        $item->product_id = $overrides['product_id'] ?? $variant_id;
        $item->quantity = $quantity;
        $item->base_unit_price = $base_unit_price;
        $item->base_product_total = $overrides['base_product_total'] ?? $base_unit_price;
        $item->tax_profile_id = $overrides['tax_profile_id'] ?? null;
        $item->product_categories = $overrides['product_categories'] ?? [];

        return $item;
    }

    protected function make_discount_result(int $shipping_discount, array $item_discounts): DiscountCalculationResultDTO
    {
        $result = new DiscountCalculationResultDTO();
        $result->shipping_discount = $shipping_discount;
        $result->item_discounts = $item_discounts;

        return $result;
    }

    /**
     * @return ShippingService&\PHPUnit\Framework\MockObject\MockObject
     */
    protected function make_taxable_shipping_service(int $base_cost)
    {
        $shipping_service = $this->createMock(ShippingService::class);
        $shipping_service->method('calculate')->willReturn($base_cost);
        $shipping_service->method('get_selected_shipping_method')->willReturn(['is_taxable' => true, 'base_cost' => $base_cost]);

        return $shipping_service;
    }

    /**
     * @param array{shipping_service?: object, discount_service?: object, coupon_service?: object, cart_service?: object} $overrides
     * @return RecalculateCartAction
     */
    protected function make_action(array $overrides = []): RecalculateCartAction
    {
        $shipping_service = $overrides['shipping_service'] ?? $this->default_shipping_service();
        $discount_service = $overrides['discount_service'] ?? $this->default_discount_service();
        $coupon_service = $overrides['coupon_service'] ?? $this->default_coupon_service();
        $cart_service = $overrides['cart_service'] ?? $this->createMock(CartService::class);

        return new RecalculateCartAction($shipping_service, $discount_service, $coupon_service, $cart_service);
    }

    protected function default_shipping_service()
    {
        $shipping_service = $this->createMock(ShippingService::class);
        $shipping_service->method('calculate')->willReturn(0);
        $shipping_service->method('get_selected_shipping_method')->willReturn(['is_taxable' => false, 'base_cost' => 0]);

        return $shipping_service;
    }

    protected function default_discount_service()
    {
        $discount_service = $this->createMock(DiscountService::class);
        $discount_service->method('calculate')->willReturn(new DiscountCalculationResultDTO());

        return $discount_service;
    }

    protected function default_coupon_service()
    {
        $coupon_service = $this->createMock(CouponService::class);
        $coupon_service->method('find_by_codes')->willReturn(collection());

        return $coupon_service;
    }
}
