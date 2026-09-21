<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\TaxProfile\TaxProfileCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\TaxProfile\TaxProfileUpdateRequest;
use Kirki\Ecommerce\App\Resources\TaxProfileResource;
use Kirki\Ecommerce\App\Services\TaxProfileService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\CreateTaxProfileDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\UpdateTaxProfileDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing tax profiles.
 *
 * @since 1.0.0
 */
class TaxProfileController
{
    /** @var TaxProfileService */
    protected $service;

    /**
     * Create the controller with its tax profile service.
     *
     * @since 1.0.0
     *
     * @param TaxProfileService $service
     */
    public function __construct(TaxProfileService $service)
    {
        $this->service = $service;
    }

    /**
     * List tax profiles, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated tax profiles with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => TaxProfileResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Tax profiles retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => TaxProfileResource::paginated($data),
            'message' => __('Tax profiles retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a tax profile from the validated request.
     *
     * @since 1.0.0
     *
     * @param TaxProfileCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created tax profile with a 201 status.
     */
    public function create(TaxProfileCreateRequest $request)
    {
        $payload = CreateTaxProfileDTO::from_request($request);

        $tax_profile = $this->service->create($payload);

        return response()->json([
            'data' => TaxProfileResource::make($tax_profile),
            'message' => __('Tax profile created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single tax profile by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The tax profile resource.
     */
    public function show(Request $request)
    {
        $tax_profile = $this->service->find($request->int('id'));

        return response()->json([
            'data' => TaxProfileResource::make($tax_profile),
            'message' => __('Tax profile retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a tax profile from the validated request.
     *
     * @since 1.0.0
     *
     * @param TaxProfileUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated tax profile.
     */
    public function update(TaxProfileUpdateRequest $request)
    {
        $payload = UpdateTaxProfileDTO::from_request($request);

        $tax_profile = $this->service->update($payload);

        return response()->json([
            'data' => TaxProfileResource::make($tax_profile),
            'message' => __('Tax profile updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single tax profile by the route ID.
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
            'message' => __('Tax profile deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on tax profiles.
     *
     * Supports deleting the given IDs or deleting every tax profile matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Tax profiles deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All tax profiles deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
