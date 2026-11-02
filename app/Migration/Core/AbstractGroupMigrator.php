<?php

namespace Kirki\Ecommerce\App\Migration\Core;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Contracts\GroupMigrator;
use Kirki\Ecommerce\App\Migration\DTO\ChunkResultDTO;
use Kirki\Ecommerce\App\Migration\DTO\SkippedItemDTO;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

/**
 * Base class for a data group. It owns the chunk flow; subclasses read, map and save rows.
 *
 * @since 1.0.0
 */
abstract class AbstractGroupMigrator implements GroupMigrator
{
    /** @var string[] Notes collected while the current chunk runs. */
    protected $notes = [];

    /** @var int|null The run the current chunk belongs to; groups use it to link records they create beyond the row itself. */
    protected $run_id;

    /**
     * Get the entity name used for this group's links in the record ledger.
     *
     * @since 1.0.0
     *
     * @return string
     */
    abstract protected function entity();

    /**
     * Read the next source rows after the cursor, ordered by id. Each row has an "id" key.
     *
     * @since 1.0.0
     *
     * @param int $cursor The source id of the last item already processed.
     * @param int $limit  The most rows to return.
     * @return array<int, array<string, mixed>>
     */
    abstract protected function fetch(int $cursor, int $limit);

    /**
     * Map one source row to the data that Kirki saves.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row    The source row.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @return mixed
     * @throws SkipItemException When the row cannot be migrated.
     */
    abstract protected function map(array $row, RecordLedger $ledger);

    /**
     * Save mapped data in Kirki.
     *
     * @since 1.0.0
     *
     * @param mixed                $mapped The result of map().
     * @param array<string, mixed> $row    The source row.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @return int The id of the created Kirki record.
     * @throws SkipItemException When the row cannot be migrated.
     */
    abstract protected function persist($mapped, array $row, RecordLedger $ledger);

    /**
     * Find a Kirki record that already stands for the row, so it is reused and not created again.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row    The source row.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @return int|null The Kirki id, or null when no record matches.
     */
    protected function find_existing(array $row, RecordLedger $ledger)
    {
        return null;
    }

    /**
     * Record a note about a value that was changed to fit, shown in the final report.
     *
     * @since 1.0.0
     *
     * @param string $message The note.
     * @return void
     */
    protected function note(string $message)
    {
        $this->notes[] = $message;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function depends_on()
    {
        return [];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function chunk_size()
    {
        return 50;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function migrate_chunk(int $cursor, RecordLedger $ledger, $run_id = null)
    {
        $this->notes = [];
        $this->run_id = $run_id;
        $result = new ChunkResultDTO(['group' => $this->id(), 'cursor' => $cursor]);
        $limit = $this->chunk_size();
        $rows = $this->fetch($cursor, $limit);

        foreach ($rows as $row) {
            $source_id = (int) $row['id'];
            $result->processed++;
            $result->cursor = $source_id;

            if ($ledger->exists($this->entity(), $source_id)) {
                $result->reused++;
                continue;
            }

            $this->migrate_row($row, $source_id, $ledger, $run_id, $result);
        }

        $result->finished = count($rows) < $limit;
        $result->notes = $this->notes;

        return $result;
    }

    /**
     * Migrate one row and count it as created, reused or skipped.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row       The source row.
     * @param int                  $source_id The source id of the row.
     * @param RecordLedger                $ledger    The links between source and Kirki records.
     * @param int|null             $run_id    The id of the current run.
     * @param ChunkResultDTO       $result    The chunk result to update.
     * @return void
     */
    protected function migrate_row(array $row, int $source_id, RecordLedger $ledger, $run_id, ChunkResultDTO $result)
    {
        DB::begin_transaction();

        try {
            $existing_id = $this->find_existing($row, $ledger);

            if ($existing_id !== null) {
                $ledger->link($this->entity(), $source_id, $existing_id, $run_id, MigrationRecordLedger::ORIGIN_REUSED);
                DB::commit();
                $result->reused++;

                return;
            }

            $kirki_ecommerce_id = $this->persist($this->map($row, $ledger), $row, $ledger);
            $ledger->link($this->entity(), $source_id, $kirki_ecommerce_id, $run_id, MigrationRecordLedger::ORIGIN_CREATED);
            DB::commit();
            $result->created++;
        } catch (Throwable $e) {
            DB::rollback();
            $ledger->forget_cache();
            $result->skipped++;
            $result->skipped_items[] = new SkippedItemDTO([
                'group' => $this->id(),
                'source_id' => $source_id,
                'reason' => $e->getMessage(),
            ]);
        }
    }
}
