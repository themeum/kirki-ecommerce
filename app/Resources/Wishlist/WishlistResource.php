<?php

namespace Kirki\Ecommerce\App\Resources\Wishlist;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Resource;

use function Kirki\Ecommerce\Framework\app;

class WishlistResource extends Resource
{
    /**
     * Convert the wishlist resource to an array.
     *
     * @return array
     */
    public function to_array()
    {
        if (!$this->resource) {
            return [];
        }

        $variant = $this->variant;
        $product = $variant ? $variant->product : null;
        $display_currency = Money::resolve_display_currency();

        $image_url = '';
        if ($variant && !empty($variant->media)) {
            $media_id = is_object($variant->media) ? ($variant->media->ID ?? $variant->media->id) : $variant->media;
            $image_url = wp_get_attachment_image_url($media_id, 'large') ?: '';
        } elseif ($product && $product->media && $product->media->first()) {
            $media = $product->media->first();
            $image_url = wp_get_attachment_image_url($media->ID ?? $media->id, 'large') ?: '';
        }

        if (empty($image_url)) {
            $image_url = Url::get_product_fallback_image();
        }

        $regular_price = $variant ? (int) $variant->base_price : 0;
        $sale_price    = $variant ? (int) $variant->base_sale_price : 0;
        $in_sale       = $sale_price > 0 && $sale_price < $regular_price;

        $out_of_stock = false;
        if ($variant) {
            $out_of_stock = !app()->make(InventoryService::class)->has_stock($variant->id, 1);
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'variant_id' => $this->variant_id,
            'product_id' => $product ? $product->id : ($variant ? $variant->product_id : null),
            'title' => $product ? $product->title : '',
            'slug' => $product ? $product->slug : '',
            'product_url' => $product ? Url::get_product_url($product->slug) : '',
            'image_url' => $image_url,
            'base_price' => $variant ? Money::prepare_amount_from_minor($variant->base_price) : 0,
            'display_price_money_object' => $variant ? Money::prepare_amount_object_from_minor($variant->base_price, null, $display_currency) : null,
            'in_sale' => $in_sale,
            'out_of_stock' => $out_of_stock
        ];
    }
}
