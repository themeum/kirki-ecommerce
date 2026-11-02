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
}
