<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class ShippingBox extends Model
{
    protected $table = 'kirki_ecommerce_shipping_boxes';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'width' => 'float',
        'height' => 'float',
        'length' => 'float',
        'is_default' => 'boolean',
    ];

    protected $fillable = [
        'name',
        'description',
        'width',
        'height',
        'length',
        'unit',
        'is_default',
    ];

    public function scope_default(QueryBuilder $query)
    {
        return $query->where('is_default', 1);
    }
}
