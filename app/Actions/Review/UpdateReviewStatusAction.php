<?php

namespace Kirki\Ecommerce\App\Actions\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Review;
use Kirki\Ecommerce\App\Services\ReviewService;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

/**
 * Updates the status of a review.
 *
 * @since 1.0.1
 */
class UpdateReviewStatusAction
{
    /** @var ReviewService */
    protected $review_service;

    /**
     * Create the action instance.
     *
     * @since 1.0.1
     *
     * @param ReviewService $review_service
     */
    public function __construct(ReviewService $review_service)
    {
        $this->review_service = $review_service;
    }

    /**
     * Execute the status change.
     *
     * @since 1.0.1
     *
     * @param int    $id
     * @param string $status
     * @return Review
     * @throws Throwable
     */
    public function execute(int $id, string $status)
    {
        DB::begin_transaction();

        try {
            $review = $this->review_service->update_status($id, $status);
            DB::commit();

            return $review;
        } catch (Throwable $e) {
            DB::roll_back();
            throw $e;
        }
    }
}
