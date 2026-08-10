<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class ProductSchema extends Model
{
    protected $table = 'kirki_ecommerce_product_schemas';

    protected $primary_key = 'id';

    protected $casts = [
        'is_default' => 'boolean',
        'schema' => 'json',
    ];

    protected $fillable = [
        'name',
        'is_default',
        'schema',
    ];
}
