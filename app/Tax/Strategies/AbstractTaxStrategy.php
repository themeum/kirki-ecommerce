<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

use Brick\Math\RoundingMode;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationResultDTO;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\App\decision_engine;

abstract class AbstractTaxStrategy
{
    protected $address;
    protected $settings;
    protected $is_tax_inclusive_price;
    protected $is_shipping_tax_enabled;

    public function __construct(array $address, array $country_settings, bool $is_tax_inclusive_price, bool $is_shipping_tax_enabled)
    {
        $this->address = $address;
        $this->settings = $country_settings;
        $this->is_tax_inclusive_price = $is_tax_inclusive_price;
        $this->is_shipping_tax_enabled = $is_shipping_tax_enabled;
    }

    /**
     * Calculate every tax line the cart accrues - per item and for shipping -
     * in one pass.
     *
     * @param TaxCalculationContextDTO $context
     * @return TaxCalculationResultDTO
     */
    abstract public function calculate(TaxCalculationContextDTO $context): TaxCalculationResultDTO;

    /**
     * The tax amount for one line: extracted from the base amount when prices
     * are tax-inclusive, added on top of it otherwise.
     *
     * @param float $rate
     * @param int $base_amount
     * @return int
     */
    protected function calculate_tax_amount(float $rate, int $base_amount): int
    {
        $amount = Money::from_minor($base_amount);

        if ($this->is_tax_inclusive_price) {
            return $amount->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100 + $rate, RoundingMode::HALF_UP)->getMinorAmount()->toInt();
        }

        return $amount->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100, RoundingMode::HALF_UP)->getMinorAmount()->toInt();
    }

    /**
     * The tax amount for a shipping line: always added on top of the
     * shipping charge, regardless of the store's tax-inclusive-price
     * setting for products - a shipping fee is never itself quoted
     * tax-inclusive.
     *
     * @param float $rate
     * @param int $base_amount
     * @return int
     */
    protected function calculate_shipping_tax_amount(float $rate, int $base_amount): int
    {
        return Money::from_minor($base_amount)->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100, RoundingMode::HALF_UP)->getMinorAmount()->toInt();
    }

    /**
     * Apply rules using Decision Engine
     *
     * @param DecisionContext $context
     * @param array $rules
     * @return DecisionContext
     */
    protected function apply_rules(DecisionContext $context, array $rules)
    {
        if (empty($rules)) {
            return $context;
        }

        $engine = decision_engine();
        $engine->apply_rules($context, $rules);

        return $context;
    }

    /**
     * Prepare decision context for rule evaluation
     *
     * @param array $context_data
     * @return DecisionContext
     */
    protected function prepare_decision_context(array $context_data)
    {
        return DecisionContext::from($context_data);
    }
}
