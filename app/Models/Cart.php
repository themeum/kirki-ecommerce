<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a shopper's cart, held for a user or a guest cart token.
 *
 * @since 1.0.0
 */
class Cart extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_carts';

    /** @inheritDoc */
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

    /** @inheritDoc */
    protected $casts = [
        'user_id' => 'integer',
        'items_count' => 'integer',
        'expires_at' => 'datetime',
        'shipping_address' => 'json',
        'billing_address' => 'json',
        'shipping_details' => 'json',
        'is_billing_same_as_shipping' => 'boolean'
    ];

    /**
     * Define the line items in this cart.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function items()
    {
        return $this->has_many(CartItem::class, 'cart_id');
    }

    /**
     * Define the currency the cart is priced in.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function currency()
    {
        return $this->belongs_to(Currency::class, 'currency_code', 'currency_code');
    }

    /**
     * Define the coupons applied to this cart.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function coupons()
    {
        return $this->belongs_to_many(Coupon::class, 'kirki_ecommerce_cart_coupons', 'cart_id', 'coupon_id');
    }
}
