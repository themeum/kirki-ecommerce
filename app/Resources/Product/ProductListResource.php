<?php

namespace Kirki\Ecommerce\App\Resources\Product;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class ProductListResource extends Resource
{
    /**
     * Convert the product resource to an array.
     *
     * @return array The product data as an associative array.
     */
    public function to_array()
    {
        $inventory = 0;
        $min_price = $this->variants->first()->price;

        foreach ($this->variants->all() as $variant) {
            $inventory += $variant->track_inventory ? $variant->available_quantity : 0;
            $min_price = min($min_price, $variant->price);
        }

        $display_currency = Money::resolve_display_currency();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image' => MediaAttachment::make($this->media->first()->ID ?? null)['url'] ?? null,
            'sku' => $this->sku,
            'inventory' => $inventory,
            'base_price' => Money::prepare_amount($min_price),
            'base_price_money_object' => Money::prepare_amount_object($min_price),
            'display_price' => Money::prepare_amount($min_price, null, $display_currency),
            'display_price_money_object' => Money::prepare_amount_object($min_price, null, $display_currency),
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
