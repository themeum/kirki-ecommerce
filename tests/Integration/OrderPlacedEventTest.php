<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Admins\AdminNewOrderMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewOrderMail;
use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;
use RuntimeException;

class OrderPlacedEventTest extends RestTestCase
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

        FakeOrderMail::$enabled = true;
        FakeOrderMail::$sent = true;
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
     * Placing an order queues one new-order email to the customer and one to the admin.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_placing_an_order_queues_customer_and_admin_emails(): void
    {
        $order = $this->place_order();

        $customer_jobs = $this->pushed_mail(CustomerNewOrderMail::class);
        $admin_jobs = $this->pushed_mail(AdminNewOrderMail::class);

        $this->assertCount(1, $customer_jobs);
        $this->assertCount(1, $admin_jobs);
        $this->assertSame($order->customer_email, $customer_jobs[0]->email);
        $this->assertNotEmpty($admin_jobs[0]->email);
        $this->assertSame(SendOrderMailJob::QUEUE, $customer_jobs[0]->get_queue());
        $this->assertSame($order->id, $customer_jobs[0]->order->id);
    }

    /**
     * The order-placed hook receives the order id and the order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_placing_an_order_fires_the_order_placed_hook(): void
    {
        $received = [];

        add_action(DevHookNames::ORDER_PLACED, function ($order_id, $order) use (&$received) {
            $received = [$order_id, $order];
        }, 10, 2);

        $order = $this->place_order();

        $this->assertSame($order->id, $received[0]);
        $this->assertInstanceOf(Order::class, $received[1]);
    }

    /**
     * A failing order-placed hook cannot roll back the committed order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failing_order_placed_hook_keeps_the_order(): void
    {
        $orders_before = Order::query()->count();

        add_action(DevHookNames::ORDER_PLACED, function () {
            throw new RuntimeException('Third-party hook failed.');
        });

        $this->request('POST', 'orders', $this->order_payload());

        $this->assertSame($orders_before + 1, Order::query()->count());
    }

    /**
     * A mail disabled in the email settings is not sent.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mail_job_skips_disabled_mail(): void
    {
        FakeOrderMail::$enabled = false;
        FakeOrderMail::$sent = false;

        (new SendOrderMailJob($this->place_order(), FakeOrderMail::class, 'buyer@example.com'))->handle();

        $this->addToAssertionCount(1);
    }

    /**
     * A failed send throws so the queue retries the job.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mail_job_throws_when_sending_fails(): void
    {
        FakeOrderMail::$sent = false;

        $this->expectException(RuntimeException::class);

        (new SendOrderMailJob($this->place_order(), FakeOrderMail::class, 'buyer@example.com'))->handle();
    }

    /**
     * Place an order through the API and return it.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function place_order(): Order
    {
        $payload = $this->assert_api_success($this->request('POST', 'orders', $this->order_payload()), 201);

        return Order::find($payload['data']['id']);
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
        return $this->queue->pushed(SendOrderMailJob::class, function (SendOrderMailJob $job) use ($mailer_class) {
            return $job->mailer_class === $mailer_class;
        });
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

/**
 * Mailer double whose enabled state and send result the test controls.
 */
class FakeOrderMail extends Mailer
{
    /** @var bool */
    public static $enabled = true;

    /** @var bool */
    public static $sent = true;

    /**
     * Accept the order like a real order mail does.
     *
     * @param Order $order The order.
     */
    public function __construct(Order $order) {}

    /**
     * @inheritDoc
     */
    public function option_key()
    {
        return 'test';
    }

    /**
     * @inheritDoc
     */
    public function with()
    {
        return [];
    }

    /**
     * @inheritDoc
     */
    public function is_enabled()
    {
        return static::$enabled;
    }

    /**
     * Fail the test if a disabled mail is sent, else report the configured result.
     *
     * @param string $to Recipient.
     * @return bool
     */
    public function send(string $to)
    {
        if (!static::$enabled) {
            throw new \LogicException('A disabled mail was sent.');
        }

        return static::$sent;
    }
}
