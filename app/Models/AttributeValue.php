<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for one selectable value of a product attribute.
 *
 * @since 1.0.0
 */
class AttributeValue extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_attribute_values';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'attribute_id' => 'integer',
        'media' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'attribute_id',
        'value',
        'color',
        'media'
    ];

    /**
     * Get the column used to resolve this model in routes.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_route_key()
    {
        return 'id';
    }
}
