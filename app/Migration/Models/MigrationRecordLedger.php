<?php

namespace Kirki\Ecommerce\App\Migration\Models;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a migrated source record and the Kirki record it became.
 *
 * @since 1.0.0
 */
class MigrationRecordLedger extends Model
{
    public const ORIGIN_CREATED = 'created';
    public const ORIGIN_REUSED = 'reused';

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_migration_record_ledger';

    /** @inheritDoc */
    protected $fillable = [
        'source',
        'entity',
        'source_id',
        'kirki_ecommerce_id',
        'run_id',
        'origin',
        'previous_value',
    ];

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'source_id' => 'integer',
        'kirki_ecommerce_id' => 'integer',
        'run_id' => 'integer',
        'previous_value' => 'json',
    ];
}
