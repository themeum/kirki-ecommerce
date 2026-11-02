<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Migration\Core\MigrationReverter;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\RunStatus;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

/**
 * Covers reverting a WooCommerce migration run.
 */
class WooCommerceRevertTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;
    use SeedsTestCurrency;

    /** @var MigrationRunner */
    protected $runner;

    /** @var MigrationReverter */
    protected $reverter;

    /** @var WooCommerceSource */
    protected $source;

    /** @var array<string, mixed> */
    protected $settings_snapshot = [];

    /**
     * Set up WooCommerce fixtures, the runner and the reverter.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->register_woo_taxonomies();
        $this->purge();
        $this->seed_base_currency();
        update_option('woocommerce_version', '8.4.0');
        $this->create_woo_tables(false);

        $this->settings_snapshot = Option::get(OptionKeys::GENERAL_SETTINGS);
        $this->source = new WooCommerceSource();
        $registry = new SourceRegistry();
        $this->runner = new MigrationRunner($registry);
        $this->reverter = new MigrationReverter($registry);
    }

    /**
     * Remove created rows and fixtures.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        Option::set(OptionKeys::GENERAL_SETTINGS, $this->settings_snapshot, true);
        $this->purge();
        delete_option('woocommerce_store_city');
        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * Revert removes the records the run created and keeps the ones it reused.
     *
     * @return void
     */
    public function test_revert_removes_created_records_and_keeps_reused_ones()
    {
        $created = self::factory()->user->create(['role' => 'customer', 'user_email' => 'new@example.com', 'user_login' => 'new@example.com']);
        $reused = self::factory()->user->create(['role' => 'customer', 'user_email' => 'dup@example.com', 'user_login' => 'dup@example.com']);
        $existing = Customer::create(['first_name' => 'Old', 'last_name' => 'Name', 'email' => 'dup@example.com', 'created_by' => get_current_user_id(), 'updated_by' => get_current_user_id()]);
        $category = $this->woo_term('product_cat', 'Shoes');
        $ledger = new RecordLedger('woocommerce');

        $run = $this->migrate(['customers', 'categories']);
        $customer_id = $ledger->resolve('customer', $created);
        $category_id = $ledger->resolve('category', $category);

        $result = $this->revert($run);

        $this->assertSame(RunStatus::REVERTED, $result['status']);
        $this->assertNull(Customer::find($customer_id));
        $this->assertNull(Category::find($category_id));
        $this->assertNotNull(Customer::find($existing->id), 'A reused customer is not deleted.');
        $this->assertSame(0, Address::query()->where('customer_id', $customer_id)->count());
        $this->assertSame(0, MigrationRecordLedger::query()->where('run_id', $run->id)->count());
        $this->assertNotNull($reused);
    }

    /**
     * Revert removes a created attribute together with its values.
     *
     * @return void
     */
    public function test_revert_removes_a_created_attribute_and_its_values()
    {
        $attribute = $this->insert_woo_row('woocommerce_attribute_taxonomies', ['attribute_name' => 'size', 'attribute_label' => 'Size']);
        $this->woo_term('pa_size', 'Small');
        $ledger = new RecordLedger('woocommerce');

        $run = $this->migrate(['attributes']);
        $attribute_id = $ledger->resolve('attribute', $attribute);
        $this->assertSame(1, AttributeValue::query()->where('attribute_id', $attribute_id)->count());

        $result = $this->revert($run);

        $this->assertSame(RunStatus::REVERTED, $result['status']);
        $this->assertNull(Attribute::find($attribute_id));
        $this->assertSame(0, AttributeValue::query()->where('attribute_id', $attribute_id)->count());
    }

    /**
     * A record that new Kirki data depends on is kept and counted.
     *
     * @return void
     */
    public function test_record_in_use_is_kept_and_reported()
    {
        $parent = $this->woo_term('product_cat', 'Parent');
        $run = $this->migrate(['categories']);
        $parent_id = (new RecordLedger('woocommerce'))->resolve('category', $parent);
        $child = Category::create(['name' => 'Mine', 'slug' => 'mine', 'level' => 2, 'parent_id' => $parent_id, 'is_active' => 1, 'is_deletable' => 1]);

        $result = $this->revert($run);

        $this->assertSame(1, $result['kept']);
        $this->assertNotNull(Category::find($parent_id));
        $this->assertNotNull(Category::find($child->id));
        $this->assertSame(RunStatus::REVERTED, $result['status']);
    }

    /**
     * Revert puts back a store address the migration filled.
     *
     * @return void
     */
    public function test_revert_restores_changed_settings()
    {
        Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->set(['store_address' => ['address_line_1' => '', 'address_line_2' => null, 'city' => '', 'state' => null, 'postal_code' => null, 'country' => '']], false);
        update_option('woocommerce_store_city', 'Woo City');

        $run = $this->migrate(['settings']);
        $this->assertSame('Woo City', Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array()['store_address']['city']);

        $this->revert($run);

        $this->assertEmpty(Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array()['store_address']['city']);
    }

    /**
     * A reverted store can be migrated again and creates everything again.
     *
     * @return void
     */
    public function test_migrating_again_after_revert_creates_records_again()
    {
        $term = $this->woo_term('product_cat', 'Hats');

        $this->revert($this->migrate(['categories']));
        $this->assertSame(0, Category::query()->where('name', 'Hats')->count());

        $this->migrate(['categories']);

        $this->assertSame(1, Category::query()->where('name', 'Hats')->count());
        $this->assertNotNull((new RecordLedger('woocommerce'))->resolve('category', $term));
    }

    /**
     * The latest run is the one that was not reverted.
     *
     * @return void
     */
    public function test_latest_run_ignores_reverted_runs()
    {
        $this->woo_term('product_cat', 'Bags');
        $run = $this->migrate(['categories']);

        $this->assertSame((int) $run->id, (int) $this->runner->latest_run('woocommerce')->id);

        $this->revert($run);

        $this->assertNull($this->runner->latest_run('woocommerce'));
    }

    /**
     * A run that is still pending cannot be reverted.
     *
     * @return void
     */
    public function test_unfinished_run_cannot_be_reverted()
    {
        $this->woo_term('product_cat', 'Bags');
        $run = $this->runner->start($this->source, ['categories']);

        $this->expectException(\Kirki\Ecommerce\Framework\Exceptions\ValidationException::class);

        $this->reverter->start($run);
    }

    /**
     * Run all chunks of a migration.
     *
     * @param string[] $groups The group ids.
     * @return MigrationRun
     */
    protected function migrate(array $groups): MigrationRun
    {
        $run = $this->runner->start($this->source, $groups);

        do {
            $progress = $this->runner->next_chunk($run);
        } while (!$progress['done']);

        return $run->fresh();
    }

    /**
     * Run all chunks of a revert.
     *
     * @param MigrationRun $run The run to revert.
     * @return array<string, mixed> The last progress.
     */
    protected function revert(MigrationRun $run): array
    {
        $run = $this->reverter->start($run);

        do {
            $progress = $this->reverter->next_chunk($run);
        } while (!$progress['done']);

        return $progress;
    }

    /**
     * Delete the Kirki rows the test creates.
     *
     * @return void
     */
    protected function purge(): void
    {
        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        Coupon::query()->delete();
        Address::query()->delete();
        Customer::query()->delete();
        Product::query()->delete();
        Category::query()->delete();
        AttributeValue::query()->delete();
        Attribute::query()->delete();
    }
}
