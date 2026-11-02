<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

defined('ABSPATH') || exit;

use Brick\Math\RoundingMode;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxDestination;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationResultDTO;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\App\decision_engine;

/**
 * Base class for country-specific tax calculation strategies.
 *
 * @since 1.0.0
 */
abstract class AbstractTaxStrategy
{
    /** @var array<string, mixed> Tax region configuration for the address's country. */
    protected $settings;
    /** @var bool */
    protected $is_tax_inclusive_price;
    /** @var bool */
    protected $is_shipping_tax_enabled;
    /** @var string Which of the context's addresses the tax is calculated from: an OrderTaxDestination value. */
    protected $destination;

    /**
     * Create a new tax strategy instance.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $country_settings        Tax region configuration for the tax address's country.
     * @param bool                 $is_tax_inclusive_price  Whether catalog prices already include tax.
     * @param bool                 $is_shipping_tax_enabled Whether shipping is taxed.
     * @param string               $destination             Which of the context's addresses the tax is calculated from: an OrderTaxDestination value.
     */
    public function __construct(array $country_settings, bool $is_tax_inclusive_price, bool $is_shipping_tax_enabled, string $destination = OrderTaxDestination::SHIPPING)
    {
        $this->settings = $country_settings;
        $this->is_tax_inclusive_price = $is_tax_inclusive_price;
        $this->is_shipping_tax_enabled = $is_shipping_tax_enabled;
        $this->destination = $destination;
    }

    /**
     * Get the address the tax is calculated from.
     *
     * A country whose law needs a special rule for choosing the address overrides
     * this, together with `tax_destination()`.
     *
     * @since 1.0.0
     *
     * @param TaxCalculationContextDTO $context Addresses and items to tax.
     * @return array<string, mixed> Empty when that address is not set.
     */
    protected function tax_address(TaxCalculationContextDTO $context): array
    {
        return $context->address_for($this->destination);
    }

    /**
     * Get the destination to record on the order: which kind of address the tax came from.
     *
     * Defaults to the destination the strategy was built for. A country whose tax does not
     * follow that destination overrides this to report the one it really used.
     *
     * @since 1.0.0
     *
     * @return string An OrderTaxDestination value.
     */
    public function tax_destination(): string
    {
        return $this->destination;
    }

    /**
     * Calculate every tax line the cart accrues - per item and for shipping -
     * in one pass.
     *
     * @since 1.0.0
     *
     * @param TaxCalculationContextDTO $context
     * @return TaxCalculationResultDTO
     */
    abstract public function calculate(TaxCalculationContextDTO $context): TaxCalculationResultDTO;

    /**
     * The tax amount for one line: extracted from the base amount when prices
     * are tax-inclusive, added on top of it otherwise.
     *
     * @since 1.0.0
     *
     * @param float $rate        Tax rate as a percentage.
     * @param int   $base_amount Line amount in minor units.
     * @return int Tax amount in minor units.
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
     * @since 1.0.0
     *
     * @param float $rate        Tax rate as a percentage.
     * @param int   $base_amount Shipping charge in minor units.
     * @return int Tax amount in minor units.
     */
    protected function calculate_shipping_tax_amount(float $rate, int $base_amount): int
    {
        return Money::from_minor($base_amount)->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100, RoundingMode::HALF_UP)->getMinorAmount()->toInt();
    }

    /**
     * Apply rules using Decision Engine.
     *
     * @since 1.0.0
     *
     * @param DecisionContext      $context
     * @param array<string, mixed> $rules   Decision rules to apply, none when empty.
     * @return DecisionContext The same context, updated by the rules.
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
     * Prepare decision context for rule evaluation.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $context_data Values the rules can read and change.
     * @return DecisionContext
     */
    protected function prepare_decision_context(array $context_data)
    {
        return DecisionContext::from($context_data);
    }
}
