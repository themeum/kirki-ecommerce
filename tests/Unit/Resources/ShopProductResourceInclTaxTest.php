<?php

namespace Kirki\Ecommerce\Tests\Unit\Resources;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Site\Shop\ShopProductResource;
use Kirki\Ecommerce\Framework\Container;
use Kirki\Ecommerce\Tests\Support\FakeSettingsFactory;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\collection;

class ShopProductResourceInclTaxTest extends TestCase
{
    // to_array() needs inventory, wishlist and Money services this lightweight
    // container does not provide, so the label rule is called through
    // reflection instead.

    protected function bind_tax_settings(bool $display_inclusive_price): void
    {
        Container::get_instance()->bind('settings', fn() => new FakeSettingsFactory([
            'general' => ['is_tax_calculation_enabled' => true],
            'tax'     => [
                'tax_regions'                          => [['country' => 'DE']],
                'is_tax_inclusive_price'               => true,
                'is_enabled_display_inclusive_taxed_price' => $display_inclusive_price,
            ],
        ]));
        $this->reset_facade_cache();
    }

    protected function make_variant(bool $charge_taxes): Variant
    {
        $variant = new Variant();
        $variant->charge_taxes = $charge_taxes;

        return $variant;
    }

    /**
     * @param Variant[]|null $variants Null when the card shows one variant.
     */
    protected function resolve_show_incl_tax(Variant $variant, ?array $variants): bool
    {
        $resource = new ShopProductResource([]);

        $method = new \ReflectionMethod(ShopProductResource::class, 'resolve_show_incl_tax');
        $method->setAccessible(true);

        return $method->invoke($resource, $variant, $variants === null ? null : collection($variants));
    }

    public function test_shows_label_when_one_variant_charges_tax(): void
    {
        $this->bind_tax_settings(true);
        $taxed   = $this->make_variant(true);
        $untaxed = $this->make_variant(false);

        $this->assertTrue($this->resolve_show_incl_tax($untaxed, [$untaxed, $taxed]));
    }

    public function test_hides_label_when_no_variant_charges_tax(): void
    {
        $this->bind_tax_settings(true);
        $first  = $this->make_variant(false);
        $second = $this->make_variant(false);

        $this->assertFalse($this->resolve_show_incl_tax($first, [$first, $second]));
    }

    public function test_single_variant_card_follows_its_variant(): void
    {
        $this->bind_tax_settings(true);

        $this->assertTrue($this->resolve_show_incl_tax($this->make_variant(true), null));
        $this->assertFalse($this->resolve_show_incl_tax($this->make_variant(false), null));
    }

    public function test_hides_label_when_store_does_not_display_inclusive_prices(): void
    {
        $this->bind_tax_settings(false);
        $taxed = $this->make_variant(true);

        $this->assertFalse($this->resolve_show_incl_tax($taxed, [$taxed]));
    }
}
