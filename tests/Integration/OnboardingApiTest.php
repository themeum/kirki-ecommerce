<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\PageKeys;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\ShippingZonePresets;
use Kirki\Ecommerce\App\Supports\Onboarding;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class OnboardingApiTest extends RestTestCase
{
    /**
     * Prepare state before each test.
     *
     * The seeder queue remembers which seeders already ran for the whole PHP
     * process, so it is cleared to let every test seed against its own database.
     * Plugin table state carries across tests in a class (the harness only
     * rebuilds it in setUpBeforeClass), so currencies are cleared too.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_seeder_queue();
        Currency::query()->delete();
    }

    /**
     * Clean up state after each test.
     *
     * Store setup makes a currency the base inside its own database
     * transaction, which implicitly commits the test's wrapping transaction,
     * so the options it wrote survive the rollback. They are deleted, and the
     * deletion committed, once the rollback has run so later test classes
     * start from the shipped defaults.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        global $wpdb;

        parent::tearDown();

        $option_keys = [
            OptionKeys::GENERAL_SETTINGS,
            OptionKeys::TAX_SETTINGS,
            OptionKeys::ADVANCE_SETTINGS,
            OptionKeys::PRODUCT_SETTINGS,
            OptionKeys::CHECKOUT_SETTINGS,
            OptionKeys::PAYMENT_SETTINGS,
            OptionKeys::SHIPPING_SETTINGS,
            OptionKeys::LEGAL_SETTINGS,
            OptionKeys::ONBOARDING_COMPLETED_AT,
            OptionKeys::SETUP_CHECKLIST,
            OptionKeys::PRESETS_APPLIED_AT,
        ];

        foreach ($option_keys as $option_key) {
            Option::delete($option_key);
        }

        $wpdb->query('COMMIT');
        $this->reset_option_manager_cache();
        wp_cache_flush();
    }

    /**
     * Missing store name is rejected without writing anything.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_missing_store_name_is_rejected(): void
    {
        $response = $this->request('POST', 'onboarding', $this->payload(['store_name' => '']));

        $this->assert_validation_error($response);
        $this->assertFalse(Onboarding::is_completed());
        $this->assertSame(0, Currency::query()->count());
    }

    /**
     * Unknown country and currency codes are rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_country_or_currency_is_rejected(): void
    {
        $this->assert_validation_error($this->request('POST', 'onboarding', $this->payload(['country' => 'ZZ'])));
        $this->assert_validation_error($this->request('POST', 'onboarding', $this->payload(['currency' => 'ZZZ'])));
        $this->assertFalse(Onboarding::is_completed());
    }

    /**
     * Users without the store management capability are forbidden.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_non_admin_is_forbidden(): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));

        $this->assert_api_error($this->request('POST', 'onboarding', $this->payload()), 403);
        $this->assertFalse(Onboarding::is_completed());
    }

    /**
     * A successful setup configures the store and records completion.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_successful_setup_configures_the_store(): void
    {
        Option::set(OptionKeys::GENERAL_SETTINGS, ['store_email' => 'owner@example.com']);
        $store_created_count = did_action(DevHookNames::STORE_CREATED);
        $product_count = Product::query()->count();

        $payload = $this->assert_api_success($this->request('POST', 'onboarding', $this->payload()));

        $general = Option::get(OptionKeys::GENERAL_SETTINGS);
        $this->assertSame('Acme', $general['store_name']);
        $this->assertSame('food-and-drink', $general['industry']);
        $this->assertSame('owner@example.com', $general['store_email']);
        $this->assertSame('BD', $general['store_address']['country']);
        $this->assertSame('Dhaka', $general['store_address']['city']);
        $this->assertNull($general['store_address']['address_line_1']);
        $this->assertFalse($general['is_tax_calculation_enabled']);
        $this->assertNull($general['store_tax_id']);

        $currencies = Currency::query()->where('code', 'BDT')->get();
        $this->assertCount(1, $currencies);
        $this->assertTrue((bool) $currencies->first()->is_base);
        $this->assertTrue((bool) $currencies->first()->is_active);
        $this->assertEquals(1, $currencies->first()->exchange_rate);

        foreach (array_keys(PageKeys::get_list()) as $page_key) {
            $page_id = (int) $this->advance_page_id($page_key);
            $this->assertGreaterThan(0, $page_id);
            $this->assertSame('publish', get_post_status($page_id));
        }

        $this->assertSame($product_count, Product::query()->count());
        $this->assertTrue(Onboarding::is_completed());
        $this->assertSame($store_created_count + 1, did_action(DevHookNames::STORE_CREATED));

        $this->assertSame('BD', $payload['data']['country']['code']);
        $this->assertSame('BDT', $payload['data']['currency']['code']);
        $this->assertNull($payload['data']['tax']);
    }

    /**
     * Setup offers Cash on Delivery and Direct bank transfer, both disabled.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_setup_seeds_offline_payments_disabled(): void
    {
        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload()));

        $offline_payments = Option::get(OptionKeys::PAYMENT_SETTINGS)['offline_payments'];

        $this->assertSame(['cod', 'bank_transfer'], array_column($offline_payments, 'id'));

        foreach ($offline_payments as $offline_payment) {
            $this->assertFalse($offline_payment['is_enabled']);
            $this->assertNotEmpty($offline_payment['instructions']);
        }
    }

    /**
     * Setup records the checklist steps whose data is already in place as preconfigured.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_setup_records_preconfigured_checklist_steps(): void
    {
        Option::set(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => [
            ['id' => 'zone', 'is_enabled' => true, 'shipping_methods' => [['id' => 'flat', 'is_enabled' => true]]],
        ]]);
        $this->reset_option_manager_cache();

        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload()));

        $this->assertSame(['shipping'], Option::get(OptionKeys::SETUP_CHECKLIST)['preconfigured']);
    }

    /**
     * Collecting tax with prices including tax turns both switches on and keeps the tax ID.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_included_in_price_is_saved(): void
    {
        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload([
            'is_tax_collected' => true,
            'is_tax_inclusive_price' => true,
            'store_tax_id' => 'VAT-123',
        ])));

        $general = Option::get(OptionKeys::GENERAL_SETTINGS);
        $tax = Option::get(OptionKeys::TAX_SETTINGS);
        $this->assertTrue($general['is_tax_calculation_enabled']);
        $this->assertSame('VAT-123', $general['store_tax_id']);
        $this->assertTrue($tax['is_tax_inclusive_price']);
    }

    /**
     * Tax values are ignored when the merchant does not collect tax.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_values_are_ignored_when_tax_is_off(): void
    {
        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload([
            'is_tax_collected' => false,
            'is_tax_inclusive_price' => true,
            'store_tax_id' => 'VAT-123',
        ])));

        $general = Option::get(OptionKeys::GENERAL_SETTINGS);
        $tax = Option::get(OptionKeys::TAX_SETTINGS);
        $this->assertFalse($general['is_tax_calculation_enabled']);
        $this->assertNull($general['store_tax_id']);
        $this->assertFalse($tax['is_tax_inclusive_price']);
    }

    /**
     * An already stored currency is promoted to base instead of duplicated.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_existing_currency_becomes_the_base(): void
    {
        Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => 1, 'is_active' => 1]);
        Currency::create(['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'exchange_rate' => 0.9, 'is_base' => 0, 'is_active' => 1]);

        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload(['currency' => 'EUR'])));

        $this->assertSame(1, Currency::query()->where('code', 'EUR')->count());
        $this->assertTrue((bool) Currency::query()->where('code', 'EUR')->first()->is_base);
        $this->assertFalse((bool) Currency::query()->where('code', 'USD')->first()->is_base);
        $this->assertSame(1, Currency::query()->where('is_base', 1)->count());
    }

    /**
     * Setup after a partial earlier run creates no duplicates.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_setup_after_partial_run_creates_no_duplicates(): void
    {
        Currency::create(['code' => 'BDT', 'name' => 'Bangladeshi Taka', 'symbol' => '৳', 'exchange_rate' => 1, 'is_base' => 1, 'is_active' => 1]);
        $cart_page_id = wp_insert_post(['post_title' => 'Cart', 'post_type' => 'page', 'post_status' => 'draft']);
        Option::set(OptionKeys::ADVANCE_SETTINGS, ['pages' => [PageKeys::CART => $cart_page_id]]);

        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload()));

        $this->assertSame(1, Currency::query()->where('code', 'BDT')->count());
        $this->assertSame($cart_page_id, (int) $this->advance_page_id(PageKeys::CART));
        $this->assertSame('publish', get_post_status($cart_page_id));
    }

    /**
     * Setup is rejected once onboarding is complete.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_setup_after_completion_is_rejected(): void
    {
        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload()));

        $this->assert_api_error($this->request('POST', 'onboarding', $this->payload([
            'store_name' => 'Changed',
            'currency' => 'EUR',
        ])), 409);

        $this->assertSame('Acme', Option::get(OptionKeys::GENERAL_SETTINGS)['store_name']);
        $this->assertSame(0, Currency::query()->where('code', 'EUR')->count());
    }

    /**
     * Sample data cannot be loaded before onboarding.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sample_data_is_rejected_before_onboarding(): void
    {
        $product_count = Product::query()->count();

        $this->assert_api_error($this->request('POST', 'onboarding/sample-data'), 409);
        $this->assertSame($product_count, Product::query()->count());
    }

    /**
     * Sample data adds the demo products and the starter coupon once.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sample_data_adds_demo_products_once(): void
    {
        Coupon::query()->delete();
        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload()));

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));
        $product_count = Product::query()->count();
        $this->assertGreaterThan(0, $product_count);
        $this->assertSame(1, Coupon::query()->where('code', 'WELCOME50')->count());

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));
        $this->assertSame($product_count, Product::query()->count());
        $this->assertSame(1, Coupon::query()->where('code', 'WELCOME50')->count());
    }

    /**
     * Sample data on a store that already has products creates no coupon.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sample_data_creates_no_coupon_when_products_exist(): void
    {
        $this->assert_api_success($this->request('POST', 'onboarding', $this->payload()));
        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));
        Coupon::query()->delete();

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));

        $this->assertFalse(Coupon::query()->exists());
    }

    /**
     * Store setup writes every preset kind for the saved industry and country.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_setup_applies_every_preset_kind(): void
    {
        $this->clear_preset_targets();

        $this->assert_api_success($this->request('POST', 'onboarding', $this->preset_payload()));

        $this->assertTrue(Category::query()->where('name', 'Women')->exists());
        $this->assertTrue(Attribute::query()->where('slug', 'size')->exists());
        $this->assertSame(1, ProductSchema::query()->count());
        $this->assertFalse(Coupon::query()->exists());
        $this->assertTrue(ShippingProfile::query()->where('name', 'Oversized')->exists());
        $this->assertTrue(TaxProfile::query()->where('name', "Children's Clothing")->exists());
        $this->assertCount(3, Option::get(OptionKeys::LEGAL_SETTINGS)['consents']);
        $this->assertSame(['Domestic'], array_column(Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'], 'title'));
        $this->assertSame('GB', Option::get(OptionKeys::TAX_SETTINGS)['tax_regions'][0]['code']);
        $this->assertContains('shipping', Option::get(OptionKeys::SETUP_CHECKLIST)['preconfigured']);
        $this->assertNotEmpty(Option::get(OptionKeys::PRESETS_APPLIED_AT));
    }

    /**
     * Store setup does not apply the presets again once they were applied.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_setup_does_not_apply_presets_twice(): void
    {
        $this->clear_preset_targets();
        Option::set(OptionKeys::PRESETS_APPLIED_AT, time());

        $this->assert_api_success($this->request('POST', 'onboarding', $this->preset_payload()));

        $this->assertFalse(Category::query()->exists());
        $this->assertFalse(ShippingProfile::query()->exists());
        $this->assertEmpty(Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'] ?? []);
    }

    /**
     * A preset kind that throws is logged, and the other kinds are still written.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failing_preset_kind_does_not_stop_the_others(): void
    {
        $this->clear_preset_targets();
        app()->instance(ShippingZonePresets::class, new class extends ShippingZonePresets {
            public function __construct()
            {
            }

            public function apply(array $presets, PresetContext $context)
            {
                throw new \RuntimeException('Zone presets failed');
            }
        });

        try {
            $this->assert_api_success($this->request('POST', 'onboarding', $this->preset_payload()));
        } finally {
            static::forget_singleton(ShippingZonePresets::class);
        }

        $this->assertEmpty(Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'] ?? []);
        $this->assertTrue(Category::query()->where('name', 'Women')->exists());
        $this->assertCount(3, Option::get(OptionKeys::LEGAL_SETTINGS)['consents']);
        $this->assertCount(1, Option::get(OptionKeys::TAX_SETTINGS)['tax_regions']);
        $this->assertNotEmpty(Option::get(OptionKeys::PRESETS_APPLIED_AT));
    }

    /**
     * Presets leave the order and invoice number settings at their defaults.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_presets_leave_order_and_invoice_numbering_unchanged(): void
    {
        $this->assert_api_success($this->request('POST', 'onboarding', $this->preset_payload()));

        $general = Option::get(OptionKeys::GENERAL_SETTINGS);
        $this->assertSame(['prefix' => '', 'suffix' => ''], $general['order_number']);
        $this->assertSame([
            'prefix' => '',
            'suffix' => '',
            'sequence' => '000001',
            'apply_year_prefix' => false,
            'reset_sequence_every_year' => false,
        ], $general['invoice_number']);
    }

    /**
     * Build a valid onboarding payload.
     *
     * @param array $overrides Fields to override.
     *
     * @return array
     * @since 1.0.0
     */
    protected function payload(array $overrides = []): array
    {
        return array_merge([
            'store_name' => 'Acme',
            'industry' => 'food-and-drink',
            'country' => 'BD',
            'store_address' => [
                'city' => 'Dhaka',
            ],
            'currency' => 'BDT',
            'is_tax_collected' => false,
            'is_tax_inclusive_price' => false,
            'store_tax_id' => null,
        ], $overrides);
    }

    /**
     * Build a payload whose industry and country both have presets.
     *
     * @return array
     * @since 1.0.0
     */
    protected function preset_payload(): array
    {
        return $this->payload([
            'industry' => 'fashion-and-apparel',
            'country' => 'GB',
            'store_address' => ['city' => 'London'],
            'currency' => 'GBP',
            'is_tax_collected' => true,
        ]);
    }

    /**
     * Delete the plugin rows the presets write, which carry across tests in a class.
     *
     * @return void
     * @since 1.0.0
     */
    protected function clear_preset_targets(): void
    {
        Category::query()->delete();
        AttributeValue::query()->delete();
        Attribute::query()->delete();
        ProductSchema::query()->delete();
        Coupon::query()->delete();
        ShippingProfile::query()->delete();
        TaxProfile::query()->delete();
    }

    /**
     * Read a storefront page id from the stored advanced settings.
     *
     * @param string $page_key Page key.
     *
     * @return mixed
     * @since 1.0.0
     */
    protected function advance_page_id(string $page_key)
    {
        return Option::get(OptionKeys::ADVANCE_SETTINGS)['pages'][$page_key] ?? null;
    }

    /**
     * Clear the seeder queue's process-wide record of called and resolved seeders.
     *
     * @return void
     * @since 1.0.0
     */
    protected function reset_seeder_queue(): void
    {
        $reflection = new \ReflectionClass(Seeder::class);

        foreach (['called', 'resolved'] as $property_name) {
            $property = $reflection->getProperty($property_name);
            $property->setAccessible(true);
            $property->setValue(null, []);
        }
    }
}
