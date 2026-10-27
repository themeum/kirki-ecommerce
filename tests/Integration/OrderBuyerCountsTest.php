<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class OrderBuyerCountsTest extends RestTestCase
{
    /**
     * Prior orders are matched by customer ID or by email, in either letter case.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_count_prior_orders_matches_customer_or_email_ignoring_case(): void
    {
        $customer = $this->create_customer('buyer@example.com');
        $this->create_order(['customer_id' => $customer->id, 'customer_email' => 'someone-else@example.com']);
        $this->create_order(['customer_email' => 'Guest@Example.com']);

        $service = $this->service();

        $this->assertSame(1, $service->count_prior_orders($customer->id, null));
        $this->assertSame(1, $service->count_prior_orders(null, 'guest@example.com'));
        $this->assertSame(2, $service->count_prior_orders($customer->id, 'guest@example.com'));
        $this->assertSame(0, $service->count_prior_orders(null, 'new@example.com'));
        $this->assertSame(0, $service->count_prior_orders(null, null));
    }

    /**
     * Failed-cancelled and refunded orders are not prior orders, and the excluded order is left out.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_count_prior_orders_skips_cancelled_refunded_and_excluded_orders(): void
    {
        $email = 'buyer@example.com';
        $this->create_order(['customer_email' => $email, 'order_status' => OrderStatus::FAILED_CANCELLED]);
        $this->create_order(['customer_email' => $email, 'order_status' => OrderStatus::REFUNDED]);
        $edited = $this->create_order(['customer_email' => $email]);

        $service = $this->service();

        $this->assertSame(1, $service->count_prior_orders(null, $email));
        $this->assertSame(0, $service->count_prior_orders(null, $email, $edited->id));
    }

    /**
     * Coupon usages are matched by customer ID or by the order's email, in either letter case.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_count_coupon_usages_matches_customer_or_order_email_ignoring_case(): void
    {
        $coupon = $this->create_coupon('LIMITED');
        $other_coupon = $this->create_coupon('OTHER');
        $customer = $this->create_customer('buyer@example.com');

        $customer_order = $this->create_order(['customer_id' => $customer->id, 'customer_email' => 'buyer@example.com']);
        $this->create_order_coupon($customer_order, $coupon, $customer->id);

        $guest_order = $this->create_order(['customer_email' => 'Guest@Example.com']);
        $this->create_order_coupon($guest_order, $coupon);
        $this->create_order_coupon($guest_order, $other_coupon);

        $service = $this->service();

        $this->assertSame(1, $service->count_coupon_usages($coupon->id, $customer->id, null));
        $this->assertSame(1, $service->count_coupon_usages($coupon->id, null, 'guest@example.com'));
        $this->assertSame(2, $service->count_coupon_usages($coupon->id, $customer->id, 'guest@example.com'));
        $this->assertSame(1, $service->count_coupon_usages($other_coupon->id, null, 'guest@example.com'));
        $this->assertSame(0, $service->count_coupon_usages($coupon->id, null, null));
    }

    /**
     * Reversed coupon usages and the excluded order are not counted.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_count_coupon_usages_skips_reversed_and_excluded_orders(): void
    {
        $coupon = $this->create_coupon('LIMITED');
        $email = 'buyer@example.com';

        $cancelled = $this->create_order(['customer_email' => $email]);
        $this->create_order_coupon($cancelled, $coupon, null, ['usage_reversed_at' => Date::now()]);

        $edited = $this->create_order(['customer_email' => $email]);
        $this->create_order_coupon($edited, $coupon);

        $service = $this->service();

        $this->assertSame(1, $service->count_coupon_usages($coupon->id, null, $email));
        $this->assertSame(0, $service->count_coupon_usages($coupon->id, null, $email, $edited->id));
    }

    /**
     * Get the order service.
     *
     * @return OrderService
     * @since 1.0.0
     */
    protected function service(): OrderService
    {
        return app()->make(OrderService::class);
    }

    /**
     * Create a customer record with the given email.
     *
     * @param string $email Customer email.
     *
     * @return Customer
     * @since 1.0.0
     */
    protected function create_customer(string $email): Customer
    {
        return Customer::create([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => $email,
        ]);
    }

    /**
     * Create an order with the given attributes.
     *
     * @param array $attributes Order attributes.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function create_order(array $attributes): Order
    {
        return Order::create(array_merge([
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
        ], $attributes));
    }

    /**
     * Create a coupon with the given code.
     *
     * @param string $code Coupon code.
     *
     * @return Coupon
     * @since 1.0.0
     */
    protected function create_coupon(string $code): Coupon
    {
        return Coupon::create([
            'title' => $code,
            'code' => $code,
            'discount_type' => DiscountType::AMOUNT_OFF,
        ]);
    }

    /**
     * Record a coupon use on an order.
     *
     * @param Order    $order       Order the coupon was used on.
     * @param Coupon   $coupon      Coupon used.
     * @param int|null $customer_id Customer snapshot, if the order had one.
     * @param array    $overrides   Extra attributes.
     *
     * @return OrderCoupon
     * @since 1.0.0
     */
    protected function create_order_coupon(Order $order, Coupon $coupon, $customer_id = null, array $overrides = []): OrderCoupon
    {
        return OrderCoupon::create(array_merge([
            'order_id' => $order->id,
            'coupon_id' => $coupon->id,
            'customer_id' => $customer_id,
            'code' => $coupon->code,
            'title' => $coupon->title,
            'discount_type' => $coupon->discount_type,
        ], $overrides));
    }
}
