<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\Database\Seeders\CurrencySeeder;
use Kirki\Ecommerce\Database\Seeders\ProductSchemaSeeder;
use Kirki\Ecommerce\Database\Seeders\ShippingBoxesSeeder;
use Kirki\Ecommerce\Database\Seeders\ShippingProfilesSeeder;
use Kirki\Ecommerce\Database\Seeders\TaxProfilesSeeder;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class SeederIdempotencyTest extends RestTestCase
{
    /**
     * Run the five default-record seeders.
     *
     * @return void
     * @since 1.0.0
     */
    protected function run_seeders(): void
    {
        (new CurrencySeeder())->run();
        (new ShippingProfilesSeeder())->run();
        (new TaxProfilesSeeder())->run();
        (new ShippingBoxesSeeder())->run();
        (new ProductSchemaSeeder())->run();
    }

    /**
     * Seeding twice must not duplicate rows or violate a unique index.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_seeding_twice_does_not_duplicate_records(): void
    {
        $this->run_seeders();

        $counts = [
            'currencies' => Currency::query()->count(),
            'shipping_profiles' => ShippingProfile::query()->count(),
            'tax_profiles' => TaxProfile::query()->count(),
            'shipping_boxes' => ShippingBox::query()->count(),
            'product_schemas' => ProductSchema::query()->count(),
        ];

        $this->assertGreaterThan(0, $counts['currencies']);
        $this->assertGreaterThan(0, $counts['shipping_profiles']);
        $this->assertGreaterThan(0, $counts['tax_profiles']);
        $this->assertGreaterThan(0, $counts['shipping_boxes']);
        $this->assertGreaterThan(0, $counts['product_schemas']);

        $this->run_seeders();

        $this->assertSame($counts['currencies'], Currency::query()->count());
        $this->assertSame($counts['shipping_profiles'], ShippingProfile::query()->count());
        $this->assertSame($counts['tax_profiles'], TaxProfile::query()->count());
        $this->assertSame($counts['shipping_boxes'], ShippingBox::query()->count());
        $this->assertSame($counts['product_schemas'], ProductSchema::query()->count());
    }

    /**
     * Exactly one base currency, default box, and default schema exist.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_seeding_produces_a_single_default_of_each_kind(): void
    {
        $this->run_seeders();
        $this->run_seeders();

        $this->assertSame(1, Currency::query()->where('is_base', 1)->count());
        $this->assertSame(1, ShippingBox::query()->where('is_default', 1)->count());
        $this->assertSame(1, ProductSchema::query()->where('is_default', 1)->count());
    }

    /**
     * A merchant's edits to the seeded defaults survive a re-seed.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reseeding_preserves_merchant_changes(): void
    {
        $this->run_seeders();

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

        $renamed = ShippingProfile::query()->first();
        ShippingProfile::query()->where('id', $renamed->id)->update(['name' => 'Renamed Profile']);

        $this->run_seeders();

        $this->assertSame(1, Currency::query()->where('is_base', 1)->count());
        $this->assertSame(1, Currency::query()->where('code', 'EUR')->where('is_base', 1)->count());
        $this->assertSame(1, ShippingProfile::query()->where('name', 'Renamed Profile')->count());
    }

    /**
     * A default the merchant deleted is restored, not duplicated, on re-seed.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reseeding_restores_a_deleted_default_without_duplicating_others(): void
    {
        $this->run_seeders();

        $total = TaxProfile::query()->count();
        $deleted = TaxProfile::query()->first();
        $name = $deleted->name;

        TaxProfile::query()->where('id', $deleted->id)->delete();
        $this->assertSame($total - 1, TaxProfile::query()->count());

        $this->run_seeders();

        $this->assertSame($total, TaxProfile::query()->count());
        $this->assertSame(1, TaxProfile::query()->where('name', $name)->count());
    }
}
