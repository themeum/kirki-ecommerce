<?php

namespace Kirki\Ecommerce\Tests\Unit\Models;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class OrderEditableTest extends TestCase
{
    /**
     * @param array<string, mixed> $attributes Overrides for an unpaid, open, unfulfilled order.
     * @return Order
     */
    protected function make_order(array $attributes = []): Order
    {
        return new Order(array_merge([
            'payment_status' => PaymentStatus::UNPAID,
            'fulfillment_status' => FulfillmentStatus::UNFULFILLED,
            'cancelled_at' => null,
        ], $attributes));
    }

    public function test_unpaid_unfulfilled_order_is_editable(): void
    {
        $this->assertTrue($this->make_order()->is_editable());
    }

    public function test_pending_and_failed_payments_are_editable(): void
    {
        $this->assertTrue($this->make_order(['payment_status' => PaymentStatus::PENDING])->is_editable());
        $this->assertTrue($this->make_order(['payment_status' => PaymentStatus::FAILED])->is_editable());
    }

    public function test_processing_and_on_hold_fulfillment_are_editable(): void
    {
        $this->assertTrue($this->make_order(['fulfillment_status' => FulfillmentStatus::PROCESSING])->is_editable());
        $this->assertTrue($this->make_order(['fulfillment_status' => FulfillmentStatus::ON_HOLD])->is_editable());
    }

    public function test_paid_order_is_not_editable(): void
    {
        $this->assertFalse($this->make_order(['payment_status' => PaymentStatus::PAID])->is_editable());
    }

    public function test_refunding_and_refunded_orders_are_not_editable(): void
    {
        $this->assertFalse($this->make_order(['payment_status' => PaymentStatus::REFUNDING])->is_editable());
        $this->assertFalse($this->make_order(['payment_status' => PaymentStatus::REFUNDED])->is_editable());
    }

    public function test_cancelled_order_is_not_editable(): void
    {
        $this->assertFalse($this->make_order(['cancelled_at' => '2026-10-01 10:00:00'])->is_editable());
    }

    /**
     * @return array<string, array{0: string}>
     */
    public function shipped_fulfillment_statuses(): array
    {
        return [
            'shipped' => [FulfillmentStatus::SHIPPED],
            'delivered' => [FulfillmentStatus::DELIVERED],
            'returned' => [FulfillmentStatus::RETURNED],
            'cancelled' => [FulfillmentStatus::CANCELLED],
            'returned refund pending' => ['returned-refund-pending'],
        ];
    }

    /**
     * @dataProvider shipped_fulfillment_statuses
     */
    public function test_unpaid_order_past_fulfillment_is_not_editable(string $fulfillment_status): void
    {
        $this->assertFalse($this->make_order(['fulfillment_status' => $fulfillment_status])->is_editable());
    }
}
