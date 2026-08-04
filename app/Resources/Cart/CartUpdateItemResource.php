<?php

namespace Kirki\Ecommerce\App\Resources\Cart;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\app;

class CartUpdateItemResource extends CartResource
{
    /**
     * Convert the cart resource to an array.
     *
     * @return array The cart data as an associative array.
     */
    public function to_array()
    {
        $context = CalculationContextDTO::from_cart($this->resource);
        $recalculate_action = app()->make(RecalculateCartAction::class);
        $result = $recalculate_action->execute($context);

        $this->subtotal = $result->subtotal;
        $this->tax_total = $result->tax_total;
        $this->discount_total = $result->discount_total;
        $this->shipping_subtotal = $result->shipping_subtotal;
        $this->shipping_tax = $result->shipping_tax;
        $this->shipping_discount = $result->shipping_discount;
        $this->shipping_total = $result->shipping_total;
        $this->total = $result->total;
        $this->items_count = $result->items_count;

        $items = $this->prepare_items($this->items, $result);

        return [
            'sub_total' => Money::format_from_decimal($this->prepare_amount($this->subtotal), $this->currency_code),
            'total' => Money::format_from_decimal($this->prepare_amount($this->total), $this->currency_code),
            'items_count' => $this->items_count,
            'items' => (object) array_reduce(
                $items,
                function ($carry, $item) {
                    $carry[$item['id']] = Money::format_from_decimal($item['total'], $this->currency_code);
                    return $carry;
                },
                []
            ),
        ];
    }
}
