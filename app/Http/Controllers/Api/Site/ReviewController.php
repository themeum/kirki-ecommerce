<?php

/**
 * Manage Storefront Product Reviews API
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Api\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.1
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Api\Site;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Actions\Review\CreateReviewAction;
use Kirki\Ecommerce\App\Actions\Review\VoteHelpfulAction;
use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\App\DTO\Review\CreateReviewDTO;
use Kirki\Ecommerce\App\Models\Review;
use Kirki\Ecommerce\App\Http\Requests\Review\ReviewCreateRequest;
use Kirki\Ecommerce\App\Resources\Site\Shop\ShopReviewResource;
use Kirki\Ecommerce\App\Services\ReviewService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for storefront product reviews and helpful votes.
 *
 * @since 1.0.1
 */
class ReviewController
{
    /** @var ReviewService */
    protected $service;

    /**
     * Create the controller with the review service.
     *
     * @since 1.0.1
     *
     * @param ReviewService $service
     */
    public function __construct(ReviewService $service)
    {
        $this->service = $service;
    }

    /**
     * List approved public reviews for a product.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function product_reviews(Request $request)
    {
        $product_id = $request->int('id');

        $reviews = $this->service->get_approved_product_reviews($product_id);
        $summary = $this->service->get_product_rating_summary($product_id);

        return response()->json([
            'data' => [
                'reviews' => $reviews ? ShopReviewResource::collection($reviews) : [],
                'summary' => $summary,
            ],
            'message' => __('Product reviews retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Submit a new customer review for a product.
     *
     * @since 1.0.1
     *
     * @param ReviewCreateRequest $request
     * @param CreateReviewAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function store(ReviewCreateRequest $request, CreateReviewAction $action)
    {
        $payload = CreateReviewDTO::from_array($request->validated());

        if (is_user_logged_in()) {
            $payload->user_id = (int) get_current_user_id();
        }

        $review = $action->execute($payload);

        return response()->json([
            'data' => ShopReviewResource::make($review),
            'message' => __('Your review has been submitted for moderation.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Increment the helpful counter for a review.
     *
     * @since 1.0.1
     *
     * @param Request           $request
     * @param VoteHelpfulAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function vote_helpful(Request $request, VoteHelpfulAction $action)
    {
        $review = $action->execute($request->int('id'));

        return response()->json([
            'data' => [
                'id' => (int) $review->id,
                'helpful_count' => (int) ($review->helpful_count ?? 0),
            ],
            'message' => __('Thank you for your feedback.', 'kirki-ecommerce'),
        ]);
    }
}
