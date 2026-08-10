<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\ProductSchema\ProductSchemaCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\ProductSchema\ProductSchemaUpdateRequest;
use Kirki\Ecommerce\App\Resources\ProductSchemaResource;
use Kirki\Ecommerce\App\Services\ProductSchemaService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ProductSchema\CreateProductSchemaDTO;
use Kirki\Ecommerce\App\DTO\ProductSchema\UpdateProductSchemaDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

class ProductSchemaController
{
    protected $service;

    public function __construct(ProductSchemaService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'is_default', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => ProductSchemaResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Product schemas retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => ProductSchemaResource::paginated($data),
            'message' => __('Product schemas retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(ProductSchemaCreateRequest $request)
    {
        $payload = CreateProductSchemaDTO::from_request($request);

        $product_schema = $this->service->create($payload);

        return response()->json([
            'data' => ProductSchemaResource::make($product_schema),
            'message' => __('Product schema created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $product_schema = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ProductSchemaResource::make($product_schema),
            'message' => __('Product schema retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(ProductSchemaUpdateRequest $request)
    {
        $payload = UpdateProductSchemaDTO::from_request($request);

        $product_schema = $this->service->update($payload);

        return response()->json([
            'data' => ProductSchemaResource::make($product_schema),
            'message' => __('Product schema updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Product schema deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function bulk_actions(BulkActionRequest $request)
    {
        $validated = $request->all();

        $action = $validated['action'];
        $ids = $validated['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Product schemas deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All product schemas deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
