<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class CartCoupon extends Model
{
    protected $table = 'kirki_ecommerce_cart_coupons';

    protected $fillable = [
        'cart_id',
        'coupon_id',
    ];

    protected $casts = [
        'cart_id' => 'integer',
        'coupon_id' => 'integer',
    ];

    public function cart()
    {
        return $this->belongs_to(Cart::class, 'cart_id');
    }

    public function coupon()
    {
        return $this->belongs_to(Coupon::class, 'coupon_id');
    }
}
