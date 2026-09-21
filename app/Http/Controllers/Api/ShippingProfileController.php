<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingProfile\ShippingProfileCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingProfile\ShippingProfileUpdateRequest;
use Kirki\Ecommerce\App\Resources\ShippingProfileResource;
use Kirki\Ecommerce\App\Services\ShippingProfileService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\CreateShippingProfileDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\UpdateShippingProfileDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing shipping profiles.
 *
 * @since 1.0.0
 */
class ShippingProfileController
{
    /** @var ShippingProfileService */
    protected $service;

    /**
     * Create the controller with its shipping profile service.
     *
     * @since 1.0.0
     *
     * @param ShippingProfileService $service
     */
    public function __construct(ShippingProfileService $service)
    {
        $this->service = $service;
    }

    /**
     * List shipping profiles, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated shipping profiles with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => ShippingProfileResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Shipping profiles retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => ShippingProfileResource::paginated($data),
            'message' => __('Shipping profiles retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a shipping profile from the validated request.
     *
     * @since 1.0.0
     *
     * @param ShippingProfileCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created shipping profile with a 201 status.
     */
    public function create(ShippingProfileCreateRequest $request)
    {
        $payload = CreateShippingProfileDTO::from_request($request);

        $shipping_profile = $this->service->create($payload);

        return response()->json([
            'data' => ShippingProfileResource::make($shipping_profile),
            'message' => __('Shipping profile created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single shipping profile by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The shipping profile resource.
     */
    public function show(Request $request)
    {
        $shipping_profile = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ShippingProfileResource::make($shipping_profile),
            'message' => __('Shipping profile retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a shipping profile from the validated request.
     *
     * @since 1.0.0
     *
     * @param ShippingProfileUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated shipping profile.
     */
    public function update(ShippingProfileUpdateRequest $request)
    {
        $payload = UpdateShippingProfileDTO::from_request($request);

        $shipping_profile = $this->service->update($payload);

        return response()->json([
            'data' => ShippingProfileResource::make($shipping_profile),
            'message' => __('Shipping profile updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single shipping profile by the route ID.
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
            'message' => __('Shipping profile deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on shipping profiles.
     *
     * Supports deleting the given IDs or deleting every shipping profile matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Shipping profiles deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All shipping profiles deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
