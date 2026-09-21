<?php

namespace Kirki\Ecommerce\App\Resources\Product;

use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;
use function Kirki\Ecommerce\Framework\app;

/**
 * API resource for a full product (admin), with taxonomy, media, attributes and variants.
 *
 * @since 1.0.0
 */
class ProductResource extends Resource
{
    /**
     * Storefront preview URL of the product, when supplied.
     *
     * @var string|null
     */
    protected $preview_url;

    /**
     * Create the resource for a product.
     *
     * @since 1.0.0
     *
     * @param Product     $product     Product with its relations loaded.
     * @param string|null $preview_url Storefront preview URL to expose as `preview_url`.
     */
    public function __construct(Product $product, ?string $preview_url = null)
    {
        $this->preview_url = $preview_url;
        parent::__construct($product);
    }
    /**
     * Convert the product resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The product data, including SEO fields, taxonomy, media, attributes and variants.
     */
    public function to_array()
    {
        $availability_service = app()->make(AvailabilityService::class);
        $store_default_threshold = (int) Settings::get('product.low_stock_threshold', 0);
        $availability_status = $availability_service->resolve_product_status($this->variants->all(), $store_default_threshold);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'status' => $this->status,
            'ribbon' => $this->ribbon,

            'currency' => !$this->currency_id ? null : [
                'id' => $this->currency_id,
                'code' => $this->currency->code,
                'name' => $this->currency->name,
                'symbol' => $this->currency->symbol,
            ],

            'brand' => !$this->brand_id ? null : [
                'id' => $this->brand_id,
                'name' => $this->brand->name,
                'logo' => MediaAttachment::make($this->brand->logo)
            ],

            'short_description' => $this->short_description,
            'description' => $this->description,
            'additional_info' => $this->additional_info,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'seo_keywords' => $this->seo_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image' => MediaAttachment::make($this->og_image),
            'schema_id' => $this->schema_id,
            'llm_instructions' => $this->llm_instructions,
            'has_variants' => $this->has_variants,
            'availability_status' => $availability_status,
            'availability_label' => !is_null($availability_status) ? AvailabilityStatus::get_formatted($availability_status) : null,

            'categories' => $this->categories->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'parent_id' => $item->parent_id,
                    'level' => $item->level,
                ];
            }),
            'tags' => $this->tags->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                ];
            }),
            'collections' => $this->collections->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                ];
            }),

            'attributes' => !empty($this->attributes) ? $this->format_attributes($this->attributes->to_array(), $this->attribute_values->to_array()) : [],
            'variants' => VariantResource::collection($this->variants),
            'media' => MediaAttachment::make_many($this->media->pluck('ID')->all()),

            'preview_url' => $this->preview_url,

            'published_at' => $this->published_at,
            'trashed_at' => $this->trashed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Group attribute values under their attributes.
     *
     * Combines the product's own attribute values with any values used only by its variants.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $attributes       Attribute rows of the product.
     * @param array<int, array<string, mixed>> $attribute_values Attribute value rows of the product.
     * @return array<int, array<string, mixed>> Attributes, each with its list of values.
     */
    protected function format_attributes($attributes, $attribute_values)
    {
        $attribute_values_map = [];

        foreach ($attribute_values as $attribute_value) {
            $attribute_values_map[$attribute_value['attribute_id']][] = [
                'id' => $attribute_value['id'],
                'value' => $attribute_value['value'],
                'color' => $attribute_value['color'],
            ];
        }

        foreach ($this->variants as $variant) {
            foreach ($variant->attribute_values as $attribute_value) {
                $attribute_id = $attribute_value->attribute_id;
                $existing_ids = array_column($attribute_values_map[$attribute_id] ?? [], 'id');

                if (in_array($attribute_value->id, $existing_ids, true)) {
                    continue;
                }

                $attribute_values_map[$attribute_id][] = [
                    'id' => $attribute_value->id,
                    'value' => $attribute_value->value,
                    'color' => $attribute_value->color,
                ];
            }
        }

        $attribute_map = [];

        foreach ($attributes as $attribute) {
            $attribute_map[] = [
                'id' => $attribute['id'],
                'name' => $attribute['name'],
                'values' => $attribute_values_map[$attribute['id']] ?? [],
            ];
        }

        return $attribute_map;
    }
}
