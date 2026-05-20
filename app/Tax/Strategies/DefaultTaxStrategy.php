<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

use Brick\Math\RoundingMode;
use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxItemResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxResultDTO;
use Kirki\Ecommerce\Supports\Facades\Money;

class DefaultTaxStrategy extends AbstractTaxStrategy
{
    public function calculate_product_tax(ProductTaxContextDTO $tax_context): TaxResultDTO
    {
        return $this->calculate_tax('product_tax', $tax_context->all(), $tax_context->product_price);
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

        if (!empty($this->settings['rules']) && !empty($context_data)) {
            $context_data[$type] = $rate;
            $context = $this->prepare_decision_context($context_data);
            $context = $this->apply_rules($context, $this->settings['rules']);

            $rate = $context->get($type);
        }

        if ($this->is_tax_inclusive_price) {
            $tax_amount = $amount->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100 + $rate, RoundingMode::HALF_UP)->getMinorAmount()->toInt();
            $result->breakdown = [
                TaxItemResultDTO::from_array([
                    'name' => 'Tax',
                    'rate' => $rate,
                    'amount' => $tax_amount
                ])
            ];
            $result->total = $tax_amount;

            return $result;
        }

        $tax_amount = $amount->multipliedBy($rate, RoundingMode::HALF_UP)->dividedBy(100, RoundingMode::HALF_UP)->getMinorAmount()->toInt();

        $result->breakdown = [
            TaxItemResultDTO::from_array([
                'name' => 'Tax',
                'rate' => $rate,
                'amount' => $tax_amount
            ])
        ];
        $result->total = $tax_amount;

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
        $is_central_tax_enabled = $this->settings['is_central_tax_enabled'] ?? false;

        if ($is_central_tax_enabled) {
            $central_key = $type === 'product_tax' ? 'central_product_tax' : 'central_shipping_tax';
            return $this->settings[$central_key] ?? 0;
        }

        $rates = $this->settings[$type] ?? [];
        $state = $this->address['state'] ?? null;

        if (empty($state)) {
            return 0;
        }

        foreach ($rates as $rate_config) {
            if ($state === $rate_config['state']) {
                return (float) $rate_config['rate'];
            }
        }

        return 0;
    }
}
