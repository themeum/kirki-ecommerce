<?php

namespace Kirki\Ecommerce\App\Migration\Core;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Contracts\GroupMigrator;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Reverts a run: removes the Kirki records it created and puts back the settings it changed.
 *
 * The ledger is read from the newest row to the oldest, so a record is removed before the records it
 * points to. A record that other data uses is kept and counted. Only Kirki data changes.
 *
 * @since 1.0.0
 */
class MigrationReverter
{
    /** The number of ledger rows handled in one chunk. */
    public const CHUNK_SIZE = 50;

    /** @var SourceRegistry */
    protected $registry;

    /**
     * Create the reverter.
     *
     * @since 1.0.0
     *
     * @param SourceRegistry $registry The registered sources.
     */
    public function __construct(SourceRegistry $registry)
    {
        $this->registry = $registry;
    }

    /**
     * Mark a finished or failed run as reverting. A run that is already reverting is returned as it is.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run to revert.
     * @return MigrationRun
     * @throws ValidationException When the run cannot be reverted.
     */
    public function start(MigrationRun $run)
    {
        throw_if(
            !in_array($run->status, [RunStatus::DONE, RunStatus::FAILED, RunStatus::REVERTING], true),
            __('Only a finished or failed migration can be reverted.', 'kirki-ecommerce'),
            ValidationException::class,
            Response::UNPROCESSABLE_ENTITY
        );

        if ($run->status === RunStatus::REVERTING) {
            return $run;
        }

        $run->update([
            'status' => RunStatus::REVERTING,
            'last_error' => null,
            'revert_state' => [
                'cursor' => null,
                'total' => $this->rows($run)->count(),
                'removed' => 0,
                'kept' => 0,
            ],
        ]);

        return $run->fresh();
    }

    /**
     * Revert the next chunk of ledger rows and save the new position.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run that is reverting.
     * @return array<string, mixed> Progress for the screen.
     * @throws ValidationException When the run is not reverting.
     * @throws Throwable           When a record fails to revert; the saved position stays at the last finished chunk.
     */
    public function next_chunk(MigrationRun $run)
    {
        throw_if(
            $run->status !== RunStatus::REVERTING,
            __('This migration is not being reverted.', 'kirki-ecommerce'),
            ValidationException::class,
            Response::UNPROCESSABLE_ENTITY
        );

        $state = $run->revert_state;
        $groups = $this->groups_by_entity($run);
        $query = $this->rows($run);

        if ($state['cursor'] !== null) {
            $query->where('id', '<', (int) $state['cursor']);
        }

        $rows = $query->order_by('id', 'desc')->limit(static::CHUNK_SIZE)->get();

        try {
            foreach ($rows as $row) {
                $group = $groups[$row->entity] ?? null;
                $removed = $group !== null && $group->revert_record($row->entity, (int) $row->kirki_ecommerce_id, $row->previous_value);

                $state[$removed ? 'removed' : 'kept']++;
                $state['cursor'] = (int) $row->id;
            }
        } catch (Throwable $e) {
            $run->update(['revert_state' => $state, 'last_error' => $e->getMessage()]);

            throw $e;
        }

        $finished = count($rows) < static::CHUNK_SIZE;

        if ($finished) {
            MigrationRecordLedger::query()->where('run_id', (int) $run->id)->delete();
            $run->update(['status' => RunStatus::REVERTED, 'revert_state' => $state, 'finished_at' => current_time('mysql', true)]);
        } else {
            $run->update(['revert_state' => $state]);
        }

        return $this->progress($run->fresh());
    }

    /**
     * Build the progress data returned after a chunk.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run.
     * @return array<string, mixed>
     */
    public function progress(MigrationRun $run)
    {
        $state = $run->revert_state ?: [];

        return [
            'run_id' => (int) $run->id,
            'status' => $run->status,
            'done' => $run->status === RunStatus::REVERTED,
            'total' => (int) ($state['total'] ?? 0),
            'removed' => (int) ($state['removed'] ?? 0),
            'kept' => (int) ($state['kept'] ?? 0),
        ];
    }

    /**
     * Query the ledger rows that the run created.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run.
     * @return QueryBuilder
     */
    protected function rows(MigrationRun $run)
    {
        return MigrationRecordLedger::query()
            ->where('run_id', (int) $run->id)
            ->where('origin', MigrationRecordLedger::ORIGIN_CREATED);
    }

    /**
     * Map each ledger entity of the source to the group that created it.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run.
     * @return array<string, GroupMigrator>
     */
    protected function groups_by_entity(MigrationRun $run)
    {
        $source = $this->registry->get($run->source);
        $map = [];

        if ($source === null) {
            return $map;
        }

        foreach ($source->groups() as $group) {
            foreach ($group->ledger_entities() as $entity) {
                $map[$entity] = $group;
            }
        }

        return $map;
    }
}
