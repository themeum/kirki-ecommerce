<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a named product schema definition that products reference through `schema_id`.
 *
 * @since 1.0.0
 */
class ProductSchema extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_product_schemas';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'is_default' => 'boolean',
        'schema' => 'json',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'name',
        'is_default',
        'schema',
    ];
}
