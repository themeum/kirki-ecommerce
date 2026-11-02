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

/**
 * Tax strategy that charges the rates stored on an order instead of the current tax settings.
 *
 * Used when an order is edited and its tax address did not change. A line that
 * has stored rates keeps them. A line without stored rates (a line added in the
 * edit) and the shipping, which an edit always quotes again, take their rates
 * from the live strategy, when there is one.
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
     * @param AbstractTaxStrategy|null $live_strategy          Strategy for the current settings, used for lines without a stored rate and for shipping; null when tax is not calculated today.
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

        $result->shipping = $live_result->shipping;
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
}
