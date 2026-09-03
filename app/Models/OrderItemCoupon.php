<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class OrderItemCoupon extends Model
{
    protected $table = 'kirki_ecommerce_order_item_coupons';

    protected $fillable = [
        'order_item_id',
        'order_coupon_id',
        'invoiced_discount_amount',
        'base_discount_amount',
    ];

    protected $casts = [
        'order_item_id' => 'integer',
        'order_coupon_id' => 'integer',
        'invoiced_discount_amount' => 'integer',
        'base_discount_amount' => 'integer',
    ];

    public function order_item()
    {
        return $this->belongs_to(OrderItem::class, 'order_item_id');
    }

    public function order_coupon()
    {
        return $this->belongs_to(OrderCoupon::class, 'order_coupon_id');
    }
}
