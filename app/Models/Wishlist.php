<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a variant a user saved to their wishlist.
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
        'variant_id',
    ];

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'variant_id' => 'integer',
    ];

    /**
     * Define the wishlisted variant.
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
