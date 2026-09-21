<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\DTO\Variant\VariantListFilterDTO;
use Kirki\Ecommerce\App\Http\Requests\Variant\BulkUpdateVariantRequest;
use Kirki\Ecommerce\App\Http\Requests\Variant\GenerateSkuRequest;
use Kirki\Ecommerce\App\Http\Requests\Variant\GenerateSkusRequest;
use Kirki\Ecommerce\App\Http\Requests\Variant\UpdateVariantRequest;
use Kirki\Ecommerce\App\Http\Requests\Variant\VariantListRequest;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Variant\InventoryResource;
use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\Supports\SkuGenerator;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * REST controller for product variants, inventory and SKU generation.
 *
 * @since 1.0.0
 */
class VariantController
{
    /** @var VariantService */
    protected $service;

    /**
     * Create the controller with the variant service.
     *
     * @since 1.0.0
     *
     * @param VariantService $service
     */
    public function __construct(VariantService $service)
    {
        $this->service = $service;
    }

    /**
     * List variants as inventory rows, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param VariantListRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated inventory with a success message.
     */
    public function get(VariantListRequest $request)
    {
        $filters = VariantListFilterDTO::from_array($request->all());

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

    /**
     * Return the variants whose IDs are given as a comma-separated `ids` parameter.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Variant collection with a success message.
     */
    public function get_by_ids(Request $request)
    {
        $ids = explode(',', $request->string('ids')) ?? [];
        $variants = $this->service->get_by_ids($ids);

        return response()->json([
            'data' => VariantResource::collection($variants),
            'message' => __('Inventory retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Return a single variant by the route ID, along with its product's storefront preview URL.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The variant resource.
     */
    public function show(Request $request)
    {
        $variant = $this->service->find($request->int('id'));

        return response()->json([
            'data' => VariantResource::make($variant, $this->preview_url_for($variant)),
            'message' => __('Variant retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Get the storefront preview URL of the product a variant belongs to.
     *
     * @since 1.0.0
     *
     * @param Variant $variant
     * @return string|null Null when the variant has no product slug.
     */
    protected function preview_url_for($variant)
    {
        $slug = $variant->product->slug ?? null;

        if (empty($slug)) {
            return null;
        }

        return app()->make(ProductService::class)->get_preview_url($slug);
    }

    /**
     * Partially update a variant from the validated request.
     *
     * @since 1.0.0
     *
     * @param UpdateVariantRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated variant.
     */
    public function update(UpdateVariantRequest $request)
    {
        $data = $request->sanitized();

        unset($data['id']);

        $variant = $this->service->partial_update($request->int('id'), $data);

        return response()->json([
            'data' => VariantResource::make($variant),
            'message' => __('Variant updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update several variants at once from the request `variants` list.
     *
     * @since 1.0.0
     *
     * @param BulkUpdateVariantRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated variants.
     */
    public function bulk_update(BulkUpdateVariantRequest $request)
    {
        $data = $request->all();

        $updated_variants = $this->service->bulk_update($data['variants'] ?? []);

        return response()->json([
            'data' => VariantResource::collection($updated_variants),
            'message' => __('Inventory updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Generate a SKU for a single variant, saved or still a draft.
     *
     * When `variant_id` is given the sources come from that saved variant; otherwise they are resolved from the draft product identifiers in the request.
     *
     * @since 1.0.0
     *
     * @param GenerateSkuRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The generated SKU.
     * @throws NotFoundException When a given `variant_id` matches no variant.
     */
    public function generate_sku(GenerateSkuRequest $request)
    {
        $variant_id = $request->int('variant_id');

        $sources = $variant_id
            ? $this->sources_from_variant($variant_id)
            : $this->sources_from_draft($request);

        return response()->json([
            'data' => ['sku' => SkuGenerator::generate($sources)],
            'message' => __('SKU generated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Compose one SKU per requested variant, numbered consecutively.
     *
     * A batch rather than repeated single calls because the sequence is read
     * from the stored SKUs and nothing is persisted here - N separate requests
     * would each read the same maximum and return the same number.
     *
     * Ids with no matching variant are skipped rather than failing the batch,
     * so a stale row in the grid cannot cost the merchant every other SKU.
     *
     * @since 1.0.0
     *
     * @param GenerateSkusRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The generated SKUs, each paired with its variant ID.
     */
    public function generate_skus(GenerateSkusRequest $request)
    {
        $variant_ids = $request->array('variant_ids') ?? [];

        $variants = Variant::with(['product.brand', 'product.categories', 'attribute_values'])
            ->where_in('id', $variant_ids)
            ->get()
            ->key_by('id')
            ->all();

        $sources_by_variant_id = [];

        foreach ($variant_ids as $variant_id) {
            $variant_id = (int) $variant_id;

            if (empty($variants[$variant_id])) {
                continue;
            }

            $sources_by_variant_id[$variant_id] = $this->sources_from_variant_record($variants[$variant_id]);
        }

        $generated = [];

        foreach (SkuGenerator::generate_many($sources_by_variant_id) as $variant_id => $sku) {
            $generated[] = [
                'variant_id' => (int) $variant_id,
                'sku' => $sku,
            ];
        }

        return response()->json([
            'data' => $generated,
            'message' => __('SKUs generated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Read the SKU sources off a saved variant and the product owning it.
     *
     * @since 1.0.0
     *
     * @param int $variant_id
     * @return array<string, mixed> Title, attribute values, brand and category used to compose the SKU.
     * @throws NotFoundException When no variant has the given ID.
     */
    protected function sources_from_variant(int $variant_id)
    {
        $variant = Variant::with(['product.brand', 'product.categories', 'attribute_values'])
            ->where('id', $variant_id)
            ->first();

        throw_if(empty($variant), __('Variant not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $this->sources_from_variant_record($variant);
    }

    /**
     * Extract the SKU sources from an already loaded variant.
     *
     * @since 1.0.0
     *
     * @param Variant $variant Variant with its product, brand, categories and attribute values loaded.
     * @return array<string, mixed> Title, attribute values, brand and category used to compose the SKU.
     */
    protected function sources_from_variant_record($variant)
    {
        return [
            'title' => $variant->product->title ?? null,
            'attribute_values' => !empty($variant->attribute_values)
                ? $variant->attribute_values
                    ->map(fn($attribute_value) => $attribute_value->value ?? $attribute_value->color)
                    ->filter()
                    ->values()
                    ->all()
                : [],
            'brand' => $variant->product->brand->name ?? null,
            'category' => $variant->product->categories->first()->name ?? null,
        ];
    }

    /**
     * Resolve the SKU sources for a product that has not been saved yet.
     *
     * Only identifiers are trusted from the client; the text itself is read back
     * from the records they point at.
     *
     * @since 1.0.0
     *
     * @param GenerateSkuRequest $request
     * @return array<string, mixed> Title, attribute values, brand and category used to compose the SKU.
     */
    protected function sources_from_draft(GenerateSkuRequest $request)
    {
        $brand_id = $request->int('brand_id');
        $category_ids = $request->array('category_ids') ?? [];

        return [
            'title' => $request->text('title'),
            'attribute_values' => $this->attribute_value_labels($request->array('attribute_value_ids') ?? []),
            'brand' => $brand_id ? (Brand::query()->where('id', $brand_id)->first()->name ?? null) : null,
            'category' => !empty($category_ids)
                ? (Category::query()->where('id', (int) $category_ids[0])->first()->name ?? null)
                : null,
        ];
    }

    /**
     * Resolve attribute value labels, preserving the order the ids arrived in.
     *
     * @since 1.0.0
     *
     * @param array<int, int|string> $attribute_value_ids
     * @return string[] Value (or color) label of each attribute value that exists.
     */
    protected function attribute_value_labels(array $attribute_value_ids)
    {
        if (empty($attribute_value_ids)) {
            return [];
        }

        $attribute_values = AttributeValue::query()
            ->where_in('id', $attribute_value_ids)
            ->get()
            ->key_by('id')
            ->all();

        return collection($attribute_value_ids)
            ->map(function ($id) use ($attribute_values) {
                $attribute_value = $attribute_values[$id] ?? null;

                return $attribute_value ? ($attribute_value->value ?? $attribute_value->color) : null;
            })
            ->filter()
            ->values()
            ->all();
    }
}
