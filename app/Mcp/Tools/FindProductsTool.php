<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Product\ProductListFilterDTO;
use Kirki\Ecommerce\App\Mcp\Concerns\PagesResults;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Finds products with the filters of the admin product list.
 *
 * @since 1.0.0
 */
class FindProductsTool extends StoreReadTool
{
    use PagesResults;

    /** @var string */
    protected $description = 'Find products of the store with the filters of the admin product list. Trashed products are left out unless "status" is "trashed". '
        . 'Use it for questions such as "which shoes are out of stock?" or "show the draft products". '
        . 'Each product has its ID, title, status, stock status, price range in the store currency, variant count, the available quantity of the variants that track inventory, and its categories. '
        . 'Use the stock-levels tool for the stock of each variant.';

    /** @var ProductService */
    protected $product_service;

    /** @var AvailabilityService */
    protected $availability_service;

    /**
     * Create the tool with the product services.
     *
     * @since 1.0.0
     *
     * @param ProductService      $product_service      Service of the admin product list.
     * @param AvailabilityService $availability_service Resolver of stock statuses.
     */
    public function __construct(ProductService $product_service, AvailabilityService $availability_service)
    {
        $this->product_service = $product_service;
        $this->availability_service = $availability_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function input_schema(JsonSchema $schema)
    {
        return array_merge([
            'search' => $schema->string()
                ->description('Part of a product title or of a variant SKU.'),
            'status' => $schema->string()
                ->enum(ProductStatus::get_constant_values())
                ->description('Product status. Leave it out for all products that are not trashed.'),
            'availability_status' => $schema->string()
                ->enum(AvailabilityStatus::get_constant_values())
                ->description('Stock status of the product.'),
            'category_ids' => $schema->array()
                ->items($schema->integer())
                ->description('Category IDs. A product in one of the categories matches.'),
            'brand_id' => $schema->integer()
                ->min(1)
                ->description('Brand ID.'),
            'collection_id' => $schema->integer()
                ->min(1)
                ->description('Collection ID.'),
        ], $this->page_schema($schema));
    }

    /**
     * Find the products that match the arguments.
     *
     * @since 1.0.0
     *
     * @param Request $request Tool arguments.
     *
     * @return Response
     * @throws ValidationException When an argument is not valid.
     */
    public function handle(Request $request)
    {
        $statuses = ProductStatus::get_constant_values();
        $availability_statuses = AvailabilityStatus::get_constant_values();
        $category_message = __('The "category_ids" must be a list of integer IDs.', 'kirki-ecommerce');
        $brand_message = __('The "brand_id" must be an integer of 1 or more.', 'kirki-ecommerce');
        $collection_message = __('The "collection_id" must be an integer of 1 or more.', 'kirki-ecommerce');

        $params = $this->validate_arguments($request->all(), array_merge([
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:' . implode(',', $statuses),
            'availability_status' => 'nullable|string|in:' . implode(',', $availability_statuses),
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer',
            'brand_id' => 'nullable|integer|min:1',
            'collection_id' => 'nullable|integer|min:1',
        ], $this->page_rules()), array_merge([
            'search.string' => __('The "search" must be text of at most 100 characters.', 'kirki-ecommerce'),
            'search.max' => __('The "search" must be text of at most 100 characters.', 'kirki-ecommerce'),
            'status.in' => $this->one_of_message('status', $statuses),
            'availability_status.in' => $this->one_of_message('availability_status', $availability_statuses),
            'category_ids.array' => $category_message,
            'category_ids.*.integer' => $category_message,
            'brand_id.integer' => $brand_message,
            'brand_id.min' => $brand_message,
            'collection_id.integer' => $collection_message,
            'collection_id.min' => $collection_message,
        ], $this->page_messages()));
        [$page, $per_page] = $this->page_arguments($params);

        $products = $this->product_service->paginated(ProductListFilterDTO::from_array([
            'search' => $params['search'] ?? null,
            'status' => $params['status'] ?? null,
            'availability_status' => $params['availability_status'] ?? 'all',
            'category_ids' => empty($params['category_ids']) ? null : array_map('intval', $params['category_ids']),
            'brand_id' => $params['brand_id'] ?? null,
            'collection_id' => isset($params['collection_id']) ? (string) $params['collection_id'] : null,
            'page' => $page,
            'limit' => $per_page,
        ]));
        $threshold = (int) Settings::get('product.low_stock_threshold', 0);

        return Response::structured([
            'products' => array_values(array_map(function (Product $product) use ($threshold) {
                return $this->product_row($product, $threshold);
            }, $products->items()->all())),
            'pagination' => $this->pagination($products),
        ]);
    }

    /**
     * Shape one product into a compact row.
     *
     * @since 1.0.0
     *
     * @param Product $product   Product with its variants and categories.
     * @param int     $threshold Store default low-stock threshold.
     *
     * @return array<string, mixed>
     */
    protected function product_row(Product $product, int $threshold)
    {
        $variants = $product->variants->all();
        $prices = [];
        $tracked_quantity = 0;

        foreach ($variants as $variant) {
            $is_on_sale = $variant->base_sale_price > 0 && $variant->base_sale_price < $variant->base_price;
            $prices[] = (int) ($is_on_sale ? $variant->base_sale_price : $variant->base_price);
            $tracked_quantity += $variant->track_inventory ? (int) $variant->available_quantity : 0;
        }

        return [
            'product_id' => (int) $product->id,
            'title' => $product->title,
            'status' => $product->status,
            'availability_status' => $this->availability_service->resolve_product_status($variants, $threshold),
            'price_range' => [
                'min' => empty($prices) ? null : $this->money(min($prices)),
                'max' => empty($prices) ? null : $this->money(max($prices)),
            ],
            'variant_count' => count($variants),
            'tracked_quantity' => $tracked_quantity,
            'categories' => array_values(array_map(function ($category) {
                return $category->name;
            }, $product->categories->all())),
        ];
    }
}
