<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxResultDTO;

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
     * Calculate product tax
     *
     * @param ProductTaxContextDTO $tax_context
     * @return TaxResultDTO
     */
    abstract public function calculate_product_tax(ProductTaxContextDTO $tax_context);

    /**
     * Calculate shipping tax
     *
     * @param int $shipping_cost
     * @return TaxResultDTO
     */
    abstract public function calculate_shipping_tax(int $shipping_cost);

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
