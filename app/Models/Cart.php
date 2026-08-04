<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Supports\Arr;

class Cart extends Model
{
    protected $table = 'kirki_ecommerce_carts';

    protected $fillable = [
        'customer_id',
        'cart_token',
        'currency_code',
        'base_currency_code',
        'discount_details',
        'shipping_method',
        'shipping_details',
        'items_count',
        'ip_address',
        'user_agent',
        'customer_notes',
        'expires_at',
        'shipping_address',
        'billing_address',
        'shipping_method',
    ];

    protected $casts = [
        'customer_id' => 'integer',
        'items_count' => 'integer',
        'expires_at' => 'datetime',
        'discount_details' => 'json',
        'shipping_address' => 'json',
        'billing_address' => 'json',
        'shipping_details' => 'json',
    ];

    public function items()
    {
        return $this->has_many(CartItem::class, 'cart_id');
    }

    public function customer()
    {
        return $this->belongs_to(Customer::class, 'customer_id');
    }

    public function currency()
    {
        return $this->belongs_to(Currency::class, 'currency_code', 'currency_code');
    }
}
