<?php

namespace Kirki\Ecommerce\Tests\Unit\Models;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;

class OrderEditableTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->use_store_base_currency('USD');
    }

    /**
     * Make the store's base currency the given code, as it is when the request starts.
     *
     * @param string $code Currency code.
     * @return void
     */
    protected function use_store_base_currency(string $code): void
    {
        $this->bind_money_dependencies($code);
        app()->alias('money', MoneyManager::class);
        $this->reset_facade_cache();
    }

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
            'base_currency_code' => 'USD',
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

    public function test_order_placed_in_a_previous_base_currency_is_not_editable(): void
    {
        $this->use_store_base_currency('EUR');

        $this->assertFalse($this->make_order(['base_currency_code' => 'USD'])->is_editable());
    }

    public function test_order_is_editable_again_when_the_store_returns_to_its_base_currency(): void
    {
        $order = $this->make_order(['base_currency_code' => 'USD']);

        $this->use_store_base_currency('EUR');
        $this->assertFalse($order->is_editable());

        $this->use_store_base_currency('USD');
        $this->assertTrue($order->is_editable());
    }
}
