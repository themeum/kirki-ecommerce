<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class OrderCoupon extends Model
{
    protected $table = 'kirki_ecommerce_order_coupons';

    protected $fillable = [
        'order_id',
        'coupon_id',
        'customer_id',
        'code',
        'title',
        'discount_type',
        'discount_target',
        'coupon_snapshot',
        'invoiced_discount_amount',
        'base_discount_amount',
        'usage_reversed_at',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'coupon_id' => 'integer',
        'customer_id' => 'integer',
        'coupon_snapshot' => 'json',
        'invoiced_discount_amount' => 'integer',
        'base_discount_amount' => 'integer',
        'usage_reversed_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }

    public function coupon()
    {
        return $this->belongs_to(Coupon::class, 'coupon_id');
    }

    public function customer()
    {
        return $this->belongs_to(Customer::class, 'customer_id');
    }

    public function item_attributions()
    {
        return $this->has_many(OrderItemCoupon::class, 'order_coupon_id');
    }
}
