<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingBox\ShippingBoxCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingBox\ShippingBoxUpdateRequest;
use Kirki\Ecommerce\App\Resources\ShippingBoxResource;
use Kirki\Ecommerce\App\Services\ShippingBoxService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\CreateShippingBoxDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\UpdateShippingBoxDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing shipping boxes.
 *
 * @since 1.0.0
 */
class ShippingBoxController
{
    /** @var ShippingBoxService */
    protected $service;

    /**
     * Create the controller with its shipping box service.
     *
     * @since 1.0.0
     *
     * @param ShippingBoxService $service
     */
    public function __construct(ShippingBoxService $service)
    {
        $this->service = $service;
    }

    /**
     * List shipping boxes, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated shipping boxes with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'width', 'height', 'length', 'is_default', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => ShippingBoxResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Shipping boxes retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => ShippingBoxResource::paginated($data),
            'message' => __('Shipping boxes retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a shipping box from the validated request.
     *
     * @since 1.0.0
     *
     * @param ShippingBoxCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created shipping box with a 201 status.
     */
    public function create(ShippingBoxCreateRequest $request)
    {
        $payload = CreateShippingBoxDTO::from_request($request);

        $shipping_box = $this->service->create($payload);

        return response()->json([
            'data' => ShippingBoxResource::make($shipping_box),
            'message' => __('Shipping box created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single shipping box by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The shipping box resource.
     */
    public function show(Request $request)
    {
        $shipping_box = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ShippingBoxResource::make($shipping_box),
            'message' => __('Shipping box retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a shipping box from the validated request.
     *
     * @since 1.0.0
     *
     * @param ShippingBoxUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated shipping box.
     */
    public function update(ShippingBoxUpdateRequest $request)
    {
        $payload = UpdateShippingBoxDTO::from_request($request);

        $shipping_box = $this->service->update($payload);

        return response()->json([
            'data' => ShippingBoxResource::make($shipping_box),
            'message' => __('Shipping box updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single shipping box by the route ID.
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
            'message' => __('Shipping box deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on shipping boxes.
     *
     * Supports deleting the given IDs or deleting every shipping box matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Shipping boxes deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All shipping boxes deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
