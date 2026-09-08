<?php

namespace Kirki\Ecommerce\Tests\Unit\Tax;

use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
use Kirki\Ecommerce\App\Tax\Strategies\DefaultTaxStrategy;
use Kirki\Ecommerce\Tests\Support\BindsTaxDependencies;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class DefaultTaxStrategyTest extends TestCase
{
    use BindsTaxDependencies;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_tax_dependencies();
    }

    /**
     * The per-state rate matching the address's state id is used.
     *
     * @return void
     */
    public function test_per_state_rates_are_matched_by_state_id(): void
    {
        $strategy = $this->make_strategy(['state' => '771'], $this->per_state_region());

        $this->assertSame(2000, $strategy->calculate_product_tax($this->tax_context())->base_total);
        $this->assertSame(500, $strategy->calculate_shipping_tax(10000)->base_total);
    }

    /**
     * An address whose state has no configured rate is taxed at zero.
     *
     * @return void
     */
    public function test_unconfigured_state_is_taxed_at_zero(): void
    {
        $strategy = $this->make_strategy(['state' => '999'], $this->per_state_region());

        $this->assertSame(0, $strategy->calculate_product_tax($this->tax_context())->base_total);
        $this->assertSame(0, $strategy->calculate_shipping_tax(10000)->base_total);
    }

    /**
     * Country-wide mode applies its rates regardless of the address's state.
     *
     * @return void
     */
    public function test_country_wide_mode_ignores_the_address_state(): void
    {
        $region = [
            'code' => 'BD',
            'is_enabled' => true,
            'is_central_tax_enabled' => true,
            'central_product_tax' => 15,
            'central_shipping_tax' => 5,
            'rules' => [],
            'states' => [],
        ];

        $strategy = $this->make_strategy(['state' => '771'], $region);

        $this->assertSame(1500, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * The matched state's own rules are applied in per-state mode.
     *
     * @return void
     */
    public function test_matched_state_rules_are_applied(): void
    {
        $region = $this->per_state_region();
        $region['states'][0]['rules'] = [$this->set_product_tax_rate_rule('digital', 7)];

        $strategy = $this->make_strategy(['state' => '771'], $region);

        $this->assertSame(700, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * Region-level rules lie dormant while the region is in per-state mode.
     *
     * @return void
     */
    public function test_region_rules_do_not_apply_in_per_state_mode(): void
    {
        $region = $this->per_state_region();
        $region['rules'] = [$this->set_product_tax_rate_rule('digital', 7)];

        $strategy = $this->make_strategy(['state' => '771'], $region);

        $this->assertSame(2000, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * Region-level rules apply in country-wide mode.
     *
     * @return void
     */
    public function test_region_rules_apply_in_country_wide_mode(): void
    {
        $region = [
            'code' => 'BD',
            'is_enabled' => true,
            'is_central_tax_enabled' => true,
            'central_product_tax' => 15,
            'central_shipping_tax' => 5,
            'rules' => [$this->set_product_tax_rate_rule('digital', 7)],
            'states' => [],
        ];

        $strategy = $this->make_strategy(['state' => '771'], $region);

        $this->assertSame(700, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * A destination rule matches the shipping address by country and state list.
     *
     * @return void
     */
    public function test_destination_region_rule_applies_in_country_wide_mode(): void
    {
        $region = $this->country_wide_region();
        $region['rules'] = [
            $this->destination_region_rule(['country' => 'BD', 'state' => ['771']], 'set_product_tax_rate', 9),
        ];

        $strategy = $this->make_strategy(['state' => '771'], $region);

        $this->assertSame(900, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * A shipping-tax rule changes the shipping tax and leaves product tax alone.
     *
     * @return void
     */
    public function test_shipping_tax_rule_changes_only_shipping_tax(): void
    {
        $region = $this->country_wide_region();
        $region['rules'] = [
            $this->destination_region_rule(['country' => 'BD'], 'set_shipping_tax_rate', 12),
        ];

        $strategy = $this->make_strategy(['state' => '771'], $region);

        $this->assertSame(1200, $strategy->calculate_shipping_tax(10000)->base_total);
        $this->assertSame(1500, $strategy->calculate_product_tax($this->tax_context())->base_total);
    }

    /**
     * A product-tax rule leaves the shipping tax at the configured rate.
     *
     * @return void
     */
    public function test_product_tax_rule_does_not_change_shipping_tax(): void
    {
        $region = $this->country_wide_region();
        $region['rules'] = [
            $this->destination_region_rule(['country' => 'BD'], 'set_product_tax_rate', 9),
        ];

        $strategy = $this->make_strategy(['state' => '771'], $region);

        $this->assertSame(500, $strategy->calculate_shipping_tax(10000)->base_total);
    }

    /**
     * A country-wide general region.
     *
     * @return array
     */
    protected function country_wide_region(): array
    {
        return [
            'code' => 'BD',
            'is_enabled' => true,
            'is_central_tax_enabled' => true,
            'central_product_tax' => 15,
            'central_shipping_tax' => 5,
            'rules' => [],
            'states' => [],
        ];
    }

    /**
     * A general region with two configured states.
     *
     * @return array
     */
    protected function per_state_region(): array
    {
        return [
            'code' => 'BD',
            'is_enabled' => true,
            'is_central_tax_enabled' => false,
            'rules' => [],
            'states' => [
                [
                    'id' => '771',
                    'name' => 'Dhaka District',
                    'product_tax_rate' => 20,
                    'shipping_tax_rate' => 5,
                    'rules' => [],
                ],
                [
                    'id' => '785',
                    'name' => 'Chittagong District',
                    'product_tax_rate' => 21,
                    'shipping_tax_rate' => 6,
                    'rules' => [],
                ],
            ],
        ];
    }

    /**
     * @param array $address_extras Address fields merged over the country.
     * @param array $region         The matched tax region settings.
     *
     * @return DefaultTaxStrategy
     */
    protected function make_strategy(array $address_extras, array $region): DefaultTaxStrategy
    {
        return new DefaultTaxStrategy(array_merge(['country' => 'BD'], $address_extras), $region, false, true);
    }

    /**
     * @return ProductTaxContextDTO
     */
    protected function tax_context(): ProductTaxContextDTO
    {
        return ProductTaxContextDTO::from_array([
            'shipping_address' => ['country' => 'BD', 'state' => '771'],
            'billing_address' => [],
            'base_product_price' => 10000,
            'product_categories' => [],
            'tax_profile' => 'digital',
        ]);
    }
}
