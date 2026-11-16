<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Actions\Review\ReplyReviewAction;
use Kirki\Ecommerce\App\Actions\Review\UpdateReviewAction;
use Kirki\Ecommerce\App\Actions\Review\UpdateReviewStatusAction;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\DTO\Review\ReviewFilterDTO;
use Kirki\Ecommerce\App\DTO\Review\UpdateReviewDTO;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Review\ReviewListRequest;
use Kirki\Ecommerce\App\Http\Requests\Review\ReviewReplyRequest;
use Kirki\Ecommerce\App\Http\Requests\Review\ReviewStatusRequest;
use Kirki\Ecommerce\App\Http\Requests\Review\ReviewUpdateRequest;
use Kirki\Ecommerce\App\Resources\Review\ReviewListResource;
use Kirki\Ecommerce\App\Resources\Review\ReviewResource;
use Kirki\Ecommerce\App\Services\ReviewService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing product reviews in the admin panel.
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
     * List reviews, paginated by request filters.
     *
     * @since 1.0.1
     *
     * @param ReviewListRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function get(ReviewListRequest $request)
    {
        $params = ReviewFilterDTO::from_array($request->all());
        $data = $this->service->paginated($params);

        return response()->json([
            'data' => ReviewListResource::paginated($data),
            'message' => __('Reviews retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Return a single review by route ID.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function show(Request $request)
    {
        $review = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ReviewResource::make($review),
            'message' => __('Review retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update an existing review.
     *
     * @since 1.0.1
     *
     * @param ReviewUpdateRequest $request
     * @param UpdateReviewAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function update(ReviewUpdateRequest $request, UpdateReviewAction $action)
    {
        $payload = UpdateReviewDTO::from_array($request->validated());
        $review = $action->execute($request->int('id'), $payload);

        return response()->json([
            'data' => ReviewResource::make($review),
            'message' => __('Review updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update moderation status of a review.
     *
     * @since 1.0.1
     *
     * @param ReviewStatusRequest      $request
     * @param UpdateReviewStatusAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function update_status(ReviewStatusRequest $request, UpdateReviewStatusAction $action)
    {
        $review = $action->execute($request->int('id'), $request->string('status'));

        return response()->json([
            'data' => ReviewResource::make($review),
            'message' => __('Review status updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Add or update store owner reply on a review.
     *
     * @since 1.0.1
     *
     * @param ReviewReplyRequest $request
     * @param ReplyReviewAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function reply(ReviewReplyRequest $request, ReplyReviewAction $action)
    {
        $review = $action->execute($request->int('id'), $request->string('admin_reply'));

        return response()->json([
            'data' => ReviewResource::make($review),
            'message' => __('Reply saved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single review by route ID.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Review deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run bulk actions on reviews.
     *
     * @since 1.0.1
     *
     * @param BulkActionRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function bulk_actions(BulkActionRequest $request)
    {
        $validated = $request->validated();
        $params = ReviewFilterDTO::from_array($request->all());

        $action = $validated['action'];
        $ids = $validated['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Reviews deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All reviews deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
