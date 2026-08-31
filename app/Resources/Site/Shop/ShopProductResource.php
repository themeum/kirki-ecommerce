<?php

/**
 * Shop Product Resource
 *
 * @package Kirki\Ecommerce\App\Resources\Site\Shop
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Resources\Site\Shop;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Resource;

use function Kirki\Ecommerce\Framework\app;

/**
 * Class ShopProductResource
 *
 * Transforms a Product model into the data shape expected by the
 * site/shop/parts/product-card.php template.
 *
 * @since 1.0.0
 */
class ShopProductResource extends Resource
{
    /**
     * Convert the product to an array for the product-card template.
     *
     * @return array
     */
    public function to_array(): array
    {
        $variants = $this->variants;
        $variant  = $variants->first();

        if (! $variant) {
            return [];
        }

        $has_variants = (bool) $variant->has_variants;
        $variant_id   = intval($variant->id);
        $out_of_stock = $this->resolve_stock_status($variant_id);
        $pricing      = $this->resolve_pricing($variant, $variants, $has_variants);

        return [
            'id'                      => $this->id,
            'title'                   => $this->title,
            'slug'                    => $this->slug,
            'product_url'             => Url::get_product_url($this->slug),
            'image_url'               => $this->resolve_image_url(),
            'category_name'           => $this->resolve_category_name(),
            'ribbon_text'             => $this->resolve_ribbon_text($out_of_stock),
            'display_price'           => $pricing['display_price'],
            'formatted_regular_price' => $pricing['formatted_regular_price'],
            'in_sale'                 => $pricing['in_sale'],
            'out_of_stock'            => $out_of_stock,
            'has_variants'            => $has_variants,
            'variant_id'              => $variant_id,
            'cart_url'                => Url::get_cart_url(),
        ];
    }

    /**
     * Resolve the display price, formatted regular price, and sale flag.
     *
     * For single-variant products: compares base_price vs base_sale_price.
     * For multi-variant products: shows a price range across all variants.
     *
     * @param object $variant     The first (representative) variant.
     * @param object $variants    The full variants collection.
     * @param bool   $has_variants Whether the product has multiple variants.
     *
     * @return array{ display_price: string, formatted_regular_price: string, in_sale: bool }
     */
    private function resolve_pricing($variant, $variants, bool $has_variants): array
    {
        $regular_price = $variant->base_price;
        $sale_price    = $variant->base_sale_price;
        $in_sale       = $sale_price > 0 && $sale_price < $regular_price;

        $formatted_regular_price = Money::format_from_minor($regular_price);
        $display_price           = $in_sale ? Money::format_from_minor($sale_price) : $formatted_regular_price;

        if ($has_variants) {
            [$display_price, $in_sale] = $this->resolve_variant_price_range($variants);
        }

        return compact('display_price', 'formatted_regular_price', 'in_sale');
    }

    /**
     * Build the price range string for multi-variant products.
     *
     * Returns a tuple of [display_price, in_sale]. Sale is always false for
     * multi-variant products since we show a range instead of a struck price.
     *
     * @param object $variants The full variants collection.
     *
     * @return array{ 0: string, 1: bool }
     */
    private function resolve_variant_price_range($variants): array
    {
        $lowest_price  = $variants->min(fn($v) => $v->base_price);
        $highest_price = $variants->max(fn($v) => $v->base_price);

        $display_price = Money::format_from_minor($lowest_price);

        if ($lowest_price !== $highest_price) {
            $display_price .= ' - ' . Money::format_from_minor($highest_price);
        }

        return [$display_price, false];
    }

    /**
     * Check whether the given variant is out of stock.
     *
     * @param int $variant_id
     *
     * @return bool
     */
    private function resolve_stock_status(int $variant_id): bool
    {
        return ! app()->make(InventoryService::class)->has_stock($variant_id, 1);
    }

    /**
     * Resolve the product thumbnail URL, falling back to the placeholder image.
     *
     * @return string
     */
    private function resolve_image_url(): string
    {
        $media = $this->media->first();

        return $media
            ? (wp_get_attachment_image_url($media->ID, 'large') ?: '')
            : Url::get_product_fallback_image();
    }

    /**
     * Return the name of the primary category, or an empty string if none.
     *
     * @return string
     */
    private function resolve_category_name(): string
    {
        $category = $this->categories->first();

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
