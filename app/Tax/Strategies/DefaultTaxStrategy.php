<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO;

/**
 * Tax strategy for countries taxed per item and shipping at a central or per-state rate.
 *
 * @since 1.0.0
 */
class DefaultTaxStrategy extends AbstractTaxStrategy
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function calculate(TaxCalculationContextDTO $context): TaxCalculationResultDTO
    {
        $result = new TaxCalculationResultDTO();

        foreach ($context->items as $item) {
            $result->items[$item->item_id] = [$this->calculate_item_tax($item, $context)];
        }

        $result->shipping = $this->calculate_shipping_tax($context);
        $result->tax_destination = $this->tax_destination();

        return $result;
    }

    /**
     * Calculate the tax line for one cart item.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxableItemDTO $item
     * @param TaxCalculationContextDTO                    $context
     * @return TaxLineDTO
     */
    protected function calculate_item_tax($item, TaxCalculationContextDTO $context): TaxLineDTO
    {
        $rate = $this->resolve_rate('product_tax', $this->tax_address($context), [
            'shipping_address' => $context->shipping_address,
            'billing_address' => $context->billing_address,
            'base_product_price' => $item->taxable_amount,
            'product_categories' => $item->product_categories,
            'tax_profile' => $item->tax_profile_id,
        ]);

        return TaxLineDTO::from_array([
            'name' => 'Tax',
            'rate' => $rate,
            'base_amount' => $this->calculate_tax_amount($rate, $item->taxable_amount),
            'item_id' => $item->item_id,
        ]);
    }

    /**
     * Calculate the tax lines for shipping.
     *
     * @since 1.0.0
     *
     * @param TaxCalculationContextDTO $context
     * @return TaxLineDTO[] Empty when shipping tax is disabled or shipping is not taxable.
     */
    protected function calculate_shipping_tax(TaxCalculationContextDTO $context): array
    {
        if (!$this->is_shipping_tax_enabled || !$context->is_shipping_taxable) {
            return [];
        }

        $rate = $this->resolve_rate('shipping_tax', $this->tax_address($context), ['shipping_address' => $context->shipping_address]);

        return [
            TaxLineDTO::from_array([
                'name' => 'Shipping Tax',
                'rate' => $rate,
                'base_amount' => $this->calculate_shipping_tax_amount($rate, $context->shipping_fee),
            ]),
        ];
    }

    /**
     * Resolve a rate for the given tax type, letting any matching decision
     * rules override the base configured rate.
     *
     * @since 1.0.0
     *
     * @param string               $type         'product_tax' or 'shipping_tax'
     * @param array<string, mixed> $tax_address  The address the tax is calculated from.
     * @param array<string, mixed> $context_data Values the decision rules can read.
     * @return float
     */
    protected function resolve_rate(string $type, array $tax_address, array $context_data): float
    {
        $rate = $this->get_rate($type, $tax_address);
        $rules = $this->get_rules($tax_address);

        if (empty($rules)) {
            return $rate;
        }

        $context_data[$type] = $rate;
        $context = $this->prepare_decision_context($context_data);
        $context = $this->apply_rules($context, $rules);

        return (float) $context->get($type);
    }

    /**
     * Get tax rate based on state or central tax configuration.
     *
     * @since 1.0.0
     *
     * @param string               $type        'product_tax' or 'shipping_tax'
     * @param array<string, mixed> $tax_address The address the tax is calculated from.
     * @return float Zero when no state matches the address.
     */
    protected function get_rate(string $type, array $tax_address): float
    {
        if (!empty($this->settings['is_central_tax_enabled'])) {
            $central_key = $type === 'product_tax' ? 'central_product_tax' : 'central_shipping_tax';
            return (float) ($this->settings[$central_key] ?? 0);
        }

        $state = $this->get_matched_state($tax_address);

        if (empty($state)) {
            return 0;
        }

        $rate_key = $type === 'product_tax' ? 'product_tax_rate' : 'shipping_tax_rate';

        return (float) ($state[$rate_key] ?? 0);
    }

    /**
     * The configured state matching the tax address, keyed by state id.
     * Always null in central tax mode, where no state is consulted.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $tax_address The address the tax is calculated from.
     * @return array<string, mixed>|null
     */
    protected function get_matched_state(array $tax_address)
    {
        if (!empty($this->settings['is_central_tax_enabled'])) {
            return null;
        }

        $address_state = (string) ($tax_address['state'] ?? '');

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
     * @since 1.0.0
     *
     * @param array<string, mixed> $tax_address The address the tax is calculated from.
     * @return array<string, mixed>
     */
    protected function get_rules(array $tax_address): array
    {
        if (!empty($this->settings['is_central_tax_enabled'])) {
            return $this->settings['rules'] ?? [];
        }

        $state = $this->get_matched_state($tax_address);

        return $state['rules'] ?? [];
    }
}
