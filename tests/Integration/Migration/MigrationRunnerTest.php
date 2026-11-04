<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\RunStatus;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\Tests\Support\Migration\FakeGroupMigrator;
use Kirki\Ecommerce\Tests\Support\Migration\FakeMigrationSource;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers the source-independent migration engine with a fake source.
 */
class MigrationRunnerTest extends RestTestCase
{
    /** @var FakeGroupMigrator */
    protected $products;

    /** @var FakeGroupMigrator */
    protected $orders;

    /** @var FakeMigrationSource */
    protected $source;

    /** @var MigrationRunner */
    protected $runner;

    /**
     * Build a fake source with products (70 items) and orders (40 items, after products).
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();

        $this->products = new FakeGroupMigrator('products', 70);
        $this->orders = new FakeGroupMigrator('orders', 40, ['products']);
        $this->source = new FakeMigrationSource([$this->products, $this->orders]);

        $registry = (new SourceRegistry())->register($this->source);
        $this->runner = new MigrationRunner($registry);
    }

    /**
     * Remove the rows the test created, because the engine commits its own transactions.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();

        parent::tearDown();
    }

    /**
     * A scan lists groups with counts and omits empty groups.
     *
     * @return void
     */
    public function test_scan_lists_groups_and_omits_empty_ones()
    {
        $source = new FakeMigrationSource([new FakeGroupMigrator('products', 5), new FakeGroupMigrator('coupons', 0)]);

        $result = $this->runner->scan($source);

        $this->assertSame([['id' => 'products', 'label' => 'Products', 'description' => 'Fake products', 'count' => 5]], $result->groups);
    }

    /**
     * No chunk processes more than the chunk size, and the last chunk reports the group finished.
     *
     * @return void
     */
    public function test_chunks_respect_the_chunk_size_and_finish_the_group()
    {
        $run = $this->runner->start($this->source, ['products']);

        $first = $this->runner->next_chunk($run);
        $second = $this->runner->next_chunk($run);
        $third = $this->runner->next_chunk($run);

        $this->assertSame([1, 30], [$first['range_from'], $first['range_to']]);
        $this->assertSame([31, 60], [$second['range_from'], $second['range_to']]);
        $this->assertSame([61, 70], [$third['range_from'], $third['range_to']]);
        $this->assertFalse($first['group_finished']);
        $this->assertTrue($third['group_finished']);
        $this->assertTrue($third['done']);
    }

    /**
     * Orders do not start before products are done.
     *
     * @return void
     */
    public function test_groups_run_in_dependency_order()
    {
        $run = $this->runner->start($this->source, ['orders', 'products']);
        $order = [];

        do {
            $progress = $this->runner->next_chunk($run);
            $order[] = $progress['group'];
        } while (!$progress['done']);

        $this->assertSame(['products', 'products', 'products', 'orders', 'orders'], array_values(array_filter($order)));
    }

    /**
     * A deselected dependency does not block the group that needs it.
     *
     * @return void
     */
    public function test_a_deselected_dependency_does_not_block()
    {
        $run = $this->runner->start($this->source, ['orders']);

        $progress = $this->runner->next_chunk($run);

        $this->assertSame('orders', $progress['group']);
    }

    /**
     * A failed chunk keeps the position of the last finished chunk, and resume continues there.
     *
     * @return void
     */
    public function test_resume_continues_from_the_saved_position()
    {
        $run = $this->runner->start($this->source, ['products']);
        $this->runner->next_chunk($run);
        $this->products->explode_after = 30;

        try {
            $this->runner->next_chunk($run);
            $this->fail('The chunk should have failed.');
        } catch (\RuntimeException $e) {
            $this->assertSame('Source went away', $e->getMessage());
        }

        $saved = MigrationRun::find($run->id);
        $this->assertSame(RunStatus::FAILED, $saved->status);
        $this->assertSame(30, $saved->groups['products']['cursor']);

        $this->products->persisted = [];
        $resumed = $this->runner->next_chunk($saved);

        $this->assertSame(31, $resumed['range_from']);
        $this->assertSame(31, $this->products->persisted[0]);
    }

    /**
     * An item that cannot be mapped is skipped and reported, and the rest of the chunk is created.
     *
     * @return void
     */
    public function test_a_bad_item_is_skipped_and_reported()
    {
        $this->products->bad_ids = [5];
        $run = $this->runner->start($this->source, ['products']);

        $progress = $this->runner->next_chunk($run);

        $saved = MigrationRun::find($run->id);
        $this->assertSame(29, $progress['groups']['products']['created']);
        $this->assertSame(1, $progress['groups']['products']['skipped']);
        $this->assertSame([['group' => 'products', 'source_id' => 5, 'reason' => 'Cannot map item 5']], $saved->skipped_items);
    }

    /**
     * Each created item has a link, and linked items are not created again.
     *
     * @return void
     */
    public function test_links_are_saved_and_a_second_run_creates_nothing()
    {
        $run = $this->runner->start($this->source, ['products']);
        do {
            $progress = $this->runner->next_chunk($run);
        } while (!$progress['done']);

        $map = new RecordLedger('fake');
        $this->assertTrue($map->exists('products', 70));
        $this->assertNotNull($map->resolve('products', 1));

        $this->products->persisted = [];
        $second = $this->runner->start($this->source, ['products']);
        do {
            $progress = $this->runner->next_chunk($second);
        } while (!$progress['done']);

        $this->assertSame([], $this->products->persisted);
        $this->assertSame(70, $progress['groups']['products']['reused']);
        $this->assertSame(0, $progress['groups']['products']['created']);
    }

    /**
     * Clearing the ledger deletes the rows of one source and leaves the other sources alone.
     *
     * @return void
     */
    public function test_clear_ledger_deletes_only_the_rows_of_the_source()
    {
        (new RecordLedger('fake'))->link('products', 1, 10);
        (new RecordLedger('other'))->link('products', 1, 20);

        $this->runner->clear_ledger('fake');

        $this->assertFalse((new RecordLedger('fake'))->exists('products', 1));
        $this->assertTrue((new RecordLedger('other'))->exists('products', 1));

        MigrationRecordLedger::query()->where('source', 'other')->delete();
    }

    /**
     * Starting a run while one is unfinished returns the unfinished run.
     *
     * @return void
     */
    public function test_start_returns_the_active_run()
    {
        $first = $this->runner->start($this->source, ['products']);
        $second = $this->runner->start($this->source, ['orders']);

        $this->assertSame($first->id, $second->id);
    }
}
