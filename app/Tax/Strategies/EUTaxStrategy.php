<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO;
use Kirki\Ecommerce\App\Facades\Money;

/**
 * Tax strategy for EU member countries, charging the VAT rate of the destination country.
 *
 * @since 1.0.0
 */
class EUTaxStrategy extends AbstractTaxStrategy
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function calculate(TaxCalculationContextDTO $context): TaxCalculationResultDTO
    {
        $result = new TaxCalculationResultDTO();
        $rates_by_item = [];

        foreach ($context->items as $item) {
            $rate = $this->resolve_item_rate($item, $context);
            $rates_by_item[$item->item_id] = $rate;

            $result->items[$item->item_id] = [
                TaxLineDTO::from_array([
                    'name' => 'VAT',
                    'rate' => $rate,
                    'base_amount' => $this->calculate_tax_amount($rate, $item->taxable_amount),
                    'item_id' => $item->item_id,
                ]),
            ];
        }

        $result->shipping = $this->calculate_shipping_tax($context, $rates_by_item);

        return $result;
    }

    /**
     * Resolve the VAT rate for one cart item, letting any matching decision
     * rules override the destination country's rate.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxableItemDTO $item
     * @param TaxCalculationContextDTO                    $tax_context
     * @return float
     */
    protected function resolve_item_rate($item, TaxCalculationContextDTO $tax_context): float
    {
        $rate = $this->get_rate();

        if (empty($this->settings['rules'])) {
            return $rate;
        }

        $decision_context = $this->prepare_decision_context([
            'shipping_address' => $this->address,
            'billing_address' => $tax_context->billing_address,
            'base_product_price' => $item->taxable_amount,
            'product_categories' => $item->product_categories,
            'tax_profile' => $item->tax_profile_id,
            'product_tax' => $rate,
        ]);

        $decision_context = $this->apply_rules($decision_context, $this->settings['rules']);

        return (float) $decision_context->get('product_tax');
    }

    /**
     * The EU's shipping tax follows the goods it ships: rather than one
     * independently configured shipping rate, the shipping fee is
     * allocated across the cart's items - proportioned to each item's own
     * taxable value - and each item's portion is taxed at that item's own
     * resolved rate. Every line is tagged with the item it was allocated
     * to, so persistence can record which order item each portion of
     * shipping tax belongs to; two items that happen to share a rate still
     * produce two separate lines, one per item, rather than being merged.
     *
     * @since 1.0.0
     *
     * @param TaxCalculationContextDTO $context
     * @param array<int|string, float> $rates_by_item VAT rate of each item, keyed by item ID.
     * @return TaxLineDTO[] Empty when shipping tax is disabled or shipping is not taxable.
     */
    protected function calculate_shipping_tax(TaxCalculationContextDTO $context, array $rates_by_item): array
    {
        if (!$this->is_shipping_tax_enabled || !$context->is_shipping_taxable) {
            return [];
        }

        $taxable_amounts = array_map(fn($item) => $item->taxable_amount, $context->items);

        // No items to allocate the shipping fee across (e.g. a
        // shipping-only quote) - fall back to the member country's plain
        // rate, unattributed to any item.
        if (empty($taxable_amounts) || array_sum($taxable_amounts) <= 0) {
            $rate = $this->get_rate();

            return [
                TaxLineDTO::from_array([
                    'name' => 'VAT',
                    'rate' => $rate,
                    'base_amount' => $this->calculate_shipping_tax_amount($rate, $context->shipping_fee),
                ]),
            ];
        }

        $portions = Money::from_minor($context->shipping_fee)->allocate(...$taxable_amounts);

        $lines = [];

        foreach ($context->items as $index => $item) {
            $portion = $portions[$index]->getMinorAmount()->toInt();

            if ($portion <= 0) {
                continue;
            }

            $rate = $rates_by_item[$item->item_id];

            $lines[] = TaxLineDTO::from_array([
                'name' => 'VAT',
                'rate' => $rate,
                'base_amount' => $this->calculate_shipping_tax_amount($rate, $portion),
                'item_id' => $item->item_id,
            ]);
        }

        return $lines;
    }

    /**
     * Get the VAT rate configured for the address's member country. A member
     * country has a single rate that applies to both product and shipping tax.
     *
     * @since 1.0.0
     *
     * @return float Zero when the address has no country or the country has no configured rate.
     */
    protected function get_rate(): float
    {
        // TODO: honour $this->settings['type'] === 'micro_business' — a micro
        // business charges its home-country VAT rate, not the destination
        // member-country rate resolved below. Currently 'oss' and 'micro_business'
        // behave identically.
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
