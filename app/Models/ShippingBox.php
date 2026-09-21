<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

/**
 * Model for a named shipping box with dimensions that variants can be assigned to.
 *
 * @since 1.0.0
 */
class ShippingBox extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_shipping_boxes';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'width' => 'float',
        'height' => 'float',
        'length' => 'float',
        'is_default' => 'boolean',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'name',
        'description',
        'width',
        'height',
        'length',
        'unit',
        'is_default',
    ];

    /**
     * Limit the query to the default shipping box.
     *
     * @since 1.0.0
     *
     * @param QueryBuilder $query Query being scoped.
     * @return QueryBuilder
     */
    public function scope_default(QueryBuilder $query)
    {
        return $query->where('is_default', 1);
    }
}
