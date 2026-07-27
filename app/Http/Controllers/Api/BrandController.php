<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Brand\BrandCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Brand\BrandUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Resources\BrandResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Brand\CreateBrandDTO;
use Kirki\Ecommerce\App\DTO\Brand\UpdateBrandDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Services\BrandService;

use function Kirki\Ecommerce\Framework\response;

class BrandController
{
    protected $service;

    public function __construct(BrandService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'name', 'slug', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => BrandResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Brands retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => BrandResource::paginated($data),
            'message' => __('Brands retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(BrandCreateRequest $request)
    {
        $payload = CreateBrandDTO::from_request($request);

        $brand = $this->service->create($payload);

        return response()->json([
            'data' => BrandResource::make($brand),
            'message' => __('Brand created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $brand = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => BrandResource::make($brand),
            'message' => __('Brand retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(BrandUpdateRequest $request)
    {
        $payload = UpdateBrandDTO::from_request($request);

        $brand = $this->service->update($payload);

        return response()->json([
            'data' => BrandResource::make($brand),
            'message' => __('Brand updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Brand deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Brand deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All brands deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
