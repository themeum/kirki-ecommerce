<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Attribute\AttributeCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Attribute\AttributeUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Resources\AttributeResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Attribute\AttributeListFilterDTO;
use Kirki\Ecommerce\App\DTO\Attribute\CreateAttributeDTO;
use Kirki\Ecommerce\App\DTO\Attribute\UpdateAttributeDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Services\AttributeService;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing attributes.
 *
 * @since 1.0.0
 */
class AttributeController
{
    /** @var AttributeService */
    protected $service;

    /**
     * Create the controller with its attribute service.
     *
     * @since 1.0.0
     *
     * @param AttributeService $service
     */
    public function __construct(AttributeService $service)
    {
        $this->service = $service;
    }

    /**
     * List attributes, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated attributes with a success message.
     */
    public function get(Request $request)
    {
        $params = AttributeListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'slug', 'type', 'created_by', 'updated_by', 'created_at', 'updated_at']);
        $params->sort_order = 'asc';

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => AttributeResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Attributes retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => AttributeResource::paginated($data),
            'message' => __('Attributes retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create an attribute from the validated request.
     *
     * @since 1.0.0
     *
     * @param AttributeCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created attribute with a 201 status.
     */
    public function create(AttributeCreateRequest $request)
    {
        $attribute = $this->service->create(CreateAttributeDTO::from_request($request));

        return response()->json([
            'data' => AttributeResource::make($attribute),
            'message' => __('Attribute created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single attribute by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The attribute resource.
     */
    public function show(Request $request)
    {
        $attribute = $this->service->find($request->int('id'));

        return response()->json([
            'data' => AttributeResource::make($attribute),
            'message' => __('Attribute retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update an attribute from the validated request.
     *
     * @since 1.0.0
     *
     * @param AttributeUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated attribute.
     */
    public function update(AttributeUpdateRequest $request)
    {
        $attribute = $this->service->update(UpdateAttributeDTO::from_request($request));

        return response()->json([
            'data' => AttributeResource::make($attribute),
            'message' => __('Attribute updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single attribute by the route ID.
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
            'message' => __('Attribute deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on attributes.
     *
     * Supports deleting the given IDs or deleting every attribute matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Attribute deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = AttributeListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All attributes deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
