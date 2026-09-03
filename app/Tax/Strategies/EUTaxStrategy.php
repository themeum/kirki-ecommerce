<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

use Brick\Math\RoundingMode;
use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxItemResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxResultDTO;
use Kirki\Ecommerce\App\Facades\Money;

class EUTaxStrategy extends AbstractTaxStrategy
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
                    'name' => 'VAT',
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
                'name' => 'VAT',
                'rate' => $rate,
                'base_amount' => $tax_amount
            ])
        ];
        $result->base_total = $tax_amount;

        return $result;
    }

    /**
     * Get the VAT rate configured for the address's member country. A member
     * country has a single rate that applies to both product and shipping tax.
     *
     * @param string $type 'product_tax' or 'shipping_tax' — kept as the
     *                      rules-context key; it does not affect the rate.
     * @return float
     */
    protected function get_rate(string $type): float
    {
        $address_country = (string) ($this->address['country'] ?? '');

        if ($address_country === '') {
            return 0;
        }

        foreach ($this->settings['countries'] ?? [] as $country) {
            if (is_array($country) && (string) ($country['code'] ?? '') === $address_country) {
                return (float) ($country['rate'] ?? 0);
            }
        }

        return 0;
    }
}
