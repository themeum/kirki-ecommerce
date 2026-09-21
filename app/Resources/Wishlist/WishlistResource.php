<?php

namespace Kirki\Ecommerce\App\Resources\Wishlist;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Resources\Site\Shop\ShopProductResource;
use Kirki\Ecommerce\App\Supports\Url;

/**
 * API resource for a wishlist entry, presented as a product card for its variant.
 *
 * @since 1.0.0
 */
class WishlistResource extends ShopProductResource
{
    /**
     * Convert the wishlist resource to an array.
     *
     * Fills the product card data from the wishlisted variant and its product, then adds variant, URL and pricing fields.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> Card data with variant and price fields, or an empty array when there is no resource.
     */
    public function to_array(): array
    {
        if (!$this->resource) {
            return [];
        }

        $variant = $this->variant;
        $product = $variant ? $variant->product : null;

        $this->title = $product ? $product->title : '';
        $this->slug  = $product ? $product->slug : '';


        if ($variant && !empty($variant->media)) {
            $this->media = is_object($variant->media) ? ($variant->media->ID ?? $variant->media->id) : $variant->media;
        } elseif ($product && $product->media && $product->media->first()) {
            $media = $product->media->first();
            $this->media = $media->ID ?? $media->id;
        }
        $this->categories = $product ? $product->categories : null;
        $this->ribbon = $product ? $product->ribbon : '';

        $regular_price = $variant ? (int) $variant->base_price : 0;
        $sale_price    = $variant ? (int) $variant->base_sale_price : 0;
        $in_sale       = $sale_price > 0 && $sale_price < $regular_price;

        $paren_data = parent::to_array();

        $pricing = $this->resolve_pricing($regular_price, $sale_price, $in_sale);

        return array_merge(
            $paren_data,
            [
                'variant_id' => $this->variant_id,
                'product_url' => Url::add_query_params(Url::get_product_url($this->slug), [ 'variant_id' => $this->variant_id ]),
                'product_id' => $product ? $product->id : ($variant ? $variant->product_id : null),
                'in_sale' => $in_sale,
                'formatted_regular_price' => $pricing['formatted_regular_price'],
                'display_price' => $pricing['display_price'],
            ],
        );
    }

    /**
     * Resolve the formatted regular price and the display price of the wishlisted variant.
     *
     * The display price is the sale price when the variant is on sale, otherwise the regular price.
     *
     * @since 1.0.0
     *
     * @param int  $regular_price Regular price in minor units.
     * @param int  $sale_price    Sale price in minor units.
     * @param bool $in_sale       Whether the sale price applies.
     * @return array{display_price: string, formatted_regular_price: string, in_sale: bool} Formatted prices and the sale flag.
     */
    private function resolve_pricing($regular_price, $sale_price, $in_sale): array
    {
        $display_currency = Money::resolve_display_currency();
        $formatted_regular_price = Money::prepare_amount_object_from_minor($regular_price, null, $display_currency)->display;
        $display_price           = $in_sale ? Money::prepare_amount_object_from_minor($sale_price, null, $display_currency)->display : $formatted_regular_price;

        return compact('display_price', 'formatted_regular_price', 'in_sale');
    }
}
