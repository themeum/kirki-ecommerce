<?php

namespace Kirki\Ecommerce\Tests\Unit\Tax;

use Kirki\Ecommerce\App\Supports\Tax;
use Kirki\Ecommerce\App\Tax\Strategies\DefaultTaxStrategy;
use Kirki\Ecommerce\App\Tax\Strategies\EUTaxStrategy;
use Kirki\Ecommerce\App\Tax\TaxStrategyFactory;
use Exception;
use Kirki\Ecommerce\Tests\Support\BindsTaxDependencies;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class TaxStrategyFactoryTest extends TestCase
{
    use BindsTaxDependencies;

    /**
     * A non-EU country resolves to DefaultTaxStrategy, with the matched
     * region and store settings threaded through to it.
     *
     * @return void
     */
    public function test_resolves_default_strategy_for_a_configured_country(): void
    {
        $this->bind_full_tax_settings([
            ['code' => 'BD', 'is_enabled' => true, 'is_central_tax_enabled' => true, 'central_product_tax' => 15, 'central_shipping_tax' => 5, 'rules' => [], 'states' => []],
        ]);

        $strategy = TaxStrategyFactory::make(['country' => 'BD']);

        $this->assertInstanceOf(DefaultTaxStrategy::class, $strategy);
    }

    /**
     * An EU member country resolves to EUTaxStrategy via the real EU
     * country dataset, not a country-code region of its own.
     *
     * @return void
     */
    public function test_resolves_eu_strategy_for_an_eu_member_country(): void
    {
        $this->bind_full_tax_settings([
            ['code' => 'EU', 'is_enabled' => true, 'type' => 'oss', 'rules' => [], 'countries' => [['code' => 'AT', 'name' => 'Austria', 'rate' => 20]]],
        ]);

        $strategy = TaxStrategyFactory::make(['country' => 'AT']);

        $this->assertInstanceOf(EUTaxStrategy::class, $strategy);
    }

    /**
     * A country with no country in the address at all is rejected before
     * any region lookup.
     *
     * @return void
     */
    public function test_rejects_an_address_with_no_country(): void
    {
        $this->bind_full_tax_settings([]);

        $this->expectException(Exception::class);

        TaxStrategyFactory::make([]);
    }

    /**
     * A country with no configured region at all is rejected.
     *
     * @return void
     */
    public function test_rejects_an_unconfigured_country(): void
    {
        $this->bind_full_tax_settings([
            ['code' => 'BD', 'is_enabled' => true, 'is_central_tax_enabled' => true, 'central_product_tax' => 15, 'central_shipping_tax' => 5, 'rules' => [], 'states' => []],
        ]);

        $this->expectException(Exception::class);

        TaxStrategyFactory::make(['country' => 'US']);
    }

    /**
     * A disabled region does not match, exactly as if it weren't
     * configured at all.
     *
     * @return void
     */
    public function test_rejects_a_disabled_region(): void
    {
        $this->bind_full_tax_settings([
            ['code' => 'BD', 'is_enabled' => false, 'is_central_tax_enabled' => true, 'central_product_tax' => 15, 'central_shipping_tax' => 5, 'rules' => [], 'states' => []],
        ]);

        $this->expectException(Exception::class);

        TaxStrategyFactory::make(['country' => 'BD']);
    }

    /**
     * `Tax::get_tax_strategy()` never throws - an empty address returns
     * null immediately, without ever reaching the factory.
     *
     * @return void
     */
    public function test_get_tax_strategy_returns_null_for_an_empty_address(): void
    {
        $this->bind_full_tax_settings([]);

        $this->assertNull(Tax::get_tax_strategy([]));
    }

    /**
     * `Tax::get_tax_strategy()` swallows the factory's exception and
     * returns null so checkout for an unconfigured destination degrades
     * to "no tax" instead of a hard failure.
     *
     * @return void
     */
    public function test_get_tax_strategy_returns_null_for_an_unconfigured_country(): void
    {
        $this->bind_full_tax_settings([
            ['code' => 'BD', 'is_enabled' => true, 'is_central_tax_enabled' => true, 'central_product_tax' => 15, 'central_shipping_tax' => 5, 'rules' => [], 'states' => []],
        ]);

        $this->assertNull(Tax::get_tax_strategy(['country' => 'US']));
    }

    /**
     * `Tax::get_tax_strategy()` returns a working strategy for a properly
     * configured, enabled region.
     *
     * @return void
     */
    public function test_get_tax_strategy_returns_a_strategy_for_a_configured_country(): void
    {
        $this->bind_full_tax_settings([
            ['code' => 'BD', 'is_enabled' => true, 'is_central_tax_enabled' => true, 'central_product_tax' => 15, 'central_shipping_tax' => 5, 'rules' => [], 'states' => []],
        ]);

        $strategy = Tax::get_tax_strategy(['country' => 'BD']);

        $this->assertInstanceOf(DefaultTaxStrategy::class, $strategy);
    }
}
