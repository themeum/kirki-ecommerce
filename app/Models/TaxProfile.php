<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a named tax profile that variants can be assigned to.
 *
 * @since 1.0.0
 */
class TaxProfile extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_tax_profiles';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'is_default' => 'boolean',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'name',
        'is_default',
    ];
}
