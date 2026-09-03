<?php

namespace Kirki\Ecommerce\Tests\Unit\Tax;

use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
use Kirki\Ecommerce\App\Tax\Strategies\EUTaxStrategy;
use Kirki\Ecommerce\Tests\Support\BindsTaxDependencies;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class EUTaxStrategyTest extends TestCase
{
    use BindsTaxDependencies;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_tax_dependencies();
    }

    /**
     * The address's member country supplies one VAT rate that applies to both
     * product tax and shipping tax.
     *
     * @return void
     */
    public function test_member_country_rate_applies_to_product_and_shipping(): void
    {
        $strategy = $this->make_strategy('AT', $this->eu_region());

        $this->assertSame(2000, $strategy->calculate_product_tax($this->tax_context())->base_total);
        $this->assertSame(2000, $strategy->calculate_shipping_tax(10000)->base_total);
    }

    /**
     * Each member country keeps its own rate.
     *
     * @return void
     */
    public function test_rates_are_matched_by_country_code(): void
    {
        $strategy = $this->make_strategy('BE', $this->eu_region());

        $this->assertSame(2100, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * A member country with no configured rate is taxed at zero.
     *
     * @return void
     */
    public function test_unconfigured_country_is_taxed_at_zero(): void
    {
        $strategy = $this->make_strategy('DE', $this->eu_region());

        $this->assertSame(0, $strategy->calculate_product_tax($this->tax_context())->base_total);
        $this->assertSame(0, $strategy->calculate_shipping_tax(10000)->base_total);
    }

    /**
     * The EU region's rules stay region-level and are applied to every member.
     *
     * @return void
     */
    public function test_region_rules_are_applied(): void
    {
        $region = $this->eu_region();
        $region['rules'] = [$this->set_product_tax_rate_rule('digital', 7)];

        $strategy = $this->make_strategy('AT', $region);

        $this->assertSame(700, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * The EU region with two configured member countries.
     *
     * @return array
     */
    protected function eu_region(): array
    {
        return [
            'code' => 'EU',
            'is_enabled' => true,
            'type' => 'oss',
            'rules' => [],
            'countries' => [
                [
                    'code' => 'AT',
                    'name' => 'Austria',
                    'rate' => 20,
                ],
                [
                    'code' => 'BE',
                    'name' => 'Belgium',
                    'rate' => 21,
                ],
            ],
        ];
    }

    /**
     * @param string $country The shipping address's country code.
     * @param array  $region  The EU tax region settings.
     *
     * @return EUTaxStrategy
     */
    protected function make_strategy(string $country, array $region): EUTaxStrategy
    {
        return new EUTaxStrategy(['country' => $country], $region, false, true);
    }

    /**
     * @return ProductTaxContextDTO
     */
    protected function tax_context(): ProductTaxContextDTO
    {
        return ProductTaxContextDTO::from_array([
            'shipping_address' => ['country' => 'AT'],
            'billing_address' => [],
            'base_product_price' => 10000,
            'product_categories' => [],
            'tax_profile' => 'digital',
        ]);
    }
}
