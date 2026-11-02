<?php

namespace Kirki\Ecommerce\Tests\Support\Migration;

use Kirki\Ecommerce\App\Migration\Core\AbstractGroupMigrator;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\SkipItemException;

/**
 * Group migrator over an in-memory list of rows, used to test the engine.
 */
class FakeGroupMigrator extends AbstractGroupMigrator
{
    /** @var string */
    protected $group_id;

    /** @var int */
    protected $total;

    /** @var string[] */
    protected $dependencies;

    /** @var int[] Source ids that fail to map. */
    public $bad_ids = [];

    /** @var int|null Source id that throws a chunk-level error when fetched. */
    public $explode_after = null;

    /** @var int Next Kirki id handed out. */
    public static $next_kirki_ecommerce_id = 1000;

    /** @var int[] Kirki ids reverted, in order. */
    public $reverted = [];

    /** @var int[] Source ids saved, in order. */
    public $persisted = [];

    public function __construct(string $group_id, int $total, array $dependencies = [])
    {
        $this->group_id = $group_id;
        $this->total = $total;
        $this->dependencies = $dependencies;
    }

    public function id()
    {
        return $this->group_id;
    }

    public function label()
    {
        return ucfirst($this->group_id);
    }

    public function description()
    {
        return 'Fake ' . $this->group_id;
    }

    public function depends_on()
    {
        return $this->dependencies;
    }

    public function chunk_size()
    {
        return 30;
    }

    public function count()
    {
        return $this->total;
    }

    protected function entity()
    {
        return $this->group_id;
    }

    protected function fetch(int $cursor, int $limit)
    {
        if ($this->explode_after !== null && $cursor >= $this->explode_after) {
            $this->explode_after = null;

            throw new \RuntimeException('Source went away');
        }

        $rows = [];

        for ($id = $cursor + 1; $id <= $this->total && count($rows) < $limit; $id++) {
            $rows[] = ['id' => $id];
        }

        return $rows;
    }

    protected function map(array $row, RecordLedger $ledger)
    {
        if (in_array($row['id'], $this->bad_ids, true)) {
            throw new SkipItemException('Cannot map item ' . $row['id']);
        }

        return $row;
    }

    public function revert_record(string $entity, int $kirki_ecommerce_id, $previous_value = null)
    {
        $this->reverted[] = $kirki_ecommerce_id;

        return true;
    }

    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        $this->persisted[] = $row['id'];

        return static::$next_kirki_ecommerce_id++;
    }
}
