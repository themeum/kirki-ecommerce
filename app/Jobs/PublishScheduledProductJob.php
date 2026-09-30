<?php

namespace Kirki\Ecommerce\App\Jobs;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

/**
 * Publishes a scheduled product once its scheduled_at has arrived.
 *
 * The queue cannot cancel a job, so a job left behind by a reschedule, an
 * unschedule, a trash or a delete is neutralised by re-checking the product
 * when it runs: anything no longer due is a silent no-op.
 *
 * @since 1.0.0
 */
class PublishScheduledProductJob implements ShouldQueue
{
    use Queueable;

    const QUEUE = 'scheduled-products';

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    protected $tries = 3;

    /**
     * The seconds to wait before retrying a failed attempt.
     *
     * @var int
     */
    protected $backoff = 60;

    /**
     * The product ID to publish.
     *
     * @var int
     */
    public $product_id;

    /**
     * Create a new job instance.
     *
     * Pass IDs and scalars rather than models or posts: the job is serialized
     * when it is dispatched and restored, possibly minutes later, when it runs.
     * The job always goes to the scheduled-products queue, whichever call
     * site dispatches it.
     *
     * @since 1.0.0
     *
     * @param int $product_id The product ID to publish.
     */
    public function __construct(int $product_id)
    {
        $this->product_id = $product_id;
        $this->on_queue(static::QUEUE);
    }

    /**
     * Publish the product if it is still scheduled and its scheduled_at has arrived.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function handle()
    {
        $product = Product::query()->where('id', $this->product_id)->first();
        $now = Date::now()->set_timezone('UTC');

        if (empty($product) || $product->status !== ProductStatus::SCHEDULED || empty($product->scheduled_at) || $product->scheduled_at->gt($now)) {
            return;
        }

        $product->status = ProductStatus::PUBLISHED;
        $product->published_at = $now;
        $product->scheduled_at = null;
        $product->save();
    }
}
