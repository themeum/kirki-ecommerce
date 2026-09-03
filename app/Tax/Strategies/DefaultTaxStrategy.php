<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

use Brick\Math\RoundingMode;
use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxItemResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxResultDTO;
use Kirki\Ecommerce\App\Facades\Money;

class DefaultTaxStrategy extends AbstractTaxStrategy
{
    public function calculate_product_tax(ProductTaxContextDTO $tax_context): TaxResultDTO
    {
        return $this->calculate_tax('product_tax', $tax_context->all(), $tax_context->base_product_price);
    }

    public function calculate_shipping_tax(int $shipping_cost): TaxResultDTO
    {
        if (!$this->is_shipping_tax_enabled) {
            return new TaxResultDTO();
        }

        return $this->calculate_tax('shipping_tax', [], $shipping_cost);
    }

    public function calculate_tax(string $type, array $context_data, int $amount): TaxResultDTO
    {
        $result = new TaxResultDTO();

        $rate = $this->get_rate($type);
        $amount = Money::from_minor($amount);
        $rules = $this->get_rules();

        if (!empty($rules) && !empty($context_data)) {
            $context_data[$type] = $rate;
            $context = $this->prepare_decision_context($context_data);
            $context = $this->apply_rules($context, $rules);

            $rate = $context->get($type);
        }

        if ($this->is_tax_inclusive_price) {
            $tax_amount = $amount->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100 + $rate, RoundingMode::HALF_UP)->getMinorAmount()->toInt();
            $result->breakdown = [
                TaxItemResultDTO::from_array([
                    'name' => 'Tax',
                    'rate' => $rate,
                    'base_amount' => $tax_amount
                ])
            ];
            $result->base_total = $tax_amount;

            return $result;
        }

        $tax_amount = $amount->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100, RoundingMode::HALF_UP)->getMinorAmount()->toInt();

        $result->breakdown = [
            TaxItemResultDTO::from_array([
                'name' => 'Tax',
                'rate' => $rate,
                'base_amount' => $tax_amount
            ])
        ];
        $result->base_total = $tax_amount;

        return $result;
    }

    /**
     * Get tax rate based on state or central tax configuration
     *
     * @param string $type 'product_tax' or 'shipping_tax'
     * @return float
     */
    protected function get_rate(string $type): float
    {
        if (!empty($this->settings['is_central_tax_enabled'])) {
            $central_key = $type === 'product_tax' ? 'central_product_tax' : 'central_shipping_tax';
            return (float) ($this->settings[$central_key] ?? 0);
        }

        $state = $this->get_matched_state();

        if (empty($state)) {
            return 0;
        }

        $rate_key = $type === 'product_tax' ? 'product_tax_rate' : 'shipping_tax_rate';

        return (float) ($state[$rate_key] ?? 0);
    }

    /**
     * The configured state matching the shipping address, keyed by state id.
     * Always null in central tax mode, where no state is consulted.
     *
     * @return array|null
     */
    protected function get_matched_state()
    {
        if (!empty($this->settings['is_central_tax_enabled'])) {
            return null;
        }

        $address_state = (string) ($this->address['state'] ?? '');

        if ($address_state === '') {
            return null;
        }

        foreach ($this->settings['states'] ?? [] as $state) {
            if (is_array($state) && (string) ($state['id'] ?? '') === $address_state) {
                return $state;
            }
        }

        return null;
    }

    /**
     * The rule set that applies to this address: the region's own rules in central
     * tax mode, the matched state's rules otherwise. Never both.
     *
     * @return array
     */
    protected function get_rules(): array
    {
        if (!empty($this->settings['is_central_tax_enabled'])) {
            return $this->settings['rules'] ?? [];
        }

        $state = $this->get_matched_state();

        return $state['rules'] ?? [];
    }
}
