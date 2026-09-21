<?php

namespace Kirki\Ecommerce\App\Resources\Variant;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\UnitPrice;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

/**
 * API resource for a product variant with pricing, stock and shipping details.
 *
 * @since 1.0.0
 */
class VariantResource extends Resource
{
    /**
     * Public preview URL of the variant's product, when one is available.
     *
     * @var string|null
     */
    protected $preview_url;

    /**
     * Create the resource for a variant.
     *
     * @since 1.0.0
     *
     * @param mixed       $variant     Variant model with its product loaded.
     * @param string|null $preview_url Public preview URL of the variant's product, if any.
     */
    public function __construct($variant, ?string $preview_url = null)
    {
        $this->preview_url = $preview_url;
        parent::__construct($variant);
    }

    /**
     * Convert the variant resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The variant data, with prices in base and display currencies, stock and availability.
     */
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
            'product_id' => $this->product_id,
            'preview_url' => $this->preview_url,
            'name' => $this->product->title,
            'media' => MediaAttachment::make($this->media ?: ($this->product->media ?? collection())->first()),
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'base_price' => Money::prepare_amount_from_minor($this->base_price),
            'base_price_money_object' => Money::prepare_amount_object_from_minor($this->base_price),
            'display_price' => Money::prepare_amount_from_minor($this->base_price, null, $display_currency),
            'display_price_money_object' => Money::prepare_amount_object_from_minor($this->base_price, null, $display_currency),
            'display_unit_price' => UnitPrice::make($this->resource, $display_currency),
            'show_unit_price' => (bool) $this->show_unit_price,
            'base_unit' => $this->base_unit,
            'base_unit_amount' => $this->base_unit_amount,
            'total_unit' => $this->total_unit,
            'total_unit_amount' => $this->total_unit_amount,
            'base_sale_price' => !is_null($this->base_sale_price) ? Money::prepare_amount_from_minor($this->base_sale_price) : null,
            'base_sale_price_money_object' => !is_null($this->base_sale_price) ? Money::prepare_amount_object_from_minor($this->base_sale_price) : null,
            'display_sale_price' => !is_null($this->base_sale_price) ? Money::prepare_amount_from_minor($this->base_sale_price, null, $display_currency) : null,
            'display_sale_price_money_object' => !is_null($this->base_sale_price) ? Money::prepare_amount_object_from_minor($this->base_sale_price, null, $display_currency) : null,
            'base_cost_of_goods' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_from_minor($this->base_cost_of_goods) : null,
            'base_cost_of_goods_money_object' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_object_from_minor($this->base_cost_of_goods) : null,
            'display_cost_of_goods' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_from_minor($this->base_cost_of_goods, null, $display_currency) : null,
            'display_cost_of_goods_money_object' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_object_from_minor($this->base_cost_of_goods, null, $display_currency) : null,
            'weight' => $this->weight,
            'weight_unit' => $this->weight_unit,
            'charge_taxes' => $this->charge_taxes,
            'allow_back_order' => $this->allow_back_order,
            'track_inventory' => $this->track_inventory,
            'available_quantity' => $this->available_quantity,
            'in_stock' => $this->in_stock,
            'committed_quantity' => $this->committed_quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'availability_status' => $availability_status,
            'availability_label' => AvailabilityStatus::get_formatted($availability_status),
            'has_limit_per_order' => $this->has_limit_per_order,
            'max_per_order' => $this->max_per_order,
            'tax_profile_id' => $this->tax_profile_id,
            'shipping_profile_id' => $this->shipping_profile_id,
            'shipping_box_id' => $this->shipping_box_id,
            'is_visible' => $this->is_visible,
            'is_physical_product' => $this->is_physical_product,
            'is_default' => $this->is_default,

            'attribute_values' => !empty($this->attribute_values) ? $this->attribute_values->pluck('id')->all() : [],
            'attribute_value_labels' => !empty($this->attribute_values) ? $this->attribute_values->pluck('value')->all() : [],

            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
