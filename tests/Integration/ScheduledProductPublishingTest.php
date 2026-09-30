<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Exception;
use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\Jobs\PublishScheduledProductJob;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Queue\DatabaseQueue;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class ScheduledProductPublishingTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * The queue fake recording dispatched jobs.
     *
     * @var QueueFake
     */
    protected $queue;

    /**
     * Fake the queue before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->queue = Queue::fake();
    }

    /**
     * Drop the faked queue manager so later tests resolve a real one.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        static::forget_singleton(QueueManager::class);

        parent::tearDown();
    }

    /**
     * Creating a scheduled product queues one publish for its scheduled_at.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_creating_a_scheduled_product_queues_its_publish(): void
    {
        $scheduled_at = $this->future_atom(DAY_IN_SECONDS);

        $product = $this->create_product([
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $scheduled_at,
        ]);

        $jobs = $this->pushed_for($product['id']);

        $this->assertCount(1, $jobs);
        $this->assertSame(PublishScheduledProductJob::QUEUE, $jobs[0]->get_queue());
        $this->assertSame(strtotime($scheduled_at), $jobs[0]->get_delay()->get_timestamp());
    }

    /**
     * Creating a draft or published product queues nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_creating_an_unscheduled_product_queues_nothing(): void
    {
        $this->create_product(['status' => ProductStatus::DRAFT]);
        $this->create_product(['status' => ProductStatus::PUBLISHED]);

        $this->assertCount(0, $this->queue->pushed(PublishScheduledProductJob::class));
    }

    /**
     * Moving a draft product to scheduled queues one publish.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_scheduling_a_draft_product_queues_its_publish(): void
    {
        $product = $this->create_product(['status' => ProductStatus::DRAFT]);

        $this->update_product($product, [
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $this->future_atom(DAY_IN_SECONDS),
        ]);

        $this->assertCount(1, $this->pushed_for($product['id']));
    }

    /**
     * Re-saving a scheduled product with the same scheduled_at queues nothing more.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_resaving_with_the_same_schedule_queues_nothing_more(): void
    {
        $scheduled_at = $this->future_atom(DAY_IN_SECONDS);

        $product = $this->create_product([
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $scheduled_at,
        ]);

        $this->update_product($product, [
            'title' => 'Renamed Product',
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $scheduled_at,
        ]);

        $this->assertCount(1, $this->pushed_for($product['id']));
    }

    /**
     * Moving scheduled_at queues a publish for the new time.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rescheduling_queues_a_publish_for_the_new_time(): void
    {
        $product = $this->create_product([
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $this->future_atom(DAY_IN_SECONDS),
        ]);

        $rescheduled_at = $this->future_atom(2 * DAY_IN_SECONDS);

        $this->update_product($product, [
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $rescheduled_at,
        ]);

        $jobs = $this->pushed_for($product['id']);

        $this->assertCount(2, $jobs);
        $this->assertSame(strtotime($rescheduled_at), $jobs[1]->get_delay()->get_timestamp());
    }

    /**
     * Moving a scheduled product back to draft queues nothing more.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unscheduling_queues_nothing_more(): void
    {
        $product = $this->create_product([
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $this->future_atom(DAY_IN_SECONDS),
        ]);

        $this->update_product($product, ['status' => ProductStatus::DRAFT]);

        $this->assertCount(1, $this->pushed_for($product['id']));
    }

    /**
     * A due scheduled product is published and its schedule cleared.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_job_publishes_a_due_scheduled_product(): void
    {
        $product_id = $this->seed_product(ProductStatus::SCHEDULED, gmdate('Y-m-d H:i:s', time() - MINUTE_IN_SECONDS));

        (new PublishScheduledProductJob($product_id))->handle();

        $product = Product::query()->where('id', $product_id)->first();

        $this->assertSame(ProductStatus::PUBLISHED, $product->status);
        $this->assertNotEmpty($product->published_at);
        $this->assertEmpty($product->scheduled_at);
    }

    /**
     * A scheduled product whose scheduled_at is still ahead is left alone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_job_leaves_a_product_scheduled_for_later_alone(): void
    {
        $scheduled_at = gmdate('Y-m-d H:i:s', time() + DAY_IN_SECONDS);
        $product_id = $this->seed_product(ProductStatus::SCHEDULED, $scheduled_at);

        (new PublishScheduledProductJob($product_id))->handle();

        $product = Product::query()->where('id', $product_id)->first();

        $this->assertSame(ProductStatus::SCHEDULED, $product->status);
        $this->assertEmpty($product->published_at);
        $this->assertSame($scheduled_at, $product->scheduled_at->format('Y-m-d H:i:s'));
    }

    /**
     * A product that is no longer scheduled is left alone, even with a past scheduled_at.
     *
     * @dataProvider unscheduled_statuses
     *
     * @param string $status The product's current status.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_job_leaves_an_unscheduled_product_alone(string $status): void
    {
        $published_at = '2020-01-01 00:00:00';
        $product_id = $this->seed_product($status, gmdate('Y-m-d H:i:s', time() - MINUTE_IN_SECONDS), $published_at);

        (new PublishScheduledProductJob($product_id))->handle();

        $product = Product::query()->where('id', $product_id)->first();

        $this->assertSame($status, $product->status);
        $this->assertSame($published_at, $product->published_at->format('Y-m-d H:i:s'));
    }

    /**
     * Statuses a product can move to after being scheduled.
     *
     * @return array<string, string[]>
     * @since 1.0.0
     */
    public function unscheduled_statuses(): array
    {
        return [
            'draft' => [ProductStatus::DRAFT],
            'trashed' => [ProductStatus::TRASHED],
            'published' => [ProductStatus::PUBLISHED],
        ];
    }

    /**
     * A job for a deleted product finishes without error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_job_ignores_a_missing_product(): void
    {
        (new PublishScheduledProductJob(PHP_INT_MAX))->handle();

        $this->assertNull(Product::query()->where('id', PHP_INT_MAX)->first());
    }

    /**
     * A scheduled create that rolls back leaves no queued publish behind.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_rolled_back_create_leaves_no_queued_publish(): void
    {
        static::forget_singleton(QueueManager::class);
        $this->reset_facade_cache();

        $jobs_before = $this->count_queued_jobs();

        $failing_variant_service = new class extends VariantService {
            /**
             * @inheritDoc
             */
            public function create(CreateVariantDTO $data)
            {
                return null;
            }
        };

        $payload = $this->product_payload([
            'status' => ProductStatus::SCHEDULED,
            'scheduled_at' => $this->future_atom(DAY_IN_SECONDS),
        ]);

        try {
            (new CreateProductAction(new ProductService(), $failing_variant_service))
                ->execute(CreateProductDTO::from_array($payload), [CreateVariantDTO::from_array($payload['variants'][0])]);
            $this->fail('The create was expected to fail on its variant.');
        } catch (Exception $exception) {
            $this->assertSame($jobs_before, $this->count_queued_jobs());
        }

        (new CreateProductAction(new ProductService(), new VariantService()))
            ->execute(CreateProductDTO::from_array($payload), [CreateVariantDTO::from_array($payload['variants'][0])]);

        $this->assertSame($jobs_before + 1, $this->count_queued_jobs(), 'A committed scheduled create should queue a real job row.');
    }

    /**
     * Update a product through the API, echoing its variants back.
     *
     * @param array $product   Product response data.
     * @param array $overrides Product attribute overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function update_product(array $product, array $overrides): array
    {
        $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload(array_merge([
            'id' => $product['id'],
            'variants' => $this->variants_for_update($product),
        ], $overrides)));

        return $this->assert_api_success($response)['data'];
    }

    /**
     * Insert a product row directly, bypassing request validation.
     *
     * @param string      $status       Product status.
     * @param string      $scheduled_at UTC scheduled_at in Y-m-d H:i:s.
     * @param string|null $published_at UTC published_at in Y-m-d H:i:s.
     *
     * @return int The product ID.
     * @since 1.0.0
     */
    protected function seed_product(string $status, string $scheduled_at, ?string $published_at = null): int
    {
        $product_id = (int) $this->create_product(['status' => ProductStatus::DRAFT])['id'];

        Product::query()->where('id', $product_id)->update([
            'status' => $status,
            'scheduled_at' => $scheduled_at,
            'published_at' => $published_at,
        ]);

        return $product_id;
    }

    /**
     * Get the publish jobs pushed for a product.
     *
     * @param int $product_id Product ID.
     *
     * @return PublishScheduledProductJob[]
     * @since 1.0.0
     */
    protected function pushed_for(int $product_id): array
    {
        return $this->queue->pushed(PublishScheduledProductJob::class, function (PublishScheduledProductJob $job) use ($product_id) {
            return $job->product_id === $product_id;
        });
    }

    /**
     * Count the rows on the scheduled-products queue in the real jobs table.
     *
     * @return int
     * @since 1.0.0
     */
    protected function count_queued_jobs(): int
    {
        $rows = DB::select('SELECT COUNT(*) AS aggregate FROM ' . app(DatabaseQueue::class)->get_table() . ' WHERE queue = %s', [PublishScheduledProductJob::QUEUE]);

        return (int) ($rows[0]['aggregate'] ?? 0);
    }

    /**
     * Format a time the given number of seconds from now as an ATOM string.
     *
     * @param int $seconds Seconds from now.
     *
     * @return string
     * @since 1.0.0
     */
    protected function future_atom(int $seconds): string
    {
        return gmdate(DATE_ATOM, time() + $seconds);
    }
}
