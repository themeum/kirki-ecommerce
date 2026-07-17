<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class Brand extends Model
{
    use HasSlug;

    protected $table = 'kirki_ecommerce_brands';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

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

    public function scope_active(QueryBuilder $query)
    {
        return $query->where('is_active', 1);
    }

    public function products()
    {
        return $this->has_many(Product::class, 'brand_id');
    }
}
