<?php

namespace Kirki\Ecommerce\App\Migration\Core;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Contracts\GroupMigrator;
use Kirki\Ecommerce\App\Migration\Contracts\MigrationSource;
use Kirki\Ecommerce\App\Migration\DTO\GroupDTO;
use Kirki\Ecommerce\App\Migration\DTO\ScanResultDTO;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Throwable;

/**
 * Scans a source and runs a migration one chunk at a time, saving progress after each chunk.
 *
 * @since 1.0.0
 */
class MigrationRunner
{
    /** @var SourceRegistry */
    protected $registry;

    /**
     * Create the runner with the source registry.
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
     * Scan a source for the groups that can be migrated. Only reads data.
     *
     * @since 1.0.0
     *
     * @param MigrationSource $source The source to scan.
     * @return ScanResultDTO
     */
    public function scan(MigrationSource $source)
    {
        $groups = [];

        foreach ($source->groups() as $group) {
            $count = $group->count();

            if ($count > 0) {
                $groups[] = (new GroupDTO(['id' => $group->id(), 'label' => $group->label(), 'description' => $group->description(), 'count' => $count]))->to_array();
            }
        }

        return new ScanResultDTO([
            'source' => $source->id(),
            'groups' => $groups,
            'extensions' => $source->extensions(),
        ]);
    }

    /**
     * Get the unfinished run of a source, if one exists.
     *
     * @since 1.0.0
     *
     * @param string $source_id The source id.
     * @return MigrationRun|null
     */
    public function active_run(string $source_id)
    {
        return MigrationRun::query()
            ->where('source', $source_id)
            ->where_in('status', [RunStatus::PENDING, RunStatus::RUNNING, RunStatus::FAILED])
            ->first();
    }

    /**
     * Get the latest run of a source that was not reverted, if one exists.
     *
     * @since 1.0.0
     *
     * @param string $source_id The source id.
     * @return MigrationRun|null
     */
    public function latest_run(string $source_id)
    {
        return MigrationRun::query()
            ->where('source', $source_id)
            ->where('status', '!=', RunStatus::REVERTED)
            ->order_by('id', 'desc')
            ->first();
    }

    /**
     * Start a run for the chosen groups, or return the unfinished run of the source.
     *
     * @since 1.0.0
     *
     * @param MigrationSource $source    The source to migrate from.
     * @param string[]        $group_ids The ids of the groups to migrate.
     * @return MigrationRun
     */
    public function start(MigrationSource $source, array $group_ids)
    {
        $active = $this->active_run($source->id());

        if ($active) {
            return $active;
        }

        $groups = [];

        foreach ($source->groups() as $group) {
            if (!in_array($group->id(), $group_ids, true)) {
                continue;
            }

            $groups[$group->id()] = [
                'label' => $group->label(),
                'status' => RunStatus::PENDING,
                'cursor' => 0,
                'total' => $group->count(),
                'done' => 0,
                'created' => 0,
                'reused' => 0,
                'skipped' => 0,
            ];
        }

        return MigrationRun::create([
            'source' => $source->id(),
            'status' => RunStatus::PENDING,
            'groups' => $groups,
            'skipped_items' => [],
            'started_at' => current_time('mysql', true),
        ]);
    }

    /**
     * Run the next chunk of the next unfinished group and save the new position.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run to continue.
     * @return array<string, mixed> Progress for the screen.
     * @throws Throwable When the chunk fails; the saved position stays at the last finished chunk.
     */
    public function next_chunk(MigrationRun $run)
    {
        $source = $this->registry->get($run->source);
        $groups = $run->groups;
        $group = $source ? $this->next_group($source, $groups) : null;

        if ($group === null) {
            if ($run->status !== RunStatus::DONE) {
                $this->finish($run);
            }

            return $this->progress($run, null);
        }

        $state = $groups[$group->id()];
        $state['status'] = RunStatus::RUNNING;
        $groups[$group->id()] = $state;
        $run->update(['status' => RunStatus::RUNNING, 'groups' => $groups, 'last_error' => null]);

        try {
            $ledger = new RecordLedger($run->source);
            $result = $group->migrate_chunk((int) $state['cursor'], $ledger, (int) $run->id);
        } catch (Throwable $e) {
            $groups[$group->id()]['status'] = RunStatus::FAILED;
            $run->update(['status' => RunStatus::FAILED, 'groups' => $groups, 'last_error' => $e->getMessage()]);

            throw $e;
        }

        $from = (int) $state['done'] + 1;
        $state['cursor'] = $result->cursor;
        $state['done'] += $result->processed;
        $state['created'] += $result->created;
        $state['reused'] += $result->reused;
        $state['skipped'] += $result->skipped;
        $state['status'] = $result->finished ? RunStatus::DONE : RunStatus::RUNNING;
        $groups[$group->id()] = $state;

        $skipped_items = array_merge($run->skipped_items ?: [], array_map(function ($item) {
            return $item->to_array();
        }, $result->skipped_items));

        $run->update(['groups' => $groups, 'skipped_items' => $skipped_items]);

        if ($this->next_group($source, $groups) === null) {
            $this->finish($run);
        }

        return $this->progress($run, $group, $from, $state['done'], $result->finished, $result->notes);
    }

    /**
     * Pick the first selected group that is not done and whose dependencies are done.
     *
     * @since 1.0.0
     *
     * @param MigrationSource      $source The source being migrated.
     * @param array<string, array> $groups The saved group states.
     * @return GroupMigrator|null
     */
    protected function next_group(MigrationSource $source, array $groups)
    {
        foreach ($source->groups() as $group) {
            if (!isset($groups[$group->id()]) || $groups[$group->id()]['status'] === RunStatus::DONE) {
                continue;
            }

            $blocked = false;

            foreach ($group->depends_on() as $dependency) {
                if (isset($groups[$dependency]) && $groups[$dependency]['status'] !== RunStatus::DONE) {
                    $blocked = true;
                    break;
                }
            }

            if (!$blocked) {
                return $group;
            }
        }

        return null;
    }

    /**
     * Mark the run as finished.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run.
     * @return void
     */
    protected function finish(MigrationRun $run)
    {
        $run->update(['status' => RunStatus::DONE, 'finished_at' => current_time('mysql', true)]);
    }

    /**
     * Build the progress data returned after a chunk.
     *
     * @since 1.0.0
     *
     * @param MigrationRun      $run            The run.
     * @param GroupMigrator|null $group          The group that ran, or null when nothing ran.
     * @param int               $range_from     First item number of the chunk.
     * @param int               $range_to       Last item number of the chunk.
     * @param bool              $group_finished Whether the group finished in this chunk.
     * @param string[]          $notes          Notes from the chunk.
     * @return array<string, mixed>
     */
    protected function progress(MigrationRun $run, $group, int $range_from = 0, int $range_to = 0, bool $group_finished = false, array $notes = [])
    {
        $run = $run->fresh();

        return [
            'run_id' => (int) $run->id,
            'status' => $run->status,
            'done' => $run->status === RunStatus::DONE,
            'group' => $group ? $group->id() : null,
            'label' => $group ? $group->label() : null,
            'range_from' => $range_from,
            'range_to' => $range_to,
            'group_finished' => $group_finished,
            'groups' => $run->groups,
            'notes' => $notes,
        ];
    }
}
