<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\DTO\Variant\VariantListFilterDTO;
use Kirki\Ecommerce\App\Http\Requests\Variant\BulkUpdateVariantRequest;
use Kirki\Ecommerce\App\Http\Requests\Variant\VariantListRequest;
use Kirki\Ecommerce\App\Resources\Variant\InventoryResource;
use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\Database\Query\Paginator;

use function Kirki\Ecommerce\response;

class VariantController
{
    protected $service;

    public function __construct(VariantService $service)
    {
        $this->service = $service;
    }

    public function get(VariantListRequest $request)
    {
        $filters = VariantListFilterDTO::from_array($request->all());
        $filters->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'product_id', 'name', 'sku', 'price', 'sale_price', 'available_quantity', 'created_at', 'updated_at']);

        if ((int) $filters->limit === Pagination::ALL) {
            $data = $this->service->all($filters);

            return response()->json([
                'data' => InventoryResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Inventory retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($filters);

        return response()->json([
            'data' => InventoryResource::paginated($data),
            'message' => __('Inventory retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function get_by_ids(Request $request)
    {
        $ids = explode(',', $request->get_string('ids')) ?? [];
        $variants = $this->service->get_by_ids($ids);

        return response()->json([
            'data' => VariantResource::collection($variants),
            'message' => __('Inventory retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function bulk_update(BulkUpdateVariantRequest $request)
    {
        $data = $request->clean();

        $updated_variants = $this->service->bulk_update($data['variants'] ?? []);

        return response()->json([
            'data' => VariantResource::collection($updated_variants),
            'message' => __('Inventory updated successfully.', 'kirki-ecommerce'),
        ]);
    }
}
