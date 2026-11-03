<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers migrating the WooCommerce store settings, tax rates and shipping zones.
 */
class WooCommerceSettingsGroupTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;
    use SeedsTestCurrency;

    /** @var MigrationRunner */
    protected $runner;

    /** @var WooCommerceSource */
    protected $source;

    /** @var array<string, array<string, mixed>> The Kirki settings before the test. */
    protected $snapshot = [];

    /** The Kirki settings groups that the migration can change. */
    protected const GROUPS = [OptionKeys::GENERAL_SETTINGS, OptionKeys::PRODUCT_SETTINGS, OptionKeys::CHECKOUT_SETTINGS, OptionKeys::TAX_SETTINGS, OptionKeys::SHIPPING_SETTINGS, OptionKeys::CURRENCY_SETTINGS, OptionKeys::EMAIL_SETTINGS];

    /**
     * Save the Kirki settings and set up WooCommerce fixtures.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed_base_currency();
        $this->reset_base_currency();

        foreach (static::GROUPS as $group) {
            $this->snapshot[$group] = Settings::get($group)->refresh()->to_array();
        }

        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        update_option('woocommerce_version', '8.4.0');
        $this->create_woo_tables(false);

        $this->source = new WooCommerceSource();
        $this->runner = new MigrationRunner(new SourceRegistry());
    }

    /**
     * Restore the Kirki settings and remove fixtures.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        foreach (static::GROUPS as $group) {
            Option::set($group, $this->snapshot[$group], $group !== OptionKeys::EMAIL_SETTINGS);
        }

        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        $this->reset_base_currency();

        foreach (['woocommerce_currency', 'woocommerce_store_address', 'woocommerce_store_address_2', 'woocommerce_store_city', 'woocommerce_store_postcode', 'woocommerce_default_country', 'woocommerce_calc_taxes', 'woocommerce_prices_include_tax', 'woocommerce_weight_unit', 'woocommerce_dimension_unit', 'woocommerce_enable_reviews', 'woocommerce_enable_review_rating', 'woocommerce_enable_guest_checkout', 'woocommerce_enable_coupons', 'woocommerce_notify_low_stock_amount', 'woocommerce_enable_signup_and_login_from_checkout', 'woocommerce_email_from_address', 'woocommerce_allowed_countries', 'woocommerce_specific_allowed_countries', 'woocommerce_all_except_countries', 'woocommerce_checkout_phone_field', 'woocommerce_checkout_company_field', 'woocommerce_tax_display_shop', 'woocommerce_currency_pos', 'woocommerce_price_thousand_sep', 'woocommerce_price_decimal_sep', 'woocommerce_customer_processing_order_settings', 'woocommerce_failed_order_settings', 'woocommerce_notify_low_stock', 'woocommerce_email_footer_text', 'woocommerce_email_base_color', 'woocommerce_paypal_settings', 'woocommerce_flat_rate_1_settings', 'woocommerce_flat_rate_3_settings', 'woocommerce_free_shipping_2_settings', 'woocommerce_local_pickup_4_settings'] as $option) {
            delete_option($option);
        }

        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * Units, reviews, checkout options and the low stock amount follow WooCommerce.
     *
     * @return void
     */
    public function test_options_follow_woocommerce()
    {
        Settings::get(OptionKeys::PRODUCT_SETTINGS)->refresh()->set(['weight_unit' => 'kg', 'dimension_unit' => 'm', 'is_enabled_reviews' => false, 'low_stock_threshold' => 0], false);
        Settings::get(OptionKeys::CHECKOUT_SETTINGS)->refresh()->set(['is_allowed_guest_checkout' => false, 'has_apply_coupon_code' => true], false);
        update_option('woocommerce_weight_unit', 'lbs');
        update_option('woocommerce_dimension_unit', 'cm');
        update_option('woocommerce_enable_reviews', 'yes');
        update_option('woocommerce_enable_guest_checkout', 'yes');
        update_option('woocommerce_enable_coupons', 'no');
        update_option('woocommerce_notify_low_stock_amount', '4');

        $this->migrate();

        $product = Settings::get(OptionKeys::PRODUCT_SETTINGS)->refresh()->to_array();
        $checkout = Settings::get(OptionKeys::CHECKOUT_SETTINGS)->refresh()->to_array();
        $this->assertSame('lb', $product['weight_unit']);
        $this->assertSame('cm', $product['dimension_unit']);
        $this->assertTrue($product['is_enabled_reviews']);
        $this->assertSame(4, $product['low_stock_threshold']);
        $this->assertTrue($checkout['is_allowed_guest_checkout']);
        $this->assertFalse($checkout['has_apply_coupon_code']);
    }

    /**
     * A WooCommerce value replaces a changed Kirki value, a missing one keeps it, and an unsupported unit is reported.
     *
     * @return void
     */
    public function test_woocommerce_values_replace_and_missing_ones_keep_the_kirki_value()
    {
        Settings::get(OptionKeys::PRODUCT_SETTINGS)->refresh()->set(['weight_unit' => 'g', 'dimension_unit' => 'mm'], false);
        update_option('woocommerce_weight_unit', 'lbs');
        update_option('woocommerce_dimension_unit', 'yd');
        update_option('woocommerce_enable_signup_and_login_from_checkout', 'yes');

        $progress = $this->migrate();

        $product = Settings::get(OptionKeys::PRODUCT_SETTINGS)->refresh()->to_array();
        $this->assertSame('lb', $product['weight_unit']);
        $this->assertSame('mm', $product['dimension_unit'], 'An unsupported unit leaves the Kirki value.');
        $notes = implode(' ', $progress['notes']);
        $this->assertStringContainsString('"yd" of WooCommerce is not supported', $notes);
        $this->assertStringContainsString('create an account at checkout', $notes);
    }

    /**
     * The store email, selling countries, checkout fields, tax display, price format and emails follow WooCommerce.
     *
     * @return void
     */
    public function test_extra_options_follow_woocommerce()
    {
        update_option('woocommerce_email_from_address', 'shop@example.com');
        update_option('woocommerce_allowed_countries', 'specific');
        update_option('woocommerce_specific_allowed_countries', ['DE', 'FR', 'ZZ']);
        update_option('woocommerce_checkout_phone_field', 'optional');
        update_option('woocommerce_tax_display_shop', 'incl');
        update_option('woocommerce_currency_pos', 'right_space');
        update_option('woocommerce_price_thousand_sep', ' ');
        update_option('woocommerce_price_decimal_sep', ',');
        update_option('woocommerce_customer_processing_order_settings', ['enabled' => 'no']);
        update_option('woocommerce_notify_low_stock', 'no');
        update_option('woocommerce_email_footer_text', 'Thanks from the shop');
        update_option('woocommerce_email_base_color', '#112233');

        $progress = $this->migrate();

        $general = Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array();
        $this->assertSame('shop@example.com', $general['store_email']);
        $this->assertSame('selected-countries', $general['selling_location_type']);
        $this->assertSame(['DE', 'FR'], $general['selling_countries']);
        $this->assertStringContainsString('left out', implode(' ', $progress['notes']));
        $this->assertSame('optional', Settings::get(OptionKeys::CHECKOUT_SETTINGS)->refresh()->to_array()['checkout_configuration']['phone_number_validation']);
        $this->assertTrue(Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['is_enabled_display_inclusive_taxed_price']);
        $currency = Settings::get(OptionKeys::CURRENCY_SETTINGS)->refresh()->to_array();
        $this->assertSame('after', $currency['currency_position']);
        $this->assertSame('space', $currency['thousand_separator']);
        $this->assertSame(',', $currency['decimal_separator']);
        $email = Settings::get(OptionKeys::EMAIL_SETTINGS)->refresh()->to_array();
        $this->assertFalse($email['customer_emails']['order_notifications']['order_processing']['is_enabled']);
        $this->assertFalse($email['admin_emails']['inventory_notifications']['low_stock']['is_enabled']);
        $this->assertTrue($email['admin_emails']['inventory_notifications']['out_of_stock']['is_enabled'], 'An email WooCommerce has no value for keeps the Kirki value.');
        $this->assertSame('Thanks from the shop', $email['default_template']['footer']);
        $this->assertSame('#112233', $email['default_template']['colors']['button']['background']);
    }

    /**
     * A hidden checkout field and an unknown separator keep the Kirki value and are reported.
     *
     * @return void
     */
    public function test_values_kirki_cannot_hold_are_reported()
    {
        update_option('woocommerce_checkout_company_field', 'hidden');
        update_option('woocommerce_price_thousand_sep', '\'');

        $progress = $this->migrate();

        $notes = implode(' ', $progress['notes']);
        $this->assertStringContainsString('is hidden in WooCommerce', $notes);
        $this->assertStringContainsString('thousand separator of WooCommerce is not supported', $notes);
        $this->assertSame(',', Settings::get(OptionKeys::CURRENCY_SETTINGS)->refresh()->to_array()['thousand_separator']);
    }

    /**
     * A zone with only a country selects every state of that country, and a country without states stays empty.
     *
     * @return void
     */
    public function test_country_only_zone_selects_all_states()
    {
        $without = null;

        foreach (array_keys(CountryData::index()) as $code) {
            if ($code !== 'US' && empty(CountryData::state_ids($code))) {
                $without = $code;
                break;
            }
        }

        $zone = $this->insert_woo_row('woocommerce_shipping_zones', ['zone_name' => 'Mixed', 'zone_order' => 1]);
        $this->insert_woo_row('woocommerce_shipping_zone_locations', ['zone_id' => $zone, 'location_code' => 'US', 'location_type' => 'country']);
        $this->insert_woo_row('woocommerce_shipping_zone_locations', ['zone_id' => $zone, 'location_code' => $without, 'location_type' => 'country']);

        $this->migrate();

        $regions = array_column(Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->to_array()['shipping_zones'][0]['regions'], null, 'country');
        $this->assertNotEmpty(CountryData::state_ids('US'));
        $this->assertSame(CountryData::state_ids('US'), $regions['US']['states']);
        $this->assertSame([], $regions[$without]['states']);
    }

    /**
     * The currency, the store address and the tax switches are left to the onboarding wizard.
     *
     * @return void
     */
    public function test_store_facts_are_not_migrated()
    {
        $before = [
            Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array(),
            Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['is_tax_inclusive_price'] ?? false,
        ];
        update_option('woocommerce_currency', 'EUR');
        update_option('woocommerce_store_city', 'Woo City');
        update_option('woocommerce_calc_taxes', 'yes');
        update_option('woocommerce_prices_include_tax', 'yes');

        $this->migrate();

        $this->assertSame('USD', Currency::base()->first()->code);
        $this->assertSame($before[0], Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array());
        $this->assertSame($before[1], Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['is_tax_inclusive_price'] ?? false);
    }

    /**
     * A whole-country tax rate becomes a country-wide region, and two rates of one country are added together.
     *
     * @return void
     */
    public function test_country_tax_rates_become_regions_and_add_together()
    {
        Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->set(['tax_regions' => []], false);
        $this->tax_rate(['tax_rate_country' => 'DE', 'tax_rate' => '19.0000', 'tax_rate_shipping' => 1]);
        $this->tax_rate(['tax_rate_country' => 'FR', 'tax_rate' => '20.0000', 'tax_rate_shipping' => 0]);
        $this->tax_rate(['tax_rate_country' => 'FR', 'tax_rate' => '2.0000', 'tax_rate_shipping' => 0, 'tax_rate_priority' => 2]);

        $progress = $this->migrate();

        $regions = array_column(Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['tax_regions'], null, 'code');
        $this->assertSame(['DE', 'FR'], array_keys($regions));
        $this->assertEquals(19, $regions['DE']['central_product_tax']);
        $this->assertEquals(19, $regions['DE']['central_shipping_tax']);
        $this->assertTrue($regions['DE']['is_central_tax_enabled']);
        $this->assertEquals(22, $regions['FR']['central_product_tax']);
        $this->assertEquals(0, $regions['FR']['central_shipping_tax']);
        $this->assertStringContainsString('added together', implode(' ', $progress['notes']));
    }

    /**
     * A rate for a state or another tax class is skipped and reported, and the Kirki regions are replaced.
     *
     * @return void
     */
    public function test_tax_rates_that_cannot_be_kept_exactly_are_skipped_and_replace_the_regions()
    {
        Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->set(['tax_regions' => [['code' => 'GB', 'name' => 'United Kingdom', 'type' => 'general', 'is_enabled' => true, 'central_product_tax' => 5]]], false);
        $this->tax_rate(['tax_rate_country' => 'US', 'tax_rate_state' => 'CA', 'tax_rate' => '7.25']);
        $this->tax_rate(['tax_rate_country' => 'CA', 'tax_rate' => '5', 'tax_rate_class' => 'reduced-rate']);
        $this->tax_rate(['tax_rate_country' => 'GB', 'tax_rate' => '20']);

        $this->migrate();

        $reasons = implode(' ', array_column(MigrationRun::query()->first()->skipped_items, 'reason'));
        $this->assertStringContainsString('state is not migrated', $reasons);
        $this->assertStringContainsString('standard tax class', $reasons);
        $regions = Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['tax_regions'];
        $this->assertCount(1, $regions);
        $this->assertEquals(20, $regions[0]['central_product_tax'], 'The WooCommerce rate replaces the existing region.');
    }

    /**
     * Kirki lists stay when WooCommerce has no tax rates or shipping zones.
     *
     * @return void
     */
    public function test_kirki_lists_stay_when_woocommerce_has_none()
    {
        $regions = [['code' => 'GB', 'name' => 'United Kingdom', 'type' => 'general', 'is_enabled' => true, 'central_product_tax' => 5]];
        Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->set(['tax_regions' => $regions], false);

        $this->migrate();

        $this->assertCount(1, Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['tax_regions']);
    }

    /**
     * Shipping zones keep their countries and their flat rate, free shipping and pickup methods.
     *
     * @return void
     */
    public function test_shipping_zones_are_migrated()
    {
        Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->set(['shipping_zones' => []], false);
        $zone = $this->insert_woo_row('woocommerce_shipping_zones', ['zone_name' => 'Europe', 'zone_order' => 1]);
        $this->insert_woo_row('woocommerce_shipping_zone_locations', ['zone_id' => $zone, 'location_code' => 'DE', 'location_type' => 'country']);
        $this->insert_woo_row('woocommerce_shipping_zone_locations', ['zone_id' => $zone, 'location_code' => 'FR', 'location_type' => 'country']);
        $this->insert_woo_row('woocommerce_shipping_zone_locations', ['zone_id' => $zone, 'location_code' => 'US:CA', 'location_type' => 'state']);
        $this->shipping_method($zone, 'flat_rate', 1, ['title' => 'Standard', 'cost' => '7.50', 'tax_status' => 'taxable']);
        $this->shipping_method($zone, 'free_shipping', 2, ['title' => 'Free']);
        $this->shipping_method($zone, 'flat_rate', 3, ['title' => 'Weighted', 'cost' => '5 + [qty]']);
        $this->shipping_method($zone, 'local_pickup', 4, ['title' => 'Pick up', 'cost' => '0', 'tax_status' => 'none']);

        $progress = $this->migrate();

        $zones = Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->to_array()['shipping_zones'];
        $this->assertCount(1, $zones);
        $this->assertSame('Europe', $zones[0]['title']);
        $this->assertSame(['DE', 'FR'], array_column($zones[0]['regions'], 'country'));
        $methods = array_column($zones[0]['shipping_methods'], null, 'name');
        $this->assertSame(750, $methods['Standard']['base_amount']);
        $this->assertTrue($methods['Standard']['is_taxable']);
        $this->assertSame('flat_rate', $methods['Free']['type']);
        $this->assertSame(0, $methods['Free']['base_amount']);
        $this->assertSame(0, $methods['Weighted']['base_amount']);
        $this->assertSame('local_pickup', $methods['Pick up']['type']);
        $this->assertFalse($methods['Pick up']['is_taxable']);
        $notes = implode(' ', $progress['notes']);
        $this->assertStringContainsString('1 location was left out', $notes);
        $this->assertStringContainsString('formula', $notes);
    }

    /**
     * A rate that applies to some postcodes or cities only is skipped, so it does not apply to the whole country.
     *
     * @return void
     */
    public function test_tax_rate_with_postcodes_is_skipped()
    {
        $rate = $this->tax_rate(['tax_rate_country' => 'GB', 'tax_rate' => '20']);
        $this->insert_woo_row('woocommerce_tax_rate_locations', ['location_code' => 'SW1', 'tax_rate_id' => $rate, 'location_type' => 'postcode']);

        $this->migrate();

        $this->assertStringContainsString('postcodes or cities', MigrationRun::query()->first()->skipped_items[0]['reason']);
        $this->assertSame([], Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['tax_regions']);
    }

    /**
     * Free shipping that needs a minimum amount or a coupon is left out, and the rest of world zone is reported.
     *
     * @return void
     */
    public function test_conditional_free_shipping_and_rest_of_world_are_not_widened()
    {
        Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->set(['shipping_zones' => []], false);
        $zone = $this->insert_woo_row('woocommerce_shipping_zones', ['zone_name' => 'Europe', 'zone_order' => 1]);
        $this->insert_woo_row('woocommerce_shipping_zone_locations', ['zone_id' => $zone, 'location_code' => 'DE', 'location_type' => 'country']);
        $this->shipping_method($zone, 'free_shipping', 1, ['title' => 'Free over 50', 'requires' => 'min_amount', 'min_amount' => '50']);
        $this->shipping_method($zone, 'free_shipping', 2, ['title' => 'Free', 'requires' => '']);
        $this->shipping_method(0, 'flat_rate', 3, ['title' => 'Everywhere', 'cost' => '9']);

        $progress = $this->migrate();

        $zones = Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->to_array()['shipping_zones'];
        $this->assertCount(1, $zones);
        $this->assertSame(['Free'], array_column($zones[0]['shipping_methods'], 'name'));
        $this->assertStringContainsString('needs a minimum amount or a coupon', implode(' ', $progress['notes']));
        $this->assertStringContainsString('no zone for locations that no other zone covers', implode(' ', array_column(MigrationRun::query()->first()->skipped_items, 'reason')));
    }

    /**
     * A zone with no whole-country location is skipped, so it does not ship to a wider area.
     *
     * @return void
     */
    public function test_zone_without_a_country_is_skipped()
    {
        Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->set(['shipping_zones' => []], false);
        $zone = $this->insert_woo_row('woocommerce_shipping_zones', ['zone_name' => 'California', 'zone_order' => 1]);
        $this->insert_woo_row('woocommerce_shipping_zone_locations', ['zone_id' => $zone, 'location_code' => 'US:CA', 'location_type' => 'state']);

        $this->migrate();

        $this->assertSame([], Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->to_array()['shipping_zones']);
        $this->assertStringContainsString('no whole-country location', MigrationRun::query()->first()->skipped_items[0]['reason']);
    }

    /**
     * Payment gateway keys are not copied into any Kirki setting.
     *
     * @return void
     */
    public function test_payment_gateway_secrets_are_not_copied()
    {
        update_option('woocommerce_paypal_settings', ['enabled' => 'yes', 'api_password' => 'SECRET-KEY-12345']);

        $this->migrate();

        global $wpdb;
        $copies = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->options} WHERE option_value LIKE %s", '%SECRET-KEY-12345%')); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- test check.
        $this->assertSame(1, $copies, 'Only the original WooCommerce option holds the secret.');
    }

    /**
     * Make USD the store currency again and remove the other currencies, because the migration commits its own changes.
     *
     * @return void
     */
    protected function reset_base_currency(): void
    {
        app(CurrencyService::class)->ensure_base('USD');
        Currency::query()->where('code', '!=', 'USD')->delete();
    }

    /**
     * Create a WooCommerce tax rate.
     *
     * @param array<string, mixed> $rate Columns to override.
     * @return int
     */
    protected function tax_rate(array $rate): int
    {
        return $this->insert_woo_row('woocommerce_tax_rates', array_merge(['tax_rate_country' => '', 'tax_rate_state' => '', 'tax_rate' => '10', 'tax_rate_name' => 'Tax', 'tax_rate_priority' => 1, 'tax_rate_compound' => 0, 'tax_rate_shipping' => 1, 'tax_rate_order' => 1, 'tax_rate_class' => ''], $rate));
    }

    /**
     * Create a shipping method for a zone, with its saved settings.
     *
     * @param int                  $zone_id     The zone id.
     * @param string               $method_id   The WooCommerce method id.
     * @param int                  $instance_id The instance id.
     * @param array<string, mixed> $settings    The method settings.
     * @return void
     */
    protected function shipping_method(int $zone_id, string $method_id, int $instance_id, array $settings): void
    {
        $this->woo_zone_method($zone_id, $method_id, $instance_id);
        update_option('woocommerce_' . $method_id . '_' . $instance_id . '_settings', $settings);
    }

    /**
     * Insert a zone method row.
     *
     * @param int    $zone_id     The zone id.
     * @param string $method_id   The WooCommerce method id.
     * @param int    $instance_id The instance id.
     * @return void
     */
    protected function woo_zone_method(int $zone_id, string $method_id, int $instance_id): void
    {
        global $wpdb;

        $wpdb->insert($wpdb->prefix . 'woocommerce_shipping_zone_methods', ['zone_id' => $zone_id, 'instance_id' => $instance_id, 'method_id' => $method_id, 'method_order' => $instance_id, 'is_enabled' => 1]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- test fixture row.
    }

    /**
     * Run a migration of the settings group to the end and return the last progress with all notes.
     *
     * @return array<string, mixed>
     */
    protected function migrate(): array
    {
        $run = $this->runner->start($this->source, ['settings']);
        $notes = [];

        do {
            $progress = $this->runner->next_chunk($run);
            $notes = array_merge($notes, $progress['notes']);
        } while (!$progress['done']);

        $progress['notes'] = $notes;

        return $progress;
    }
}
