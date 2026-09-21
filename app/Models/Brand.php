<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

/**
 * Model for a product brand.
 *
 * @since 1.0.0
 */
class Brand extends Model
{
    use HasSlug;

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_brands';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo',
        'website_url',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * Limit the query to active brands.
     *
     * @since 1.0.0
     *
     * @param QueryBuilder $query Query being scoped.
     * @return QueryBuilder
     */
    public function scope_active(QueryBuilder $query)
    {
        return $query->where('is_active', 1);
    }

    /**
     * Define the products sold under this brand.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function products()
    {
        return $this->has_many(Product::class, 'brand_id');
    }
}
