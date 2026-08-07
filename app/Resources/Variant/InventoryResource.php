<?php

namespace Kirki\Ecommerce\App\Resources\Variant;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class InventoryResource extends Resource
{
    public function to_array()
    {
        $display_currency = Money::resolve_display_currency();

        return [
            'id' => $this->id,
            'name' => $this->attribute_values ? $this->attribute_values->map(fn($attribute_value) => $attribute_value->value ?? $attribute_value->color)->join(' | ') : '',
            'sku' => $this->sku,
            'base_price' => Money::prepare_amount_from_minor($this->base_price),
            'base_price_money_object' => Money::prepare_amount_object_from_minor($this->base_price),
            'display_price' => Money::prepare_amount_from_minor($this->base_price, null, $display_currency),
            'display_price_money_object' => Money::prepare_amount_object_from_minor($this->base_price, null, $display_currency),
            'base_sale_price' => !is_null($this->base_sale_price) ? Money::prepare_amount_from_minor($this->base_sale_price) : null,
            'base_sale_price_money_object' => !is_null($this->base_sale_price) ? Money::prepare_amount_object_from_minor($this->base_sale_price) : null,
            'display_sale_price' => !is_null($this->base_sale_price) ? Money::prepare_amount_from_minor($this->base_sale_price, null, $display_currency) : null,
            'display_sale_price_money_object' => !is_null($this->base_sale_price) ? Money::prepare_amount_object_from_minor($this->base_sale_price, null, $display_currency) : null,
            'base_cost_of_goods' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_from_minor($this->base_cost_of_goods) : null,
            'base_cost_of_goods_money_object' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_object_from_minor($this->base_cost_of_goods) : null,
            'display_cost_of_goods' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_from_minor($this->base_cost_of_goods, null, $display_currency) : null,
            'display_cost_of_goods_money_object' => !is_null($this->base_cost_of_goods) ? Money::prepare_amount_object_from_minor($this->base_cost_of_goods, null, $display_currency) : null,
            'stock_quantity' => $this->stock_quantity,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->title,
                'image' => MediaAttachment::make($this->media ?? $this->product->media->first()->id ?? null),
            ],
        ];
    }
}
