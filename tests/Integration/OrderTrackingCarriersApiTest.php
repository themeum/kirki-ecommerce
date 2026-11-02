<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Email\CustomerOrderNotification;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderShippedMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderTrackingAddedMail;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\EmailPreviewService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;

class OrderTrackingCarriersApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    const UPS_TEMPLATE = 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}';

    /**
     * @var int
     */
    protected $variant_id;

    /**
     * @var \Kirki\Ecommerce\Framework\Queue\QueueFake
     */
    protected $queue;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_settings();
        $this->variant_id = $this->default_variant_id($this->create_product());
        $this->queue = Queue::fake();
    }

    protected function tearDown(): void
    {
        static::forget_singleton(QueueManager::class);

        parent::tearDown();
    }

    /**
     * Save shipping zones through the settings API and refresh the shipping service.
     *
     * @param array<int, array<string, mixed>> $zones Zones to store.
     * @return void
     */
    protected function save_zones(array $zones): void
    {
        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => ['shipping_zones' => $zones],
        ]));
        static::forget_singleton(ShippingService::class);
    }

    /**
     * Build a zone.
     *
     * @param string                           $id       Zone id.
     * @param array<int, array<string, mixed>> $regions  Zone regions.
     * @param array<int, array<string, mixed>> $carriers Zone carriers.
     * @param bool                             $enabled  Whether the zone is enabled.
     * @return array<string, mixed>
     */
    protected function zone(string $id, array $regions, array $carriers, bool $enabled = true): array
    {
        return [
            'id' => $id,
            'is_enabled' => $enabled,
            'title' => 'Zone ' . $id,
            'regions' => $regions,
            'shipping_methods' => [[
                'id' => 'method-0001',
                'is_enabled' => true,
                'name' => 'Standard',
                'type' => 'flat_rate',
                'base_amount' => 10,
                'is_taxable' => false,
                'description' => null,
                'shipping_rules' => [],
            ]],
            'shipping_carriers' => $carriers,
        ];
    }

    /**
     * Build a carrier.
     *
     * @param string               $id        Carrier id.
     * @param string               $name      Carrier name.
     * @param bool                 $enabled   Whether the carrier is enabled.
     * @param array<string, mixed> $overrides Fields to override.
     * @return array<string, mixed>
     */
    protected function carrier(string $id, string $name, bool $enabled = true, array $overrides = []): array
    {
        return array_merge([
            'id' => $id,
            'preset' => null,
            'name' => $name,
            'tracking_url' => static::UPS_TEMPLATE,
            'logo' => null,
            'is_enabled' => $enabled,
        ], $overrides);
    }

    /**
     * Place a manual order shipping to New York, US and ship it, the state that allows adding tracking.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return Order
     */
    protected function place_order(array $overrides = []): Order
    {
        $response = $this->request('POST', 'orders', array_merge([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 1]],
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
        ], $overrides));
        $payload = $this->assert_api_success($response, 201);

        $order = Order::find($payload['data']['id']);
        $this->perform($order, OrderAction::MARK_AS_PROCESSING);
        $this->perform($order, OrderAction::MARK_AS_SHIPPED);
        $this->queue->clear();

        return $order;
    }

    protected function perform(Order $order, string $action, array $params = []): void
    {
        $this->assert_api_success($this->request('PATCH', 'orders/' . $order->id . '/action', array_merge(['action' => $action], $params)));
    }

    protected function add_tracking(Order $order, array $params): \WP_REST_Response
    {
        return $this->request('PATCH', 'orders/' . $order->id . '/action', array_merge(['action' => OrderAction::ADD_TRACKING], $params));
    }

    protected function carriers_of(Order $order): array
    {
        return $this->assert_api_success($this->request('GET', 'orders/' . $order->id . '/shipping-carriers'))['data'];
    }

    public function test_the_endpoint_lists_only_enabled_carriers_of_the_matched_zone(): void
    {
        $this->save_zones([
            $this->zone('us', [['country' => 'US', 'states' => []]], [
                $this->carrier('ups', 'UPS'),
                $this->carrier('dhl', 'DHL', false),
            ]),
            $this->zone('gb', [['country' => 'GB', 'states' => []]], [$this->carrier('royal', 'Royal Mail')]),
        ]);

        $carriers = $this->carriers_of($this->place_order());

        $this->assertSame(['ups'], array_column($carriers, 'id'));
        $this->assertSame('UPS', $carriers[0]['name']);
        $this->assertSame(static::UPS_TEMPLATE, $carriers[0]['tracking_url']);
        $this->assertArrayHasKey('logo_url', $carriers[0]);
    }

    public function test_the_endpoint_matches_a_zone_by_state(): void
    {
        $this->save_zones([
            $this->zone('west', [['country' => 'US', 'states' => ['CA']]], [$this->carrier('west-courier', 'West Courier')]),
            $this->zone('east', [['country' => 'US', 'states' => ['NY']]], [$this->carrier('east-courier', 'East Courier')]),
        ]);

        $this->assertSame(['east-courier'], array_column($this->carriers_of($this->place_order()), 'id'));
    }

    public function test_the_endpoint_is_empty_when_no_zone_matches(): void
    {
        $order = $this->place_order();

        $this->save_zones([
            $this->zone('gb', [['country' => 'GB', 'states' => []]], [$this->carrier('royal', 'Royal Mail')]),
        ]);

        $this->assertSame([], $this->carriers_of($order));
    }

    public function test_the_endpoint_is_empty_when_the_zone_has_no_enabled_carrier(): void
    {
        $this->save_zones([
            $this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS', false)]),
        ]);

        $this->assertSame([], $this->carriers_of($this->place_order()));
    }

    public function test_the_endpoint_for_a_missing_order_is_not_found(): void
    {
        $this->assert_api_error($this->request('GET', 'orders/999999/shipping-carriers'), 404);
    }

    public function test_a_listed_carrier_is_resolved_and_stored_on_the_order(): void
    {
        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS')])]);
        $order = $this->place_order();

        $this->assert_api_success($this->add_tracking($order, ['carrier_id' => 'ups', 'tracking_number' => '1Z 999&A']));

        $fresh = $order->fresh();

        $this->assertSame('UPS', $fresh->shipping_carrier);
        $this->assertSame('1Z 999&A', $fresh->shipping_tracking_number);
        $this->assertSame('https://www.ups.com/track?loc=en_US&tracknum=1Z%20999%26A', $fresh->shipping_tracking_url);
    }

    public function test_the_server_ignores_a_client_sent_url_for_a_listed_carrier(): void
    {
        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS')])]);
        $order = $this->place_order();

        $this->assert_api_success($this->add_tracking($order, [
            'carrier_id' => 'ups',
            'tracking_number' => '123',
            'tracking_url' => 'https://evil.example.com/',
        ]));

        $this->assertSame('https://www.ups.com/track?loc=en_US&tracknum=123', $order->fresh()->shipping_tracking_url);
    }

    public function test_an_unknown_carrier_id_is_rejected_and_the_order_is_unchanged(): void
    {
        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS')])]);
        $order = $this->place_order();

        $errors = $this->assert_validation_error($this->add_tracking($order, ['carrier_id' => 'nope', 'tracking_number' => '123']))['errors'];

        $this->assertArrayHasKey('carrier_id', $errors);
        $this->assertNull($order->fresh()->shipping_tracking_number);
    }

    public function test_a_disabled_carrier_id_is_rejected(): void
    {
        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS', false)])]);
        $order = $this->place_order();

        $this->assert_validation_error($this->add_tracking($order, ['carrier_id' => 'ups', 'tracking_number' => '123']));
        $this->assertNull($order->fresh()->shipping_tracking_number);
    }

    public function test_a_carrier_id_of_another_zone_is_rejected(): void
    {
        $this->save_zones([
            $this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS')]),
            $this->zone('gb', [['country' => 'GB', 'states' => []]], [$this->carrier('royal', 'Royal Mail')]),
        ]);
        $order = $this->place_order();

        $this->assert_validation_error($this->add_tracking($order, ['carrier_id' => 'royal', 'tracking_number' => '123']));
    }

    public function test_other_resolves_an_ad_hoc_template(): void
    {
        $order = $this->place_order();

        $this->assert_api_success($this->add_tracking($order, [
            'carrier' => 'Local Courier',
            'tracking_number' => 'AB 12',
            'tracking_url' => 'https://track.example.com/?n={tracking_number}',
        ]));

        $fresh = $order->fresh();

        $this->assertSame('Local Courier', $fresh->shipping_carrier);
        $this->assertSame('https://track.example.com/?n=AB%2012', $fresh->shipping_tracking_url);
    }

    public function test_other_with_an_unsafe_scheme_is_rejected(): void
    {
        $order = $this->place_order();

        $errors = $this->assert_validation_error($this->add_tracking($order, [
            'carrier' => 'Local Courier',
            'tracking_number' => '123',
            'tracking_url' => 'javascript:alert({tracking_number})',
        ]))['errors'];

        $this->assertArrayHasKey('tracking_url', $errors);
        $this->assertNull($order->fresh()->shipping_tracking_number);
    }

    public function test_other_without_a_carrier_name_is_rejected(): void
    {
        $order = $this->place_order();

        $errors = $this->assert_validation_error($this->add_tracking($order, ['tracking_number' => '123']))['errors'];

        $this->assertArrayHasKey('carrier', $errors);
    }

    public function test_a_legacy_request_with_a_plain_url_is_stored_as_sent(): void
    {
        $order = $this->place_order();

        $this->assert_api_success($this->add_tracking($order, [
            'carrier' => 'DHL',
            'tracking_number' => '123',
            'tracking_url' => 'https://www.dhl.com/track?id=123',
        ]));

        $this->assertSame('https://www.dhl.com/track?id=123', $order->fresh()->shipping_tracking_url);
    }

    public function test_editing_a_carrier_later_does_not_change_the_stored_order(): void
    {
        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS')])]);
        $order = $this->place_order();
        $this->assert_api_success($this->add_tracking($order, ['carrier_id' => 'ups', 'tracking_number' => '123']));

        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [
            $this->carrier('ups', 'UPS Renamed', true, ['tracking_url' => 'https://new.example.com/{tracking_number}']),
        ])]);

        $fresh = $order->fresh();

        $this->assertSame('UPS', $fresh->shipping_carrier);
        $this->assertSame('https://www.ups.com/track?loc=en_US&tracknum=123', $fresh->shipping_tracking_url);
    }

    /**
     * Get the queued tracking-added mail jobs.
     *
     * @return SendOrderMailJob[]
     */
    protected function tracking_mail_jobs(): array
    {
        return $this->queue->pushed(SendOrderMailJob::class, fn(SendOrderMailJob $job) => $job->mailer_class === CustomerOrderTrackingAddedMail::class);
    }

    public function test_adding_tracking_queues_one_email_with_carrier_number_and_link(): void
    {
        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS')])]);
        $order = $this->place_order();

        $this->assert_api_success($this->add_tracking($order, ['carrier_id' => 'ups', 'tracking_number' => '1Z999']));

        $jobs = $this->tracking_mail_jobs();

        $this->assertCount(1, $jobs);
        $this->assertSame($order->customer_email, $jobs[0]->email);

        $job = unserialize(serialize($jobs[0]));
        $html = CustomerOrderTrackingAddedMail::make($job->order)->get_preview_html();

        $this->assertStringContainsString('UPS', $html);
        $this->assertStringContainsString('1Z999', $html);
        $this->assertStringContainsString('tracknum=1Z999', $html);
    }

    public function test_adding_tracking_again_queues_a_new_email(): void
    {
        $order = $this->place_order();

        $this->assert_api_success($this->add_tracking($order, ['carrier' => 'DHL', 'tracking_number' => '111', 'tracking_url' => 'https://x.test/{tracking_number}']));
        $this->assert_api_success($this->add_tracking($order, ['carrier' => 'DHL', 'tracking_number' => '222', 'tracking_url' => 'https://x.test/{tracking_number}']));

        $this->assertCount(2, $this->tracking_mail_jobs());
    }

    public function test_a_rejected_add_tracking_queues_no_email(): void
    {
        $this->save_zones([$this->zone('us', [['country' => 'US', 'states' => []]], [$this->carrier('ups', 'UPS')])]);
        $order = $this->place_order();

        $this->assert_validation_error($this->add_tracking($order, ['carrier_id' => 'nope', 'tracking_number' => '123']));

        $this->assertSame([], $this->tracking_mail_jobs());
    }

    public function test_the_tracking_added_email_can_be_switched_off(): void
    {
        $order = $this->place_order();
        $this->assertTrue(CustomerOrderTrackingAddedMail::make($order)->is_enabled());

        $settings = Settings::get('email');
        $values = $settings->to_array();
        $values['customer_emails']['order_notifications']['tracking_added']['is_enabled'] = false;
        $settings->set($values, false);

        $this->assertFalse(CustomerOrderTrackingAddedMail::make($order)->is_enabled());
    }

    public function test_the_email_settings_hold_the_tracking_added_template(): void
    {
        $template = $this->assert_api_success($this->request('GET', 'settings/email'))['data']['customer_emails']['order_notifications']['tracking_added'];

        $this->assertTrue($template['is_enabled']);
        $this->assertStringContainsString('{shipping_tracking_url}', $template['message']);
        $this->assertContains('{shipping_carrier}', array_column($template['shortcodes'], 'value'));
    }

    public function test_the_tracking_added_email_can_be_previewed(): void
    {
        $mailer = app(EmailPreviewService::class)->resolve_mailer('customer', 'order', CustomerOrderNotification::TRACKING_ADDED);

        $this->assertInstanceOf(CustomerOrderTrackingAddedMail::class, $mailer);
        $this->assertStringContainsString('1Z999AA10123456784', $mailer->get_preview_html());
    }

    public function test_the_shipped_email_is_unchanged_by_adding_tracking(): void
    {
        $order = $this->place_order();
        $this->queue->clear();

        $this->assert_api_success($this->add_tracking($order, ['carrier' => 'DHL', 'tracking_number' => '111', 'tracking_url' => 'https://x.test/{tracking_number}']));

        $this->assertSame([], $this->queue->pushed(SendOrderMailJob::class, fn(SendOrderMailJob $job) => $job->mailer_class === CustomerOrderShippedMail::class));
    }
}
