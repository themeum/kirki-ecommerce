<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\App\Traits\HasDateRangeFilter;
use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a curated collection of products.
 *
 * @since 1.0.0
 */
class Collection extends Model
{
    use HasSlug, HasDateRangeFilter;

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_collections';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
        'ordering' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'banner',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'is_active',
        'ordering',
        'created_by',
        'updated_by',
    ];

    /**
     * Define the products in this collection.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_collection_product', 'collection_id', 'product_id');
    }
}
