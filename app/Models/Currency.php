<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

/**
 * Model for a currency the store can price and display in.
 *
 * @since 1.0.0
 */
class Currency extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_currencies';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
        'is_base' => 'boolean',
        'exchange_rate' => 'float',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'code',
        'name',
        'symbol',
        'exchange_rate',
        'is_base',
        'is_active',
    ];

    /**
     * Get the currency code in upper case.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_code_attribute()
    {
        return strtoupper($this->attributes['code']);
    }

    /**
     * Limit the query to active currencies.
     *
     * @since 1.0.0
     *
     * @param QueryBuilder $query Query being scoped.
     * @return QueryBuilder
     */
    public function scope_active(QueryBuilder $query)
    {
        return $query->where('is_active', 1);
    }

    /**
     * Limit the query to the store's base currency.
     *
     * @since 1.0.0
     *
     * @param QueryBuilder $query Query being scoped.
     * @return QueryBuilder
     */
    public function scope_base(QueryBuilder $query)
    {
        return $query->where('is_base', 1);
    }
}
