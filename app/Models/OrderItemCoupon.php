<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for the share of an order coupon's discount attributed to one order item.
 *
 * @since 1.0.0
 */
class OrderItemCoupon extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_order_item_coupons';

    /** @inheritDoc */
    protected $fillable = [
        'order_item_id',
        'order_coupon_id',
        'invoiced_discount_amount',
        'base_discount_amount',
    ];

    /** @inheritDoc */
    protected $casts = [
        'order_item_id' => 'integer',
        'order_coupon_id' => 'integer',
        'invoiced_discount_amount' => 'integer',
        'base_discount_amount' => 'integer',
    ];

    /**
     * Define the order item the discount was attributed to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function order_item()
    {
        return $this->belongs_to(OrderItem::class, 'order_item_id');
    }

    /**
     * Define the order coupon the discount belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function order_coupon()
    {
        return $this->belongs_to(OrderCoupon::class, 'order_coupon_id');
    }
}
