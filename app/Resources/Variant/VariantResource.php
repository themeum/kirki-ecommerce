<?php

namespace Kirki\Ecommerce\App\Resources\Variant;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\MediaAttachment;
use Kirki\Ecommerce\App\Facades\Money;
use function Kirki\Ecommerce\collection;

class VariantResource extends Resource
{
    /**
     * Convert the product resource to an array.
     *
     * @return array The product data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->product->title,
            'media' => MediaAttachment::make($this->media ?: ($this->product->media ?? collection())->first()),
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'price' => Money::from_minor($this->price)->getAmount(),
            'show_unit_price' => (bool) $this->show_unit_price,
            'base_unit' => $this->base_unit,
            'base_unit_amount' => $this->base_unit_amount,
            'total_unit' => $this->total_unit,
            'total_unit_amount' => $this->total_unit_amount,
            'sale_price' => !is_null($this->sale_price) ? Money::from_minor($this->sale_price)->getAmount() : null,
            'cost_of_goods' => !is_null($this->cost_of_goods) ? Money::from_minor($this->cost_of_goods)->getAmount() : null,
            'weight' => $this->weight,
            'weight_unit' => $this->weight_unit,
            'charge_taxes' => (bool) $this->charge_taxes,
            'allow_back_order' => (bool) $this->allow_back_order,
            'track_inventory' => (bool) $this->track_inventory,
            'available_quantity' => $this->available_quantity,
            'in_stock' => (bool) $this->in_stock,
            'committed_quantity' => $this->committed_quantity,
            'has_limit_per_order' => (bool) $this->has_limit_per_order,
            'max_per_order' => $this->max_per_order,
            'tax_profile_id' => $this->tax_profile_id,
            'shipping_profile_id' => $this->shipping_profile_id,
            'shipping_box_id' => $this->shipping_box_id,
            'is_visible' => (bool) $this->is_visible,
            'is_physical_product' => (bool) $this->is_physical_product,
            'is_default' => (bool) $this->is_default,

            'attribute_values' => !empty($this->attribute_values) ? $this->attribute_values->pluck('id')->all() : [],

            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
