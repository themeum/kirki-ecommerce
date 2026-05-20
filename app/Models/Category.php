<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Database\Query\Model;

class Category extends Model
{
    use HasSlug;

    protected $table = 'kirki_ecommerce_categories';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'parent_id' => 'integer',
        'is_active' => 'boolean',
        'is_deletable' => 'boolean',
        'level' => 'integer',
        'ordering' => 'integer',
    ];

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

    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_category_product', 'category_id', 'product_id');
    }

    public function parent()
    {
        return $this->belongs_to(Category::class, 'parent_id', 'id');
    }

    public function children()
    {
        return $this->has_many(Category::class, 'parent_id', 'id');
    }
}
