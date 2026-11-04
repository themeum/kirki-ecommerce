<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Constants\MigrationHookNames;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\Tests\Support\Migration\FakeGroupMigrator;
use Kirki\Ecommerce\Tests\Support\Migration\FakeMigrationSource;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers the migration REST endpoints with a fake source.
 */
class MigrationApiTest extends RestTestCase
{
    /** @var FakeGroupMigrator */
    protected $products;

    /** @var callable */
    protected $add_filter_for_test;

    /**
     * Register a fake source holding 70 products.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();

        $this->products = new FakeGroupMigrator('products', 70);

        $source = new FakeMigrationSource([$this->products]);
        $this->add_filter_for_test = function ($sources) use ($source) {
            $sources[] = $source;

            return $sources;
        };
        add_filter(MigrationHookNames::SOURCES, $this->add_filter_for_test);
    }

    /**
     * Remove the registered source and the rows the test created.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        remove_filter(MigrationHookNames::SOURCES, $this->add_filter_for_test);

        parent::tearDown();
    }

    /**
     * Users without store management rights are rejected on every endpoint.
     *
     * @return void
     */
    public function test_non_admins_are_rejected()
    {
        $this->logout();

        foreach ([['GET', 'migration/sources'], ['POST', 'migration/scan'], ['POST', 'migration/runs'], ['GET', 'migration/runs/1'], ['POST', 'migration/runs/1/chunk']] as [$method, $path]) {
            $this->assertContains($this->request($method, $path, ['source' => 'fake', 'groups' => ['products']])->get_status(), [401, 403], $path);
        }

        $this->assertSame(0, MigrationRun::query()->count());
    }

    /**
     * Detected sources are listed.
     *
     * @return void
     */
    public function test_sources_lists_detected_sources()
    {
        $payload = $this->assert_api_success($this->request('GET', 'migration/sources'));

        $this->assertSame('fake', $payload['data'][0]['id']);
        $this->assertTrue($payload['data'][0]['version']['supported']);
    }

    /**
     * A scan returns the groups and writes nothing.
     *
     * @return void
     */
    public function test_scan_returns_groups_and_writes_nothing()
    {
        $payload = $this->assert_api_success($this->request('POST', 'migration/scan', ['source' => 'fake']));

        $this->assertSame([['id' => 'products', 'label' => 'Products', 'description' => 'Fake products', 'count' => 70]], $payload['data']['groups']);
        $this->assertSame(0, MigrationRun::query()->count());
        $this->assertSame(0, MigrationRecordLedger::query()->count());
        $this->assertSame([], $this->products->persisted);
    }

    /**
     * An unknown source is not found.
     *
     * @return void
     */
    public function test_scan_of_an_unknown_source_is_not_found()
    {
        $this->assertSame(404, $this->request('POST', 'migration/scan', ['source' => 'nope'])->get_status());
    }

    /**
     * Starting a run, running chunks and reading the run work end to end.
     *
     * @return void
     */
    public function test_chunk_response_shape_and_run_state()
    {
        $start = $this->assert_api_success($this->request('POST', 'migration/runs', ['source' => 'fake', 'groups' => ['products']]), 201);
        $run_id = $start['data']['id'];

        $chunk = $this->assert_api_success($this->request('POST', 'migration/runs/' . $run_id . '/chunk'));

        $this->assertSame('products', $chunk['data']['group']);
        $this->assertSame(1, $chunk['data']['range_from']);
        $this->assertSame(30, $chunk['data']['range_to']);
        $this->assertFalse($chunk['data']['group_finished']);
        $this->assertSame(70, $chunk['data']['groups']['products']['total']);

        $show = $this->assert_api_success($this->request('GET', 'migration/runs/' . $run_id));
        $this->assertSame(30, $show['data']['groups']['products']['done']);
    }

    /**
     * The ledger rows of the source are deleted when the last chunk reports done, and not before.
     *
     * @return void
     */
    public function test_ledger_is_cleared_when_the_run_is_done()
    {
        $start = $this->assert_api_success($this->request('POST', 'migration/runs', ['source' => 'fake', 'groups' => ['products']]), 201);
        $run_id = $start['data']['id'];

        $first = $this->assert_api_success($this->request('POST', 'migration/runs/' . $run_id . '/chunk'));
        $this->assertFalse($first['data']['done']);
        $this->assertSame(30, MigrationRecordLedger::query()->where('source', 'fake')->count());

        $this->assert_api_success($this->request('POST', 'migration/runs/' . $run_id . '/chunk'));
        $last = $this->assert_api_success($this->request('POST', 'migration/runs/' . $run_id . '/chunk'));

        $this->assertTrue($last['data']['done']);
        $this->assertSame(0, MigrationRecordLedger::query()->where('source', 'fake')->count());
        $latest = $this->assert_api_success($this->request('GET', 'migration/runs/latest', ['source' => 'fake']));
        $this->assertSame('done', $latest['data']['status']);
    }

    /**
     * A failed run keeps its ledger rows, so Retry continues without creating duplicates.
     *
     * @return void
     */
    public function test_failed_run_keeps_the_ledger_and_retry_continues()
    {
        $start = $this->assert_api_success($this->request('POST', 'migration/runs', ['source' => 'fake', 'groups' => ['products']]), 201);
        $run_id = $start['data']['id'];
        $this->products->explode_after = 30;

        $this->assert_api_success($this->request('POST', 'migration/runs/' . $run_id . '/chunk'));
        $this->assertGreaterThanOrEqual(400, $this->request('POST', 'migration/runs/' . $run_id . '/chunk')->get_status());
        $this->assertSame(30, MigrationRecordLedger::query()->where('source', 'fake')->count());

        $this->assert_api_success($this->request('POST', 'migration/runs/' . $run_id . '/chunk'));
        $last = $this->assert_api_success($this->request('POST', 'migration/runs/' . $run_id . '/chunk'));

        $this->assertTrue($last['data']['done']);
        $this->assertSame([], array_diff(range(1, 70), $this->products->persisted));
        $this->assertSame(70, count($this->products->persisted));
        $this->assertSame(0, MigrationRecordLedger::query()->where('source', 'fake')->count());
    }

    /**
     * Starting a second run while one is unfinished returns the unfinished run, and it can be fetched by source.
     *
     * @return void
     */
    public function test_second_start_returns_the_active_run()
    {
        $first = $this->assert_api_success($this->request('POST', 'migration/runs', ['source' => 'fake', 'groups' => ['products']]), 201);
        $second = $this->assert_api_success($this->request('POST', 'migration/runs', ['source' => 'fake', 'groups' => ['products']]), 201);
        $active = $this->assert_api_success($this->request('GET', 'migration/runs/latest', ['source' => 'fake']));

        $this->assertSame($first['data']['id'], $second['data']['id']);
        $this->assertSame($first['data']['id'], $active['data']['id']);
    }

    /**
     * A start request without groups is invalid.
     *
     * @return void
     */
    public function test_start_requires_groups()
    {
        $this->assertSame(422, $this->request('POST', 'migration/runs', ['source' => 'fake'])->get_status());
    }
}
