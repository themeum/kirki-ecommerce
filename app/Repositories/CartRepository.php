<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Models\CartItem;

class CartRepository
{
    public function find($id)
    {
        return Cart::with([
            'items' => ['product' => ['media', 'categories'], 'variant' => ['media']]
        ])->find($id);
    }

    public function find_by_token($token)
    {
        return Cart::where('cart_token', $token)->with([
            'items' => ['product' => ['media', 'categories'], 'variant' => ['media']]
        ])->first();
    }

    public function find_by_customer($customer_id)
    {
        return Cart::where('customer_id', $customer_id)->with([
            'items' => ['product' => ['media', 'categories'], 'variant' => ['media', 'attribute_values', 'available_quantity']]
        ])->first();
    }

    public function create_cart(array $data)
    {
        return Cart::create($data);
    }

    public function update_cart($id, array $data)
    {
        $cart = $this->find($id);

        if ($cart) {
            $cart->update($data);

            return $this->find($id);
        }

        return null;
    }

    public function find_item($item_id)
    {
        return CartItem::find($item_id);
    }

    public function add_item($cart_id, array $item_data)
    {
        return CartItem::create(array_merge(['cart_id' => $cart_id], $item_data));
    }

    public function update_item($item_id, array $data)
    {
        $item = CartItem::find($item_id);

        if ($item) {
            $item->update($data);
            return $item;
        }
        return null;
    }

    public function remove_item($item_id)
    {
        return CartItem::destroy($item_id);
    }

    public function empty_cart($cart_id)
    {
        return Cart::where('id', $cart_id)->delete();
    }

    public function find_item_in_cart($cart_id, $variant_id)
    {
        return CartItem::where('cart_id', $cart_id)
            ->where('variant_id', $variant_id)
            ->first();
    }
}
