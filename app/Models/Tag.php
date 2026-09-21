<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a product tag.
 *
 * @since 1.0.0
 */
class Tag extends Model
{
    use HasSlug;

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_tags';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'count' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the column used to resolve this model in routes.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_route_key()
    {
        return 'slug';
    }

    /**
     * Define the products carrying this tag.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_product_tags', 'tag_id', 'product_id');
    }
}
