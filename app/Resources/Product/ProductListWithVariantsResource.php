<?php

namespace Kirki\Ecommerce\App\Resources\Product;

use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\ProductAttributeFormatter;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;
use function Kirki\Ecommerce\Framework\app;

/**
 * API resource for a product in list views that also includes its variants and attributes.
 *
 * @since 1.0.0
 */
class ProductListWithVariantsResource extends Resource
{
    /**
     * Convert the product resource to an array.
     *
     * Prices are the lowest across the product's variants and inventory sums the tracked variants.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The product summary, with availability, prices, attributes and variants.
     */
    public function to_array()
    {
        $inventory = 0;
        $min_price = $this->variants->first()->base_price;
        $min_base_sale_price = $this->variants->first()->base_sale_price;

        foreach ($this->variants->all() as $variant) {
            $inventory += $variant->track_inventory ? $variant->available_quantity : 0;
            $min_price = min($min_price, $variant->base_price);
            $min_base_sale_price = min($min_base_sale_price, $variant->base_sale_price);

            $variant->set_relation('product', $this->resource);
        }

        $display_currency = Money::resolve_display_currency();

        $availability_service = app()->make(AvailabilityService::class);
        $store_default_threshold = (int) Settings::get('product.low_stock_threshold', 0);
        $availability_status = $availability_service->resolve_product_status($this->variants->all(), $store_default_threshold);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image' => MediaAttachment::make($this->media->first()->ID ?? null)['url'] ?? null,
            'sku' => $this->sku,
            'inventory' => $inventory,
            'availability_status' => $availability_status,
            'availability_label' => !is_null($availability_status) ? $availability_service->format_status_label($availability_status, $inventory) : null,
            'base_price' => Money::prepare_amount_from_minor($min_price),
            'base_price_money_object' => Money::prepare_amount_object_from_minor($min_price),
            'display_price' => Money::prepare_amount_from_minor($min_price, null, $display_currency),
            'display_price_money_object' => Money::prepare_amount_object_from_minor($min_price, null, $display_currency),
            'base_sale_price' => !is_null($min_base_sale_price) ? Money::prepare_amount_from_minor($min_base_sale_price) : null,
            'base_sale_price_money_object' => !is_null($min_base_sale_price) ? Money::prepare_amount_object_from_minor($min_base_sale_price) : null,
            'display_sale_price' => !is_null($min_base_sale_price) ? Money::prepare_amount_from_minor($min_base_sale_price, null, $display_currency) : null,
            'display_sale_price_money_object' => !is_null($min_base_sale_price) ? Money::prepare_amount_object_from_minor($min_base_sale_price, null, $display_currency) : null,
            'status' => $this->status,
            'has_variants' => $this->has_variants,
            'attributes' => !empty($this->attributes)
                ? ProductAttributeFormatter::format($this->attributes->to_array(), $this->attribute_values->to_array(), $this->variants)
                : [],
            'variants' => VariantResource::collection($this->variants),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
