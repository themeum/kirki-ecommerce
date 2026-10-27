<?php

namespace Kirki\Ecommerce\App\Tax\Strategies;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Order\OrderTaxDestination;
use Kirki\Ecommerce\App\DTO\Calculation\StoredOrderTermsDTO;
use Kirki\Ecommerce\App\DTO\Calculation\TaxRateDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxableItemDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO;
use Kirki\Ecommerce\App\Facades\Money;

/**
 * Tax strategy that charges the rates stored on an order instead of the current tax settings.
 *
 * Used when an order is edited and its tax address did not change. A line that
 * has stored rates keeps them. A line without stored rates (a line added in the
 * edit) takes its rate from the live strategy, when there is one.
 *
 * @since 1.0.0
 */
class StoredRateTaxStrategy extends AbstractTaxStrategy
{
    /** @var StoredOrderTermsDTO */
    protected $stored;

    /** @var AbstractTaxStrategy|null */
    protected $live_strategy;

    /**
     * Create the strategy from the order's stored tax terms.
     *
     * @since 1.0.0
     *
     * @param StoredOrderTermsDTO      $stored                 Terms the order was placed with.
     * @param AbstractTaxStrategy|null $live_strategy          Strategy for the current settings, used for lines without a stored rate; null when tax is not calculated today.
     * @param bool                     $is_tax_inclusive_price Whether the order's prices include tax.
     */
    public function __construct(StoredOrderTermsDTO $stored, ?AbstractTaxStrategy $live_strategy, bool $is_tax_inclusive_price)
    {
        parent::__construct([], $is_tax_inclusive_price, true, $stored->tax_destination ?: OrderTaxDestination::SHIPPING);

        $this->stored = $stored;
        $this->live_strategy = $live_strategy;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function calculate(TaxCalculationContextDTO $context): TaxCalculationResultDTO
    {
        $live_result = $this->live_strategy ? $this->live_strategy->calculate($context) : new TaxCalculationResultDTO();
        $result = new TaxCalculationResultDTO();

        foreach ($context->items as $item) {
            $stored_rates = $this->stored->item_tax_rates[$item->item_id] ?? null;

            $result->items[$item->item_id] = $stored_rates === null
                ? ($live_result->items[$item->item_id] ?? [])
                : $this->calculate_item_lines($item, $stored_rates);
        }

        $result->shipping = $this->stored->shipping_tax_rates === null
            ? $live_result->shipping
            : $this->calculate_shipping_lines($context, $result);
        $result->tax_destination = $this->stored->tax_destination ?: $live_result->tax_destination;

        return $result;
    }

    /**
     * Calculate the tax lines of one item at its stored rates.
     *
     * @since 1.0.0
     *
     * @param TaxableItemDTO $item         Item to tax.
     * @param TaxRateDTO[]   $stored_rates Rates stored for the item.
     * @return TaxLineDTO[]
     */
    protected function calculate_item_lines(TaxableItemDTO $item, array $stored_rates): array
    {
        return array_map(function ($stored_rate) use ($item) {
            return TaxLineDTO::from_array([
                'name' => $stored_rate->name,
                'rate' => $stored_rate->rate,
                'base_amount' => $this->calculate_tax_amount($stored_rate->rate, $item->taxable_amount),
                'item_id' => $item->item_id,
            ]);
        }, $stored_rates);
    }

    /**
     * Calculate the shipping tax lines at the stored shipping rates.
     *
     * A shipping tax that was split across items (as in the EU) is split again,
     * in proportion to the items' taxable amounts, each portion at its item's rate.
     *
     * @since 1.0.0
     *
     * @param TaxCalculationContextDTO $context Addresses, shipping fee and items to tax.
     * @param TaxCalculationResultDTO  $result  Result so far, holding the item tax lines.
     * @return TaxLineDTO[] Stored rates with calculated amounts, including zero amounts when shipping is free.
     */
    protected function calculate_shipping_lines(TaxCalculationContextDTO $context, TaxCalculationResultDTO $result): array
    {
        $stored_rates = $this->stored->shipping_tax_rates;

        if (empty($stored_rates)) {
            return [];
        }

        $is_split_across_items = $this->stored->is_shipping_tax_split;
        $taxable_amounts = array_map(fn($item) => $item->taxable_amount, $context->items);
        $has_taxable_amounts = array_sum($taxable_amounts) > 0;

        if (!$is_split_across_items || (!$has_taxable_amounts && $context->shipping_fee > 0)) {
            return array_map(function ($stored_rate) use ($context) {
                return TaxLineDTO::from_array([
                    'name' => $stored_rate->name,
                    'rate' => $stored_rate->rate,
                    'base_amount' => $this->calculate_shipping_tax_amount($stored_rate->rate, $context->shipping_fee),
                ]);
            }, $is_split_across_items ? [$stored_rates[0]] : $stored_rates);
        }

        $rates_by_line_key = [];

        foreach ($stored_rates as $stored_rate) {
            if ($stored_rate->line_key !== null) {
                $rates_by_line_key[$stored_rate->line_key] = $stored_rate;
            }
        }

        $portions = $has_taxable_amounts ? Money::from_minor($context->shipping_fee)->allocate(...$taxable_amounts) : [];
        $lines = [];

        foreach ($context->items as $index => $item) {
            $portion = isset($portions[$index]) ? $portions[$index]->getMinorAmount()->toInt() : 0;

            $item_rate = $rates_by_line_key[$item->item_id] ?? $this->first_item_rate($result->items[$item->item_id] ?? [], $stored_rates[0]);

            $lines[] = TaxLineDTO::from_array([
                'name' => $item_rate->name,
                'rate' => $item_rate->rate,
                'base_amount' => $this->calculate_shipping_tax_amount($item_rate->rate, $portion),
                'item_id' => $item->item_id,
            ]);
        }

        return $lines;
    }

    /**
     * Get the rate of an item's first tax line, for a line that has no stored shipping rate.
     *
     * @since 1.0.0
     *
     * @param TaxLineDTO[] $item_lines Tax lines of the item.
     * @param TaxRateDTO   $fallback   Rate to use when the item has no tax line.
     * @return TaxRateDTO
     */
    protected function first_item_rate(array $item_lines, TaxRateDTO $fallback): TaxRateDTO
    {
        if (empty($item_lines)) {
            return $fallback;
        }

        $item_rate = new TaxRateDTO();
        $item_rate->name = $item_lines[0]->name;
        $item_rate->rate = $item_lines[0]->rate;

        return $item_rate;
    }
}
