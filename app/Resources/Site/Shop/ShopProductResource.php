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

use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Supports\Assets;
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

        $regular_price = $variant->base_price;
        $sale_price    = $variant->base_sale_price;
        $in_sale       = $sale_price > 0 && $sale_price < $regular_price;

        $manager                 = new MoneyManager();
        $formatted_regular_price = $manager->format($manager->from_minor($regular_price));
        $formatted_sale_price    = '';

        if ($sale_price > 0) {
            $formatted_sale_price = $manager->format($manager->from_minor($sale_price));
        }

        $display_price = $in_sale ? $formatted_sale_price : $formatted_regular_price;

        if ($variants->count() > 1) {
            $in_sale       = false;
            $lowest_price  = $variants->min(fn($v) => $v->base_price);
            $highest_price = $variants->max(fn($v) => $v->base_price);

            $display_price = $manager->format($manager->from_minor($lowest_price));
            if ($lowest_price !== $highest_price) {
                $display_price .= ' - ' . $manager->format($manager->from_minor($highest_price));
            }
        }

        $inventory_service = app()->make(InventoryService::class);
        $out_of_stock      = ! $inventory_service->has_stock((int) $variant->id, 1);

        $ribbon_text = $out_of_stock ? __('Out of Stock', 'kirki-ecommerce') : $this->ribbon;

        $media     = $this->media->first();
        $image_url = $media
            ? wp_get_attachment_image_url($media->ID, 'large')
            : Assets::get_url('images/product-fallback.webp');

        $category = $this->categories->first();

        return [
            'id'                      => $this->id,
            'title'                   => $this->title,
            'slug'                    => $this->slug,
            'ribbon_text'             => $ribbon_text,
            'image_url'               => $image_url ?: '',
            'product_url'             => Url::get_product_url($this->slug),
            'category_name'           => $category ? $category->name : '',
            'display_price'           => $display_price,
            'formatted_regular_price' => $formatted_regular_price,
            'in_sale'                 => $in_sale,
            'out_of_stock'            => $out_of_stock,
            'has_variants'            => (bool) $variant->has_variants,
            'variant_id'              => (int) $variant->id,
            'cart_url'                => Url::get_cart_url(),
        ];
    }
}
