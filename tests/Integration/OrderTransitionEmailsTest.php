<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Admins\AdminOrderCancelledMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminPaymentFailedMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewOrderMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderCancelMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderCompletedMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderOnHoldMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderProcessingMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderShippedMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerPaymentFailedMail;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class OrderTransitionEmailsTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /**
     * The queue fake recording dispatched jobs.
     *
     * @var QueueFake
     */
    protected $queue;

    /**
     * Variant id for the current test.
     *
     * @var int
     */
    protected $variant_id;

    /**
     * Seed an orderable product and fake the queue before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $this->variant_id = $this->default_variant_id($this->create_product());
        $this->queue = Queue::fake();
    }

    /**
     * Drop the faked queue manager so later tests resolve a real one.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        static::forget_singleton(QueueManager::class);

        parent::tearDown();
    }

    /**
     * Cancelling an order emails the customer and the admin.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cancelling_an_order_queues_customer_and_admin_emails(): void
    {
        $order = $this->place_order();

        $this->perform($order, OrderAction::CANCEL_ORDER);

        $this->assertSame([CustomerOrderCancelMail::class, AdminOrderCancelledMail::class], $this->queued_mailers());
        $this->assertSame($order->customer_email, $this->pushed_mail(CustomerOrderCancelMail::class)[0]->email);
        $this->assertNotEmpty($this->pushed_mail(AdminOrderCancelledMail::class)[0]->email);
    }

    /**
     * Putting an order on hold emails the customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_putting_an_order_on_hold_queues_customer_email(): void
    {
        $order = $this->failed_processing_order();

        $this->perform($order, OrderAction::MARK_AS_HOLD);

        $this->assertSame([CustomerOrderOnHoldMail::class], $this->queued_mailers());
    }

    /**
     * Marking an order as processing emails the customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_marking_an_order_as_processing_queues_customer_email(): void
    {
        $order = $this->place_order();

        $this->perform($order, OrderAction::MARK_AS_PROCESSING);

        $this->assertSame([CustomerOrderProcessingMail::class], $this->queued_mailers());
    }

    /**
     * Resuming fulfillment of an on-hold order sends no processing email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_resuming_fulfillment_sends_no_processing_email(): void
    {
        $order = $this->failed_processing_order();
        $this->perform($order, OrderAction::MARK_AS_HOLD);
        $this->queue->clear();

        $this->perform($order, OrderAction::RESUME_FULFILLMENT);

        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * Shipping an order emails the customer, and the queued job still renders after a serialize round trip.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shipping_an_order_queues_customer_email(): void
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        $this->queue->clear();

        $this->perform($order, OrderAction::MARK_AS_SHIPPED);

        $this->assertSame([CustomerOrderShippedMail::class], $this->queued_mailers());

        /** @var SendOrderMailJob $job */
        $job = unserialize(serialize($this->pushed_mail(CustomerOrderShippedMail::class)[0]));
        $this->assertStringContainsString($order->order_number, CustomerOrderShippedMail::make($job->order)->get_preview_html());
    }

    /**
     * Delivering a paid order completes it and emails the customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delivering_a_paid_order_queues_delivered_email(): void
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::MARK_AS_PAID, ['payment_provider' => 'paypal']);
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        $this->perform($order, OrderAction::MARK_AS_SHIPPED);
        $this->queue->clear();

        $this->perform($order, OrderAction::MARK_AS_DELIVERED);

        $this->assertSame(OrderStatus::COMPLETED, $order->fresh()->order_status);
        $this->assertSame([CustomerOrderCompletedMail::class], $this->queued_mailers());
    }

    /**
     * Delivering an unpaid order emails the customer straight away.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delivering_an_unpaid_order_queues_delivered_email(): void
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        $this->perform($order, OrderAction::MARK_AS_SHIPPED);
        $this->queue->clear();

        $this->perform($order, OrderAction::MARK_AS_DELIVERED);

        $this->assertSame(OrderStatus::DELIVERED_UNPAID, $order->fresh()->order_status);
        $this->assertSame([CustomerOrderCompletedMail::class], $this->queued_mailers());
    }

    /**
     * Delivering an order whose payment failed still emails the customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delivering_an_order_with_failed_payment_queues_delivered_email(): void
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        $this->perform($order, OrderAction::MARK_AS_SHIPPED);
        OrderManager::mark_payment_as_failed($order->id);
        $this->queue->clear();

        $this->perform($order, OrderAction::MARK_AS_DELIVERED);

        $this->assertSame(OrderStatus::FAILED_DELIVERED, $order->fresh()->order_status);
        $this->assertSame([CustomerOrderCompletedMail::class], $this->queued_mailers());
    }

    /**
     * Paying for an order that was already delivered sends no second delivered email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_paying_a_delivered_order_sends_no_email(): void
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        $this->perform($order, OrderAction::MARK_AS_SHIPPED);
        $this->perform($order, OrderAction::MARK_AS_DELIVERED);
        $this->queue->clear();

        $this->perform($order, OrderAction::MARK_AS_PAID, ['payment_provider' => 'paypal']);

        $this->assertSame(OrderStatus::COMPLETED, $order->fresh()->order_status);
        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * A repeated paid notification for a completed order sends no second completed email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_repeated_payment_on_completed_order_sends_no_email(): void
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        $this->perform($order, OrderAction::MARK_AS_SHIPPED);
        $this->perform($order, OrderAction::MARK_AS_DELIVERED);
        $this->perform($order, OrderAction::MARK_AS_PAID, ['payment_provider' => 'paypal']);
        $this->queue->clear();

        OrderManager::mark_payment_as_paid($order->id);

        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * A failed payment emails the customer and the admin once, even when reported twice.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_payment_queues_emails_once(): void
    {
        $order = $this->place_order();

        OrderManager::mark_payment_as_failed($order->id);
        OrderManager::mark_payment_as_failed($order->id);

        $this->assertSame([CustomerPaymentFailedMail::class, AdminPaymentFailedMail::class], $this->queued_mailers());
    }

    /**
     * An action the order's status does not allow is rejected without queuing email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rejected_transition_queues_nothing(): void
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::CANCEL_ORDER);
        $this->queue->clear();

        $response = $this->request('PATCH', 'orders/' . $order->id . '/action', ['action' => OrderAction::MARK_AS_SHIPPED]);

        $this->assertSame(422, $response->get_status());
        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * Resending the order email queues only the customer confirmation.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_resending_order_email_queues_customer_confirmation(): void
    {
        $order = $this->place_order();

        $this->perform($order, OrderAction::RESEND_ORDER_EMAIL);

        $this->assertSame([CustomerNewOrderMail::class], $this->queued_mailers());
        $this->assertSame($order->customer_email, $this->pushed_mail(CustomerNewOrderMail::class)[0]->email);
    }

    /**
     * Place an order through the API, then clear the new-order jobs it queued.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function place_order(): Order
    {
        $payload = $this->assert_api_success($this->request('POST', 'orders', $this->order_payload()), 201);

        $this->queue->clear();

        return Order::find($payload['data']['id']);
    }

    /**
     * Place an order in processing whose payment failed, the only status admins can put on hold from.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function failed_processing_order(): Order
    {
        $order = $this->place_order();
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        OrderManager::mark_payment_as_failed($order->id);
        $this->queue->clear();

        return $order;
    }

    /**
     * Perform an order action through the API and assert it succeeded.
     *
     * @param Order                $order  The order.
     * @param string               $action The order action.
     * @param array<string, mixed> $params Extra action parameters.
     * @return void
     * @since 1.0.0
     */
    protected function perform(Order $order, string $action, array $params = []): void
    {
        $this->assert_api_success($this->request('PATCH', 'orders/' . $order->id . '/action', array_merge(['action' => $action], $params)));
    }

    /**
     * Get the mailer classes of every queued mail job, in dispatch order.
     *
     * @return string[]
     * @since 1.0.0
     */
    protected function queued_mailers(): array
    {
        return array_map(fn(SendOrderMailJob $job) => $job->mailer_class, $this->queue->pushed(SendOrderMailJob::class));
    }

    /**
     * Get the queued mail jobs for one mailer class.
     *
     * @param string $mailer_class The Mailer subclass.
     * @return SendOrderMailJob[]
     * @since 1.0.0
     */
    protected function pushed_mail(string $mailer_class): array
    {
        return $this->queue->pushed(SendOrderMailJob::class, fn(SendOrderMailJob $job) => $job->mailer_class === $mailer_class);
    }

    /**
     * Build a manual order payload.
     *
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function order_payload(): array
    {
        return [
            'items' => [
                [
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
            'customer_email' => 'buyer@example.com',
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postal_code' => '10001',
            'shipping_country' => 'US',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'New York',
            'billing_state' => 'NY',
            'billing_postal_code' => '10001',
            'billing_country' => 'US',
        ];
    }
}
