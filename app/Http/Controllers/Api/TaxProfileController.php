<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\TaxProfile\TaxProfileCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\TaxProfile\TaxProfileUpdateRequest;
use Kirki\Ecommerce\App\Resources\TaxProfileResource;
use Kirki\Ecommerce\App\Services\TaxProfileService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\CreateTaxProfileDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\UpdateTaxProfileDTO;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Database\Query\Paginator;

use function Kirki\Ecommerce\response;

class TaxProfileController
{
    protected $service;

    public function __construct(TaxProfileService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'name', 'created_at', 'updated_at']);

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

    public function create(TaxProfileCreateRequest $request)
    {
        $payload = CreateTaxProfileDTO::from_request($request);

        $tax_profile = $this->service->create($payload);

        return response()->json([
            'data' => TaxProfileResource::make($tax_profile),
            'message' => __('Tax profile created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $tax_profile = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => TaxProfileResource::make($tax_profile),
            'message' => __('Tax profile retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(TaxProfileUpdateRequest $request)
    {
        $payload = UpdateTaxProfileDTO::from_request($request);

        $tax_profile = $this->service->update($payload);

        return response()->json([
            'data' => TaxProfileResource::make($tax_profile),
            'message' => __('Tax profile updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Tax profile deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function bulk_actions(BulkActionRequest $request)
    {
        $validated = $request->clean();

        $action = $validated['action'];
        $ids = $validated['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Tax profiles deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All tax profiles deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
