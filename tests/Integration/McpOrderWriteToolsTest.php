<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Actions\Order\PerformOrderAction;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\DTO\Order\PerformOrderActionDTO;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewOrderMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderNoteMail;
use Kirki\Ecommerce\App\Mcp\Tools\AddOrderNoteTool;
use Kirki\Ecommerce\App\Mcp\Tools\CancelOrderTool;
use Kirki\Ecommerce\App\Mcp\Tools\CreateManualOrderTool;
use Kirki\Ecommerce\App\Mcp\Tools\MarkOrderPaidTool;
use Kirki\Ecommerce\App\Mcp\Tools\ResendOrderEmailTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateFulfillmentTool;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity as OrderActivityModel;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\RunsWriteTools;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 3.8: the order write tools.
 *
 * Spec: mcp-order-write-tools, and mcp-write-tool-conventions for the annotations and the AI-assistant mark.
 */
class McpOrderWriteToolsTest extends RestTestCase
{
    use CreatesTestProducts;
    use RunsWriteTools;
    use SeedsAnalyticsData;
    use SeedsTestShipping;

    /** @var QueueFake */
    protected $queue;

    /**
     * Start every test from an empty store, an administrator and a fake queue.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        $this->login_as_admin();
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
     * Get the error that a store rule or a validation rule throws.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return ValidationException
     * @since 1.0.0
     */
    protected function rejection(string $tool, array $arguments): ValidationException
    {
        try {
            $this->run_tool($tool, $arguments);
        } catch (ValidationException $exception) {
            return $exception;
        }

        $this->fail('The tool did not reject the call.');
    }

    /**
     * Create an order in one status of the state matrix.
     *
     * @param string $order_status       Order status.
     * @param string $fulfillment_status Fulfillment status.
     * @param string $payment_status     Payment status.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function make_order_in(string $order_status, string $fulfillment_status, string $payment_status): Order
    {
        return $this->make_order([
            'order_number' => 'KE-' . wp_rand(10000, 99999),
            'order_status' => $order_status,
            'fulfillment_status' => $fulfillment_status,
            'payment_status' => $payment_status,
            'customer_email' => 'jane@example.com',
            'customer_first_name' => 'Jane',
            'invoiced_total' => 5000,
            'base_total' => 5000,
        ]);
    }

    /**
     * Get the newest activity of an order.
     *
     * @param Order $order The order.
     *
     * @return OrderActivityModel
     * @since 1.0.0
     */
    protected function last_activity(Order $order): OrderActivityModel
    {
        return OrderActivityModel::query()->where('order_id', $order->id)->order_by('id', 'desc')->first();
    }

    /**
     * Get the queued mail jobs for one mailer class.
     *
     * @param string $mailer_class The Mailer subclass.
     *
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
     * Annotations and _meta of the 6 order tools.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_annotations(): void
    {
        foreach ([AddOrderNoteTool::class, UpdateFulfillmentTool::class, ResendOrderEmailTool::class, CancelOrderTool::class, CreateManualOrderTool::class] as $class) {
            $tool = app()->make($class);
            $this->assertFalse($tool->read_only(), $class);
            $this->assertTrue($tool->destructive(), $class);
            $this->assertTrue($tool->open_world(), $class);
            $this->assertFalse($tool->idempotent(), $class);
        }

        $this->assertFalse(app()->make(MarkOrderPaidTool::class)->open_world());
        $this->assertTrue(app()->make(MarkOrderPaidTool::class)->destructive());

        $this->assertSame(['anthropic/requiresUserInteraction' => true], app()->make(CancelOrderTool::class)->meta());
        $this->assertSame(['anthropic/requiresUserInteraction' => true], app()->make(CreateManualOrderTool::class)->meta());
        $this->assertSame([], app()->make(AddOrderNoteTool::class)->meta());
    }

    /**
     * Scenarios "Order number" and "Unknown order".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_lookup(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);

        $preview = $this->preview(ResendOrderEmailTool::class, ['order_number' => $order->order_number]);
        $this->assertSame((int) $order->id, $preview['changes']['order_id']);
        $this->assertSame('j***@example.com', $preview['changes']['emails'][0]['to']);

        $missing = $this->run_tool(ResendOrderEmailTool::class, ['order_id' => 999999]);
        $this->assertTrue($missing->is_error());
        $this->assertStringContainsString('find-orders', $missing->content());

        $this->assertArrayHasKey('order_id', $this->rejection(ResendOrderEmailTool::class, [])->get_errors());
    }

    /**
     * Scenario "Private note": the comment is marked and no email is queued.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_private_note(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);

        $done = $this->confirm(AddOrderNoteTool::class, ['order_id' => $order->id, 'message' => 'Customer called, ships Monday']);

        $activity = $this->last_activity($order);
        $this->assertSame($done['activity_id'], (int) $activity->id);
        $this->assertSame(OrderActivityType::COMMENT_ADDED, $activity->activity_type);
        $this->assertSame('Customer called, ships Monday', $activity->description);
        $this->assertTrue(OrderActivity::is_from_assistant($activity));
        $this->assertCount(0, $this->pushed_mail(CustomerOrderNoteMail::class));
    }

    /**
     * Scenario "Note to the customer": the preview names the masked email, and the change queues the email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_note_to_the_customer(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);
        $arguments = ['order_id' => $order->id, 'message' => 'Your parcel is late', 'notify_customer' => true];

        $preview = $this->preview(AddOrderNoteTool::class, $arguments);
        $this->assertSame('customer', $preview['changes']['emails'][0]['recipient']);
        $this->assertSame('j***@example.com', $preview['changes']['emails'][0]['to']);
        $this->assertCount(0, $this->pushed_mail(CustomerOrderNoteMail::class));

        $this->confirm(AddOrderNoteTool::class, $arguments);
        $this->assertCount(1, $this->pushed_mail(CustomerOrderNoteMail::class));
    }

    /**
     * Scenario "Ship an order": the preview shows the status change and the email, and the change is marked.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_ship_an_order(): void
    {
        $order = $this->make_order_in('paid_processing', FulfillmentStatus::PROCESSING, PaymentStatus::PAID);
        $arguments = ['order_id' => $order->id, 'action' => OrderAction::MARK_AS_SHIPPED];

        $preview = $this->preview(UpdateFulfillmentTool::class, $arguments);
        $this->assertSame(['current' => 'paid_processing', 'new' => 'paid_shipped'], $preview['changes']['order_status']);
        $this->assertSame('order_shipped', $preview['changes']['emails'][0]['template']);
        $this->assertSame('paid_processing', $order->fresh()->order_status);

        $done = $this->confirm(UpdateFulfillmentTool::class, $arguments);

        $this->assertSame('paid_shipped', $done['order']['order_status']);
        $this->assertSame(OrderActivityType::SHIPPED, $this->last_activity($order)->activity_type);
        $this->assertTrue(OrderActivity::is_from_assistant($this->last_activity($order)));
    }

    /**
     * Tracking data is stored and shown.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_add_tracking(): void
    {
        $order = $this->make_order_in('paid_shipped', FulfillmentStatus::SHIPPED, PaymentStatus::PAID);

        $done = $this->confirm(UpdateFulfillmentTool::class, [
            'order_id' => $order->id,
            'action' => OrderAction::ADD_TRACKING,
            'carrier' => 'DHL',
            'tracking_number' => 'JD0001',
            'tracking_url' => 'https://example.com/track/JD0001',
        ]);

        $this->assertSame('DHL', $done['order']['shipping_carrier']);
        $this->assertSame('JD0001', $done['order']['shipping_tracking_number']);
    }

    /**
     * Scenario "Tracking without a number".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tracking_without_a_number(): void
    {
        $order = $this->make_order_in('paid_shipped', FulfillmentStatus::SHIPPED, PaymentStatus::PAID);

        $errors = $this->rejection(UpdateFulfillmentTool::class, ['order_id' => $order->id, 'action' => OrderAction::ADD_TRACKING, 'carrier' => 'DHL'])->get_errors();

        $this->assertSame(['tracking_number'], array_keys($errors));
    }

    /**
     * Scenario "Action not allowed for the order status": no token is given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_action_not_allowed(): void
    {
        $order = $this->make_order_in('paid_processing', FulfillmentStatus::PROCESSING, PaymentStatus::PAID);

        $exception = $this->rejection(UpdateFulfillmentTool::class, ['order_id' => $order->id, 'action' => OrderAction::MARK_AS_DELIVERED]);

        $this->assertStringContainsString('not available for the order', $exception->getMessage());
        $this->assertSame('paid_processing', $order->fresh()->order_status);
    }

    /**
     * Scenario "Record changed after the preview".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_changed_after_the_preview(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);
        $arguments = ['order_id' => $order->id, 'action' => OrderAction::MARK_AS_PROCESSING];
        $preview = $this->preview(UpdateFulfillmentTool::class, $arguments);

        app()->make(PerformOrderAction::class)->execute(PerformOrderActionDTO::from_array([
            'order_id' => (int) $order->id,
            'action' => OrderAction::CANCEL_ORDER,
            'reason' => 'Admin cancelled',
        ]));

        $response = $this->run_tool(UpdateFulfillmentTool::class, $arguments + ['confirmation_token' => $preview['confirmation_token']]);

        $this->assertTrue($response->is_error());
        $this->assertStringContainsString('new preview', $response->content());
        $this->assertSame('unpaid_cancelled', $order->fresh()->order_status);
    }

    /**
     * Scenario "Bank transfer arrived".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_order_paid(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);

        $done = $this->confirm(MarkOrderPaidTool::class, ['order_id' => $order->id]);

        $this->assertSame('paid_unfulfilled', $done['order']['order_status']);
        $this->assertSame(OrderActivityType::PAYMENT_COMPLETED, $this->last_activity($order)->activity_type);
        $this->assertTrue(OrderActivity::is_from_assistant($this->last_activity($order)));
    }

    /**
     * Scenario "Unknown provider".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_payment_provider(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);

        $errors = $this->rejection(MarkOrderPaidTool::class, ['order_id' => $order->id, 'payment_provider' => 'not-a-provider'])->get_errors();

        $this->assertArrayHasKey('payment_provider', $errors);
        $this->assertSame('pending', $order->fresh()->order_status);
    }

    /**
     * Scenario "Resend": the new-order email is queued again.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_resend_order_email(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);

        $this->confirm(ResendOrderEmailTool::class, ['order_id' => $order->id]);

        $this->assertCount(1, $this->pushed_mail(CustomerNewOrderMail::class));
    }

    /**
     * Scenario "Cancel": the reason is stored and the change is marked.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cancel_order(): void
    {
        $order = $this->make_order_in('pending', FulfillmentStatus::UNFULFILLED, PaymentStatus::UNPAID);
        $arguments = ['order_id' => $order->id, 'reason' => 'Customer asked'];

        $preview = $this->preview(CancelOrderTool::class, $arguments);
        $this->assertSame(['current' => 'pending', 'new' => 'unpaid_cancelled'], $preview['changes']['order_status']);
        $this->assertCount(2, $preview['changes']['emails']);

        $done = $this->confirm(CancelOrderTool::class, $arguments);

        $this->assertSame('unpaid_cancelled', $done['order']['order_status']);
        $this->assertSame('Customer asked', $done['order']['cancellation_reason_text']);
        $this->assertTrue(OrderActivity::is_from_assistant($this->last_activity($order)));
    }

    /**
     * Scenario "Already shipped": the status does not allow a cancel, and the reason is required.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cancel_not_allowed(): void
    {
        $order = $this->make_order_in('paid_shipped', FulfillmentStatus::SHIPPED, PaymentStatus::PAID);

        $this->assertStringContainsString('not available', $this->rejection(CancelOrderTool::class, ['order_id' => $order->id, 'reason' => 'Too late'])->getMessage());
        $this->assertArrayHasKey('reason', $this->rejection(CancelOrderTool::class, ['order_id' => $order->id])->get_errors());
    }

    /**
     * Seed a product and a US shipping method, and get the manual order arguments.
     *
     * @param int $quantity Units to order.
     *
     * @return array
     * @since 1.0.0
     */
    protected function manual_order_arguments(int $quantity = 2): array
    {
        $this->seed_base_currency();
        $this->seed_shipping_settings();
        $variant_id = $this->default_variant_id($this->create_product(['title' => 'Linen shirt']));
        Variant::query()->where('id', $variant_id)->update(['track_inventory' => 1, 'allow_back_order' => 0]);

        return [
            'items' => [['variant_id' => $variant_id, 'quantity' => $quantity]],
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
            'customer_email' => 'buyer@example.com',
            'shipping_method' => 'method-0001',
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postal_code' => '10001',
            'shipping_country' => 'US',
        ];
    }

    /**
     * Scenario "Phone order": the preview has the totals and creates nothing, the change creates a marked order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order(): void
    {
        $arguments = $this->manual_order_arguments();

        $preview = $this->preview(CreateManualOrderTool::class, $arguments);
        $changes = $preview['changes'];

        $this->assertSame(0, Order::query()->count());
        $this->assertSame('Linen shirt', $changes['items'][0]['product_title']);
        $this->assertSame(59.98, $changes['subtotal']['amount']);
        $this->assertSame(10.0, (float) $changes['shipping_total']['amount']);
        $this->assertSame(69.98, $changes['total']['amount']);
        $this->assertSame('b***@example.com', $changes['customer']['email']);

        $done = $this->confirm(CreateManualOrderTool::class, $arguments);

        $order = Order::find($done['order']['order_id']);
        $this->assertNotNull($order);
        $this->assertSame(69.98, $done['order']['total']['amount']);
        $this->assertSame(OrderActivityType::ORDER_PLACED, $this->last_activity($order)->activity_type);
        $this->assertTrue(OrderActivity::is_from_assistant($this->last_activity($order)));
    }

    /**
     * Scenario "Not enough stock".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_without_stock(): void
    {
        $response = $this->run_tool(CreateManualOrderTool::class, $this->manual_order_arguments(500));

        $this->assertTrue($response->is_error());
        $this->assertStringContainsString('Not enough stock', $response->content());
    }

    /**
     * Scenario "Price changed after the preview".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_price_changed(): void
    {
        $arguments = $this->manual_order_arguments();
        $preview = $this->preview(CreateManualOrderTool::class, $arguments);

        Variant::query()->where('id', $arguments['items'][0]['variant_id'])->update(['base_price' => 3999]);

        $response = $this->run_tool(CreateManualOrderTool::class, $arguments + ['confirmation_token' => $preview['confirmation_token']]);

        $this->assertTrue($response->is_error());
        $this->assertStringContainsString('new preview', $response->content());
        $this->assertSame(0, Order::query()->count());
    }
}
