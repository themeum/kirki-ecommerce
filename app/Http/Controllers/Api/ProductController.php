<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Actions\Product\UpdateProductAction;
use Kirki\Ecommerce\App\DTO\Product\ProductListFilterDTO;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductListRequest;
use Kirki\Ecommerce\App\Repositories\ProductRepository;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductUpdateRequest;
use Kirki\Ecommerce\App\Resources\Product\ProductListResource;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\DTO\Product\UpdateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\UpdateVariantDTO;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Database\Query\Paginator;

use function Kirki\Ecommerce\response;

class ProductController
{
    protected $service;
    protected $repository;

    public function __construct(ProductService $service, ProductRepository $repository)
    {
        $this->service = $service;
        $this->repository = $repository;
    }

    public function get(ProductListRequest $request)
    {
        $params = ProductListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'title', 'status', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => ProductListResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Products retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => ProductListResource::paginated($data),
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(ProductCreateRequest $request, CreateProductAction $action)
    {
        $data = $request->clean();

        $variants = array_map(function ($variant) {
            return CreateVariantDTO::from_array($variant);
        }, $data['variants']);

        $product = $action->execute(CreateProductDTO::from_array($data), $variants);

        return response()->json([
            'data' => ProductResource::make($product),
            'message' => __('Product created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $product = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => ProductResource::make($product),
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(ProductUpdateRequest $request, UpdateProductAction $action)
    {
        $data = $request->clean();

        $variants = array_map(function ($variant) {
            return UpdateVariantDTO::from_array($variant);
        }, $data['variants']);

        $product = $action->execute(UpdateProductDTO::from_array($data), $variants);

        return response()->json([
            'data' => ProductResource::make($product),
            'message' => __('Product Updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Product deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function bulk_actions(BulkActionRequest $request)
    {
        $data = $request->clean();

        $action = $data['action'];
        $ids = $data['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Product deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ProductListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All products deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
