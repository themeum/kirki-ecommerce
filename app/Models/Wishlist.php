<?php

namespace Kirki\Ecommerce\App\Models;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a product a user saved to their wishlist, with the variant they chose, if any.
 *
 * @since 1.0.0
 */
class Wishlist extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_wishlist';
    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $fillable = [
        'user_id',
        'product_id',
        'variant_id',
    ];

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
    ];

    /**
     * Define the wishlisted product.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function product()
    {
        return $this->belongs_to(Product::class, 'product_id', 'id');
    }

    /**
     * Define the variant the user chose, which is null when they chose none or the variant was deleted.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function variant()
    {
        return $this->belongs_to(Variant::class, 'variant_id', 'id');
    }
}
