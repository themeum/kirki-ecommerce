<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Coupon\CreateCouponAction;
use Kirki\Ecommerce\App\Actions\Coupon\DuplicateCouponAction;
use Kirki\Ecommerce\App\Actions\Coupon\UpdateCouponAction;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Coupon\CouponCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Coupon\CouponUpdateRequest;
use Kirki\Ecommerce\App\Resources\Coupon\CouponListResource;
use Kirki\Ecommerce\App\Resources\Coupon\CouponResource;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\Coupon\CouponFilterDTO;
use Kirki\Ecommerce\App\Http\Requests\Coupon\CouponListRequest;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\App\DTO\Coupon\UpdateCouponDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing coupons.
 *
 * @since 1.0.0
 */
class CouponController
{
    /** @var CouponService */
    protected $service;

    /**
     * Create the controller with the coupon service.
     *
     * @since 1.0.0
     *
     * @param CouponService $service
     */
    public function __construct(CouponService $service)
    {
        $this->service = $service;
    }

    /**
     * List coupons, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param CouponListRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated coupons with a success message.
     */
    public function get(CouponListRequest $request)
    {
        $params = CouponFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => CouponListResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Coupons retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => CouponListResource::paginated($data),
            'message' => __('Coupons retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a coupon from the validated request.
     *
     * @since 1.0.0
     *
     * @param CouponCreateRequest $request
     * @param CreateCouponAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created coupon with a 201 status.
     */
    public function create(CouponCreateRequest $request, CreateCouponAction $action)
    {
        $coupon = $action->execute(CreateCouponDTO::from_request($request));

        return response()->json([
            'data' => CouponResource::make($coupon),
            'message' => __('Coupon created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single coupon by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The coupon resource.
     */
    public function show(Request $request)
    {
        $coupon = $this->service->find($request->int('id'));

        return response()->json([
            'data' => CouponResource::make($coupon),
            'message' => __('Coupon retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a coupon from the validated request.
     *
     * @since 1.0.0
     *
     * @param CouponUpdateRequest $request
     * @param UpdateCouponAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated coupon.
     */
    public function update(CouponUpdateRequest $request, UpdateCouponAction $action)
    {
        $coupon = $action->execute(UpdateCouponDTO::from_request($request));

        return response()->json([
            'data' => CouponResource::make($coupon),
            'message' => __('Coupon updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single coupon by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response carrying the deletion result.
     */
    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Coupon deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on coupons.
     *
     * Supports deleting the given IDs or deleting every coupon matching the list filters. Any other action gets a 400 response.
     *
     * @since 1.0.0
     *
     * @param BulkActionRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The result message, or a 400 response for an unsupported action.
     */
    public function bulk_actions(BulkActionRequest $request)
    {
        $validated = $request->validated();

        $action = $validated['action'];
        $ids = $validated['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Coupons deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = CouponFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All coupons deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }

    /**
     * Generate a new unique coupon code.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The generated code.
     */
    public function generate_new_code(Request $request)
    {
        $code = $this->service->generate_new_code();

        return response()->json([
            'data' => $code,
            'message' => __('Coupon code generated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Check whether a coupon code is still available for use on a new coupon.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse True in `data` when the `code` parameter is not yet used.
     */
    public function validate_code(Request $request)
    {
        $is_valid = $this->service->validate_code($request->string('code'));

        return response()->json([
            'data' => $is_valid,
            'message' => $is_valid ? __('Code is valid.', 'kirki-ecommerce') : __('Code already used.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Duplicate, activate or deactivate a coupon depending on the `action` parameter.
     *
     * @since 1.0.0
     *
     * @param Request               $request
     * @param DuplicateCouponAction $duplicate_action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The affected coupon, or a 400 response for an unsupported action.
     */
    public function action(Request $request, DuplicateCouponAction $duplicate_action)
    {
        switch ($request->string('action')) {
            case 'duplicate':
                $coupon = $duplicate_action->execute($request->int('id'));
                $message = __('Coupon duplicated', 'kirki-ecommerce');
                break;
            case 'activate':
                $coupon = $this->service->change_activation_state($request->int('id'), true);
                $message = __('Coupon activated', 'kirki-ecommerce');
                break;
            case 'deactivate':
                $coupon = $this->service->change_activation_state($request->int('id'), false);
                $message = __('Coupon deactivated', 'kirki-ecommerce');
                break;
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }

        return response()->json([
            'data' => CouponResource::make($coupon),
            'message' => $message,
        ]);
    }
}
