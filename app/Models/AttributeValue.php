<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class AttributeValue extends Model
{
    protected $table = 'kirki_ecommerce_attribute_values';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'attribute_id' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    protected $fillable = [
        'attribute_id',
        'value',
        'color',
    ];

    public function get_route_key()
    {
        return 'id';
    }
}
