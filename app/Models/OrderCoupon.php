<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a coupon as applied to an order, with a snapshot of the coupon and its discount.
 *
 * @since 1.0.0
 */
class OrderCoupon extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_order_coupons';

    /** @inheritDoc */
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

    /** @inheritDoc */
    protected $casts = [
        'order_id' => 'integer',
        'coupon_id' => 'integer',
        'customer_id' => 'integer',
        'coupon_snapshot' => 'json',
        'invoiced_discount_amount' => 'integer',
        'base_discount_amount' => 'integer',
        'usage_reversed_at' => 'datetime',
    ];

    /**
     * Define the order the coupon was applied to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }

    /**
     * Define the coupon that was applied.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function coupon()
    {
        return $this->belongs_to(Coupon::class, 'coupon_id');
    }

    /**
     * Define the customer who used the coupon.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function customer()
    {
        return $this->belongs_to(Customer::class, 'customer_id');
    }

    /**
     * Define the per-item discount attributions of this order coupon.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function order_item_coupons()
    {
        return $this->has_many(OrderItemCoupon::class, 'order_coupon_id');
    }
}
