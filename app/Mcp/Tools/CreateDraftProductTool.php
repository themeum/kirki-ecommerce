<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductCreateRequest;
use Kirki\Ecommerce\App\Mcp\Concerns\DescribesProducts;
use Kirki\Ecommerce\App\Mcp\Concerns\HandlesProductText;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\App\Services\ProductService;

use function Kirki\Ecommerce\Framework\app;

/**
 * Creates a product as a draft, with one variant or with the variants that the merchant asks for.
 *
 * @since 1.0.0
 */
class CreateDraftProductTool extends StoreWriteTool
{
    use DescribesProducts;
    use HandlesProductText;

    const MAX_VARIANTS = 100;

    const VARIANT_PRICE_FIELDS = ['base_price', 'base_sale_price', 'base_cost_of_goods'];

    /** @var bool */
    protected $destructive = false;

    /** @var bool */
    protected $requires_confirmation = false;

    /** @var string */
    protected $description = 'Create a product as a draft, in one call. The product is not visible in the shop until the merchant publishes it. '
        . 'By default the product has one variant from "sku", the prices and the stock fields. Send "attributes" and "variants" only when the merchant asks for variants, such as sizes or colors. '
        . 'Prices are decimal amounts in the store currency. Images are added in the admin.';

    /** @var ProductService */
    protected $product_service;

    /**
     * Create the tool with the product service.
     *
     * @since 1.0.0
     *
     * @param ProductService $product_service Product service.
     */
    public function __construct(ProductService $product_service)
    {
        $this->product_service = $product_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        $variant_fields = $this->variant_schema($schema);

        return [
            'title' => $schema->string()->description('Product title.'),
        ] + $this->product_text_schema($schema) + [
            'category_ids' => $schema->array()->items($schema->integer())->description('Category IDs, from the catalog-structure resource.'),
            'tag_ids' => $schema->array()->items($schema->integer())->description('Tag IDs, from the catalog-structure resource.'),
            'brand_id' => $schema->integer()->description('Brand ID, from the catalog-structure resource.'),
        ] + $variant_fields + [
            'attributes' => $schema->array()
                ->items($schema->object()->properties([
                    'id' => $schema->integer()->description('Attribute ID, from the catalog-structure resource.'),
                    'values' => $schema->array()->items($schema->integer())->description('IDs of the attribute values that the product uses.'),
                ]))
                ->description('Only for a product with variants: the attributes, such as Size, and their values.'),
            'variants' => $schema->array()
                ->items($schema->object()->properties(['attribute_values' => $schema->array()->items($schema->integer())->description('One value ID of each attribute.')] + $variant_fields))
                ->description('Only for a product with variants: one entry for each combination of attribute values.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $rules = [
            'title' => 'required|string|max:500',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer',
            'brand_id' => 'nullable|integer',
            'attributes' => 'nullable|array',
            'attributes.*.id' => 'required|integer',
            'attributes.*.values' => 'required|array|min:1',
            'attributes.*.values.*' => 'integer',
            'variants' => 'nullable|array|max:' . static::MAX_VARIANTS,
            'variants.*.attribute_values' => 'required|array',
            'variants.*.attribute_values.*' => 'integer',
        ] + $this->product_text_rules() + $this->product_text_item_rules() + $this->variant_rules('') + $this->variant_rules('variants.*.');

        $params = $this->validate_arguments($arguments, $rules, [
            'title.required' => __('Send the product "title".', 'kirki-ecommerce'),
        ]);

        if (empty($params['attributes']) !== empty($params['variants'])) {
            $this->reject(['variants' => [__('Send "attributes" and "variants" together, or neither of them for a product with one variant.', 'kirki-ecommerce')]]);
        }

        $this->check_amounts($params);
        $this->check_references($params);

        return $params;
    }

    /**
     * The product is new, so there is no record to find.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        return null;
    }

    /**
     * Create the draft with the rules of the admin product form.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $request = $this->form_request(ProductCreateRequest::class, $this->payload($params));
        $data = $request->all();
        $data['status'] = ProductStatus::DRAFT;

        $variants = array_map(function ($variant) {
            return CreateVariantDTO::from_array($variant);
        }, $data['variants']);

        $product = app()->make(CreateProductAction::class)->execute(CreateProductDTO::from_array($data), $variants);

        return ['product' => $this->product_summary($this->product_service->find((int) $product->id))];
    }

    /**
     * Get the schema of the fields of one variant.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema Schema builder.
     *
     * @return array<string, mixed>
     */
    protected function variant_schema(JsonSchema $schema)
    {
        return [
            'sku' => $schema->string()->description('SKU. It must not exist in the store.'),
            'base_price' => $schema->number()->min(0)->description('Price, a decimal amount in the store currency.'),
            'base_sale_price' => $schema->number()->min(0)->description('Sale price, not higher than the price.'),
            'base_cost_of_goods' => $schema->number()->min(0)->description('Cost of goods.'),
            'track_inventory' => $schema->boolean()->description('Track the stock of the variant.'),
            'available_quantity' => $schema->integer()->min(0)->description('Units in stock.'),
        ];
    }

    /**
     * Get the validation rules of the fields of one variant.
     *
     * @since 1.0.0
     *
     * @param string $prefix Key prefix, empty for the simple product fields.
     *
     * @return array<string, string>
     */
    protected function variant_rules(string $prefix)
    {
        return [
            $prefix . 'sku' => 'nullable|string|max:100',
            $prefix . 'base_price' => 'nullable|numeric',
            $prefix . 'base_sale_price' => 'nullable|numeric',
            $prefix . 'base_cost_of_goods' => 'nullable|numeric',
            $prefix . 'track_inventory' => 'nullable|boolean',
            $prefix . 'available_quantity' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Reject amounts with too many decimals or below zero, and sale prices above the price.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return void
     */
    protected function check_amounts(array $params)
    {
        $variants = empty($params['variants']) ? ['' => $params] : $params['variants'];

        foreach ($variants as $index => $variant) {
            $prefix = $index === '' ? '' : 'variants.' . $index . '.';
            $minor = [];

            foreach (static::VARIANT_PRICE_FIELDS as $field) {
                if (isset($variant[$field]) && $variant[$field] !== '') {
                    $minor[$field] = $this->to_minor($variant[$field], $prefix . $field);
                }
            }

            if (!empty($minor['base_sale_price']) && $minor['base_sale_price'] > ($minor['base_price'] ?? 0)) {
                $this->reject([$prefix . 'base_sale_price' => [__('The sale price cannot be greater than the regular price.', 'kirki-ecommerce')]]);
            }
        }
    }

    /**
     * Reject a category, tag, brand or attribute value that does not exist.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return void
     */
    protected function check_references(array $params)
    {
        $checks = [
            'category_ids' => [Category::class, $params['category_ids'] ?? []],
            'tag_ids' => [Tag::class, $params['tag_ids'] ?? []],
            'brand_id' => [Brand::class, empty($params['brand_id']) ? [] : [$params['brand_id']]],
        ];

        foreach ($checks as $argument => $check) {
            list($model, $ids) = $check;
            $ids = array_unique(array_map('intval', $ids));

            if (!empty($ids) && $model::query()->where_in('id', $ids)->count() !== count($ids)) {
                /* translators: %s: argument name. */
                $this->reject([$argument => [sprintf(__('One or more IDs in "%s" do not exist. See the catalog-structure resource.', 'kirki-ecommerce'), $argument)]]);
            }
        }

        foreach ($params['attributes'] ?? [] as $index => $attribute) {
            $values = array_unique(array_map('intval', $attribute['values']));
            $found = AttributeValue::query()->where('attribute_id', (int) $attribute['id'])->where_in('id', $values)->count();

            if ($found !== count($values)) {
                $this->reject(['attributes.' . $index . '.values' => [__('One or more attribute values do not exist or do not belong to the attribute. See the catalog-structure resource.', 'kirki-ecommerce')]]);
            }
        }
    }

    /**
     * Build the payload of the admin product form.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return array<string, mixed>
     */
    protected function payload(array $params)
    {
        $has_variants = !empty($params['variants']);
        $variants = $has_variants ? array_values($params['variants']) : [array_merge($params, ['attribute_values' => []])];

        $payload = array_intersect_key($params, array_flip($this->product_text_fields())) + [
            'title' => $params['title'],
            'status' => ProductStatus::DRAFT,
            'has_variants' => $has_variants,
            'categories' => $params['category_ids'] ?? [],
            'tags' => $params['tag_ids'] ?? [],
            'brand_id' => $params['brand_id'] ?? null,
            'attributes' => $has_variants ? array_values($params['attributes']) : [],
            'variants' => [],
        ];

        foreach ($variants as $index => $variant) {
            $payload['variants'][] = array_intersect_key($variant, array_flip(['sku', 'base_price', 'base_sale_price', 'base_cost_of_goods', 'track_inventory', 'available_quantity', 'attribute_values'])) + [
                'is_default' => $index === 0,
                'in_stock' => true,
            ];
        }

        return $payload;
    }
}
