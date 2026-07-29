<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;

class Collection extends Model
{
    use HasSlug;

    protected $table = 'kirki_ecommerce_collections';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
        'ordering' => 'integer',
    ];

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

    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_collection_product', 'collection_id', 'product_id');
    }
}
