<?php

namespace Kirki\Ecommerce\App\Migration\Models;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for the saved progress of one data migration run.
 *
 * @since 1.0.0
 */
class MigrationRun extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_migration_runs';

    /** @inheritDoc */
    protected $fillable = [
        'source',
        'status',
        'groups',
        'skipped_items',
        'last_error',
        'started_at',
        'finished_at',
    ];

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'groups' => 'json',
        'skipped_items' => 'json',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];
}
