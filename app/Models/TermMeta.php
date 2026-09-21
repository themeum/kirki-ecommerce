<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a row in the WordPress core termmeta table.
 *
 * @since 1.0.0
 */
class TermMeta extends Model
{
    /** @inheritDoc */
    protected $table = 'termmeta';

    /** @inheritDoc */
    protected $primary_key = 'meta_id';

    /** @inheritDoc */
    protected $casts = [
        'meta_id' => 'integer',
        'term_id' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'meta_id',
        'term_id',
        'meta_key',
        'meta_value',
    ];
}
