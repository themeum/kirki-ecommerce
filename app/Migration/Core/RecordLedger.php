<?php

namespace Kirki\Ecommerce\App\Migration\Core;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;

/**
 * Records which Kirki record each source record became, for one source plugin.
 *
 * A row also says whether the migration created the record or reused an existing one.
 *
 * @since 1.0.0
 */
class RecordLedger
{
    /** @var string */
    protected $source;

    /** @var array<string, int|null> Lookups already made, keyed by "entity:source_id". */
    protected $cache = [];

    /**
     * Create the map for one source plugin.
     *
     * @since 1.0.0
     *
     * @param string $source The source id, for example "woocommerce".
     */
    public function __construct(string $source)
    {
        $this->source = $source;
    }

    /**
     * Get the source id this map belongs to.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function source()
    {
        return $this->source;
    }

    /**
     * Save a link between a source record and a Kirki record.
     *
     * @since 1.0.0
     *
     * @param string   $entity    The entity type, for example "product".
     * @param int      $source_id The id in the source plugin.
     * @param int      $kirki_ecommerce_id  The id in Kirki.
     * @param int|null $run_id    The run that created the link.
     * @param string   $origin    "created" or "reused".
     * @return void
     */
    public function link(string $entity, int $source_id, int $kirki_ecommerce_id, $run_id = null, string $origin = MigrationRecordLedger::ORIGIN_CREATED)
    {
        MigrationRecordLedger::create([
            'source' => $this->source,
            'entity' => $entity,
            'source_id' => $source_id,
            'kirki_ecommerce_id' => $kirki_ecommerce_id,
            'run_id' => $run_id,
            'origin' => $origin,
        ]);

        $this->cache[$entity . ':' . $source_id] = $kirki_ecommerce_id;
    }

    /**
     * Drop remembered lookups, for example after a rolled back row.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function forget_cache()
    {
        $this->cache = [];
    }

    /**
     * Get the Kirki id linked to a source record.
     *
     * @since 1.0.0
     *
     * @param string $entity    The entity type.
     * @param int    $source_id The id in the source plugin.
     * @return int|null Null when the record is not migrated.
     */
    public function resolve(string $entity, int $source_id)
    {
        $key = $entity . ':' . $source_id;

        if (array_key_exists($key, $this->cache)) {
            return $this->cache[$key];
        }

        $link = MigrationRecordLedger::query()
            ->where('source', $this->source)
            ->where('entity', $entity)
            ->where('source_id', $source_id)
            ->first();

        $this->cache[$key] = $link ? (int) $link->kirki_ecommerce_id : null;

        return $this->cache[$key];
    }

    /**
     * Check whether a source record is already migrated.
     *
     * @since 1.0.0
     *
     * @param string $entity    The entity type.
     * @param int    $source_id The id in the source plugin.
     * @return bool
     */
    public function exists(string $entity, int $source_id)
    {
        return $this->resolve($entity, $source_id) !== null;
    }
}
