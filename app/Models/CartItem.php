<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for one line item (variant and quantity) in a cart.
 *
 * @since 1.0.0
 */
class CartItem extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_cart_items';

    /** @inheritDoc */
    protected $fillable = [
        'cart_id',
        'product_id',
        'variant_id',
        'quantity',
    ];

    /** @inheritDoc */
    protected $casts = [
        'cart_id' => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
        'quantity' => 'integer',
    ];

    /**
     * Define the cart this item belongs to.
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
     * Define the product this item was added from.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function product()
    {
        return $this->belongs_to(Product::class, 'product_id');
    }

    /**
     * Define the variant this item is for.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function variant()
    {
        return $this->belongs_to(Variant::class, 'variant_id');
    }
}
