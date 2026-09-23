<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\App\Traits\HasDateRangeFilter;
use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a catalog product with its variants and catalog relations.
 *
 * @since 1.0.0
 */
class Product extends Model
{
    use HasSlug, HasDateRangeFilter;

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_products';
    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'currency_id' => 'integer',
        'brand_id' => 'integer',
        'schema_id' => 'integer',
        'has_variants' => 'boolean',
        'additional_info' => 'json',
        'seo_keywords' => 'json',
        'tax_profile_id' => 'integer',
        'shipping_profile_id' => 'integer',
        'shipping_box_id' => 'integer',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'trashed_at' => 'datetime',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'title',
        'slug',
        'status',
        'ribbon',
        'ribbon_color',
        'currency_id',
        'brand_id',
        'short_description',
        'description',
        'additional_info',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'og_title',
        'og_description',
        'og_image',
        'schema_id',
        'llm_instructions',
        'has_variants',
        'published_at',
        'scheduled_at',
        'trashed_at',
        'created_by',
        'updated_by',
    ];

    /**
     * Define the sellable variants of this product.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function variants()
    {
        return $this->has_many(Variant::class, 'product_id', 'id');
    }

    /**
     * Define the brand of this product.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function brand()
    {
        return $this->belongs_to(Brand::class);
    }

    /**
     * Define the currency of this product.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function currency()
    {
        return $this->belongs_to(Currency::class);
    }

    /**
     * Define the collections this product belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function collections()
    {
        return $this->belongs_to_many(Collection::class, 'kirki_ecommerce_collection_product', 'product_id', 'collection_id');
    }

    /**
     * Define the media attachments of this product, in display order.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function media()
    {
        return $this->belongs_to_many(
            Post::class,
            'kirki_ecommerce_media_product',
            'product_id',
            'media_id'
        )->order_by_pivot('ordering', 'asc');
    }

    /**
     * Define the categories this product is assigned to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function categories()
    {
        return $this->belongs_to_many(Category::class, 'kirki_ecommerce_category_product', 'product_id', 'category_id');
    }

    /**
     * Define the tags assigned to this product.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function tags()
    {
        return $this->belongs_to_many(Tag::class, 'kirki_ecommerce_product_tags', 'product_id', 'tag_id');
    }

    /**
     * Define the attributes that make up this product's variants, in display order.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function attributes()
    {
        return $this->belongs_to_many(Attribute::class, 'kirki_ecommerce_attribute_product', 'product_id', 'attribute_id')->order_by_pivot('ordering', 'asc');
    }

    /**
     * Define the attribute values used by this product's variants, in display order.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function attribute_values()
    {
        return $this->belongs_to_many(AttributeValue::class, 'kirki_ecommerce_attribute_value_product', 'product_id', 'attribute_value_id')->order_by_pivot('ordering', 'asc');
    }
}
