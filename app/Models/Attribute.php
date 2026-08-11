<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;

class Attribute extends Model
{
    use HasSlug;

    protected $table = 'kirki_ecommerce_attributes';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
    ];

    protected $fillable = [
        'name',
        'slug',
        'type',
        'created_by',
        'updated_by',
    ];

    public function get_route_key()
    {
        return 'id';
    }

    public function values()
    {
        return $this->has_many(AttributeValue::class, 'attribute_id', 'id');
    }
}
