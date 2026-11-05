<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Mcp\Resources\AnalyticsDefinitionsResource;
use Kirki\Ecommerce\App\Mcp\Resources\CatalogStructureResource;
use Kirki\Ecommerce\App\Mcp\Resources\CheckoutAndPaymentsResource;
use Kirki\Ecommerce\App\Mcp\Resources\CurrenciesResource;
use Kirki\Ecommerce\App\Mcp\Resources\OrderLifecycleResource;
use Kirki\Ecommerce\App\Mcp\Resources\StoreProfileResource;
use Kirki\Ecommerce\App\Mcp\Resources\TaxAndShippingResource;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers tasks 2.1 to 2.8 and 3.1 to 3.2: the store context resources and the catalog structure.
 *
 * Spec: mcp-store-resources.
 */
class McpStoreResourcesTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Make sure a base currency exists, because the profile and the money values read it.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        if (!Currency::query()->where('is_base', true)->exists()) {
            Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => true, 'is_active' => true]);
        }
    }

    /**
     * Merge values into a settings option and rebuild the caches that read it.
     *
     * @param string $key    Option key.
     * @param array  $values Values to merge.
     *
     * @return void
     * @since 1.0.0
     */
    protected function set_settings(string $key, array $values): void
    {
        $current = Option::get($key);
        Option::set($key, array_merge(is_array($current) ? $current : [], $values));

        $this->reset_facade_cache();
        $this->reset_settings_factory_cache();
        $this->reset_option_manager_cache();
        app()->instance(PaymentManager::class, new PaymentManager());
    }

    /**
     * Read a resource and get its JSON content as an array.
     *
     * @param string $resource Resource class.
     *
     * @return array
     * @since 1.0.0
     */
    protected function read(string $resource): array
    {
        $response = app()->make($resource)->handle(new Request([]));

        $this->assertSame('structured', $response->kind());
        $this->assertSame('application/json', $response->mime_type());

        return $response->content();
    }

    /**
     * Read a resource and get its content as the JSON text that the client gets.
     *
     * @param string $resource Resource class.
     *
     * @return string
     * @since 1.0.0
     */
    protected function read_json(string $resource): string
    {
        return (string) wp_json_encode($this->read($resource));
    }

    /**
     * Get the resource classes with their URIs.
     *
     * @return array<string, array{0: string, 1: string}>
     * @since 1.0.0
     */
    public static function resources(): array
    {
        return [
            'profile' => [StoreProfileResource::class, 'kecom://store/profile'],
            'order lifecycle' => [OrderLifecycleResource::class, 'kecom://store/order-lifecycle'],
            'analytics definitions' => [AnalyticsDefinitionsResource::class, 'kecom://store/analytics-definitions'],
            'checkout and payments' => [CheckoutAndPaymentsResource::class, 'kecom://store/checkout-and-payments'],
            'tax and shipping' => [TaxAndShippingResource::class, 'kecom://store/tax-and-shipping'],
            'currencies' => [CurrenciesResource::class, 'kecom://store/currencies'],
            'catalog structure' => [CatalogStructureResource::class, 'kecom://catalog/structure'],
        ];
    }

    /**
     * Scenarios "Administrator reads a resource" and "Signed-in customer is rejected".
     *
     * @dataProvider resources
     *
     * @param string $resource Resource class.
     * @param string $uri      Resource URI.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_identity_and_access(string $resource, string $uri): void
    {
        $instance = app()->make($resource);

        $this->assertSame($uri, $instance->uri());
        $this->assertSame('application/json', $instance->mime_type());
        $this->assertNotSame('', $instance->description());
        $this->assertFalse($instance->is_public());

        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));
        $this->assertTrue($instance->permission());

        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));
        $this->assertFalse($instance->permission());

        wp_set_current_user(static::factory()->user->create(['role' => 'subscriber']));
        $this->assertFalse($instance->permission());

        wp_set_current_user(0);
        $this->assertFalse($instance->permission());
    }

    /**
     * The profile and the analytics definitions are for the assistant, with priority 1.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_assistant_resources_have_high_priority(): void
    {
        foreach ([StoreProfileResource::class, AnalyticsDefinitionsResource::class] as $resource) {
            $hints = app()->make($resource)->hints();

            $this->assertSame(['assistant'], $hints['audience']);
            $this->assertSame(1.0, $hints['priority']);
        }
    }

    /**
     * Scenario "Content reflects a settings change".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_profile_reflects_a_changed_store_name(): void
    {
        $this->set_settings(OptionKeys::GENERAL_SETTINGS, ['store_name' => 'First Name']);
        $this->assertSame('First Name', $this->read(StoreProfileResource::class)['store_name']);

        $this->set_settings(OptionKeys::GENERAL_SETTINGS, ['store_name' => 'Second Name']);
        $profile = $this->read(StoreProfileResource::class);

        $this->assertSame('Second Name', $profile['store_name']);
        $this->assertSame('USD', $profile['base_currency']);
        $this->assertSame(wp_timezone_string(), $profile['time_zone']);
    }

    /**
     * Scenario "Store with no address": each address field is null.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_profile_with_no_address(): void
    {
        $this->set_settings(OptionKeys::GENERAL_SETTINGS, [
            'store_address' => ['address_line_1' => '', 'address_line_2' => null, 'city' => null, 'state' => null, 'postal_code' => null, 'country' => null],
        ]);

        $address = $this->read(StoreProfileResource::class)['store_address'];

        $this->assertSame(['address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country'], array_keys($address));
        $this->assertSame([null, null, null, null, null, null], array_values($address));
    }

    /**
     * Scenario "Allowed actions for a pending order".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_lifecycle_actions_of_a_pending_order(): void
    {
        $statuses = array_column($this->read(OrderLifecycleResource::class)['statuses'], null, 'status');
        $pending = $statuses['pending'];

        $this->assertSame(['mark-as-processing'], $pending['fulfillment_actions']);
        $this->assertSame(['mark-as-paid'], $pending['payment_actions']);
        $this->assertSame(['cancel-order', 'resend-order-email'], $pending['order_actions']);
        $this->assertSame('paid_unfulfilled', ((array) $pending['transitions'])['mark-as-paid']);
    }

    /**
     * Scenario "Shipped email is turned off".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_lifecycle_shows_a_disabled_email(): void
    {
        $email = Option::get(OptionKeys::EMAIL_SETTINGS);
        $email = is_array($email) ? $email : [];
        $email['customer_emails']['order_notifications']['order_shipped']['is_enabled'] = false;
        $email['customer_emails']['order_notifications']['order_processing']['is_enabled'] = true;
        $this->set_settings(OptionKeys::EMAIL_SETTINGS, $email);

        $emails = array_column($this->read(OrderLifecycleResource::class)['action_emails'], 'emails', 'action');

        $this->assertSame([['recipient' => 'customer', 'template' => 'order_shipped', 'is_enabled' => false]], $emails['mark-as-shipped']);
        $this->assertSame([['recipient' => 'customer', 'template' => 'order_processing', 'is_enabled' => true]], $emails['mark-as-processing']);
        $this->assertSame(['customer', 'admin'], array_column($emails['cancel-order'], 'recipient'));
        $this->assertArrayNotHasKey('mark-as-paid', $emails);
    }

    /**
     * Scenario "Assistant reads the presets": the presets and comparisons are the ones the analytics tools accept.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_definitions_presets(): void
    {
        $definitions = $this->read(AnalyticsDefinitionsResource::class);

        $this->assertSame(AnalyticsRangeResolver::PRESETS, $definitions['range_presets']);
        $this->assertSame(AnalyticsRangeResolver::COMPARISONS, $definitions['comparisons']);
        $this->assertSame('last_30', $definitions['default_range']);
        $this->assertSame(25, $definitions['max_limit']);
        $this->assertSame(['day' => '1-31', 'week' => '32-186', 'month' => '187+'], $definitions['granularity']);
    }

    /**
     * Scenarios "Disabled payment method" and "Online payment provider has credentials".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_methods_have_no_settings_or_credentials(): void
    {
        Option::set('paypal', ['is_enabled' => true, 'client_id' => 'CLIENT-ID-123', 'client_secret' => 'CLIENT-SECRET-456']);
        $this->set_settings(OptionKeys::PAYMENT_SETTINGS, [
            'offline_payments' => [
                ['id' => 'cod', 'name' => 'Cash on Delivery', 'instructions' => 'Pay at the door', 'icon' => null, 'is_enabled' => false, 'is_offline' => true, 'config' => ['note' => 'OFFLINE-CONFIG-789']],
            ],
        ]);

        $json = $this->read_json(CheckoutAndPaymentsResource::class);
        $methods = array_column($this->read(CheckoutAndPaymentsResource::class)['payment_methods'], null, 'id');

        $this->assertSame(['id' => 'cod', 'name' => 'Cash on Delivery', 'is_enabled' => false, 'is_offline' => true], $methods['cod']);
        $this->assertSame(['id', 'name', 'is_enabled', 'is_offline'], array_keys($methods['paypal']));
        $this->assertTrue($methods['paypal']['is_enabled']);
        $this->assertStringNotContainsString('CLIENT-ID-123', $json);
        $this->assertStringNotContainsString('CLIENT-SECRET-456', $json);
        $this->assertStringNotContainsString('OFFLINE-CONFIG-789', $json);
        $this->assertStringNotContainsString('Pay at the door', $json);

        Option::delete('paypal');
    }

    /**
     * The checkout rules and the legal consents, with the tags removed from the consent text.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_rules_and_consents(): void
    {
        $this->set_settings(OptionKeys::CHECKOUT_SETTINGS, [
            'is_allowed_guest_checkout' => false,
            'checkout_configuration' => ['phone_number_validation' => 'optional', 'has_apply_coupon_code' => true, 'show_customer_note' => false],
        ]);
        $this->set_settings(OptionKeys::LEGAL_SETTINGS, [
            'consents' => [['id' => 'terms', 'method' => 'checkbox', 'message' => '<p>I accept the <a href="#">terms</a></p>', 'locations' => ['checkout'], 'is_enabled' => true]],
        ]);

        $checkout = $this->read(CheckoutAndPaymentsResource::class);

        $this->assertFalse($checkout['is_guest_checkout_allowed']);
        $this->assertSame('optional', $checkout['checkout_fields']['phone_number_validation']);
        $this->assertTrue($checkout['has_coupon_field']);
        $this->assertFalse($checkout['shows_customer_note']);
        $this->assertSame([['id' => 'terms', 'text' => 'I accept the terms', 'method' => 'checkbox', 'locations' => ['checkout'], 'is_enabled' => true]], $checkout['legal_consents']);
    }

    /**
     * Scenario "Store with no shipping zones".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_and_shipping_with_no_zones(): void
    {
        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => []]);
        $this->set_settings(OptionKeys::TAX_SETTINGS, ['is_tax_inclusive_price' => true, 'is_shipping_tax_enabled' => false, 'tax_regions' => []]);

        $result = $this->read(TaxAndShippingResource::class);

        $this->assertSame([], $result['shipping_zones']);
        $this->assertSame([], $result['tax_regions']);
        $this->assertTrue($result['is_tax_inclusive_price']);
        $this->assertFalse($result['is_shipping_tax_enabled']);
        $this->assertArrayHasKey('is_tax_calculation_enabled', $result);
    }

    /**
     * A shipping method shows its amounts as money values in the base currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shipping_method_amounts_are_money_values(): void
    {
        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, [
            'shipping_zones' => [[
                'title' => 'Domestic',
                'is_enabled' => true,
                'regions' => [['country' => 'US', 'states' => []]],
                'shipping_methods' => [['id' => 'm1', 'name' => 'Standard', 'type' => 'flat_rate', 'is_enabled' => true, 'base_amount' => 550, 'is_free_shipping_enabled' => true, 'base_free_shipping_min_amount' => 5000]],
            ]],
        ]);

        $method = $this->read(TaxAndShippingResource::class)['shipping_zones'][0]['methods'][0];

        $this->assertSame('Standard', $method['name']);
        $this->assertEquals(5.5, $method['base_amount']['amount']);
        $this->assertSame('USD', $method['base_amount']['currency']);
        $this->assertEquals(50, $method['base_free_shipping_min_amount']['amount']);
    }

    /**
     * Scenarios "Rates were never synced" and "Currency API key is stored".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_currencies_with_no_sync_and_a_stored_key(): void
    {
        $this->set_settings(OptionKeys::CURRENCY_SETTINGS, [
            'api_provider' => 'currencyapi',
            'api_configs' => ['currencyapi' => ['api_key' => 'CURRENCY-KEY-321']],
            'last_sync_at' => null,
            'next_sync_at' => null,
            'usage' => ['total' => 300, 'used' => 1, 'remaining' => 299, 'reset_at' => null],
        ]);

        $json = $this->read_json(CurrenciesResource::class);
        $currencies = $this->read(CurrenciesResource::class);

        $this->assertNull($currencies['last_sync_at']);
        $this->assertNull($currencies['next_sync_at']);
        $this->assertSame('USD', $currencies['base_currency']);
        $this->assertContains('USD', array_column($currencies['currencies'], 'code'));
        $this->assertArrayNotHasKey('api_configs', $currencies);
        $this->assertArrayNotHasKey('usage', $currencies);
        $this->assertStringNotContainsString('CURRENCY-KEY-321', $json);
    }

    /**
     * A sync time is stored in UTC and shown in ISO 8601 in the site time zone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sync_time_is_iso_8601(): void
    {
        update_option('timezone_string', 'Asia/Dhaka');
        $this->set_settings(OptionKeys::CURRENCY_SETTINGS, ['last_sync_at' => '2026-10-25 06:00:00']);

        $this->assertSame('2026-10-25T12:00:00+06:00', $this->read(CurrenciesResource::class)['last_sync_at']);

        update_option('timezone_string', 'UTC');
    }

    /**
     * Each category and tag has its product count, and a child category keeps its parent.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_catalog_product_counts(): void
    {
        Product::query()->delete();
        Category::query()->delete();
        Tag::query()->delete();
        $this->login_as_admin();

        $first = $this->create_product(['title' => 'First']);
        $second = $this->create_product(['title' => 'Second']);
        $parent = Category::create(['name' => 'Clothing', 'slug' => 'clothing']);
        $child = Category::create(['name' => 'Shirts', 'slug' => 'shirts', 'parent_id' => $parent->id]);
        $tag = Tag::create(['name' => 'Summer', 'slug' => 'summer']);
        $parent->products()->attach([$first['id'], $second['id']]);
        $child->products()->attach($first['id']);
        $tag->products()->attach($second['id']);

        $catalog = $this->read(CatalogStructureResource::class);

        $this->assertSame([
            ['id' => (int) $parent->id, 'name' => 'Clothing', 'parent_id' => null, 'product_count' => 2],
            ['id' => (int) $child->id, 'name' => 'Shirts', 'parent_id' => (int) $parent->id, 'product_count' => 1],
        ], $catalog['categories']['items']);
        $this->assertSame(2, $catalog['categories']['total']);
        $this->assertFalse($catalog['categories']['is_truncated']);
        $this->assertSame([['id' => (int) $tag->id, 'name' => 'Summer', 'product_count' => 1]], $catalog['tags']['items']);
        $this->assertSame(['items', 'total', 'is_truncated'], array_keys($catalog['attributes']));
    }

    /**
     * Scenario "Store with 350 tags": the list holds 200 tags, keeps the tags with the most products, and is marked as cut.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_catalog_list_is_capped(): void
    {
        Product::query()->delete();
        Tag::query()->delete();
        $this->login_as_admin();

        for ($index = 1; $index <= 350; $index++) {
            Tag::create(['name' => sprintf('Tag %03d', $index), 'slug' => 'tag-' . $index]);
        }

        $popular = Tag::create(['name' => 'Zz Popular', 'slug' => 'zz-popular']);
        $popular->products()->attach($this->create_product(['title' => 'Popular'])['id']);

        $tags = $this->read(CatalogStructureResource::class)['tags'];

        $this->assertCount(200, $tags['items']);
        $this->assertSame(351, $tags['total']);
        $this->assertTrue($tags['is_truncated']);
        $this->assertSame('Zz Popular', $tags['items'][0]['name']);
        $this->assertSame('Tag 001', $tags['items'][1]['name']);
    }
}
