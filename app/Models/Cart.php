<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class Cart extends Model
{
    protected $table = 'kirki_ecommerce_carts';

    protected $fillable = [
        'user_id',
        'cart_token',
        'currency_code',
        'base_currency_code',
        'shipping_method',
        'shipping_details',
        'items_count',
        'ip_address',
        'user_agent',
        'customer_notes',
        'expires_at',
        'shipping_address',
        'billing_address',
        'is_billing_same_as_shipping',
        'shipping_method',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'items_count' => 'integer',
        'expires_at' => 'datetime',
        'shipping_address' => 'json',
        'billing_address' => 'json',
        'shipping_details' => 'json',
        'is_billing_same_as_shipping' => 'boolean'
    ];

    public function items()
    {
        return $this->has_many(CartItem::class, 'cart_id');
    }

    public function currency()
    {
        return $this->belongs_to(Currency::class, 'currency_code', 'currency_code');
    }

    public function coupons()
    {
        return $this->belongs_to_many(Coupon::class, 'kirki_ecommerce_cart_coupons', 'cart_id', 'coupon_id');
    }
}
