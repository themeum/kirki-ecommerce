<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Actions\Product\DuplicateProductAction;
use Kirki\Ecommerce\App\Actions\Product\UpdateProductAction;
use Kirki\Ecommerce\App\DTO\Product\ProductListFilterDTO;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductListRequest;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductUpdateRequest;
use Kirki\Ecommerce\App\Resources\Product\ProductListWithVariantsResource;
use Kirki\Ecommerce\App\Resources\Product\ProductListResource;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\DTO\Product\UpdateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\UpdateVariantDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing products.
 *
 * @since 1.0.0
 */
class ProductController
{
    /** @var ProductService */
    protected $service;

    /**
     * Create the controller with the product service.
     *
     * @since 1.0.0
     *
     * @param ProductService $service
     */
    public function __construct(ProductService $service)
    {
        $this->service = $service;
    }

    /**
     * List products, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param ProductListRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated products with a success message.
     */
    public function get(ProductListRequest $request)
    {
        $params = ProductListFilterDTO::from_array($request->all());

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

    /**
     * List products together with their variants, paginated by the request filters.
     *
     * @since 1.0.0
     *
     * @param ProductListRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated products with their variants.
     */
    public function get_products_with_variants(ProductListRequest $request)
    {
        $params = ProductListFilterDTO::from_array($request->all());

        $data = $this->service->paginate_with_variants($params);

        return response()->json([
            'data' => ProductListWithVariantsResource::paginated($data),
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a product and its variants from the validated request.
     *
     * @since 1.0.0
     *
     * @param ProductCreateRequest $request
     * @param CreateProductAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created product with a 201 status.
     */
    public function create(ProductCreateRequest $request, CreateProductAction $action)
    {
        $data = $request->all();

        $variants = array_map(function ($variant) {
            return CreateVariantDTO::from_array($variant);
        }, $data['variants']);

        $product = $action->execute(CreateProductDTO::from_array($data), $variants);

        return response()->json([
            'data' => ProductResource::make($product),
            'message' => __('Product created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single product by the route ID, along with its storefront preview URL.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The product resource.
     */
    public function show(Request $request)
    {
        $product = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ProductResource::make($product, $this->service->get_preview_url($product->slug)),
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a product and its variants from the validated request.
     *
     * @since 1.0.0
     *
     * @param ProductUpdateRequest $request
     * @param UpdateProductAction  $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated product.
     */
    public function update(ProductUpdateRequest $request, UpdateProductAction $action)
    {
        $data = $request->all();

        $variants = array_map(function ($variant) {
            return UpdateVariantDTO::from_array($variant);
        }, $data['variants']);

        $product = $action->execute(UpdateProductDTO::from_array($data), $variants);

        return response()->json([
            'data' => ProductResource::make($product),
            'message' => __('Product updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Permanently delete a single product by the route ID.
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
            'message' => __('Product deleted permanently', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on products.
     *
     * Supports deleting, trashing and restoring either the given IDs or every product matching the list filters. Any other action gets a 400 response.
     *
     * @since 1.0.0
     *
     * @param BulkActionRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The result message, or a 400 response for an unsupported action.
     */
    public function bulk_actions(BulkActionRequest $request)
    {
        $data = $request->all();

        $action = $data['action'];
        $ids = $data['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Product deleted permanently', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ProductListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All products deleted permanently', 'kirki-ecommerce'),
                ]);
            case BulkActions::TRASH:
                $result = $this->service->bulk_trash($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Products moved to trash', 'kirki-ecommerce'),
                ]);
            case BulkActions::TRASH_ALL:
                $params = ProductListFilterDTO::from_array($request->all());
                $result = $this->service->trash_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All products moved to trash', 'kirki-ecommerce'),
                ]);
            case BulkActions::RESTORE:
                $result = $this->service->bulk_restore($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Products restored', 'kirki-ecommerce'),
                ]);
            case BulkActions::RESTORE_ALL:
                $params = ProductListFilterDTO::from_array($request->all());
                $result = $this->service->restore_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All products restored', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }

    /**
     * Duplicate the product identified by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request                $request
     * @param DuplicateProductAction $duplicate_action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The new product with a 201 status.
     */
    public function duplicate(Request $request, DuplicateProductAction $duplicate_action)
    {
        $product = $duplicate_action->execute($request->int('id'));

        return response()->json([
            'data' => ProductResource::make($product),
            'message' => __('Product duplicated', 'kirki-ecommerce'),
        ], Response::CREATED);
    }
}
