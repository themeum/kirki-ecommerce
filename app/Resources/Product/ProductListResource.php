<?php

namespace Kirki\Ecommerce\App\Resources\Product;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\Facades\Money;
use Kirki\Ecommerce\Supports\MediaAttachment;

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

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image' => MediaAttachment::make($this->media->first()->ID ?? null)['url'] ?? null,
            'sku' => $this->sku,
            'inventory' => $inventory,
            'price' => Money::from_minor($min_price)->getAmount(),
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
