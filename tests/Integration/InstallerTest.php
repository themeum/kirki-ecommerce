<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Install;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\StorefrontPages;
use Kirki\Ecommerce\App\Installer;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\ResetsSettingsState;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\App\base_currency;

class InstallerTest extends RestTestCase
{
    use ResetsSettingsState;

    /**
     * Put the install back to a never-run state before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        Option::delete(Install::INSTALLED_VERSION);
        static::reset_settings_state();
    }

    /**
     * Leave no install or settings state behind for the next test class.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        Option::delete(Install::INSTALLED_VERSION);
        static::reset_settings_state();
        parent::tearDown();
    }

    /**
     * The recorded page map from the advance settings option.
     *
     * @return array
     * @since 1.0.0
     */
    protected function page_map(): array
    {
        return Option::get(OptionKeys::ADVANCE_SETTINGS)['pages'] ?? [];
    }

    /**
     * A first install provisions every default record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_first_install_provisions_default_records(): void
    {
        Installer::run();

        $this->assertGreaterThan(0, Currency::query()->count());
        $this->assertGreaterThan(0, ShippingProfile::query()->count());
        $this->assertGreaterThan(0, TaxProfile::query()->count());
        $this->assertGreaterThan(0, ShippingBox::query()->count());
        $this->assertGreaterThan(0, ProductSchema::query()->count());

        $this->assertSame(1, ShippingBox::query()->where('is_default', 1)->count());
        $this->assertSame(1, ProductSchema::query()->where('is_default', 1)->count());
    }

    /**
     * The base currency resolves after a first install.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_first_install_gives_the_store_a_base_currency(): void
    {
        Installer::run();

        $this->assertSame(1, Currency::query()->where('is_base', 1)->count());

        $base = base_currency();

        $this->assertNotNull($base);
        $this->assertSame('USD', $base->code);
    }

    /**
     * Every storefront view is backed by a live page and recorded in advance.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_first_install_creates_and_maps_storefront_pages(): void
    {
        Installer::run();

        $pages = $this->page_map();

        foreach (array_keys(StorefrontPages::definitions()) as $view) {
            $this->assertArrayHasKey($view, $pages, "Expected a page mapping for [{$view}]");
            $this->assertNotEmpty($pages[$view], "Expected [{$view}] to hold a page id");

            $page = get_post((int) $pages[$view]);

            $this->assertNotNull($page, "Expected [{$view}] to map to an existing page");
            $this->assertSame('page', $page->post_type);
            $this->assertSame('publish', $page->post_status);
        }
    }

    /**
     * The install records the version it provisioned for.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_install_records_the_provisioned_version(): void
    {
        $this->assertNull(Option::get(Install::INSTALLED_VERSION));

        Installer::run();

        $this->assertSame(KIRKI_ECOMMERCE_VERSION, Option::get(Install::INSTALLED_VERSION));
    }

    /**
     * No page reference is written outside the advance settings.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_install_writes_no_page_reference_to_other_sections(): void
    {
        Installer::run();

        $this->assertArrayNotHasKey('shop_page', Option::get(OptionKeys::PRODUCT_SETTINGS) ?? []);

        foreach (static::settings_keys() as $key) {
            if ($key === OptionKeys::ADVANCE_SETTINGS) {
                continue;
            }

            $this->assertNull(Option::get($key), "Expected the install to store nothing for [{$key}]");
        }
    }

    /**
     * Re-running at the same version changes nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rerunning_at_the_same_version_is_a_no_op(): void
    {
        Installer::run();

        $counts = [
            Currency::query()->count(),
            ShippingProfile::query()->count(),
            TaxProfile::query()->count(),
            ShippingBox::query()->count(),
            ProductSchema::query()->count(),
        ];
        $pages = $this->page_map();

        Installer::run();

        $this->assertSame($counts, [
            Currency::query()->count(),
            ShippingProfile::query()->count(),
            TaxProfile::query()->count(),
            ShippingBox::query()->count(),
            ProductSchema::query()->count(),
        ]);
        $this->assertSame($pages, $this->page_map());
    }

    /**
     * A version bump re-runs the install without duplicating earlier defaults.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_a_version_bump_reruns_without_duplicating_defaults(): void
    {
        Installer::run();

        $counts = [
            Currency::query()->count(),
            ShippingProfile::query()->count(),
            TaxProfile::query()->count(),
            ShippingBox::query()->count(),
            ProductSchema::query()->count(),
        ];
        $pages = $this->page_map();

        Option::set(Install::INSTALLED_VERSION, '0.9.0');

        Installer::run();

        $this->assertSame($counts, [
            Currency::query()->count(),
            ShippingProfile::query()->count(),
            TaxProfile::query()->count(),
            ShippingBox::query()->count(),
            ProductSchema::query()->count(),
        ]);
        $this->assertSame($pages, $this->page_map());
        $this->assertSame(KIRKI_ECOMMERCE_VERSION, Option::get(Install::INSTALLED_VERSION));
    }

    /**
     * Merchant changes to the provisioned data survive a re-install.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rerunning_preserves_merchant_changes(): void
    {
        Installer::run();

        Currency::query()->insert([
            'name' => 'Euro',
            'code' => 'EUR',
            'symbol' => '€',
            'exchange_rate' => 0.92,
            'is_base' => false,
            'is_active' => true,
        ]);
        Currency::query()->where('code', 'USD')->update(['is_base' => 0]);
        Currency::query()->where('code', 'EUR')->update(['is_base' => 1]);

        $profile = ShippingProfile::query()->first();
        ShippingProfile::query()->where('id', $profile->id)->update(['name' => 'Renamed Profile']);

        $chosen_page = static::factory()->post->create([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_title' => 'Merchant Shop',
        ]);

        $stored = Option::get(OptionKeys::ADVANCE_SETTINGS);
        $stored['pages'][StorefrontPages::SHOP] = $chosen_page;
        Option::set(OptionKeys::ADVANCE_SETTINGS, $stored);

        Option::set(Install::INSTALLED_VERSION, '0.9.0');

        Installer::run();

        $this->assertSame(1, Currency::query()->where('code', 'EUR')->where('is_base', 1)->count());
        $this->assertSame(1, Currency::query()->where('is_base', 1)->count());
        $this->assertSame(1, ShippingProfile::query()->where('name', 'Renamed Profile')->count());
        $this->assertSame($chosen_page, $this->page_map()[StorefrontPages::SHOP]);
    }

    /**
     * A deleted page is recreated without disturbing the other mappings.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rerunning_replaces_only_a_deleted_page(): void
    {
        Installer::run();

        $pages = $this->page_map();
        $deleted_id = $pages[StorefrontPages::CART];

        wp_delete_post($deleted_id, true);

        Option::set(Install::INSTALLED_VERSION, '0.9.0');

        Installer::run();

        $updated = $this->page_map();

        $this->assertNotSame($deleted_id, $updated[StorefrontPages::CART]);
        $this->assertNotNull(get_post((int) $updated[StorefrontPages::CART]));

        foreach ([StorefrontPages::SHOP, StorefrontPages::CHECKOUT, StorefrontPages::ACCOUNT] as $view) {
            $this->assertSame($pages[$view], $updated[$view], "Expected [{$view}] to be untouched");
        }
    }

    /**
     * A trashed page is treated as missing and replaced.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rerunning_replaces_a_trashed_page(): void
    {
        Installer::run();

        $pages = $this->page_map();
        $trashed_id = $pages[StorefrontPages::CHECKOUT];

        wp_trash_post($trashed_id);

        Option::set(Install::INSTALLED_VERSION, '0.9.0');

        Installer::run();

        $this->assertNotSame($trashed_id, $this->page_map()[StorefrontPages::CHECKOUT]);
    }

    /**
     * Advance settings resolve the recorded page map through the settings API.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_page_map_is_readable_through_the_settings_api(): void
    {
        Installer::run();

        $response = $this->request('GET', 'settings/' . OptionKeys::ADVANCE_SETTINGS);
        $payload = $this->assert_api_success($response);

        foreach ($this->page_map() as $view => $page_id) {
            $this->assertSame($page_id, $payload['data']['pages'][$view]);
        }
    }
}
