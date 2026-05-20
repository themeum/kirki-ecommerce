<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

class Currency extends Model
{
    protected $table = 'kirki_ecommerce_currencies';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
        'is_base' => 'boolean',
        'exchange_rate' => 'float',
    ];

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'exchange_rate',
        'is_base',
        'is_active',
    ];

    public function get_code_attribute()
    {
        return strtoupper($this->attributes['code']);
    }

    public function scope_active(QueryBuilder $query)
    {
        return $query->where('is_active', 1);
    }

    public function scope_base(QueryBuilder $query)
    {
        return $query->where('is_base', 1);
    }
}
