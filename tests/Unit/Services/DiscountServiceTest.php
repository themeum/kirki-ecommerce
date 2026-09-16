<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class DiscountServiceTest extends TestCase
{
    protected DiscountService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DiscountService();
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
}
