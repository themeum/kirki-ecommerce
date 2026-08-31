<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\DTO;

use function Kirki\Ecommerce\App\customer;
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

    /** @var string[] */
    public $coupons = [];

    /** @var int */
    public $shipping_method_id;

    /** @var int */
    public $customer_order_count = 0;

    /** @var bool */
    public $should_calculate_tax = true;

    public function get_subtotal()
    {
        $subtotal = 0;
        foreach ($this->items as $item) {
            $subtotal += $item->base_unit_price * $item->quantity;
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
        $dto->customer_id = null;
        $customer = null;

        if (!empty($cart->user_id)) {
            $customer = customer($cart->user_id)->get_customer();
            $dto->customer_id = $customer ? $customer->id : null;
        }

        $dto->shipping_address = $cart->shipping_address ? $cart->shipping_address : [];
        $dto->shipping_method_id = $cart->shipping_method;

        $dto->coupons = $cart->coupons->pluck('code')->to_array();

        $dto->items = $cart->items->map(function ($item) {
            $item_dto = new CalculationItemDTO();
            $item_dto->id = $item->id;
            $item_dto->variant_id = $item->variant_id;
            $item_dto->product_id = $item->product_id;
            $item_dto->quantity = $item->quantity;

            $variant = $item->variant;

            $item_dto->base_unit_price = $variant->base_sale_price ?: $variant->base_price;
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->tax_profile_id = $variant->tax_profile_id ?: $item->product->tax_profile_id;
            $item_dto->product_categories = $item->product->load('categories')->categories->pluck('id')->to_array();
            $item_dto->base_product_total = $variant->base_price;

            return $item_dto;
        }) ?? collection();

        if ($dto->customer_id && $customer) {
            // @todo: need to update this with order status which are terminal states
            $dto->customer_order_count = $customer->orders()->where_not_in('fulfillment_status', [FulfillmentStatus::CANCELLED, FulfillmentStatus::RETURNED])->count();
        }

        return $dto;
    }
}
