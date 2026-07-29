<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;

class Tag extends Model
{
    use HasSlug;

    protected $table = 'kirki_ecommerce_tags';

    protected $primary_key = 'id';

    protected $casts = [
        'count' => 'integer',
    ];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
        'updated_by',
    ];

    public function get_route_key()
    {
        return 'slug';
    }

    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_product_tags', 'tag_id', 'product_id');
    }
}
