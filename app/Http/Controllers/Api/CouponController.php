<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Coupon\CreateCouponAction;
use Kirki\Ecommerce\App\Actions\Coupon\UpdateCouponAction;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Coupon\CouponCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Coupon\CouponUpdateRequest;
use Kirki\Ecommerce\App\Resources\Coupon\CouponListResource;
use Kirki\Ecommerce\App\Resources\Coupon\CouponResource;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\App\DTO\Coupon\UpdateCouponDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Database\Query\Paginator;

use function Kirki\Ecommerce\response;

class CouponController
{
    protected $service;

    public function __construct(CouponService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'title', 'code', 'start_date', 'end_date', 'usage_limit', 'is_active', 'created_by', 'updated_by', 'created_at', 'updated_at']);

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

    public function create(CouponCreateRequest $request, CreateCouponAction $action)
    {
        $coupon = $action->execute(CreateCouponDTO::from_request($request));

        return response()->json([
            'data' => CouponResource::make($coupon),
            'message' => __('Coupon created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $coupon = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => CouponResource::make($coupon),
            'message' => __('Coupon retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(CouponUpdateRequest $request, UpdateCouponAction $action)
    {
        $coupon = $action->execute(UpdateCouponDTO::from_request($request));

        return response()->json([
            'data' => CouponResource::make($coupon),
            'message' => __('Coupon updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Coupon deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

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
                    'message' => __('Coupons deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All coupons deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
