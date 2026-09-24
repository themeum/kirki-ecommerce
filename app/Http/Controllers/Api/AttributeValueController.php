<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\AttributeValue\AttributeValueBatchRequest;
use Kirki\Ecommerce\App\Http\Requests\AttributeValue\AttributeValueCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\AttributeValue\AttributeValueUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Resources\AttributeResource;
use Kirki\Ecommerce\App\Resources\AttributeValueResource;
use Kirki\Ecommerce\App\Services\AttributeValueService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\AttributeValue\BatchAttributeValuesDTO;
use Kirki\Ecommerce\App\DTO\AttributeValue\CreateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\AttributeValue\UpdateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing attribute values.
 *
 * @since 1.0.0
 */
class AttributeValueController
{
    /** @var AttributeValueService */
    protected $service;

    /**
     * Create the controller with its attribute value service.
     *
     * @since 1.0.0
     *
     * @param AttributeValueService $service
     */
    public function __construct(AttributeValueService $service)
    {
        $this->service = $service;
    }

    /**
     * List the values of an attribute, filtered and sorted by the request.
     *
     * The attribute is taken from the `attribute_id` request parameter. All values are returned unpaginated.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Attribute value collection with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'attribute_id', 'value', 'color', 'created_at', 'updated_at']);

        $data = $this->service->all($request->int('attribute_id'), $params);

        return response()->json([
            'data' => AttributeValueResource::collection($data),
            'message' => __('Attribute values retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create an attribute value from the validated request.
     *
     * @since 1.0.0
     *
     * @param AttributeValueCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created attribute value with a 201 status.
     */
    public function create(AttributeValueCreateRequest $request)
    {
        $payload = CreateAttributeValueDTO::from_request($request);

        $attribute_value = $this->service->create($payload);

        return response()->json([
            'data' => AttributeValueResource::make($attribute_value),
            'message' => __('Attribute value created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Create and recolor several values of an attribute in one transaction.
     *
     * @since 1.0.0
     *
     * @param AttributeValueBatchRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The attribute with all of its values.
     */
    public function batch(AttributeValueBatchRequest $request)
    {
        $attribute = $this->service->batch(BatchAttributeValuesDTO::from_request($request));

        return response()->json([
            'data' => AttributeResource::make($attribute),
            'message' => __('Attribute values saved', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Return a single attribute value by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The attribute value resource.
     */
    public function show(Request $request)
    {
        $attribute_value = $this->service->find($request->int('id'));

        return response()->json([
            'data' => AttributeValueResource::make($attribute_value),
            'message' => __('Attribute value retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update an attribute value from the validated request.
     *
     * @since 1.0.0
     *
     * @param AttributeValueUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated attribute value.
     */
    public function update(AttributeValueUpdateRequest $request)
    {
        $payload = UpdateAttributeValueDTO::from_request($request);

        $attribute_value = $this->service->update($payload);

        return response()->json([
            'data' => AttributeValueResource::make($attribute_value),
            'message' => __('Attribute value updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single attribute value by the route ID.
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
            'message' => __('Attribute value deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on attribute values.
     *
     * Supports deleting the given IDs or deleting every attribute value matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Attribute values deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All attribute values deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
