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
    protected const GROUPS = [OptionKeys::GENERAL_SETTINGS, OptionKeys::TAX_SETTINGS, OptionKeys::SHIPPING_SETTINGS];

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
            Option::set($group, $this->snapshot[$group], true);
        }

        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        $this->reset_base_currency();

        foreach (['woocommerce_currency', 'woocommerce_store_address', 'woocommerce_store_address_2', 'woocommerce_store_city', 'woocommerce_store_postcode', 'woocommerce_default_country', 'woocommerce_calc_taxes', 'woocommerce_prices_include_tax', 'woocommerce_paypal_settings', 'woocommerce_flat_rate_1_settings', 'woocommerce_flat_rate_3_settings', 'woocommerce_free_shipping_2_settings', 'woocommerce_local_pickup_4_settings'] as $option) {
            delete_option($option);
        }

        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * An empty Kirki address is filled, a filled one is kept, and the state is reported and not migrated.
     *
     * @return void
     */
    public function test_store_address_fills_empty_fields_and_keeps_filled_ones()
    {
        Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->set(['store_address' => ['address_line_1' => '', 'address_line_2' => null, 'city' => 'Kept City', 'state' => null, 'postal_code' => null, 'country' => '']], false);
        update_option('woocommerce_store_address', '1 Shop Way');
        update_option('woocommerce_store_city', 'Woo City');
        update_option('woocommerce_store_postcode', '12345');
        update_option('woocommerce_default_country', 'US:CA');

        $progress = $this->migrate();

        $address = Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array()['store_address'];
        $this->assertSame('1 Shop Way', $address['address_line_1']);
        $this->assertSame('Kept City', $address['city']);
        $this->assertSame('12345', $address['postal_code']);
        $this->assertSame('US', $address['country']);
        $this->assertEmpty($address['state']);
        $notes = implode(' ', $progress['notes']);
        $this->assertStringContainsString('"city" is already set', $notes);
        $this->assertStringContainsString('state of the store address', $notes);
    }

    /**
     * The store currency follows WooCommerce when Kirki has no products or orders, and the change is reported.
     *
     * @return void
     */
    public function test_currency_follows_woocommerce_on_an_empty_store()
    {
        update_option('woocommerce_currency', 'EUR');

        $progress = $this->migrate();

        $this->assertSame('EUR', Currency::base()->first()->code);
        $this->assertStringContainsString('changed from USD to EUR', implode(' ', $progress['notes']));
    }

    /**
     * The store currency is kept when Kirki already has products, and the report says so.
     *
     * @return void
     */
    public function test_currency_is_kept_when_kirki_has_products()
    {
        $product = Product::create(['title' => 'Existing', 'slug' => 'existing-settings', 'status' => 'draft', 'created_by' => get_current_user_id(), 'updated_by' => get_current_user_id()]);
        update_option('woocommerce_currency', 'EUR');

        $progress = $this->migrate();

        $this->assertSame('USD', Currency::base()->first()->code);
        $this->assertStringContainsString('stays USD', implode(' ', $progress['notes']));

        Product::query()->where('id', $product->id)->delete();
    }

    /**
     * Tax calculation is turned on to match WooCommerce, with its price mode.
     *
     * @return void
     */
    public function test_tax_calculation_is_turned_on()
    {
        Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->set(['is_tax_calculation_enabled' => false], false);
        update_option('woocommerce_calc_taxes', 'yes');
        update_option('woocommerce_prices_include_tax', 'yes');

        $this->migrate();

        $this->assertTrue((bool) Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array()['is_tax_calculation_enabled']);
        $this->assertTrue((bool) Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['is_tax_inclusive_price']);
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
     * A rate for a state, another tax class or a region that Kirki already has is skipped and reported.
     *
     * @return void
     */
    public function test_tax_rates_that_cannot_be_kept_exactly_are_skipped()
    {
        Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->set(['tax_regions' => [['code' => 'GB', 'name' => 'United Kingdom', 'type' => 'general', 'is_enabled' => true, 'central_product_tax' => 5]]], false);
        $this->tax_rate(['tax_rate_country' => 'US', 'tax_rate_state' => 'CA', 'tax_rate' => '7.25']);
        $this->tax_rate(['tax_rate_country' => 'CA', 'tax_rate' => '5', 'tax_rate_class' => 'reduced-rate']);
        $this->tax_rate(['tax_rate_country' => 'GB', 'tax_rate' => '20']);

        $this->migrate();

        $reasons = implode(' ', array_column(MigrationRun::query()->first()->skipped_items, 'reason'));
        $this->assertStringContainsString('state is not migrated', $reasons);
        $this->assertStringContainsString('standard tax class', $reasons);
        $this->assertStringContainsString('already has a tax region', $reasons);
        $regions = Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array()['tax_regions'];
        $this->assertCount(1, $regions);
        $this->assertEquals(5, $regions[0]['central_product_tax'], 'The existing region is unchanged.');
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
