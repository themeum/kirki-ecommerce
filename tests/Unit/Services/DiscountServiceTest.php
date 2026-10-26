<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\StoredOrderTermsDTO;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItemCoupon;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

class DiscountServiceTest extends TestCase
{
    protected DiscountService $service;

    /** @var OrderService&MockObject */
    protected $order_service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->order_service = $this->createMock(OrderService::class);
        $this->service = new DiscountService($this->order_service);
    }

    public function test_calculate_applies_free_shipping_discount_when_shipping_subtotal_is_positive(): void
    {
        $context = new CalculationContextDTO();
        $context->items = [];
        $context->shipping_subtotal = 1500; // $15.00

        $coupon = new Coupon();
        $coupon->code = 'FREESHIP';
        $coupon->is_active = true;
        $coupon->discount_type = DiscountType::FREE_SHIPPING;

        $result = $this->service->calculate($context, [$coupon]);

        $this->assertEquals(1500, $result->shipping_discount);
        $this->assertCount(1, $result->coupon_results);
        $this->assertEquals(1500, $result->coupon_results[0]->shipping_discount);
        $this->assertEquals(1500, $result->coupon_results[0]->total_discount);
    }

    public function test_calculate_reports_the_product_coupon_share_of_each_item_discount(): void
    {
        $context = $this->make_amount_off_context(11000);

        $result = $this->service->calculate($context, [
            $this->make_amount_off_coupon('ITEM', DiscountTarget::PRODUCTS, DiscountValueType::FIXED, 1100),
            $this->make_amount_off_coupon('ORDER', DiscountTarget::ORDER, DiscountValueType::PERCENTAGE, 10),
        ]);

        // The order coupon applies to what the product coupon left: 10% of 9900 = 990.
        $this->assertSame([1 => 2090], $result->item_discounts);
        $this->assertSame([1 => 1100], $result->product_item_discounts);
    }

    public function test_calculate_reports_the_clamped_product_coupon_share(): void
    {
        $context = $this->make_amount_off_context(1000);

        $result = $this->service->calculate($context, [
            $this->make_amount_off_coupon('FIRST', DiscountTarget::PRODUCTS, DiscountValueType::FIXED, 700),
            $this->make_amount_off_coupon('SECOND', DiscountTarget::PRODUCTS, DiscountValueType::FIXED, 600),
        ]);

        // 700 + 600 exceeds the 1000 item total, so the second coupon is clamped to 300.
        $this->assertSame([1 => 1000], $result->item_discounts);
        $this->assertSame([1 => 1000], $result->product_item_discounts);
    }

    public function test_validate_coupon_rejects_free_shipping_when_shipping_subtotal_is_zero(): void
    {
        $context = new CalculationContextDTO();
        $context->items = [];
        $context->shipping_subtotal = 0;

        $coupon = new Coupon();
        $coupon->code = 'FREESHIP';
        $coupon->is_active = true;
        $coupon->discount_type = DiscountType::FREE_SHIPPING;

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Free shipping coupon cannot be applied when shipping cost is zero.');

        $this->service->validate_coupon($coupon, $context);
    }

    public function test_calculate_rejects_second_free_shipping_coupon(): void
    {
        $context = new CalculationContextDTO();
        $context->items = [];
        $context->shipping_subtotal = 1000;

        $coupon1 = new Coupon();
        $coupon1->code = 'SHIP1';
        $coupon1->is_active = true;
        $coupon1->discount_type = DiscountType::FREE_SHIPPING;

        $coupon2 = new Coupon();
        $coupon2->code = 'SHIP2';
        $coupon2->is_active = true;
        $coupon2->discount_type = DiscountType::FREE_SHIPPING;

        $result = $this->service->calculate($context, [$coupon1, $coupon2]);

        $this->assertCount(1, $result->coupon_results);
        $this->assertEquals('SHIP1', $result->coupon_results[0]->coupon->code);
        $this->assertCount(1, $result->invalid_coupons);
        $this->assertEquals('SHIP2', $result->invalid_coupons[0]->code);
    }

    public function test_first_time_buyer_rejects_guest_without_email(): void
    {
        $this->order_service->expects($this->never())->method('count_prior_orders');

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Please enter your email address to use this coupon.');

        $this->service->validate_coupon($this->first_time_buyer_coupon(), $this->guest_context(null));
    }

    public function test_first_time_buyer_rejects_guest_whose_email_has_prior_orders(): void
    {
        $this->order_service->method('count_prior_orders')->willReturn(1);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('This coupon is only available for first time buyers.');

        $this->service->validate_coupon($this->first_time_buyer_coupon(), $this->guest_context('guest@example.com'));
    }

    public function test_first_time_buyer_accepts_guest_with_new_email(): void
    {
        $this->order_service->expects($this->once())
            ->method('count_prior_orders')
            ->with(null, 'guest@example.com', null)
            ->willReturn(0);

        $this->service->validate_coupon($this->first_time_buyer_coupon(), $this->guest_context('guest@example.com'));
    }

    public function test_first_time_buyer_counts_by_customer_email_and_excludes_edited_order(): void
    {
        $this->order_service->expects($this->once())
            ->method('count_prior_orders')
            ->with(5, 'account@example.com', 42)
            ->willReturn(0);

        $context = $this->guest_context('account@example.com');
        $context->customer_id = 5;
        $context->order_id = 42;

        $this->service->validate_coupon($this->first_time_buyer_coupon(), $context);
    }

    public function test_customer_limit_rejects_guest_without_email(): void
    {
        $this->order_service->expects($this->never())->method('count_coupon_usages');

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Please enter your email address to use this coupon.');

        $this->service->validate_coupon($this->customer_limited_coupon(2), $this->guest_context(null));
    }

    public function test_customer_limit_accepts_guest_below_limit(): void
    {
        $this->order_service->method('count_coupon_usages')->willReturn(1);

        $this->service->validate_coupon($this->customer_limited_coupon(2), $this->guest_context('guest@example.com'));

        $this->addToAssertionCount(1);
    }

    public function test_customer_limit_rejects_guest_at_limit(): void
    {
        $this->order_service->method('count_coupon_usages')->willReturn(1);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('You have reached the usage limit for this coupon.');

        $this->service->validate_coupon($this->customer_limited_coupon(1), $this->guest_context('guest@example.com'));
    }

    public function test_customer_limit_counts_by_coupon_email_and_edited_order(): void
    {
        $this->order_service->expects($this->once())
            ->method('count_coupon_usages')
            ->with(9, null, 'guest@example.com', 42)
            ->willReturn(0);

        $context = $this->guest_context('guest@example.com');
        $context->order_id = 42;

        $this->service->validate_coupon($this->customer_limited_coupon(1), $context);
    }

    // Coupons that stay on an edited order

    public function test_a_stored_percentage_product_coupon_follows_the_new_quantity_and_skips_a_new_line(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::PRODUCTS, ['discount_rate' => 10], [10 => 100]),
        ], [$this->make_line(1, 1000, 3, 10), $this->make_line(2, 2000, 1, null)]);

        $result = $this->service->calculate($context, []);

        $this->assertSame([1 => 300], $result->item_discounts);
        $this->assertSame([1 => 300], $result->product_item_discounts);
        $this->assertSame(300, $result->coupon_results[0]->total_discount);
        $this->assertSame('STORED', $result->coupon_results[0]->order_coupon->code);
    }

    public function test_a_stored_fixed_product_coupon_keeps_the_amount_stored_for_its_line(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::PRODUCTS, [], [10 => 500]),
        ], [$this->make_line(1, 1000, 3, 10)]);

        $this->assertSame([1 => 500], $this->service->calculate($context, [])->item_discounts);
    }

    public function test_a_stored_fixed_product_coupon_is_capped_at_the_new_line_subtotal(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::PRODUCTS, [], [10 => 500]),
        ], [$this->make_line(1, 300, 1, 10)]);

        $this->assertSame([1 => 300], $this->service->calculate($context, [])->item_discounts);
    }

    public function test_a_stored_percentage_order_coupon_discounts_a_new_line_too(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::ORDER, ['discount_rate' => 10], [10 => 100]),
        ], [$this->make_line(1, 1000, 1, 10), $this->make_line(2, 3000, 1, null)]);

        $result = $this->service->calculate($context, []);

        $this->assertSame([1 => 100, 2 => 300], $result->item_discounts);
        $this->assertSame([], $result->product_item_discounts);
        $this->assertSame(400, $result->coupon_results[0]->total_discount);
    }

    public function test_a_stored_fixed_order_coupon_keeps_its_total_and_shares_it_over_every_line(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::ORDER, ['base_discount_amount' => 400], [10 => 400]),
        ], [$this->make_line(1, 1000, 1, 10), $this->make_line(2, 3000, 1, null)]);

        $result = $this->service->calculate($context, []);

        $this->assertSame([1 => 100, 2 => 300], $result->item_discounts);
        $this->assertSame(400, $result->coupon_results[0]->total_discount);
    }

    public function test_a_stored_fixed_order_coupon_is_capped_at_what_is_left(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::ORDER, ['base_discount_amount' => 400], [10 => 400]),
        ], [$this->make_line(1, 150, 1, 10)]);

        $this->assertSame([1 => 150], $this->service->calculate($context, [])->item_discounts);
    }

    public function test_a_stored_order_coupon_applies_to_what_the_stored_product_coupon_left(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('ORDER', DiscountTarget::ORDER, ['discount_rate' => 10], [10 => 90]),
            $this->make_stored_coupon('ITEM', DiscountTarget::PRODUCTS, ['discount_rate' => 10], [10 => 100]),
        ], [$this->make_line(1, 1000, 1, 10)]);

        $result = $this->service->calculate($context, []);

        // The product coupon takes 100 first, then the order coupon takes 10% of the 900 that is left.
        $this->assertSame([1 => 190], $result->item_discounts);
        $this->assertSame([1 => 100], $result->product_item_discounts);
        $this->assertSame(['ITEM', 'ORDER'], array_map(fn($coupon_result) => $coupon_result->coupon->code, $result->coupon_results));
    }

    public function test_a_stored_percentage_order_coupon_keeps_its_amount_when_a_new_percentage_order_coupon_is_added(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::ORDER, ['discount_rate' => 10], [10 => 1000]),
        ], [$this->make_line(1, 10000, 1, 10)]);

        $result = $this->service->calculate($context, [
            $this->make_amount_off_coupon('NEW', DiscountTarget::ORDER, DiscountValueType::PERCENTAGE, 20),
        ]);

        // The stored coupon takes 10% of 10000 first, then the new coupon takes 20% of the 9000 that is left.
        $this->assertSame(['STORED', 'NEW'], array_map(fn($coupon_result) => $coupon_result->coupon->code, $result->coupon_results));
        $this->assertSame([1000, 1800], array_map(fn($coupon_result) => $coupon_result->total_discount, $result->coupon_results));
        $this->assertSame([1 => 2800], $result->item_discounts);
    }

    public function test_a_stored_fixed_order_coupon_keeps_its_total_and_the_new_coupon_takes_what_is_left(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::ORDER, ['base_discount_amount' => 9500], [10 => 9500]),
        ], [$this->make_line(1, 10000, 1, 10)]);

        $result = $this->service->calculate($context, [
            $this->make_amount_off_coupon('NEW', DiscountTarget::ORDER, DiscountValueType::FIXED, 2000),
        ]);

        $this->assertSame([9500, 500], array_map(fn($coupon_result) => $coupon_result->total_discount, $result->coupon_results));
        $this->assertSame([1 => 10000], $result->item_discounts);
    }

    public function test_a_stored_coupon_applies_with_no_coupon_record_and_no_validation(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('GONE', DiscountTarget::ORDER, ['coupon_id' => null, 'discount_rate' => 10], [10 => 100]),
        ], [$this->make_line(1, 1000, 1, 10)]);

        $result = $this->service->calculate($context, []);

        $this->assertSame([], $result->invalid_coupons);
        $this->assertSame([1 => 100], $result->item_discounts);
        $this->assertNull($result->coupon_results[0]->coupon->id);
        $this->assertSame(DiscountValueType::PERCENTAGE, $result->coupon_results[0]->coupon->discount_value_type);
        $this->assertEquals(10, $result->coupon_results[0]->coupon->discount_amount_percentage);
    }

    public function test_a_stored_free_shipping_coupon_waives_the_shipping_charge(): void
    {
        $stored_coupon = new OrderCoupon();
        $stored_coupon->code = 'SHIPFREE';
        $stored_coupon->discount_type = DiscountType::FREE_SHIPPING;
        $stored_coupon->discount_target = null;
        $stored_coupon->base_discount_amount = 900;
        $context = $this->make_stored_context([$stored_coupon], []);
        $context->shipping_subtotal = 1200;

        $result = $this->service->calculate($context, []);

        $this->assertSame(1200, $result->shipping_discount);
        $this->assertSame($stored_coupon, $result->coupon_results[0]->order_coupon);
    }

    public function test_a_new_free_shipping_coupon_is_refused_while_a_stored_one_is_applied(): void
    {
        $stored_coupon = new OrderCoupon();
        $stored_coupon->code = 'SHIPFREE';
        $stored_coupon->discount_type = DiscountType::FREE_SHIPPING;
        $context = $this->make_stored_context([$stored_coupon], []);
        $context->shipping_subtotal = 1200;

        $new_coupon = new Coupon();
        $new_coupon->code = 'SHIPNEW';
        $new_coupon->is_active = true;
        $new_coupon->discount_type = DiscountType::FREE_SHIPPING;

        $result = $this->service->calculate($context, [$new_coupon]);

        $this->assertSame([$new_coupon], $result->invalid_coupons);
        $this->assertCount(1, $result->coupon_results);
        $this->assertSame(1200, $result->shipping_discount);
    }

    public function test_a_new_coupon_is_priced_from_its_record_next_to_a_stored_coupon(): void
    {
        $context = $this->make_stored_context([
            $this->make_stored_coupon('STORED', DiscountTarget::PRODUCTS, ['discount_rate' => 10], [10 => 100]),
        ], [$this->make_line(1, 1000, 1, 10)]);
        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);

        $result = $this->service->calculate($context, [
            $this->make_amount_off_coupon('NEW', DiscountTarget::ORDER, DiscountValueType::FIXED, 50),
        ]);

        $this->assertSame([1 => 150], $result->item_discounts);
        $this->assertSame('STORED', $result->coupon_results[0]->order_coupon->code);
        $this->assertNull($result->coupon_results[1]->order_coupon);
        $this->assertSame('NEW', $result->coupon_results[1]->coupon->code);
    }

    /**
     * Make a context for an edit: the lines, and the coupons that stay on the order.
     *
     * @param OrderCoupon[]         $stored_coupons Coupons that stay on the order.
     * @param CalculationItemDTO[]  $lines          Lines of the edit.
     * @return CalculationContextDTO
     */
    protected function make_stored_context(array $stored_coupons, array $lines): CalculationContextDTO
    {
        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);

        $context = new CalculationContextDTO();
        $context->items = collection($lines);
        $context->stored = new StoredOrderTermsDTO();
        $context->stored->coupons = array_column(array_map(fn($coupon) => ['code' => $coupon->code, 'coupon' => $coupon], $stored_coupons), 'coupon', 'code');

        return $context;
    }

    /**
     * @param int      $line_key      Key of the line in the calculation.
     * @param int      $unit_price    Unit price in minor units.
     * @param int      $quantity      Quantity.
     * @param int|null $order_item_id Stored line, null for a new line.
     * @return CalculationItemDTO
     */
    protected function make_line(int $line_key, int $unit_price, int $quantity, ?int $order_item_id): CalculationItemDTO
    {
        $item = new CalculationItemDTO();
        $item->line_key = $line_key;
        $item->order_item_id = $order_item_id;
        $item->base_unit_price = $unit_price;
        $item->quantity = $quantity;

        return $item;
    }

    /**
     * @param string                $code       Coupon code.
     * @param string                $target     A DiscountTarget value.
     * @param array<string, mixed>  $attributes Order coupon attributes to set: `discount_rate`, `base_discount_amount`, `coupon_id`.
     * @param array<int, int>       $shares     Stored discount per order item ID.
     * @return OrderCoupon
     */
    protected function make_stored_coupon(string $code, string $target, array $attributes, array $shares): OrderCoupon
    {
        $stored_coupon = new OrderCoupon();
        $stored_coupon->code = $code;
        $stored_coupon->title = $code;
        $stored_coupon->discount_type = DiscountType::AMOUNT_OFF;
        $stored_coupon->discount_target = $target;
        $stored_coupon->coupon_id = 9;
        $stored_coupon->discount_rate = null;
        $stored_coupon->base_discount_amount = 0;

        foreach ($attributes as $key => $value) {
            $stored_coupon->$key = $value;
        }

        $stored_coupon->set_relation('order_item_coupons', collection(array_map(function ($order_item_id, $amount) {
            $item_coupon = new OrderItemCoupon();
            $item_coupon->order_item_id = $order_item_id;
            $item_coupon->base_discount_amount = $amount;

            return $item_coupon;
        }, array_keys($shares), $shares)));

        return $stored_coupon;
    }

    protected function guest_context(?string $email): CalculationContextDTO
    {
        $context = new CalculationContextDTO();
        $context->items = [];
        $context->customer_email = $email;

        return $context;
    }

    protected function first_time_buyer_coupon(): Coupon
    {
        $coupon = new Coupon();
        $coupon->code = 'WELCOME';
        $coupon->is_active = true;
        $coupon->first_time_buyer_only = true;

        return $coupon;
    }

    protected function customer_limited_coupon(int $limit): Coupon
    {
        $coupon = new Coupon();
        $coupon->id = 9;
        $coupon->code = 'ONCE';
        $coupon->is_active = true;
        $coupon->has_customer_limit = true;
        $coupon->customer_limit = $limit;
        $coupon->set_relation('customers', collection());

        return $coupon;
    }

    protected function make_amount_off_context(int $base_unit_price): CalculationContextDTO
    {
        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);

        $item = new CalculationItemDTO();
        $item->line_key = 1;
        $item->variant_id = 1;
        $item->product_id = 1;
        $item->quantity = 1;
        $item->base_unit_price = $base_unit_price;

        $context = new CalculationContextDTO();
        $context->items = collection([$item]);
        $context->shipping_subtotal = 0;

        return $context;
    }

    protected function make_amount_off_coupon(string $code, string $discount_target, string $discount_value_type, int $amount): Coupon
    {
        $coupon = new Coupon();
        $coupon->code = $code;
        $coupon->is_active = true;
        $coupon->discount_type = DiscountType::AMOUNT_OFF;
        $coupon->discount_target = $discount_target;
        $coupon->discount_value_type = $discount_value_type;
        $coupon->eligible_item_type = EligibleItemType::ALL_PRODUCTS;

        if ($discount_value_type === DiscountValueType::FIXED) {
            $coupon->base_discount_amount_fixed = $amount;
        } else {
            $coupon->discount_amount_percentage = $amount;
        }

        return $coupon;
    }
}
