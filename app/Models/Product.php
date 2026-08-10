<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;

class Product extends Model
{
    use HasSlug;

    protected $table = 'kirki_ecommerce_products';
    protected $primary_key = 'id';

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
    ];

    protected $fillable = [
        'title',
        'slug',
        'status',
        'ribbon',
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
        'created_by',
        'updated_by',
    ];

    public function variants()
    {
        return $this->has_many(Variant::class, 'product_id', 'id');
    }

    public function brand()
    {
        return $this->belongs_to(Brand::class);
    }

    public function currency()
    {
        return $this->belongs_to(Currency::class);
    }

    public function collections()
    {
        return $this->belongs_to_many(Collection::class, 'kirki_ecommerce_collection_product', 'product_id', 'collection_id');
    }

    public function media()
    {
        return $this->belongs_to_many(
            Post::class,
            'kirki_ecommerce_media_product',
            'product_id',
            'media_id'
        )->order_by_pivot('ordering', 'asc');
    }

    public function categories()
    {
        return $this->belongs_to_many(Category::class, 'kirki_ecommerce_category_product', 'product_id', 'category_id');
    }

    public function tags()
    {
        return $this->belongs_to_many(Tag::class, 'kirki_ecommerce_product_tags', 'product_id', 'tag_id');
    }

    public function attributes()
    {
        return $this->belongs_to_many(Attribute::class, 'kirki_ecommerce_attribute_product', 'product_id', 'attribute_id')->order_by_pivot('ordering', 'asc');
    }

    public function attribute_values()
    {
        return $this->belongs_to_many(AttributeValue::class, 'kirki_ecommerce_attribute_value_product', 'product_id', 'attribute_value_id')->order_by_pivot('ordering', 'asc');
    }
}
