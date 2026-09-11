<?php

namespace Kirki\Ecommerce\App\Resources\Wishlist;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\WishlistService;
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

        $pricing = $this->resolve_pricing($regular_price, $sale_price, $in_sale);

        $is_wishlisted = $variant ? app(WishlistService::class)->is_wishlisted($variant->id) : false;

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
            'formatted_regular_price' => $pricing['formatted_regular_price'],
            'display_price' => $pricing['display_price'],
            'cart_url' => Url::get_cart_url(),
            'out_of_stock' => $out_of_stock,
            'ribbon_text' => $variant ? $this->resolve_ribbon_text($out_of_stock) : '',
            'category_name' => $variant ? $this->resolve_category_name($product) : '',
            'has_wishlist' => $is_wishlisted,
            'has_variants' => false,
        ];
    }

      /**
     * Resolve the display price, formatted regular price, and sale flag.
     *
     * For single-variant products: compares base_price vs base_sale_price.
     * For multi-variant products: shows a price range across all variants.
     *
     * @param int $regular_price
     * @param int $sale_price
     * @param bool $in_sale
     *
     * @return array{ display_price: string, formatted_regular_price: string, in_sale: bool }
     */
    private function resolve_pricing($regular_price,$sale_price, $in_sale): array
    {
        $formatted_regular_price = Money::format_from_minor($regular_price);
        $display_price           = $in_sale ? Money::format_from_minor($sale_price) : $formatted_regular_price;

        return compact('display_price', 'formatted_regular_price', 'in_sale');
    }

    /**
     * Return the name of the primary category, or an empty string if none.
     *
     * @param  \Kirki\Ecommerce\App\Models\Product $product
     *
     * @return string
     */
    private function resolve_category_name($product): string
    {
        $category = $product->categories->first();

        return $category ? $category->name : '';
    }



    /**
     * Resolve the ribbon label shown on the card badge.
     *
     * Out-of-stock products always show the stock label, overriding any
     * custom ribbon the merchant may have set.
     *
     * @param bool $out_of_stock
     *
     * @return string
     */
    private function resolve_ribbon_text(bool $out_of_stock): string
    {
        return $out_of_stock
            ? __('Out of Stock', 'kirki-ecommerce')
            : (string) $this->ribbon;
    }
}
