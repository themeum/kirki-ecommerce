<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Jobs\SendInventoryMailJob;
use Kirki\Ecommerce\App\Mails\Admins\AdminLowStockMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminOutOfStockMail;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;

class InventoryAlertEmailsTest extends RestTestCase
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
     * Create a product and fake the queue before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_settings();
        reset_phpmailer_instance();

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
     * Stock dropping to the threshold alerts low stock once.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_stock_dropping_to_threshold_alerts_low_stock(): void
    {
        $this->stock(6, 5);

        $this->inventory()->reserve_stock($this->variant_id, 1);

        $this->assertSame([AdminLowStockMail::class], $this->queued_mailers());
        $this->assertSame([$this->variant_id], $this->queue->pushed(SendInventoryMailJob::class)[0]->variant_ids);
        $this->assertNotEmpty($this->queue->pushed(SendInventoryMailJob::class)[0]->email);
    }

    /**
     * Stock that keeps dropping below the threshold does not alert again.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_stock_dropping_below_threshold_does_not_alert_again(): void
    {
        $this->stock(5, 5);

        $this->inventory()->reserve_stock($this->variant_id, 2);

        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * Stock running out alerts out of stock.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_stock_running_out_alerts_out_of_stock(): void
    {
        $this->stock(2, 5);

        $this->inventory()->decrement_stock($this->variant_id, 2);

        $this->assertSame([AdminOutOfStockMail::class], $this->queued_mailers());
        $this->assertSame([$this->variant_id], $this->queue->pushed(SendInventoryMailJob::class)[0]->variant_ids);
    }

    /**
     * One reduction crossing both levels sends only the out-of-stock alert.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_crossing_both_levels_alerts_only_out_of_stock(): void
    {
        $this->stock(10, 5);

        $this->inventory()->reserve_stock($this->variant_id, 10);

        $this->assertSame([AdminOutOfStockMail::class], $this->queued_mailers());
    }

    /**
     * Restocking above the threshold and dropping again alerts again.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_restocked_variant_alerts_again(): void
    {
        $this->stock(6, 5);
        $this->inventory()->reserve_stock($this->variant_id, 1);

        $this->inventory()->increment_stock($this->variant_id, 5);
        $this->inventory()->reserve_stock($this->variant_id, 5);

        $this->assertSame([AdminLowStockMail::class, AdminLowStockMail::class], $this->queued_mailers());
    }

    /**
     * The store default threshold applies when the variant sets none.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_store_default_threshold_applies(): void
    {
        $settings = Settings::get('product');
        $settings->set(['low_stock_threshold' => 3], false);
        $this->stock(4, null);

        $this->inventory()->reserve_stock($this->variant_id, 1);

        $this->assertSame([AdminLowStockMail::class], $this->queued_mailers());
    }

    /**
     * Without a threshold, only running out alerts.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_no_threshold_means_no_low_stock_alert(): void
    {
        $this->stock(3, 0);

        $this->inventory()->reserve_stock($this->variant_id, 2);

        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * A variant that does not track inventory never alerts.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_untracked_variant_does_not_alert(): void
    {
        $this->stock(2, 5, false);

        $this->inventory()->decrement_stock($this->variant_id, 2);

        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * The queued alert still renders after a serialize round trip.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_queued_alert_renders_after_round_trip(): void
    {
        $this->stock(2, 5);
        $this->inventory()->reserve_stock($this->variant_id, 2);

        /** @var SendInventoryMailJob $job */
        $job = unserialize(serialize($this->queue->pushed(SendInventoryMailJob::class)[0]));
        $job->handle();

        $this->assertStringContainsString('Test Product', $this->sent_body());
    }

    /**
     * One order crossing levels on several variants queues one alert per level listing them all.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_one_order_groups_alerts_per_level(): void
    {
        [$alpha, $bravo, $charlie] = $this->stocked_variants();

        $this->place_order([$alpha => 1, $bravo => 2, $charlie => 2]);

        $jobs = $this->queue->pushed(SendInventoryMailJob::class);
        $this->assertSame([AdminLowStockMail::class, AdminOutOfStockMail::class], $this->queued_mailers());
        $this->assertSame([$alpha, $bravo], $jobs[0]->variant_ids);
        $this->assertSame([$charlie], $jobs[1]->variant_ids);
    }

    /**
     * A grouped alert lists every variant once it is sent.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_grouped_alert_lists_every_variant(): void
    {
        [$alpha, $bravo] = $this->stocked_variants();
        $this->place_order([$alpha => 1, $bravo => 2]);

        /** @var SendInventoryMailJob $job */
        $job = unserialize(serialize($this->queue->pushed(SendInventoryMailJob::class)[0]));
        $job->handle();

        $body = $this->sent_body();
        $this->assertStringContainsString('Alpha', $body);
        $this->assertStringContainsString('Bravo', $body);
    }

    /**
     * An order that fails part-way queues no inventory alert for the items it had reserved.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_order_queues_no_alert(): void
    {
        [$alpha, , $charlie] = $this->stocked_variants();

        $response = $this->request('POST', 'orders', $this->order_payload([$alpha => 1, $charlie => 5]));

        $this->assertGreaterThanOrEqual(400, $response->get_status());
        $this->assertSame(6, (int) Variant::find($alpha)->available_quantity);
        $this->assertSame([], $this->queued_mailers());
    }

    /**
     * Create three tracked variants: Alpha and Bravo at 6 and Charlie at 2, all with threshold 5.
     *
     * @return int[] Variant ids of Alpha, Bravo and Charlie.
     * @since 1.0.0
     */
    protected function stocked_variants(): array
    {
        $variant_ids = [];

        foreach (['Alpha' => 6, 'Bravo' => 6, 'Charlie' => 2] as $title => $quantity) {
            $variant_ids[] = $variant_id = $this->default_variant_id($this->create_product(['title' => $title]));
            $this->stock($quantity, 5, true, $variant_id);
        }

        $this->queue->clear();

        return $variant_ids;
    }

    /**
     * Place a manual order through the API.
     *
     * @param array<int, int> $quantities Quantities keyed by variant id.
     * @return void
     * @since 1.0.0
     */
    protected function place_order(array $quantities): void
    {
        $this->assert_api_success($this->request('POST', 'orders', $this->order_payload($quantities)), 201);
    }

    /**
     * Build a manual order payload for the given quantities.
     *
     * @param array<int, int> $quantities Quantities keyed by variant id.
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function order_payload(array $quantities): array
    {
        $address = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'address_line1' => '123 Main St',
            'city' => 'New York',
            'state' => 'NY',
            'postal_code' => '10001',
            'country' => 'US',
        ];
        $payload = [
            'items' => [],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
            'customer_email' => 'buyer@example.com',
        ];

        foreach ($quantities as $variant_id => $quantity) {
            $payload['items'][] = ['variant_id' => $variant_id, 'quantity' => $quantity];
        }

        foreach ($address as $field => $value) {
            $payload['shipping_' . $field] = $value;
            $payload['billing_' . $field] = $value;
        }

        return $payload;
    }

    /**
     * Set the variant's stock, threshold and tracking.
     *
     * @param int      $available_quantity  Available quantity.
     * @param int|null $low_stock_threshold Variant threshold, or null for the store default.
     * @param bool     $track_inventory     Whether the variant tracks inventory.
     * @param int|null $variant_id          Variant to change, or null for the test's default variant.
     * @return void
     * @since 1.0.0
     */
    protected function stock(int $available_quantity, ?int $low_stock_threshold, bool $track_inventory = true, ?int $variant_id = null): void
    {
        Variant::find($variant_id ?? $this->variant_id)->update([
            'available_quantity' => $available_quantity,
            'low_stock_threshold' => $low_stock_threshold,
            'track_inventory' => $track_inventory,
            'allow_back_order' => false,
        ]);
    }

    /**
     * Get the decoded body of the email sent through the mocked mailer.
     *
     * @return string
     * @since 1.0.0
     */
    protected function sent_body(): string
    {
        return quoted_printable_decode(tests_retrieve_phpmailer_instance()->get_sent()->body);
    }

    /**
     * Resolve the inventory service.
     *
     * @return InventoryService
     * @since 1.0.0
     */
    protected function inventory(): InventoryService
    {
        return app(InventoryService::class);
    }

    /**
     * Get the mailer classes of every queued inventory mail job, in dispatch order.
     *
     * @return string[]
     * @since 1.0.0
     */
    protected function queued_mailers(): array
    {
        return array_map(fn(SendInventoryMailJob $job) => $job->mailer_class, $this->queue->pushed(SendInventoryMailJob::class));
    }
}
