<?php

namespace Kirki\Ecommerce\Tests\Unit\Tax;

use Kirki\Ecommerce\App\Constants\Order\OrderTaxDestination;
use Kirki\Ecommerce\App\DTO\Tax\TaxableItemDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
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
        $strategy = $this->make_strategy($this->per_state_region());
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(2000, $result->items[1][0]->base_amount);
        $this->assertSame(1, $result->items[1][0]->item_id);
        $this->assertSame(500, $result->shipping[0]->base_amount);
        $this->assertNull($result->shipping[0]->item_id);
    }

    /**
     * An address whose state has no configured rate is taxed at zero.
     *
     * @return void
     */
    public function test_unconfigured_state_is_taxed_at_zero(): void
    {
        $strategy = $this->make_strategy($this->per_state_region());
        $result = $strategy->calculate($this->tax_context(['state' => '999']));

        $this->assertSame(0, $result->items[1][0]->base_amount);
        $this->assertSame(0, $result->shipping[0]->base_amount);
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

        $strategy = $this->make_strategy($region);
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(1500, $result->items[1][0]->base_amount);
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

        $strategy = $this->make_strategy($region);
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(700, $result->items[1][0]->base_amount);
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

        $strategy = $this->make_strategy($region);
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(2000, $result->items[1][0]->base_amount);
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

        $strategy = $this->make_strategy($region);
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(700, $result->items[1][0]->base_amount);
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

        $strategy = $this->make_strategy($region);
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(900, $result->items[1][0]->base_amount);
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

        $strategy = $this->make_strategy($region);
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(1200, $result->shipping[0]->base_amount);
        $this->assertSame(1500, $result->items[1][0]->base_amount);
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

        $strategy = $this->make_strategy($region);
        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(500, $result->shipping[0]->base_amount);
    }

    /**
     * Untaxed shipping produces no shipping tax line.
     *
     * @return void
     */
    public function test_non_taxable_shipping_produces_no_line(): void
    {
        $strategy = $this->make_strategy($this->per_state_region());

        $context = $this->tax_context();
        $context->is_shipping_taxable = false;

        $result = $strategy->calculate($context);

        $this->assertSame([], $result->shipping);
    }

    /**
     * Tax-inclusive pricing extracts the tax from the item's base amount
     * instead of adding it on top. Shipping is never sold at a
     * tax-inclusive price, so its tax is still added on top of the
     * shipping fee even when the store's product pricing is tax-inclusive.
     *
     * @return void
     */
    public function test_tax_inclusive_pricing_extracts_the_tax_from_items_but_adds_it_on_top_for_shipping(): void
    {
        $region = $this->country_wide_region();
        $strategy = new DefaultTaxStrategy($region, true, true);

        $context = $this->tax_context();
        $context->items[0]->taxable_amount = 11500;
        $context->shipping_fee = 10500;

        $result = $strategy->calculate($context);

        $this->assertSame(1500, $result->items[1][0]->base_amount);
        $this->assertSame(525, $result->shipping[0]->base_amount);
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
     * The strategy reports the destination it was built for, shipping unless told otherwise.
     *
     * @return void
     */
    public function test_reports_the_destination_it_was_built_for(): void
    {
        $region = $this->country_wide_region();
        $default = $this->make_strategy($region)->calculate($this->tax_context());
        $store = (new DefaultTaxStrategy($region, false, true, OrderTaxDestination::STORE))->calculate($this->tax_context());

        $this->assertSame(OrderTaxDestination::SHIPPING, $default->tax_destination);
        $this->assertSame(OrderTaxDestination::STORE, $store->tax_destination);
    }

    /**
     * The state rate comes from the address the destination names, not from the shipping address.
     *
     * @return void
     */
    public function test_state_rate_follows_the_destination_address(): void
    {
        $strategy = new DefaultTaxStrategy($this->per_state_region(), false, true, OrderTaxDestination::STORE);
        $context = $this->tax_context([], ['store_address' => ['country' => 'BD', 'state' => '785']]);

        $result = $strategy->calculate($context);

        $this->assertSame(2100, $result->items[1][0]->base_amount);
    }

    /**
     * @param array $region The matched tax region settings.
     *
     * @return DefaultTaxStrategy
     */
    protected function make_strategy(array $region): DefaultTaxStrategy
    {
        return new DefaultTaxStrategy($region, false, true);
    }

    /**
     * @param array $shipping_extras Shipping address fields merged over the BD country and state 771.
     * @param array $overrides       Further context fields, e.g. `store_address`.
     *
     * @return TaxCalculationContextDTO
     */
    protected function tax_context(array $shipping_extras = [], array $overrides = []): TaxCalculationContextDTO
    {
        return TaxCalculationContextDTO::from_array(array_merge([
            'shipping_address' => array_merge(['country' => 'BD', 'state' => '771'], $shipping_extras),
            'billing_address' => [],
            'shipping_fee' => 10000,
            'is_shipping_taxable' => true,
            'items' => [
                TaxableItemDTO::from_array([
                    'item_id' => 1,
                    'taxable_amount' => 10000,
                    'tax_profile_id' => 'digital',
                    'product_categories' => [],
                ]),
            ],
        ], $overrides));
    }
}
