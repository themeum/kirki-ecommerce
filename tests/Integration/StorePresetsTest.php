<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\App\Services\LegalConsentService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Services\StorePresetService;
use Kirki\Ecommerce\App\Setup\Presets\Local\LocalPresetSource;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

/**
 * Covers the industry and location presets that store setup applies.
 */
class StorePresetsTest extends RestTestCase
{
    /**
     * Start every test from a store with no preset targets.
     *
     * Plugin table state carries across tests in a class, and the seeder queue
     * remembers which seeders ran for the whole process, so both are reset.
     * Pages that store setup created survive the rollback, so they are deleted.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_seeder_queue();

        foreach (get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids']) as $page_id) {
            wp_delete_post($page_id, true);
        }

        Product::query()->delete();
        Category::query()->delete();
        AttributeValue::query()->delete();
        Attribute::query()->delete();
        ProductSchema::query()->delete();
        Coupon::query()->delete();
        ShippingProfile::query()->delete();
        TaxProfile::query()->delete();
        Currency::query()->delete();
    }

    /**
     * Delete the options store setup wrote and commit the deletion.
     *
     * Store setup commits the test's wrapping transaction (see
     * OnboardingApiTest::tearDown), so its options survive the rollback.
     *
     * @return void
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

        delete_option('wp_page_for_privacy_policy');
        $wpdb->query('COMMIT');
        $this->reset_option_manager_cache();
        wp_cache_flush();
    }

    public function test_fashion_store_gets_color_and_fashion_attributes(): void
    {
        $this->setup_store(['industry' => 'fashion-and-apparel']);

        $slugs = Attribute::query()->get()->pluck('slug')->all();
        sort($slugs);
        $this->assertSame(['color', 'material', 'size'], $slugs);

        $size = Attribute::query()->where('slug', 'size')->first();
        $this->assertSame(['XS', 'S', 'M', 'L', 'XL', 'XXL'], AttributeValue::query()->where('attribute_id', $size->id)->order_by('id')->get()->pluck('value')->all());

        $color = Attribute::query()->where('slug', 'color')->first();
        $this->assertSame('color', $color->type);
        $red = AttributeValue::query()->where('attribute_id', $color->id)->where('value', 'Red')->first();
        $this->assertSame('#FF0000', $red->color);
    }

    public function test_other_industry_gets_color_only(): void
    {
        $this->setup_store(['industry' => 'other']);

        $this->assertSame(['color'], Attribute::query()->get()->pluck('slug')->all());
    }

    public function test_existing_attribute_is_left_unchanged(): void
    {
        $size = Attribute::create(['name' => 'Size', 'slug' => 'size', 'type' => 'list']);
        $size->values()->create(['value' => 'One size']);

        $this->setup_store(['industry' => 'fashion-and-apparel']);

        $this->assertSame(1, Attribute::query()->where('slug', 'size')->count());
        $this->assertSame(['One size'], AttributeValue::query()->where('attribute_id', $size->id)->order_by('id')->get()->pluck('value')->all());
    }

    public function test_one_default_schema_profile_with_every_picker_field(): void
    {
        $this->setup_store();

        $profiles = ProductSchema::query()->get();
        $this->assertCount(1, $profiles);
        $this->assertTrue((bool) $profiles->first()->is_default);
        $this->assertEquals([
            'Product' => ['name', 'description', 'image'],
            'Offer' => ['price', 'priceCurrency', 'availability'],
            'AggregateRating' => ['ratingValue', 'reviewCount'],
            'Brand' => ['name', 'logo'],
        ], $profiles->first()->schema);
    }

    public function test_existing_schema_profile_blocks_the_preset(): void
    {
        ProductSchema::query()->insert([['name' => 'Mine', 'is_default' => true, 'schema' => wp_json_encode(['Product' => ['name']])]]);

        $this->setup_store();

        $this->assertSame(['Mine'], ProductSchema::query()->get()->pluck('name')->all());
    }

    public function test_sample_data_creates_the_welcome_coupon_inactive(): void
    {
        $this->setup_store(['industry' => 'other']);
        $this->assertFalse(Coupon::query()->exists());

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));

        $coupon = Coupon::query()->where('code', 'WELCOME50')->first();
        $this->assertNotNull($coupon);
        $this->assertFalse($coupon->is_active);
        $this->assertSame('inactive', $coupon->get_status());
        $this->assertSame('order', $coupon->discount_target);
        $this->assertSame('percentage', $coupon->discount_value_type);
        $this->assertEquals(50, $coupon->discount_amount_percentage);
        $this->assertSame('all-products', $coupon->eligible_item_type);
        $this->assertFalse($coupon->has_end_datetime);
    }

    public function test_sample_data_leaves_an_existing_coupon_code_unchanged(): void
    {
        Coupon::create(['title' => 'Mine', 'code' => 'WELCOME50', 'discount_value_type' => 'percentage', 'discount_amount_percentage' => 10]);
        $this->setup_store(['industry' => 'other']);

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));

        $this->assertGreaterThan(0, Product::query()->count());
        $this->assertSame(1, Coupon::query()->where('code', 'WELCOME50')->count());
        $this->assertEquals(10, Coupon::query()->where('code', 'WELCOME50')->first()->discount_amount_percentage);
    }

    public function test_applying_again_creates_no_duplicates(): void
    {
        $this->setup_store(['industry' => 'fashion-and-apparel']);
        $category_count = Category::query()->count();

        app()->make(StorePresetService::class)->apply(PresetContext::from_settings());

        $this->assertSame($category_count, Category::query()->count());
        $this->assertSame(3, Attribute::query()->count());
        $this->assertSame(1, ProductSchema::query()->count());
        $this->assertSame(1, ShippingProfile::query()->where('name', 'General')->count());
        $this->assertCount(1, $this->zones());
    }

    public function test_fashion_store_gets_its_category_tree(): void
    {
        $this->setup_store(['industry' => 'fashion-and-apparel']);

        $women = Category::query()->where('name', 'Women')->first();
        $this->assertNotNull($women);
        $this->assertSame(1, $women->level);
        $this->assertNull($women->parent_id);

        $dresses = Category::query()->where('name', 'Dresses')->first();
        $this->assertSame($women->id, $dresses->parent_id);
        $this->assertSame(2, $dresses->level);

        $outerwear_slugs = Category::query()->where('name', 'Outerwear')->get()->pluck('slug')->all();
        $this->assertCount(2, $outerwear_slugs);
        $this->assertCount(2, array_unique($outerwear_slugs));
        $this->assertSame(0, Category::query()->where('level', 3)->count());
    }

    public function test_other_industry_gets_no_categories(): void
    {
        $this->setup_store(['industry' => 'other']);

        $this->assertFalse(Category::query()->exists());
    }

    public function test_existing_category_blocks_the_category_tree(): void
    {
        Category::create(['name' => 'Mine', 'slug' => 'mine', 'level' => 1, 'is_active' => true, 'is_deletable' => true]);

        $this->setup_store(['industry' => 'fashion-and-apparel']);

        $this->assertSame(['Mine'], Category::query()->get()->pluck('name')->all());
    }

    public function test_sample_data_creates_the_demo_categories(): void
    {
        $this->setup_store(['industry' => 'other']);

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));

        $home = Category::query()->where('name', 'Home & Living')->where('level', 1)->first();
        $this->assertNotNull($home);
        $decor = Category::query()->where('name', 'Home Décor')->where('parent_id', $home->id)->first();
        $this->assertNotNull(Category::query()->where('name', 'Vases')->where('parent_id', $decor->id)->first());

        foreach (Product::query()->get() as $product) {
            $this->assertNotEmpty($product->categories()->get()->all(), "{$product->title} has no category");
        }
    }

    public function test_sample_data_creates_missing_demo_attributes_and_reuses_color(): void
    {
        $this->setup_store(['industry' => 'other']);
        $color = Attribute::query()->where('slug', 'color')->first();
        $color_value_count = AttributeValue::query()->where('attribute_id', $color->id)->count();

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));

        $this->assertSame(1, Attribute::query()->where('slug', 'color')->count());
        $this->assertSame($color_value_count, AttributeValue::query()->where('attribute_id', $color->id)->count());

        $material = Attribute::query()->where('slug', 'material')->first();
        $this->assertNotNull($material);
        $this->assertSame(['Ceramic', 'Glass'], AttributeValue::query()->where('attribute_id', $material->id)->order_by('id')->get()->pluck('value')->all());
        $this->assertGreaterThan(0, Product::query()->count());
    }

    public function test_sample_data_adds_a_missing_color_value(): void
    {
        $color = Attribute::create(['name' => 'Color', 'slug' => 'color', 'type' => 'color']);
        $color->values()->create(['value' => 'Red', 'color' => '#FF0000']);
        $this->setup_store(['industry' => 'other']);

        $this->assert_api_success($this->request('POST', 'onboarding/sample-data'));

        $values = AttributeValue::query()->where('attribute_id', $color->id)->get()->pluck('value')->all();
        sort($values);
        $this->assertSame(['Blue', 'Green', 'Orange', 'Red'], $values);
    }

    public function test_one_default_shipping_and_tax_profile_each(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet']);

        $shipping = ShippingProfile::query()->order_by('id')->get();
        $this->assertSame(['General', 'Perishable', 'Frozen', 'Fragile'], $shipping->pluck('name')->all());
        $this->assertSame(['General'], ShippingProfile::query()->where('is_default', true)->get()->pluck('name')->all());

        $this->assertSame(['Standard', 'Food', 'Alcoholic Beverages'], TaxProfile::query()->order_by('id')->get()->pluck('name')->all());
        $this->assertSame(['Standard'], TaxProfile::query()->where('is_default', true)->get()->pluck('name')->all());
    }

    public function test_existing_default_profile_stays_the_only_default(): void
    {
        ShippingProfile::create(['name' => 'Mine', 'is_default' => true]);

        $this->setup_store(['industry' => 'other']);

        $this->assertSame(['Mine'], ShippingProfile::query()->where('is_default', true)->get()->pluck('name')->all());
        $this->assertSame(1, ShippingProfile::query()->where('name', 'General')->count());
    }

    public function test_tax_profiles_are_created_when_tax_is_off(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'is_tax_collected' => false]);

        $this->assertSame(1, TaxProfile::query()->where('name', 'Food')->count());
    }

    public function test_legal_pages_are_published_with_placeholder_text(): void
    {
        $this->setup_store();

        foreach (['terms-and-conditions', 'privacy-policy', 'refund-and-returns-policy'] as $slug) {
            $page = get_page_by_path($slug, OBJECT, 'page');
            $this->assertNotNull($page, "{$slug} page missing");
            $this->assertSame('publish', $page->post_status);
            $this->assertStringContainsString('Replace this text', $page->post_content);
        }
    }

    public function test_eu_privacy_consent_is_mandatory(): void
    {
        $this->setup_store(['country' => 'DE', 'currency' => 'EUR']);

        $consents = $this->consents_by_title();
        $this->assertSame('mandatory_checkbox', $consents['Privacy Policy']['method']);
        $this->assertSame(['signup', 'checkout'], $consents['Privacy Policy']['locations']);
        $this->assertSame('mandatory_checkbox', $consents['Terms & Conditions']['method']);
        $this->assertSame(['checkout'], $consents['Terms & Conditions']['locations']);
        $this->assertSame('optional_checkbox', $consents['Marketing emails']['method']);

        foreach ($consents as $consent) {
            $this->assertTrue($consent['is_enabled']);
            $this->assertNotEmpty($consent['id']);
        }
    }

    public function test_non_gdpr_privacy_consent_is_display_text(): void
    {
        $this->setup_store(['country' => 'BD', 'currency' => 'BDT']);

        $this->assertSame('display_text_only', $this->consents_by_title()['Privacy Policy']['method']);
    }

    public function test_terms_consent_links_to_the_terms_page(): void
    {
        $this->setup_store();

        $message = $this->consents_by_title()['Terms & Conditions']['message'];
        $this->assertStringContainsString('{terms_and_conditions}', $message);

        $html = app()->make(LegalConsentService::class)->render_message($message);
        $terms = get_page_by_path('terms-and-conditions', OBJECT, 'page');
        $this->assertStringContainsString('href="' . esc_url(get_permalink($terms->ID)) . '"', $html);
        $this->assertStringContainsString('>Terms &amp; Conditions</a>', $html);
    }

    public function test_published_wordpress_privacy_page_is_reused(): void
    {
        $privacy_page_id = wp_insert_post(['post_title' => 'Our Privacy', 'post_name' => 'our-privacy', 'post_type' => 'page', 'post_status' => 'publish']);
        update_option('wp_page_for_privacy_policy', $privacy_page_id);

        $this->setup_store();

        $this->assertNull(get_page_by_path('privacy-policy', OBJECT, 'page'));
        $this->assertStringContainsString('{our_privacy}', $this->consents_by_title()['Privacy Policy']['message']);
    }

    public function test_existing_consents_and_pages_are_not_changed(): void
    {
        $terms_page_id = wp_insert_post(['post_title' => 'My terms', 'post_name' => 'terms-and-conditions', 'post_content' => 'Mine', 'post_type' => 'page', 'post_status' => 'publish']);
        Option::set(OptionKeys::LEGAL_SETTINGS, ['consents' => [['id' => 'mine', 'title' => 'Mine', 'locations' => ['checkout'], 'message' => 'Mine', 'method' => 'optional_checkbox', 'is_enabled' => true]]]);
        $this->reset_option_manager_cache();

        $this->setup_store();

        $this->assertSame(['Mine'], array_column(Option::get(OptionKeys::LEGAL_SETTINGS)['consents'], 'title'));
        $this->assertSame('Mine', get_post_field('post_content', $terms_page_id));
        $this->assertCount(1, get_posts(['post_type' => 'page', 'name' => 'terms-and-conditions', 'post_status' => 'any']));
    }

    public function test_eu_store_gets_domestic_and_regional_zones(): void
    {
        $this->setup_store(['country' => 'DE', 'currency' => 'EUR']);

        $zones = $this->zones();
        $this->assertSame(['Domestic', 'Regional'], array_column($zones, 'title'));
        $this->assertSame(['DE'], $this->zone_countries($zones[0]));

        $regional = $this->zone_countries($zones[1]);
        $this->assertCount(26, $regional);
        $this->assertNotContains('DE', $regional);
        $this->assertContains('FR', $regional);

        foreach ($zones as $zone) {
            $this->assertTrue($zone['is_enabled']);
            $this->assertNotEmpty($zone['id']);
        }
    }

    public function test_country_without_bloc_gets_only_the_domestic_zone(): void
    {
        $this->setup_store(['country' => 'BD', 'currency' => 'BDT']);

        $this->assertSame(['Domestic'], array_column($this->zones(), 'title'));
    }

    public function test_matching_currency_enables_country_methods_with_amounts(): void
    {
        $this->setup_store(['country' => 'GB', 'currency' => 'GBP']);

        $methods = array_column($this->zones()[0]['shipping_methods'], null, 'name');
        $this->assertTrue($methods['Standard Delivery']['is_enabled']);
        $this->assertSame(399, $methods['Standard Delivery']['base_amount']);
        $this->assertSame('flat_rate', $methods['Standard Delivery']['type']);
        $this->assertTrue($methods['Local Pickup']['is_enabled']);
        $this->assertArrayNotHasKey('key', $methods['Standard Delivery']);
    }

    public function test_other_currency_disables_country_methods_at_zero(): void
    {
        $this->setup_store(['country' => 'GB', 'currency' => 'USD']);

        $methods = array_column($this->zones()[0]['shipping_methods'], null, 'name');
        $this->assertSame(['Standard Delivery', 'Next Day Delivery', 'Local Pickup'], array_keys($methods));
        $this->assertFalse($methods['Standard Delivery']['is_enabled']);
        $this->assertSame(0, $methods['Standard Delivery']['base_amount']);
        $this->assertFalse($methods['Local Pickup']['is_enabled']);
    }

    public function test_country_without_method_data_gets_generic_methods_disabled(): void
    {
        $this->setup_store(['country' => 'MY', 'currency' => 'MYR', 'is_tax_collected' => false]);

        $methods = $this->zones()[0]['shipping_methods'];
        $this->assertSame(['Standard Shipping', 'Express Shipping', 'Local Pickup'], array_column($methods, 'name'));

        foreach ($methods as $method) {
            $this->assertFalse($method['is_enabled']);
        }
    }

    public function test_perishable_cart_is_not_offered_regional_methods(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'country' => 'DE', 'currency' => 'EUR']);
        $perishable_id = ShippingProfile::query()->where('name', 'Perishable')->first()->id;

        $regional_rules = $this->zones()[1]['shipping_methods'][0]['shipping_rules'];
        $this->assertSame([[
            'relation' => 'AND',
            'conditions' => [['type' => 'shipping_profile', 'operator' => '=', 'value' => (string) $perishable_id]],
            'action' => ['type' => 'disable_shipping_method', 'value' => null],
        ]], array_slice($regional_rules, 0, 1));

        $service = $this->shipping_service();
        $this->assertSame([], $service->get_final_available_shipping_options($this->shipping_context('FR', $perishable_id)));

        $general_options = $service->get_final_available_shipping_options($this->shipping_context('FR', null));
        $this->assertSame(['EU Shipping'], array_column($general_options, 'name'));

        $domestic_options = $service->get_final_available_shipping_options($this->shipping_context('DE', $perishable_id));
        $this->assertSame(['Standardversand', 'Expressversand', 'Abholung im Geschäft'], array_column($domestic_options, 'name'));

        $this->assertSame([], $service->get_final_available_shipping_options($this->shipping_context('US', null)));
    }

    public function test_unreadable_data_file_writes_nothing_and_setup_succeeds(): void
    {
        app()->instance(PresetRepository::class, new PresetRepository('/missing/preconfigured-data.json'));

        try {
            $this->setup_store(['industry' => 'fashion-and-apparel', 'country' => 'DE', 'currency' => 'EUR']);
        } finally {
            static::forget_singleton(PresetRepository::class);
        }

        $this->assertFalse(Category::query()->exists());
        $this->assertFalse(Attribute::query()->exists());
        $this->assertSame([], Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'] ?? []);
        $this->assertNotEmpty(Option::get(OptionKeys::PRESETS_APPLIED_AT));
        $this->assertNotEmpty(Option::get(OptionKeys::ONBOARDING_COMPLETED_AT));
    }

    public function test_malformed_preset_records_are_skipped(): void
    {
        app()->instance(LocalPresetSource::class, new class extends LocalPresetSource {
            public function __construct()
            {
            }

            public function fetch(PresetContext $context)
            {
                return [
                    'shipping_profiles' => [['key' => 'general', 'name' => 'General', 'is_default' => true], ['key' => 'fragile', 'name' => 'Fragile']],
                    'shipping_zones' => [
                        ['title' => 'Nowhere', 'is_enabled' => true, 'regions' => [['country' => 'ZZ']], 'methods' => []],
                        ['title' => 'Home', 'is_enabled' => true, 'regions' => [['country' => 'DE']], 'methods' => [
                            ['type' => 'flat_rate', 'name' => '<b>Standard</b>', 'base_amount' => 500, 'is_taxable' => true, 'is_enabled' => true, 'rules' => [
                                ['profile' => 'fragile', 'action' => ['type' => 'multiply_shipping_cost', 'value' => 1.5]],
                                ['profile' => 'fragile', 'action' => ['type' => 'set_shipping_cost', 'value' => 1]],
                                ['profile' => 'unknown', 'action' => ['type' => 'disable_shipping_method', 'value' => null]],
                            ]],
                            ['type' => 'weight', 'name' => 'By weight', 'is_enabled' => true],
                        ]],
                    ],
                ];
            }
        });

        try {
            $this->setup_store(['industry' => 'other', 'country' => 'DE', 'currency' => 'EUR']);
        } finally {
            static::forget_singleton(LocalPresetSource::class);
        }

        $zones = $this->zones();
        $this->assertSame(['Home'], array_column($zones, 'title'));
        $this->assertCount(1, $zones[0]['shipping_methods']);

        $method = $zones[0]['shipping_methods'][0];
        $fragile_id = ShippingProfile::query()->where('name', 'Fragile')->first()->id;
        $this->assertSame('Standard', $method['name']);
        $this->assertSame(500, $method['base_amount']);
        $this->assertSame([[
            'relation' => 'AND',
            'conditions' => [['type' => 'shipping_profile', 'operator' => '=', 'value' => (string) $fragile_id]],
            'action' => ['type' => 'multiply_shipping_cost', 'value' => 1.5],
        ]], $method['shipping_rules']);
    }

    public function test_fragile_profile_multiplies_the_cost(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'country' => 'DE', 'currency' => 'EUR']);
        $fragile_id = ShippingProfile::query()->where('name', 'Fragile')->first()->id;

        $options = $this->shipping_service()->get_final_available_shipping_options($this->shipping_context('DE', $fragile_id));

        $this->assertEquals(round(499 * 1.25), round(array_column($options, 'base_cost', 'name')['Standardversand']));
    }

    public function test_preset_zones_save_unchanged_through_the_settings_api(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'country' => 'DE', 'currency' => 'EUR']);
        $stored = $this->zones();

        $shipping = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::SHIPPING_SETTINGS))['data'];

        // The response adds display-only money objects that the admin form never sends back.
        foreach ($shipping['shipping_zones'] as $zone_index => $zone) {
            foreach ($zone['shipping_methods'] as $method_index => $method) {
                unset($shipping['shipping_zones'][$zone_index]['shipping_methods'][$method_index]['base_amount_money_object']);
            }
        }

        $this->assert_api_success($this->request('PUT', 'settings', ['key' => OptionKeys::SHIPPING_SETTINGS, 'data' => $shipping]));

        $this->reset_option_manager_cache();
        $this->assertEquals($stored, $this->zones());
    }

    public function test_existing_zone_blocks_the_preset_zones(): void
    {
        Option::set(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => [['id' => 'mine', 'title' => 'Mine', 'is_enabled' => true, 'regions' => [], 'shipping_methods' => []]]]);
        $this->reset_option_manager_cache();

        $this->setup_store();

        $this->assertSame(['Mine'], array_column($this->zones(), 'title'));
    }

    public function test_preset_shipping_is_marked_preconfigured(): void
    {
        $this->setup_store(['country' => 'GB', 'currency' => 'GBP', 'is_tax_collected' => false]);

        $this->assertContains('shipping', Option::get(OptionKeys::SETUP_CHECKLIST)['preconfigured']);
    }

    public function test_eu_store_gets_a_micro_business_region_with_its_own_country_only(): void
    {
        $this->setup_store(['country' => 'FR', 'currency' => 'EUR']);

        $regions = $this->tax_regions();
        $this->assertCount(1, $regions);
        $this->assertSame('EU', $regions[0]['code']);
        $this->assertSame('micro_business', $regions[0]['type']);
        $this->assertTrue($regions[0]['is_enabled']);
        $this->assertSame(['FR'], array_column($regions[0]['countries'], 'code'));
        $this->assertEquals(20, $regions[0]['countries'][0]['rate']);
    }

    public function test_us_store_gets_its_home_state_only(): void
    {
        $this->setup_store(['country' => 'US', 'currency' => 'USD', 'store_address' => ['city' => 'Austin', 'state' => '1407']]);

        $region = $this->tax_regions()[0];
        $this->assertSame('US', $region['code']);
        $this->assertFalse($region['is_central_tax_enabled']);
        $this->assertCount(1, $region['states']);
        $this->assertSame('1407', $region['states'][0]['id']);
        $this->assertSame('Texas', $region['states'][0]['name']);
        $this->assertEquals(6.25, $region['states'][0]['product_tax_rate']);
        $this->assertEquals(6.25, $region['states'][0]['shipping_tax_rate']);
    }

    public function test_us_store_without_a_state_gets_no_region(): void
    {
        $this->setup_store(['country' => 'US', 'currency' => 'USD', 'store_address' => ['city' => 'Austin']]);

        $this->assertSame([], $this->tax_regions());
    }

    public function test_canadian_store_gets_every_province_with_its_own_pst(): void
    {
        $this->setup_store(['country' => 'CA', 'currency' => 'CAD', 'store_address' => ['city' => 'Vancouver', 'state' => '875']]);

        $states = array_column($this->tax_regions()[0]['states'], null, 'name');
        $this->assertCount(13, $states);
        $this->assertEquals(12, $states['British Columbia']['product_tax_rate']);
        $this->assertEquals(5, $states['Quebec']['product_tax_rate']);
        $this->assertEquals(13, $states['Ontario']['product_tax_rate']);
        $this->assertEquals(14, $states['Nova Scotia']['product_tax_rate']);
    }

    public function test_country_wide_vat_country_gets_one_rate(): void
    {
        $this->setup_store(['country' => 'BD', 'currency' => 'BDT']);

        $region = $this->tax_regions()[0];
        $this->assertSame('BD', $region['code']);
        $this->assertSame('general', $region['type']);
        $this->assertTrue($region['is_central_tax_enabled']);
        $this->assertEquals(15, $region['central_product_tax']);
        $this->assertEquals(15, $region['central_shipping_tax']);
        $this->assertSame([], $region['states']);
    }

    public function test_no_region_when_not_collecting_tax(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'is_tax_collected' => false]);

        $this->assertSame([], $this->tax_regions());
        $this->assertSame(1, TaxProfile::query()->where('name', 'Food')->count());
    }

    public function test_country_without_tax_data_gets_no_region(): void
    {
        $this->setup_store(['country' => 'MY', 'currency' => 'MYR']);

        $this->assertSame([], $this->tax_regions());
    }

    public function test_reduced_food_rate_becomes_a_tax_rule(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'country' => 'DE', 'currency' => 'EUR']);
        $food_id = TaxProfile::query()->where('name', 'Food')->first()->id;

        $this->assertSame([[
            'relation' => 'AND',
            'conditions' => [['type' => 'tax_profile', 'operator' => '=', 'value' => (string) $food_id]],
            'action' => ['type' => 'set_product_tax_rate', 'value' => 7],
        ]], $this->tax_regions()[0]['rules']);
    }

    public function test_zero_rate_on_a_country_wide_region_is_a_rate_rule(): void
    {
        $this->setup_store(['industry' => 'fashion-and-apparel', 'country' => 'GB', 'currency' => 'GBP']);
        $childrens_id = TaxProfile::query()->where('name', "Children's Clothing")->first()->id;

        $rules = $this->tax_regions()[0]['rules'];
        $this->assertCount(1, $rules);
        $this->assertSame((string) $childrens_id, $rules[0]['conditions'][0]['value']);
        $this->assertSame(['type' => 'set_product_tax_rate', 'value' => 0], $rules[0]['action']);
    }

    public function test_canadian_zero_rated_groceries_apply_in_every_province(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'country' => 'CA', 'currency' => 'CAD', 'store_address' => ['city' => 'Toronto', 'state' => '866']]);
        $food_id = (string) TaxProfile::query()->where('name', 'Food')->first()->id;

        foreach ($this->tax_regions()[0]['states'] as $state) {
            $food_rules = array_values(array_filter($state['rules'], fn($rule) => $rule['conditions'][0]['value'] === $food_id));
            $this->assertSame([['type' => 'set_product_tax_rate', 'value' => 0]], array_column($food_rules, 'action'), "{$state['name']} has no zero-rated food rule");
        }
    }

    public function test_us_state_that_exempts_groceries_gets_an_exempt_rule(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'country' => 'US', 'currency' => 'USD', 'store_address' => ['city' => 'Austin', 'state' => '1407']]);
        $food_id = (string) TaxProfile::query()->where('name', 'Food')->first()->id;

        $rules = $this->tax_regions()[0]['states'][0]['rules'];
        $this->assertCount(1, $rules);
        $this->assertSame($food_id, $rules[0]['conditions'][0]['value']);
        $this->assertSame(['type' => 'set_product_tax_exempt', 'value' => 0], $rules[0]['action']);
    }

    public function test_existing_region_blocks_the_preset_region(): void
    {
        Option::set(OptionKeys::TAX_SETTINGS, ['tax_regions' => [['code' => 'GB', 'is_enabled' => false]]]);
        $this->reset_option_manager_cache();

        $this->setup_store();

        $this->assertSame([['code' => 'GB', 'is_enabled' => false]], $this->tax_regions());
    }

    public function test_preset_tax_is_marked_preconfigured(): void
    {
        $this->setup_store(['country' => 'FR', 'currency' => 'EUR']);

        $this->assertContains('tax', Option::get(OptionKeys::SETUP_CHECKLIST)['preconfigured']);
    }

    public function test_preset_tax_region_saves_unchanged_through_the_settings_api(): void
    {
        $this->setup_store(['industry' => 'food-beverage-and-gourmet', 'country' => 'CA', 'currency' => 'CAD', 'store_address' => ['city' => 'Toronto', 'state' => '866']]);
        $stored = $this->tax_regions();

        $tax = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::TAX_SETTINGS))['data'];
        $this->assert_api_success($this->request('PUT', 'settings', ['key' => OptionKeys::TAX_SETTINGS, 'data' => $tax]));

        $this->reset_option_manager_cache();
        $this->assertEquals($stored, $this->tax_regions());
    }

    /**
     * Submit store setup with the given answers over the defaults.
     *
     * @param array $overrides Fields to override.
     * @return void
     */
    protected function setup_store(array $overrides = []): void
    {
        $this->assert_api_success($this->request('POST', 'onboarding', array_merge([
            'store_name' => 'Acme',
            'industry' => 'fashion-and-apparel',
            'country' => 'GB',
            'store_address' => ['city' => 'London'],
            'currency' => 'GBP',
            'is_tax_collected' => true,
            'is_tax_inclusive_price' => true,
            'store_tax_id' => null,
        ], $overrides)));
    }

    /**
     * Get the stored consents keyed by title.
     *
     * @return array<string, array<string, mixed>>
     */
    protected function consents_by_title(): array
    {
        return array_column(Option::get(OptionKeys::LEGAL_SETTINGS)['consents'], null, 'title');
    }

    /**
     * Get the stored shipping zones.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function zones(): array
    {
        return Option::get(OptionKeys::SHIPPING_SETTINGS)['shipping_zones'];
    }

    /**
     * Get the destination country codes of a zone.
     *
     * @param array<string, mixed> $zone Stored zone.
     * @return string[]
     */
    protected function zone_countries(array $zone): array
    {
        return array_column($zone['regions'], 'country');
    }

    /**
     * Build a one-item shipping calculation context.
     *
     * @param string   $country    Destination country code.
     * @param int|null $profile_id The item's shipping profile, or null for the default.
     * @return CalculationContextDTO
     */
    protected function shipping_context(string $country, $profile_id): CalculationContextDTO
    {
        return CalculationContextDTO::from_array([
            'items' => collection([(object) [
                'weight' => 1,
                'quantity' => 1,
                'base_unit_price' => 1000,
                'shipping_profile_id' => $profile_id,
                'product_categories' => [],
            ]]),
            'shipping_address' => ['country' => $country, 'state' => null],
        ]);
    }

    /**
     * Resolve a shipping service that reads the shipping settings setup just wrote.
     *
     * The service is a singleton that takes the settings in its constructor, so
     * one resolved by an earlier test would still hold that test's zones.
     *
     * @return ShippingService
     */
    protected function shipping_service(): ShippingService
    {
        static::forget_singleton(ShippingService::class);
        $this->reset_settings_factory_cache();
        $this->reset_option_manager_cache();

        return app()->make(ShippingService::class);
    }

    /**
     * Get the stored tax regions.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function tax_regions(): array
    {
        return Option::get(OptionKeys::TAX_SETTINGS)['tax_regions'] ?? [];
    }

    /**
     * Clear the seeder queue's process-wide record of called and resolved seeders.
     *
     * @return void
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
