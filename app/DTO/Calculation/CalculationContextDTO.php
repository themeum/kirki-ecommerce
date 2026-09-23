<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\DTO;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\collection;

/**
 * Input to a cart or order price calculation: items, addresses, customer and coupon codes.
 *
 * @since 1.0.0
 */
class CalculationContextDTO extends DTO
{
    /** @var int|null */
    public $cart_id;

    /** @var Collection<CalculationItemDTO> */
    public $items;

    /** @var array */
    public $shipping_address = [];

    /** @var array */
    public $billing_address = [];

    /** @var int */
    public $customer_id;

    /** @var string[] */
    public $coupon_codes = [];

    /** @var int */
    public $shipping_method_id;

    /** @var int Base shipping cost in minor units */
    public $shipping_subtotal = 0;

    /** @var int */
    public $customer_order_count = 0;

    /** @var bool */
    public $should_calculate_tax = true;

    /**
     * Sum the base unit price times quantity of every item.
     *
     * @since 1.0.0
     *
     * @return int Subtotal in minor units of the base currency.
     */
    public function get_subtotal()
    {
        $subtotal = 0;
        foreach ($this->items as $item) {
            $subtotal += $item->base_unit_price * $item->quantity;
        }
        return $subtotal;
    }

    /**
     * Sum the quantities of every item.
     *
     * @since 1.0.0
     *
     * @return int Total number of units across all items.
     */
    public function get_items_count()
    {
        $count = 0;
        foreach ($this->items as $item) {
            $count += $item->quantity;
        }
        return $count;
    }

    /**
     * Build a calculation context from a cart.
     *
     * Copies the cart's addresses, shipping method, coupon codes and items. When the cart
     * belongs to a user with a customer record, also sets the customer ID and the count of
     * that customer's orders that are neither failed/cancelled nor refunded.
     *
     * @since 1.0.0
     *
     * @param Cart $cart Cart to read the context from.
     * @return static
     */
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
        $dto->billing_address = $cart->billing_address ? $cart->billing_address : [];
        $dto->shipping_method_id = $cart->shipping_method;

        $dto->coupon_codes = $cart->coupons->pluck('code')->to_array();

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
            $dto->customer_order_count = $customer->orders()->where_not_in('order_status', [OrderStatus::FAILED_CANCELLED, OrderStatus::REFUNDED])->count();
        }

        return $dto;
    }
}
