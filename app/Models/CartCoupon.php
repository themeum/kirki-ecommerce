<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Pivot model linking a cart to a coupon applied to it.
 *
 * @since 1.0.0
 */
class CartCoupon extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_cart_coupons';

    /** @inheritDoc */
    protected $fillable = [
        'cart_id',
        'coupon_id',
    ];

    /** @inheritDoc */
    protected $casts = [
        'cart_id' => 'integer',
        'coupon_id' => 'integer',
    ];

    /**
     * Define the cart the coupon is applied to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function cart()
    {
        return $this->belongs_to(Cart::class, 'cart_id');
    }

    /**
     * Define the coupon applied to the cart.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function coupon()
    {
        return $this->belongs_to(Coupon::class, 'coupon_id');
    }
}
