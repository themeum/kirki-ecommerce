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

use Kirki\Ecommerce\App\Constants\Product\RibbonColor;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\WishlistService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Resource;

use function Kirki\Ecommerce\Framework\app;

/**
 * Transforms a Product model into the data shape expected by the
 * site/shop/parts/product-card.php template.
 *
 * @since 1.0.0
 */
class ShopProductResource extends Resource
{
    /**
     * Colour drawn for the out-of-stock label, in place of the merchant's
     * ribbon colour, so the stock warning is never mistaken for a
     * promotional badge.
     */
    protected const OUT_OF_STOCK_RIBBON_COLOR = '#d60000';

    /**
     * Convert the product to an array for the product-card template.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> Card data, or an empty array when the product has no usable variant.
     */
    public function to_array(): array
    {
        $variants = $this->variants;
        $variant  = $this->variant ? $this->variant : $this->resolve_default_variant($variants);

        if (! $variant) {
            return [];
        }

        $has_variants = (bool) $this->has_variants;
        $variant_id   = intval($variant->id);
        $out_of_stock = $variants ? !$this->resolve_has_stock($variants) : false;
        $pricing      = $this->resolve_pricing($variant, $variants, $has_variants);
        $is_wishlisted = app(WishlistService::class)->is_wishlisted($variant_id);

        return [
            'id'                      => $this->id,
            'title'                   => $this->title,
            'slug'                    => $this->slug,
            'product_url'             => Url::get_product_url($this->slug),
            'image_url'               => $this->resolve_image_url(),
            'category_name'           => $this->resolve_category_name(),
            'ribbon_text'             => $this->resolve_ribbon_text($out_of_stock),
            'ribbon_color'            => $this->resolve_ribbon_color($out_of_stock),
            'display_price'           => $pricing['display_price'],
            'formatted_regular_price' => $pricing['formatted_regular_price'],
            'in_sale'                 => $pricing['in_sale'],
            'out_of_stock'            => $out_of_stock,
            'has_variants'            => $has_variants,
            'variant_id'              => $variant_id,
            'cart_url'                => Url::get_cart_url(),
            'is_wishlisted'           => $is_wishlisted,
        ];
    }

    /**
     * Resolve the default variant from the variants collection.
     *
     * @since 1.0.0
     *
     * @param Collection|null $variants Variants of the product.
     * @return \Kirki\Ecommerce\App\Models\Variant|null Null when there are no variants or none is marked default.
     */
    private function resolve_default_variant($variants)
    {
        if (! $variants) {
            return null;
        }
        return $variants->filter(fn($variant) => 1 == $variant->is_default)->first();
    }

    /**
     * Resolve the display price, formatted regular price, and sale flag.
     *
     * For single-variant products: compares base_price vs base_sale_price.
     * For multi-variant products: shows a price range across all variants.
     *
     * @since 1.0.0
     *
     * @param object     $variant      The representative variant.
     * @param Collection $variants     The full variants collection.
     * @param bool       $has_variants Whether the product has multiple variants.
     * @return array{display_price: string, formatted_regular_price: string, in_sale: bool} Formatted prices and the sale flag.
     */
    private function resolve_pricing($variant, $variants, bool $has_variants): array
    {
        $regular_price = $variant->base_price;
        $sale_price    = $variant->base_sale_price;
        $in_sale       = $sale_price > 0 && $sale_price < $regular_price;

        $display_currency = Money::resolve_display_currency();
        $formatted_regular_price = Money::prepare_amount_object_from_minor($regular_price, null, $display_currency)->display;
        $display_price           = $in_sale ? Money::prepare_amount_object_from_minor($sale_price, null, $display_currency)->display : $formatted_regular_price;

        if ($has_variants) {
            [$display_price, $in_sale] = $this->resolve_variant_price_range($variants, $display_currency);
        }

        return compact('display_price', 'formatted_regular_price', 'in_sale');
    }

    /**
     * Build the price range string for multi-variant products.
     *
     * Returns a tuple of [display_price, in_sale]. Sale is always false for
     * multi-variant products since we show a range instead of a struck price.
     *
     * @since 1.0.0
     *
     * @param Collection  $variants         The full variants collection.
     * @param string|null $display_currency Currency code to display the prices in.
     * @return array{0: string, 1: bool} The price or price range, and the sale flag.
     */
    private function resolve_variant_price_range($variants, $display_currency = null): array
    {
        $lowest_price  = $variants->min(fn($v) => $v->base_price);
        $highest_price = $variants->max(fn($v) => $v->base_price);

        $display_price = Money::prepare_amount_object_from_minor($lowest_price, null, $display_currency)->display;

        if ($lowest_price !== $highest_price) {
            $display_price .= ' - ' . Money::prepare_amount_object_from_minor($highest_price, null, $display_currency)->display;
        }

        return [$display_price, false];
    }

    /**
     * Check whether any variant is in stock.
     *
     * @since 1.0.0
     *
     * @param Collection $variants Variants of the product.
     * @return bool True when at least one variant has one unit available.
     */
    private function resolve_has_stock(Collection $variants): bool
    {
        $has_stock = false;
        $inventory_service = app()->make(InventoryService::class);
        foreach ($variants as $variant) {
            if ($inventory_service->has_stock($variant->id, 1)) {
                $has_stock = true;
                break;
            }
        }
        return $has_stock;
    }

    /**
     * Resolve the product thumbnail URL, falling back to the placeholder image.
     *
     * @since 1.0.0
     *
     * @return string Large image URL, an empty string if the attachment has no URL, or the placeholder when no media is set.
     */
    private function resolve_image_url(): string
    {
        if (is_int($this->media)) {
            $media_id = $this->media;
        } else {
            $media = is_object($this->media) ? $this->media->first() : null;
            $media_id = $media && is_object($media) ? $media->ID : 0;
        }

        return $media_id
            ? (wp_get_attachment_image_url($media_id, 'large') ?: '')
            : Url::get_product_fallback_image();
    }

    /**
     * Return the name of the primary category, or an empty string if none.
     *
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @param bool $out_of_stock Whether no variant is in stock.
     * @return string Badge text, empty when no ribbon applies.
     */
    private function resolve_ribbon_text(bool $out_of_stock): string
    {
        return $out_of_stock
            ? __('Out of Stock', 'kirki-ecommerce')
            : (string) $this->ribbon;
    }

    /**
     * Resolve the colour the ribbon badge is drawn in.
     *
     * Out-of-stock products always show the stock label's own colour,
     * overriding any custom ribbon colour the merchant may have set. A
     * ribbon saved before colours existed has no stored colour, so it falls
     * back to the palette's first entry.
     *
     * @param bool $out_of_stock
     *
     * @return string
     */
    protected function resolve_ribbon_color(bool $out_of_stock): string
    {
        if ($out_of_stock) {
            return static::OUT_OF_STOCK_RIBBON_COLOR;
        }

        return $this->ribbon_color ?: RibbonColor::get_default();
    }
}
