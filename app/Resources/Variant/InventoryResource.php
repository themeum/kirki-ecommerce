<?php

namespace Kirki\Ecommerce\App\Resources\Variant;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

use function Kirki\Ecommerce\Framework\app;

class InventoryResource extends Resource
{
    public function to_array()
    {
        $display_currency = Money::resolve_display_currency();

        $availability_service = app()->make(AvailabilityService::class);
        $store_default_threshold = (int) Settings::get('product.low_stock_threshold', 0);
        $availability_status = $availability_service->resolve_variant_status(
            $this->resource,
            $store_default_threshold
        );

        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'display_price' => Money::prepare_amount_from_minor($this->base_price, null, $display_currency),
            'display_price_money_object' => Money::prepare_amount_object_from_minor($this->base_price, null, $display_currency),
            'display_sale_price' => !is_null($this->base_sale_price) ? Money::prepare_amount_from_minor($this->base_sale_price, null, $display_currency) : null,
            'display_sale_price_money_object' => !is_null($this->base_sale_price) ? Money::prepare_amount_object_from_minor($this->base_sale_price, null, $display_currency) : null,
            'attribute_value_labels' => !empty($this->attribute_values)
                ? $this->attribute_values
                    ->map(fn($attribute_value) => $attribute_value->value ?? $attribute_value->color)
                    ->filter()
                    ->values()
                    ->all()
                : [],
            'track_inventory' => $this->track_inventory,
            'available_quantity' => $this->available_quantity,
            'committed_quantity' => $this->committed_quantity,
            'availability_status' => $availability_status,
            'availability_label' => AvailabilityStatus::get_formatted($availability_status),
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->title,
                'image' => MediaAttachment::make($this->media ?? $this->product->media->first()->id ?? null),
            ],
        ];
    }
}
