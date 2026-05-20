<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Supports\Arr;

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

    public function set_schema_attribute($value)
    {
        return !empty($value) && is_array($value) ? Arr::json_encode($value) : null;
    }
}
