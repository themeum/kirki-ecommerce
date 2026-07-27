<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class CartItem extends Model
{
    protected $table = 'kirki_ecommerce_cart_items';

    protected $fillable = [
        'cart_id',
        'product_id',
        'variant_id',
        'quantity',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'variant_id' => 'integer',
        'quantity' => 'integer',
    ];

    public function cart()
    {
        return $this->belongs_to(Cart::class, 'cart_id');
    }

    public function product()
    {
        return $this->belongs_to(Product::class, 'product_id');
    }

    public function variant()
    {
        return $this->belongs_to(Variant::class, 'variant_id');
    }
}
