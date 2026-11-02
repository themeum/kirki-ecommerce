<?php

namespace Kirki\Ecommerce\App\Migration\Contracts;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\DTO\ChunkResultDTO;

/**
 * Contract for one data group of a source, migrated in chunks.
 *
 * @since 1.0.0
 */
interface GroupMigrator
{
    /**
     * Get the stable id of the group, for example "products".
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function id();

    /**
     * Get the display label of the group.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function label();

    /**
     * Get a one-sentence description of what the group moves.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function description();

    /**
     * Get the ids of the groups that must finish before this one starts.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    public function depends_on();

    /**
     * Get the number of items to migrate in one chunk.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function chunk_size();

    /**
     * Count the source items of the group that can be migrated.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count();

    /**
     * Migrate the next chunk of items after the given cursor.
     *
     * @since 1.0.0
     *
     * @param int         $cursor The source id of the last item already processed.
     * @param RecordLedger       $ledger The links between source and Kirki records.
     * @param int|null    $run_id The id of the current run.
     * @return ChunkResultDTO
     */
    public function migrate_chunk(int $cursor, RecordLedger $ledger, $run_id = null);

    /**
     * Get the ledger entity types that the group creates.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    public function ledger_entities();

    /**
     * Remove one record that the group created, or put back what it changed.
     *
     * @since 1.0.0
     *
     * @param string $entity                The ledger entity type of the record.
     * @param int    $kirki_ecommerce_id    The Kirki id of the record.
     * @param mixed  $previous_value        The value saved when the record was created, or null.
     * @return bool False when the record was kept because other data uses it.
     */
    public function revert_record(string $entity, int $kirki_ecommerce_id, $previous_value = null);
}
