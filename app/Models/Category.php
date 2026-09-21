<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a hierarchical product category.
 *
 * @since 1.0.0
 */
class Category extends Model
{
    use HasSlug;

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_categories';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'parent_id' => 'integer',
        'is_active' => 'boolean',
        'is_deletable' => 'boolean',
        'level' => 'integer',
        'ordering' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'image',
        'level',
        'ordering',
        'is_active',
        'is_deletable',
        'created_by',
        'updated_by',
    ];

    /**
     * Define the products assigned to this category.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_category_product', 'category_id', 'product_id');
    }

    /**
     * Define the parent category.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function parent()
    {
        return $this->belongs_to(Category::class, 'parent_id', 'id');
    }

    /**
     * Define the direct child categories.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function children()
    {
        return $this->has_many(Category::class, 'parent_id', 'id');
    }
}
