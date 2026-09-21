<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Concerns\HasSlug;
use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a product attribute (such as size or color) that variants are built from.
 *
 * @since 1.0.0
 */
class Attribute extends Model
{
    use HasSlug;

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_attributes';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'name',
        'slug',
        'type',
        'created_by',
        'updated_by',
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

    /**
     * Define the selectable values of this attribute.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function values()
    {
        return $this->has_many(AttributeValue::class, 'attribute_id', 'id');
    }
}
