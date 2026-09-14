<?php

namespace Kirki\Ecommerce\App\Resources\Wishlist;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Resources\Site\Shop\ShopProductResource;

class WishlistResource extends ShopProductResource
{
    /**
     * Convert the wishlist resource to an array.
     *
     * @return array
     */
    public function to_array(): array
    {
        if (!$this->resource) {
            return [];
        }

        $variant = $this->variant;
        $product = $variant ? $variant->product : null;

        $this->media = $variant->media ?? $product->media;
        $this->categories = $product ? $product->categories : null;
        $this->ribbon = $product ? $product->ribbon : '';

        $regular_price = $variant ? (int) $variant->base_price : 0;
        $sale_price    = $variant ? (int) $variant->base_sale_price : 0;
        $in_sale       = $sale_price > 0 && $sale_price < $regular_price;


        $pricing = $this->resolve_pricing($regular_price, $sale_price, $in_sale);
        $this->title = $product ? $product->title : '';
        $this->slug = $product ? $product->slug : '';

        return array_merge(
            parent::to_array(),
            [
                'variant_id' => $this->variant_id,
                'product_id' => $product ? $product->id : ($variant ? $variant->product_id : null),
                'in_sale' => $in_sale,
                'formatted_regular_price' => $pricing['formatted_regular_price'],
                'display_price' => $pricing['display_price'],
            ],
        );
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
}
