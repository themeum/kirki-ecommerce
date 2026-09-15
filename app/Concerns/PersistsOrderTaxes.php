<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\Constants\Order\OrderTaxType;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderTaxDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderTax;
use Exception;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Keeps an order's tax lines (`order_taxes`) reconciled with its latest
 * calculation. Used by both order creation and order editing, since both
 * recalculate an order's items/tax and both need the tax lines to reflect
 * the result exactly.
 *
 * Expects the using class to provide:
 * - a `convert_amount($amount, $target_currency_code, $exchange_rate)` method,
 *   matching the one already on `CreateOrderAction`/`UpdateOrderAction`.
 * - an `$order_service` property (OrderService), which owns all persistence
 *   for order_taxes, matching how order_items are only ever touched through
 *   OrderService.
 */
trait PersistsOrderTaxes
{
    /**
     * Replace an order's tax lines with a fresh set built from the given
     * calculation result.
     *
     * @param Order $order
     * @param CalculationResultDTO $calculated_result
     * @param string $currency_code
     * @param float $exchange_rate
     * @return OrderTax[]
     */
    protected function sync_order_taxes(Order $order, CalculationResultDTO $calculated_result, string $currency_code, float $exchange_rate)
    {
        $this->order_service->delete_order_taxes($order->id);

        $order_items_by_variant_id = [];

        foreach ($order->items as $item) {
            $order_items_by_variant_id[$item->variant_id] = $item;
        }

        $order_taxes = [];

        foreach ($order->items as $item) {
            $tax_lines = $calculated_result->items[$item->variant_id]->tax_lines ?? [];

            foreach ($tax_lines as $tax_line) {
                $order_taxes[] = $this->create_order_tax($order, $item->id, OrderTaxType::PRODUCT, $tax_line, $currency_code, $exchange_rate);
            }
        }

        foreach ($calculated_result->shipping_tax_lines as $tax_line) {
            // A shipping line carries an item_id only when the strategy
            // split the shipping tax proportionally across items (e.g. EU);
            // that maps to the order item whose share this line is. A line
            // with no item_id applies to the order's shipping as a whole.
            $order_item = $tax_line->item_id !== null ? ($order_items_by_variant_id[$tax_line->item_id] ?? null) : null;

            $order_taxes[] = $this->create_order_tax($order, $order_item ? $order_item->id : null, OrderTaxType::SHIPPING, $tax_line, $currency_code, $exchange_rate);
        }

        $this->assert_order_taxes_reconcile($order_taxes, $calculated_result->base_tax_total);

        return $order_taxes;
    }

    /**
     * @param Order $order
     * @param int|null $order_item_id
     * @param string $type
     * @param TaxLineDTO $tax_line
     * @param string $currency_code
     * @param float $exchange_rate
     * @return OrderTax
     */
    protected function create_order_tax(Order $order, $order_item_id, string $type, TaxLineDTO $tax_line, string $currency_code, float $exchange_rate)
    {
        $order_tax_dto = new CreateOrderTaxDTO();
        $order_tax_dto->order_id = $order->id;
        $order_tax_dto->order_item_id = $order_item_id;
        $order_tax_dto->type = $type;
        $order_tax_dto->name = $tax_line->name;
        $order_tax_dto->rate = $tax_line->rate;
        $order_tax_dto->invoiced_amount = $this->convert_amount($tax_line->base_amount, $currency_code, $exchange_rate);
        $order_tax_dto->base_amount = $tax_line->base_amount;

        return $this->order_service->create_order_tax($order_tax_dto);
    }

    /**
     * @param OrderTax[] $order_taxes
     * @param int $expected_total
     * @throws Exception
     */
    protected function assert_order_taxes_reconcile(array $order_taxes, int $expected_total)
    {
        $sum = collection($order_taxes)->sum(fn(OrderTax $order_tax) => $order_tax->base_amount);

        throw_if(
            $sum !== $expected_total,
            sprintf(
                /* translators: 1: Sum of order tax lines, 2: Expected tax total. */
                __('Order tax reconciliation failed: order_taxes sum to %1$d but the order\'s tax total is %2$d.', 'kirki-ecommerce'),
                $sum,
                $expected_total
            )
        );
    }
}
