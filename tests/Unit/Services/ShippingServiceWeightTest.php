<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Decisions\Conditions\CartWeightCondition;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\collection;

class ShippingServiceWeightTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies('USD', [], [], ['product' => ['weight_unit' => 'kg']]);
    }

    /**
     * @param array<int, array{0: int|float|null, 1: string|null, 2?: int}> $lines Weight, unit and quantity of each line.
     */
    protected function make_context(array $lines): CalculationContextDTO
    {
        $items = array_map(function (array $line) {
            $item = new CalculationItemDTO();
            $item->weight = $line[0];
            $item->weight_unit = $line[1];
            $item->quantity = $line[2] ?? 1;
            $item->base_unit_price = 1000;

            return $item;
        }, $lines);

        $context = new CalculationContextDTO();
        $context->items = collection($items);

        return $context;
    }

    /**
     * Make a shipping service that exposes its protected weight methods.
     */
    protected function make_service(): ShippingService
    {
        return new class([]) extends ShippingService {
            public function total_weight(CalculationContextDTO $context)
            {
                return $this->get_total_weight($context);
            }

            public function weight_based_cost(CalculationContextDTO $context, array $method)
            {
                return $this->calculate_weight_based_cost($context, $method);
            }
        };
    }

    public function test_adds_lines_in_different_units_in_the_store_unit(): void
    {
        $context = $this->make_context([[500, 'g'], [1, 'kg']]);

        $this->assertEqualsWithDelta(1.5, $this->make_service()->total_weight($context), 1e-9);
    }

    public function test_applies_the_quantity_after_conversion(): void
    {
        $context = $this->make_context([[250, 'g', 3]]);

        $this->assertEqualsWithDelta(0.75, $this->make_service()->total_weight($context), 1e-9);
    }

    public function test_counts_a_line_without_a_unit_as_the_store_unit(): void
    {
        $context = $this->make_context([[2, null, 2]]);

        $this->assertEqualsWithDelta(4, $this->make_service()->total_weight($context), 1e-9);
    }

    public function test_ignores_a_line_without_a_weight(): void
    {
        $context = $this->make_context([[null, null], [1, 'kg']]);

        $this->assertEqualsWithDelta(1, $this->make_service()->total_weight($context), 1e-9);
    }

    public function test_the_cart_weight_condition_matches_on_the_converted_total(): void
    {
        $service = $this->make_service();
        $condition = new CartWeightCondition();

        $heavy = DecisionContext::from(['cart_weight' => $service->total_weight($this->make_context([[500, 'g'], [1, 'kg']]))]);
        $light = DecisionContext::from(['cart_weight' => $service->total_weight($this->make_context([[2, 'lb']]))]);

        $this->assertTrue($condition->evaluate($heavy, '>', 1));
        $this->assertTrue($condition->evaluate($light, '<', 1));
    }

    public function test_weight_based_cost_selects_the_range_for_the_converted_total(): void
    {
        $method = [
            'is_free_shipping_enabled' => false,
            'ranges' => [
                ['from' => 0, 'to' => 1, 'base_amount' => 500],
                ['from' => 1, 'to' => 2, 'base_amount' => 900],
            ],
        ];

        $cost = $this->make_service()->weight_based_cost($this->make_context([[800, 'g'], [400, 'g']]), $method);

        $this->assertSame(900, $cost);
    }
}
