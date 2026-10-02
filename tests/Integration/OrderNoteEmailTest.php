<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderNoteMail;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class OrderNoteEmailTest extends RestTestCase
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
     * The order the comments are added to.
     *
     * @var Order
     */
    protected $order;

    /**
     * Place an order and fake the queue before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $this->queue = Queue::fake();
        $this->order = $this->place_order($this->default_variant_id($this->create_product()));
        $this->queue->clear();
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
     * A comment the admin chose to notify the customer about queues the order-note email with its text.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_notified_comment_queues_order_note_email(): void
    {
        $payload = $this->add_comment('Your parcel left the warehouse.', true);

        $jobs = $this->queue->pushed(SendOrderMailJob::class);

        $this->assertCount(1, $jobs);
        $this->assertSame(CustomerOrderNoteMail::class, $jobs[0]->mailer_class);
        $this->assertSame($this->order->customer_email, $jobs[0]->email);
        $this->assertSame(['Your parcel left the warehouse.'], $jobs[0]->mailer_args);
        $this->assertTrue($payload['data']['notify_customer']);
        $this->assertSame(['notify_customer' => true], OrderActivity::find($payload['data']['id'])->metadata);
    }

    /**
     * A comment without the notify choice stays internal.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_internal_comment_queues_nothing(): void
    {
        $payload = $this->add_comment('Check stock before packing.', false);

        $this->assertSame([], $this->queue->pushed(SendOrderMailJob::class));
        $this->assertFalse($payload['data']['notify_customer']);
        $this->assertEmpty(OrderActivity::find($payload['data']['id'])->metadata);
    }

    /**
     * The order-note email, built from the queued job after a serialize round trip, renders the comment's text.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_note_mail_renders_the_note(): void
    {
        $this->add_comment('Your parcel left the warehouse.', true);

        /** @var SendOrderMailJob $job */
        $job = unserialize(serialize($this->queue->pushed(SendOrderMailJob::class)[0]));
        $html = CustomerOrderNoteMail::make($job->order, ...$job->mailer_args)->get_preview_html();

        $this->assertStringContainsString('Your parcel left the warehouse.', $html);
    }

    /**
     * Add a comment through the API and return the response payload.
     *
     * @param string $message         Comment text.
     * @param bool   $notify_customer Whether to notify the customer.
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function add_comment(string $message, bool $notify_customer): array
    {
        return $this->assert_api_success($this->request('POST', 'orders/' . $this->order->id . '/activities', [
            'order_id' => $this->order->id,
            'message' => $message,
            'notify_customer' => $notify_customer,
        ]), 201);
    }

    /**
     * Place a manual order through the API and return it.
     *
     * @param int $variant_id Variant to order.
     * @return Order
     * @since 1.0.0
     */
    protected function place_order(int $variant_id): Order
    {
        $payload = $this->assert_api_success($this->request('POST', 'orders', [
            'items' => [['variant_id' => $variant_id, 'quantity' => 1]],
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
        ]), 201);

        return Order::find($payload['data']['id']);
    }
}
