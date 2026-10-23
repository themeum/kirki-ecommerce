<?php

namespace Kirki\Ecommerce\Tests\Unit\Tax;

use Kirki\Ecommerce\App\Constants\Order\OrderTaxDestination;
use Kirki\Ecommerce\App\DTO\Calculation\StoredOrderTermsDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxableItemDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
use Kirki\Ecommerce\App\Tax\Strategies\DefaultTaxStrategy;
use Kirki\Ecommerce\App\Tax\Strategies\StoredRateTaxStrategy;
use Kirki\Ecommerce\Tests\Support\BindsTaxDependencies;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class StoredRateTaxStrategyTest extends TestCase
{
    use BindsTaxDependencies;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_tax_dependencies();
    }

    public function test_an_item_is_taxed_at_its_stored_rate(): void
    {
        $strategy = $this->make_strategy($this->stored_terms([1 => [['name' => 'VAT', 'rate' => 10.0]]]));

        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(1000, $result->items[1][0]->base_amount);
        $this->assertSame('VAT', $result->items[1][0]->name);
        $this->assertSame(10.0, $result->items[1][0]->rate);
        $this->assertSame(1, $result->items[1][0]->item_id);
    }

    public function test_a_stored_rate_extracts_the_tax_when_the_order_prices_include_tax(): void
    {
        $strategy = $this->make_strategy($this->stored_terms([1 => [['name' => 'VAT', 'rate' => 25.0]]]), null, true);

        $result = $strategy->calculate($this->tax_context());

        $this->assertSame(2000, $result->items[1][0]->base_amount);
    }

    public function test_an_item_with_no_stored_tax_stays_untaxed(): void
    {
        $strategy = $this->make_strategy($this->stored_terms([1 => []]), $this->live_strategy(20));

        $result = $strategy->calculate($this->tax_context());

        $this->assertSame([], $result->items[1]);
    }

    public function test_an_item_without_a_stored_rate_takes_the_live_rate(): void
    {
        $strategy = $this->make_strategy($this->stored_terms([1 => [['name' => 'VAT', 'rate' => 10.0]]]), $this->live_strategy(20));

        $result = $strategy->calculate($this->tax_context([], ['items' => [$this->taxable_item(1, 10000), $this->taxable_item(2, 5000)]]));

        $this->assertSame(1000, $result->items[1][0]->base_amount);
        $this->assertSame(1000, $result->items[2][0]->base_amount);
        $this->assertSame(20.0, $result->items[2][0]->rate);
    }

    public function test_an_item_without_a_stored_rate_is_untaxed_when_no_live_strategy_exists(): void
    {
        $strategy = $this->make_strategy($this->stored_terms([1 => [['name' => 'VAT', 'rate' => 10.0]]]));

        $result = $strategy->calculate($this->tax_context([], ['items' => [$this->taxable_item(1, 10000), $this->taxable_item(2, 5000)]]));

        $this->assertSame([], $result->items[2]);
    }

    public function test_shipping_is_taxed_at_its_stored_rate(): void
    {
        $terms = $this->stored_terms([1 => []]);
        $terms->shipping_tax_rates = [['name' => 'Shipping Tax', 'rate' => 5.0, 'line_key' => null]];

        $result = $this->make_strategy($terms)->calculate($this->tax_context());

        $this->assertCount(1, $result->shipping);
        $this->assertSame(500, $result->shipping[0]->base_amount);
        $this->assertSame('Shipping Tax', $result->shipping[0]->name);
        $this->assertNull($result->shipping[0]->item_id);
    }

    public function test_shipping_tax_that_was_split_across_items_is_split_again_at_each_items_rate(): void
    {
        $terms = $this->stored_terms([1 => [['name' => 'VAT', 'rate' => 20.0]], 2 => [['name' => 'VAT', 'rate' => 10.0]]]);
        $terms->is_shipping_tax_split = true;
        $terms->shipping_tax_rates = [
            ['name' => 'VAT', 'rate' => 20.0, 'line_key' => 1],
            ['name' => 'VAT', 'rate' => 10.0, 'line_key' => 2],
        ];
        $context = $this->tax_context(['shipping_fee' => 1000], ['items' => [$this->taxable_item(1, 3000), $this->taxable_item(2, 1000)]]);

        $result = $this->make_strategy($terms)->calculate($context);

        // 1000 of shipping is shared 750 / 250 by the taxable amounts, then taxed at 20% and 10%.
        $this->assertSame([150, 25], array_map(fn($line) => $line->base_amount, $result->shipping));
        $this->assertSame([1, 2], array_map(fn($line) => $line->item_id, $result->shipping));
    }

    public function test_zero_shipping_keeps_its_stored_tax_rate(): void
    {
        $terms = $this->stored_terms([1 => []]);
        $terms->shipping_tax_rates = [['name' => 'Shipping Tax', 'rate' => 5.0, 'line_key' => null]];

        $result = $this->make_strategy($terms)->calculate($this->tax_context(['shipping_fee' => 0]));

        $this->assertCount(1, $result->shipping);
        $this->assertSame(5.0, $result->shipping[0]->rate);
        $this->assertSame(0, $result->shipping[0]->base_amount);
        $this->assertNull($result->shipping[0]->item_id);
    }

    public function test_zero_shipping_keeps_each_split_rate_even_when_every_item_is_free(): void
    {
        $terms = $this->stored_terms([1 => [['name' => 'VAT', 'rate' => 20.0]], 2 => [['name' => 'VAT', 'rate' => 10.0]]]);
        $terms->is_shipping_tax_split = true;
        $terms->shipping_tax_rates = [
            ['name' => 'VAT', 'rate' => 20.0, 'line_key' => 1],
            ['name' => 'VAT', 'rate' => 10.0, 'line_key' => 2],
        ];

        foreach ([1000, 0] as $taxable_amount) {
            $context = $this->tax_context(['shipping_fee' => 0], ['items' => [$this->taxable_item(1, $taxable_amount), $this->taxable_item(2, $taxable_amount)]]);
            $result = $this->make_strategy($terms)->calculate($context);

            $this->assertSame([20.0, 10.0], array_map(fn($line) => $line->rate, $result->shipping));
            $this->assertSame([0, 0], array_map(fn($line) => $line->base_amount, $result->shipping));
            $this->assertSame([1, 2], array_map(fn($line) => $line->item_id, $result->shipping));
        }
    }

    public function test_split_shipping_tax_uses_the_items_rate_when_its_stored_line_is_gone(): void
    {
        $terms = $this->stored_terms([2 => [['name' => 'VAT', 'rate' => 10.0]]]);
        $terms->is_shipping_tax_split = true;
        $terms->shipping_tax_rates = [['name' => 'VAT', 'rate' => 20.0, 'line_key' => null]];
        $context = $this->tax_context(['shipping_fee' => 1000], ['items' => [$this->taxable_item(2, 1000)]]);

        $result = $this->make_strategy($terms)->calculate($context);

        $this->assertSame(100, $result->shipping[0]->base_amount);
        $this->assertSame(2, $result->shipping[0]->item_id);
    }

    public function test_shipping_with_no_stored_tax_is_untaxed(): void
    {
        $terms = $this->stored_terms([1 => []]);
        $terms->shipping_tax_rates = [];

        $result = $this->make_strategy($terms, $this->live_strategy(20))->calculate($this->tax_context());

        $this->assertSame([], $result->shipping);
    }

    public function test_shipping_tax_is_calculated_again_when_it_is_not_stored(): void
    {
        $terms = $this->stored_terms([1 => [['name' => 'VAT', 'rate' => 10.0]]]);
        $terms->shipping_tax_rates = null;

        $result = $this->make_strategy($terms, $this->live_strategy(20))->calculate($this->tax_context());

        $this->assertSame(2000, $result->shipping[0]->base_amount);
    }

    public function test_it_reports_the_stored_tax_destination(): void
    {
        $terms = $this->stored_terms([1 => []]);
        $terms->tax_destination = OrderTaxDestination::BILLING;

        $strategy = $this->make_strategy($terms);

        $this->assertSame(OrderTaxDestination::BILLING, $strategy->tax_destination());
        $this->assertSame(OrderTaxDestination::BILLING, $strategy->calculate($this->tax_context())->tax_destination);
    }

    /**
     * @param array<int|string, array<int, array{name: string, rate: float}>> $item_tax_rates Stored product rates per line key.
     * @return StoredOrderTermsDTO
     */
    protected function stored_terms(array $item_tax_rates): StoredOrderTermsDTO
    {
        $terms = new StoredOrderTermsDTO();
        $terms->item_tax_rates = $item_tax_rates;
        $terms->shipping_tax_rates = [];
        $terms->tax_destination = OrderTaxDestination::SHIPPING;

        return $terms;
    }

    protected function make_strategy(StoredOrderTermsDTO $terms, $live_strategy = null, bool $is_tax_inclusive_price = false)
    {
        return new StoredRateTaxStrategy($terms, $live_strategy, $is_tax_inclusive_price);
    }

    protected function live_strategy(int $rate): DefaultTaxStrategy
    {
        return new DefaultTaxStrategy([
            'code' => 'BD',
            'is_enabled' => true,
            'is_central_tax_enabled' => true,
            'central_product_tax' => $rate,
            'central_shipping_tax' => $rate,
            'rules' => [],
            'states' => [],
        ], false, true);
    }

    protected function taxable_item(int $item_id, int $taxable_amount): TaxableItemDTO
    {
        return TaxableItemDTO::from_array(['item_id' => $item_id, 'taxable_amount' => $taxable_amount, 'tax_profile_id' => null, 'product_categories' => []]);
    }

    /**
     * @param array<string, mixed> $overrides Context fields to override.
     * @param array<string, mixed> $extras    More context fields, e.g. `items`.
     * @return TaxCalculationContextDTO
     */
    protected function tax_context(array $overrides = [], array $extras = []): TaxCalculationContextDTO
    {
        return TaxCalculationContextDTO::from_array(array_merge([
            'shipping_address' => ['country' => 'BD', 'state' => '771'],
            'billing_address' => [],
            'shipping_fee' => 10000,
            'is_shipping_taxable' => true,
            'items' => [$this->taxable_item(1, 10000)],
        ], $overrides, $extras));
    }
}
