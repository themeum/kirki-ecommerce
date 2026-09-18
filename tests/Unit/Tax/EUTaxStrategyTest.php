<?php

namespace Kirki\Ecommerce\Tests\Unit\Tax;

use Kirki\Ecommerce\App\DTO\Tax\TaxableItemDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
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
     * product tax and shipping tax when every item shares that rate.
     *
     * @return void
     */
    public function test_member_country_rate_applies_to_product_and_shipping(): void
    {
        $strategy = $this->make_strategy('AT', $this->eu_region(), false);
        $result = $strategy->calculate($this->tax_context('AT'));

        $this->assertSame(2000, $result->items[1][0]->base_amount);
        $this->assertSame(1, $result->items[1][0]->item_id);
        $this->assertCount(1, $result->shipping);
        $this->assertSame(20.0, $result->shipping[0]->rate);
        $this->assertSame(2000, $result->shipping[0]->base_amount);
        $this->assertSame(1, $result->shipping[0]->item_id);
    }

    /**
     * Each member country keeps its own rate.
     *
     * @return void
     */
    public function test_rates_are_matched_by_country_code(): void
    {
        $strategy = $this->make_strategy('BE', $this->eu_region(), false);
        $result = $strategy->calculate($this->tax_context('BE'));

        $this->assertSame(2100, $result->items[1][0]->base_amount);
    }

    /**
     * A member country with no configured rate is taxed at zero.
     *
     * @return void
     */
    public function test_unconfigured_country_is_taxed_at_zero(): void
    {
        $strategy = $this->make_strategy('DE', $this->eu_region(), false);
        $result = $strategy->calculate($this->tax_context('DE'));

        $this->assertSame(0, $result->items[1][0]->base_amount);
        $this->assertSame(0, $result->shipping[0]->base_amount);
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

        $strategy = $this->make_strategy('AT', $region, false);
        $result = $strategy->calculate($this->tax_context('AT'));

        $this->assertSame(700, $result->items[1][0]->base_amount);
    }

    /**
     * A destination rule can target a set of member countries.
     *
     * @return void
     */
    public function test_destination_region_rule_matches_a_member_country_set(): void
    {
        $region = $this->eu_region();
        $region['rules'] = [
            $this->destination_region_rule(['country' => ['AT', 'BE']], 'set_product_tax_rate', 5),
        ];

        $strategy = $this->make_strategy('AT', $region, false);
        $result = $strategy->calculate($this->tax_context('AT'));

        $this->assertSame(500, $result->items[1][0]->base_amount);
    }

    /**
     * When a per-tax-profile rule gives items in the same cart different
     * effective VAT rates, shipping tax is split across those rates
     * proportionally to each rate's share of the cart's taxable value,
     * rather than reusing a single flat rate.
     *
     * @return void
     */
    public function test_shipping_tax_splits_across_mixed_item_rates(): void
    {
        $region = $this->eu_region();
        $region['rules'] = [$this->set_product_tax_rate_rule('digital', 5)];

        $strategy = $this->make_strategy('AT', $region, false);

        $context = TaxCalculationContextDTO::from_array([
            'shipping_address' => ['country' => 'AT'],
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
                TaxableItemDTO::from_array([
                    'item_id' => 2,
                    'taxable_amount' => 10000,
                    'tax_profile_id' => 'physical',
                    'product_categories' => [],
                ]),
            ],
        ]);

        $result = $strategy->calculate($context);

        $this->assertSame(500, $result->items[1][0]->base_amount);
        $this->assertSame(2000, $result->items[2][0]->base_amount);

        $this->assertCount(2, $result->shipping);
        $this->assertSame(5.0, $result->shipping[0]->rate);
        $this->assertSame(250, $result->shipping[0]->base_amount);
        $this->assertSame(1, $result->shipping[0]->item_id);
        $this->assertSame(20.0, $result->shipping[1]->rate);
        $this->assertSame(1000, $result->shipping[1]->base_amount);
        $this->assertSame(2, $result->shipping[1]->item_id);
    }

    /**
     * Two items that resolve to the same rate still each get their own
     * shipping tax line, rather than being merged into one: order_taxes
     * needs a line per item to record which order item each portion of
     * shipping tax belongs to.
     *
     * @return void
     */
    public function test_shipping_tax_is_not_merged_across_items_sharing_a_rate(): void
    {
        $strategy = $this->make_strategy('AT', $this->eu_region(), false);

        $context = TaxCalculationContextDTO::from_array([
            'shipping_address' => ['country' => 'AT'],
            'billing_address' => [],
            'shipping_fee' => 10000,
            'is_shipping_taxable' => true,
            'items' => [
                TaxableItemDTO::from_array([
                    'item_id' => 1,
                    'taxable_amount' => 10000,
                    'tax_profile_id' => null,
                    'product_categories' => [],
                ]),
                TaxableItemDTO::from_array([
                    'item_id' => 2,
                    'taxable_amount' => 10000,
                    'tax_profile_id' => null,
                    'product_categories' => [],
                ]),
            ],
        ]);

        $result = $strategy->calculate($context);

        $this->assertCount(2, $result->shipping);
        $this->assertSame(20.0, $result->shipping[0]->rate);
        $this->assertSame(1000, $result->shipping[0]->base_amount);
        $this->assertSame(1, $result->shipping[0]->item_id);
        $this->assertSame(20.0, $result->shipping[1]->rate);
        $this->assertSame(1000, $result->shipping[1]->base_amount);
        $this->assertSame(2, $result->shipping[1]->item_id);
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
        $strategy = $this->make_strategy('AT', $this->eu_region(), true);

        $context = $this->tax_context('AT');
        $context->items[0]->taxable_amount = 12000;

        $result = $strategy->calculate($context);

        $this->assertSame(2000, $result->items[1][0]->base_amount);
        $this->assertSame(2000, $result->shipping[0]->base_amount);
    }

    /**
     * Untaxed shipping produces no shipping tax line, same as the default
     * strategy.
     *
     * @return void
     */
    public function test_non_taxable_shipping_produces_no_line(): void
    {
        $strategy = $this->make_strategy('AT', $this->eu_region(), false);

        $context = $this->tax_context('AT');
        $context->is_shipping_taxable = false;

        $result = $strategy->calculate($context);

        $this->assertSame([], $result->shipping);
    }

    /**
     * A zero shipping fee produces no shipping tax line - there is nothing
     * to allocate or tax.
     *
     * @return void
     */
    public function test_zero_shipping_fee_produces_no_line(): void
    {
        $strategy = $this->make_strategy('AT', $this->eu_region(), false);

        $context = $this->tax_context('AT');
        $context->shipping_fee = 0;

        $result = $strategy->calculate($context);

        $this->assertSame([], $result->shipping);
    }

    /**
     * Three items sharing a rate still each get their own shipping tax
     * line, and the split accounts for every minor unit of the shipping
     * fee - none lost or duplicated across the three lines.
     *
     * @return void
     */
    public function test_shipping_tax_splits_across_three_items_without_losing_a_cent(): void
    {
        $strategy = $this->make_strategy('AT', $this->eu_region(), false);

        $context = TaxCalculationContextDTO::from_array([
            'shipping_address' => ['country' => 'AT'],
            'billing_address' => [],
            'shipping_fee' => 15000,
            'is_shipping_taxable' => true,
            'items' => [
                TaxableItemDTO::from_array(['item_id' => 1, 'taxable_amount' => 5000, 'tax_profile_id' => null, 'product_categories' => []]),
                TaxableItemDTO::from_array(['item_id' => 2, 'taxable_amount' => 5000, 'tax_profile_id' => null, 'product_categories' => []]),
                TaxableItemDTO::from_array(['item_id' => 3, 'taxable_amount' => 5000, 'tax_profile_id' => null, 'product_categories' => []]),
            ],
        ]);

        $result = $strategy->calculate($context);

        $this->assertCount(3, $result->shipping);
        $this->assertSame([1, 2, 3], array_map(fn($line) => $line->item_id, $result->shipping));
        $this->assertSame(3000, array_sum(array_map(fn($line) => $line->base_amount, $result->shipping)));
    }

    /**
     * The split still accounts for every minor unit even when the shipping
     * fee does not divide evenly across the items' weights - Brick\Money's
     * allocate() distributes the remainder rather than dropping it, and
     * per-line rounding of the tax itself may drift the sum by at most a
     * cent per line, never more.
     *
     * @return void
     */
    public function test_shipping_tax_split_handles_an_uneven_remainder(): void
    {
        $strategy = $this->make_strategy('AT', $this->eu_region(), false);

        $context = TaxCalculationContextDTO::from_array([
            'shipping_address' => ['country' => 'AT'],
            'billing_address' => [],
            'shipping_fee' => 10000,
            'is_shipping_taxable' => true,
            'items' => [
                TaxableItemDTO::from_array(['item_id' => 1, 'taxable_amount' => 3333, 'tax_profile_id' => null, 'product_categories' => []]),
                TaxableItemDTO::from_array(['item_id' => 2, 'taxable_amount' => 3333, 'tax_profile_id' => null, 'product_categories' => []]),
                TaxableItemDTO::from_array(['item_id' => 3, 'taxable_amount' => 3334, 'tax_profile_id' => null, 'product_categories' => []]),
            ],
        ]);

        $result = $strategy->calculate($context);

        $this->assertCount(3, $result->shipping);

        $expected_tax_on_whole = (int) round(10000 * 20 / 100);
        $actual_tax_sum = array_sum(array_map(fn($line) => $line->base_amount, $result->shipping));

        $this->assertEqualsWithDelta($expected_tax_on_whole, $actual_tax_sum, 3, 'Split tax drifted by more than one cent per line from the tax on the whole shipping fee.');
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
     * @param string $country              The shipping address's country code.
     * @param array  $region                The EU tax region settings.
     * @param bool   $is_tax_inclusive_price Whether prices are tax-inclusive.
     *
     * @return EUTaxStrategy
     */
    protected function make_strategy(string $country, array $region, bool $is_tax_inclusive_price): EUTaxStrategy
    {
        return new EUTaxStrategy(['country' => $country], $region, $is_tax_inclusive_price, true);
    }

    /**
     * @param string $country The shipping address's country code.
     *
     * @return TaxCalculationContextDTO
     */
    protected function tax_context(string $country): TaxCalculationContextDTO
    {
        return TaxCalculationContextDTO::from_array([
            'shipping_address' => ['country' => $country],
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
        ]);
    }
}
