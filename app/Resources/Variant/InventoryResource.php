<?php

namespace Kirki\Ecommerce\App\Resources\Variant;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class InventoryResource extends Resource
{
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->attribute_values ? $this->attribute_values->map(fn($attribute_value) => $attribute_value->value ?? $attribute_value->color)->join(' | ') : '',
            'sku' => $this->sku,
            'price' => Money::from_minor($this->price)->getAmount(),
            'sale_price' => !is_null($this->sale_price) ? Money::from_minor($this->sale_price)->getAmount() : null,
            'cost_of_goods' => !is_null($this->cost_of_goods) ? Money::from_minor($this->cost_of_goods)->getAmount() : null,
            'stock_quantity' => $this->stock_quantity,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->title,
                'image' => MediaAttachment::make($this->media ?? $this->product->media->first()->id ?? null),
            ],
        ];
    }
}
