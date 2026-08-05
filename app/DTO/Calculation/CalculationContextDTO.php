<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\DTO;

use function Kirki\Ecommerce\Framework\collection;

class CalculationContextDTO extends DTO
{
    /** @var int|null */
    public $cart_id;

    /** @var Collection<CalculationItemDTO> */
    public $items;

    /** @var array */
    public $shipping_address = [];

    /** @var int */
    public $customer_id;

    /** @var string|null */
    public $coupon = null;

    /** @var int */
    public $shipping_method_id;

    /** @var int */
    public $customer_order_count = 0;

    public function get_subtotal()
    {
        $subtotal = 0;
        foreach ($this->items as $item) {
            $subtotal += $item->unit_price * $item->quantity;
        }
        return $subtotal;
    }

    public function get_items_count()
    {
        $count = 0;
        foreach ($this->items as $item) {
            $count += $item->quantity;
        }
        return $count;
    }

    public static function from_cart(Cart $cart)
    {
        $dto = new static();
        $dto->cart_id = $cart->id;
        $dto->customer_id = $cart->customer_id;
        $dto->shipping_address = $cart->shipping_address ? $cart->shipping_address : [];
        $dto->shipping_method_id = $cart->shipping_method;

        if (!empty($cart->discount_details['code'])) {
            $dto->coupon = $cart->discount_details['code'];
        }

        $dto->items = $cart->items->map(function ($item) {
            $item_dto = new CalculationItemDTO();
            $item_dto->id = $item->id;
            $item_dto->variant_id = $item->variant_id;
            $item_dto->product_id = $item->product_id;
            $item_dto->quantity = $item->quantity;

            $variant = $item->variant;

            $item_dto->unit_price = $variant->sale_price ?: $variant->price;
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->tax_profile_id = $variant->tax_profile_id ?: $item->product->tax_profile_id;
            $item_dto->product_categories = $item->product->load('categories')->categories->pluck('id')->to_array();

            return $item_dto;
        }) ?? collection();

        if ($cart->customer_id && $cart->customer) {
            $dto->customer_order_count = $cart->customer->orders()->where_not_in('order_status', [OrderStatus::CANCELLED, OrderStatus::REFUNDED])->count();
        }

        return $dto;
    }
}
