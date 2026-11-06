<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderResource;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\RestrictedPaymentProvider;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\include_view;

class CheckoutPaymentProviderTest extends RestTestCase
{
    use CreatesTestProducts;
    use EnablesPaymentProviders;
    use SeedsTestShipping;

    /** @var int */
    protected $variant_id;

    /**
     * Prepare a product to order and a shipping method to ship it with.
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
    }

    /**
     * Do not leave this test's providers in the shared registry.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        $this->start_new_request();

        parent::tearDown();
    }

    /**
     * A shopper cannot check out with a provider that does not exist.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shopper_unknown_provider_is_rejected(): void
    {
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'no-such-provider']));

        $this->assert_api_error($response, 422);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * A shopper cannot check out with a provider that is registered but disabled.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shopper_disabled_provider_is_rejected(): void
    {
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'paypal']));

        $this->assert_api_error($response, 422);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * A shopper can check out with an enabled online provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shopper_enabled_provider_is_accepted(): void
    {
        $this->enable_payment_provider('paypal');
        $this->add_item_to_cart();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'paypal']));

        $payload = $this->assert_api_success($response, 201);
        $this->assertSame('paypal', $payload['data']['payment_provider']);
    }

    /**
     * Spec scenarios: Checkout creates an order, and Customer leaves no note.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_carries_order_notes_onto_the_order(): void
    {
        $this->enable_payment_provider('paypal');
        $this->add_item_to_cart();

        $with_note = $this->request('POST', 'checkout', $this->order_payload(['order_notes' => 'Call before delivery']));
        $payload = $this->assert_api_success($with_note, 201);
        $this->assertSame('Call before delivery', $payload['data']['order_notes']);
        $this->assertSame('Call before delivery', Order::find($payload['data']['id'])->order_notes);

        $this->add_item_to_cart();
        $without_note = $this->request('POST', 'checkout', $this->order_payload());
        $payload = $this->assert_api_success($without_note, 201);
        $this->assertNull($payload['data']['order_notes']);
    }

    /**
     * An offline method is rejected while disabled and accepted once enabled through its endpoint.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_offline_method_is_accepted_only_after_it_is_enabled(): void
    {
        $created = $this->request('POST', 'offline-payments', ['name' => 'Cash on Delivery', 'is_enabled' => false]);
        $id = $this->assert_api_success($created, 201)['data']['id'];
        $this->start_new_request();

        $rejected = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => $id]));
        $this->assert_api_error($rejected, 422);

        $this->assert_api_success($this->request('PATCH', 'offline-payments/' . $id, ['is_enabled' => true]));
        $this->start_new_request();
        $this->add_item_to_cart();

        $accepted = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => $id]));
        $this->assertSame($id, $this->assert_api_success($accepted, 201)['data']['payment_provider']);
    }

    /**
     * An administrator can create a manual order without choosing a provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_without_provider_is_accepted(): void
    {
        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => null]));

        $this->assert_api_success($response, 201);
    }

    /**
     * An administrator can record a manual order against a registered provider that is disabled.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_with_disabled_provider_is_accepted(): void
    {
        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => 'paypal']));

        $payload = $this->assert_api_success($response, 201);
        $this->assertSame('paypal', $payload['data']['payment_provider']);
    }

    /**
     * A manual order still cannot name a provider that does not exist.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_with_unknown_provider_is_rejected(): void
    {
        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => 'no-such-provider']));

        $this->assert_api_error($response, 422);
    }

    /**
     * Spec scenario: Shopper submits a provider that cannot accept the currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shopper_provider_that_cannot_accept_the_currency_is_rejected(): void
    {
        $this->register_restricted_provider();
        $this->add_item_to_cart();
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'restricted']));

        $error = $this->assert_api_error($response, 422);
        $this->assertStringContainsString('USD', wp_json_encode($error));
        $this->assertStringContainsString('BDT', wp_json_encode($error));
        $this->assertSame($orders_before, Order::count());
        $this->assertSame(0, RestrictedPaymentProvider::$pay_calls);
    }

    /**
     * Currency codes match in any letter case.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_currency_rule_ignores_letter_case(): void
    {
        $this->register_restricted_provider(['usd']);
        $this->add_item_to_cart();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'restricted']));

        $this->assert_api_success($response, 201);
    }

    /**
     * Spec scenario: Administrator names a provider that cannot accept the currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_with_provider_that_cannot_accept_the_currency_is_rejected(): void
    {
        $this->register_restricted_provider();
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => 'restricted']));

        $this->assert_api_error($response, 422);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * Spec scenario: Administrator names an offline provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_with_offline_provider_is_accepted(): void
    {
        $created = $this->request('POST', 'offline-payments', ['name' => 'Cash on Delivery', 'is_enabled' => true]);
        $id = $this->assert_api_success($created, 201)['data']['id'];
        $this->start_new_request();

        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => $id]));

        $this->assert_api_success($response, 201);
    }

    /**
     * Spec: an order with a zero total follows the currency rule too.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_zero_total_order_follows_the_currency_rule(): void
    {
        $this->register_restricted_provider();
        $free_variant = $this->default_variant_id($this->create_product(['base_price' => 0]));
        $this->assert_api_success($this->request('POST', 'cart/items', ['variant_id' => $free_variant, 'quantity' => 1]));
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload([
            'items' => [['variant_id' => $free_variant, 'quantity' => 1]],
            'payment_provider' => 'restricted',
        ]));

        $this->assert_api_error($response, 422);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * Spec scenario: Order placement starts the payment.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_response_starts_the_payment(): void
    {
        $this->register_restricted_provider(['USD']);
        $this->add_item_to_cart();

        $payload = $this->assert_api_success($this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'restricted'])), 201);

        $this->assertSame('https://gateway.test/pay', $payload['data']['payment_next_step']['value']);
        $this->assertSame(1, RestrictedPaymentProvider::$pay_calls);
    }

    /**
     * Spec requirement: Viewing an order does not start a payment.
     *
     * The tracking, account, success and failed pages all render this resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rendering_an_unpaid_order_does_not_start_a_payment(): void
    {
        $this->register_restricted_provider(['USD']);
        $this->add_item_to_cart();
        $payload = $this->assert_api_success($this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'restricted'])), 201);
        $order = app(OrderService::class)->find_order_by_uuid($payload['data']['uuid']);
        $metadata = $order->payment_metadata;
        RestrictedPaymentProvider::$pay_calls = 0;

        $rendered = OrderResource::make($order);

        $this->assertArrayNotHasKey('payment_next_step', $rendered);
        $this->assertSame(0, RestrictedPaymentProvider::$pay_calls);
        $this->assertSame($metadata, Order::find($order->id)->payment_metadata);
    }

    /**
     * Spec scenario: Another currency has a payment method. Only that gateway is enabled.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_part_shows_the_switch_message_when_no_gateway_is_listed(): void
    {
        $this->seed_active_currency('BDT');
        $this->use_only_providers([new RestrictedPaymentProvider()]);

        $gateways = Payment::get_checkout_providers('USD');
        $this->assertSame([], $gateways);

        $notice = Payment::get_currency_unavailable_notice('USD', app(CurrencyService::class)->get_active_currency_codes());
        $html = $this->render_payment_methods($gateways, $notice);

        $this->assertStringContainsString('No payment method is available for USD. Switch to BDT to complete your order.', $html);
        $this->assertStringNotContainsString('No payment methods found!', $html);
    }

    /**
     * Spec scenario: Store has no enabled gateway.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_part_keeps_the_existing_message_with_no_enabled_gateway(): void
    {
        $this->use_only_providers([new RestrictedPaymentProvider('restricted', ['BDT'], false)]);

        $notice = Payment::get_currency_unavailable_notice('USD', ['USD']);
        $html = $this->render_payment_methods(Payment::get_checkout_providers('USD'), $notice);

        $this->assertNull($notice);
        $this->assertStringContainsString('No payment methods found!', $html);
    }

    /**
     * Spec scenario: One gateway is restricted. The listed gateways are the ones that accept the currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_part_does_not_list_a_restricted_gateway(): void
    {
        $this->use_only_providers([new RestrictedPaymentProvider(), new RestrictedPaymentProvider('open', ['USD'])]);

        $html = $this->render_payment_methods(Payment::get_checkout_providers('USD'), null);

        $this->assertStringContainsString('value="open"', $html);
        $this->assertStringNotContainsString('value="restricted"', $html);
    }

    /**
     * Spec scenario: A disabled gateway accepts another currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_notice_does_not_suggest_a_currency_of_a_disabled_gateway(): void
    {
        $this->seed_active_currency('EUR');
        $this->use_only_providers([new RestrictedPaymentProvider(), new RestrictedPaymentProvider('euro', ['EUR'], false)]);

        $notice = Payment::get_currency_unavailable_notice('USD', app(CurrencyService::class)->get_active_currency_codes());

        $this->assertSame('No payment method is available for USD.', $notice);
    }

    /**
     * The base currency comes first in the suggestion order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_active_currency_codes_start_with_the_base_currency(): void
    {
        $this->seed_active_currency('BDT');

        $codes = app(CurrencyService::class)->get_active_currency_codes();

        $this->assertSame('USD', $codes[0]);
        $this->assertContains('BDT', $codes);
    }

    /**
     * Spec scenario: No active currency can use the gateway. A badge does not change the enabled state.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_methods_list_reports_currency_support(): void
    {
        $this->register_restricted_provider();

        $unsupported = $this->payment_method_row('restricted');
        $this->assertSame('unsupported', $unsupported['currency_support']['status']);
        $this->assertStringContainsString('BDT', $unsupported['currency_support']['message']);
        $this->assertSame('supported', $this->payment_method_row('paypal')['currency_support']['status']);

        $this->seed_active_currency('BDT');
        $this->assertSame('limited', $this->payment_method_row('restricted')['currency_support']['status']);
    }

    /**
     * Spec scenario: Merchant enables an unsupported gateway.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_merchant_can_enable_a_gateway_with_no_supported_currency(): void
    {
        $this->seed_active_currency('BDT');
        $this->assertFalse(Payment::get_provider('paypal')->supports_currency('BDT'));
        $this->enable_payment_provider('paypal');
        $this->start_new_request();

        $this->assertTrue(Payment::get_provider('paypal')->enabled());
    }

    /**
     * Find one row of the payment methods list.
     *
     * @param string $id Provider ID.
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function payment_method_row(string $id): array
    {
        $rows = $this->assert_api_success($this->request('GET', 'payment-methods'))['data'];

        foreach ($rows as $row) {
            if ($row['id'] === $id) {
                return $row;
            }
        }

        $this->fail('No payment method row for ' . $id);
    }

    /**
     * Render the checkout payment methods part.
     *
     * @param PaymentProvider[] $payment_gateways
     * @param string|null       $payment_notice
     * @return string
     * @since 1.0.0
     */
    protected function render_payment_methods(array $payment_gateways, ?string $payment_notice): string
    {
        ob_start();
        include_view('site.checkout.parts.payment-methods', compact('payment_gateways', 'payment_notice'));

        return (string) ob_get_clean();
    }

    /**
     * Add an active, non-base currency.
     *
     * @param string $code Currency code.
     * @return void
     * @since 1.0.0
     */
    protected function seed_active_currency(string $code): void
    {
        $this->request('POST', 'currencies', [
            'items' => [[
                'code' => $code,
                'name' => $code,
                'symbol' => $code,
                'exchange_rate' => 100.0,
                'is_base' => false,
                'is_active' => true,
            ]],
        ]);
    }

    /**
     * Replace the registered providers, as the next real request would.
     *
     * @param PaymentProvider[] $providers
     * @return void
     * @since 1.0.0
     */
    protected function use_only_providers(array $providers): void
    {
        add_filter(DevHookNames::PAYMENT_PROVIDERS, fn() => $providers);

        $this->start_new_request();
    }

    /**
     * Register a restricted provider, as the next real request would.
     *
     * @param string[] $currencies Currencies the provider accepts.
     * @return void
     * @since 1.0.0
     */
    protected function register_restricted_provider(array $currencies = ['BDT']): void
    {
        RestrictedPaymentProvider::$pay_calls = 0;

        add_filter(DevHookNames::PAYMENT_PROVIDERS, function ($providers) use ($currencies) {
            $providers[] = new RestrictedPaymentProvider('restricted', $currencies);

            return $providers;
        });

        $this->start_new_request();
    }

    /**
     * Put the test product in the signed-in shopper's cart, which shopper checkout reads from.
     *
     * @return void
     * @since 1.0.0
     */
    protected function add_item_to_cart(): void
    {
        $this->assert_api_success($this->request('POST', 'cart/items', ['variant_id' => $this->variant_id, 'quantity' => 1]));
    }

    /**
     * Rebuild the provider registry, as the next real request would.
     *
     * @return void
     * @since 1.0.0
     */
    protected function start_new_request(): void
    {
        static::forget_singleton(PaymentManager::class);
        $this->reset_facade_cache();
    }

    /**
     * Build a checkout payload for a one-item order; shopper checkout unless overridden.
     *
     * @param array<string, mixed> $overrides Fields to override.
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function order_payload(array $overrides = []): array
    {
        return array_merge([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 1]],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => false,
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
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
        ], $overrides);
    }
}
