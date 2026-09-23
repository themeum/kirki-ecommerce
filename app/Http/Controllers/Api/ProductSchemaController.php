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

/**
 * REST controller for managing product schemas.
 *
 * @since 1.0.0
 */
class ProductSchemaController
{
    /** @var ProductSchemaService */
    protected $service;

    /**
     * Create the controller with its product schema service.
     *
     * @since 1.0.0
     *
     * @param ProductSchemaService $service
     */
    public function __construct(ProductSchemaService $service)
    {
        $this->service = $service;
    }

    /**
     * List product schemas, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated product schemas with a success message.
     */
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

    /**
     * Create a product schema from the validated request.
     *
     * @since 1.0.0
     *
     * @param ProductSchemaCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created product schema with a 201 status.
     */
    public function create(ProductSchemaCreateRequest $request)
    {
        $payload = CreateProductSchemaDTO::from_request($request);

        $product_schema = $this->service->create($payload);

        return response()->json([
            'data' => ProductSchemaResource::make($product_schema),
            'message' => __('Schema created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single product schema by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The product schema resource.
     */
    public function show(Request $request)
    {
        $product_schema = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ProductSchemaResource::make($product_schema),
            'message' => __('Product schema retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a product schema from the validated request.
     *
     * @since 1.0.0
     *
     * @param ProductSchemaUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated product schema.
     */
    public function update(ProductSchemaUpdateRequest $request)
    {
        $payload = UpdateProductSchemaDTO::from_request($request);

        $product_schema = $this->service->update($payload);

        return response()->json([
            'data' => ProductSchemaResource::make($product_schema),
            'message' => __('Schema updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single product schema by the route ID.
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
            'message' => __('Schema deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on product schemas.
     *
     * Supports deleting the given IDs or deleting every product schema matching the list filters. Any other action gets a 400 response.
     *
     * @since 1.0.0
     *
     * @param BulkActionRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The result message, or a 400 response for an unsupported action.
     */
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
                    'message' => __('Schemas deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All schemas deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
