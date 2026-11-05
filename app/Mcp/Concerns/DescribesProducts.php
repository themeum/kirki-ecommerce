<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;

/**
 * Describes products and variants in the results of catalog write tools. The class must use ReadsStoreValues.
 *
 * @since 1.0.0
 */
trait DescribesProducts
{
    /**
     * Get the product fields that a catalog change shows, with its variants.
     *
     * @since 1.0.0
     *
     * @param Product $product Product with its variants.
     *
     * @return array<string, mixed>
     */
    protected function product_summary(Product $product)
    {
        return [
            'product_id' => (int) $product->id,
            'title' => $product->title,
            'status' => $product->status,
            'scheduled_at' => $this->datetime($product->scheduled_at),
            'admin_edit_url' => $this->product_edit_url((int) $product->id),
            'variants' => array_values(array_map(function ($variant) {
                return $this->variant_summary($variant);
            }, $product->variants->all())),
        ];
    }

    /**
     * Get the variant fields that a catalog change shows.
     *
     * @since 1.0.0
     *
     * @param Variant $variant The variant.
     *
     * @return array<string, mixed>
     */
    protected function variant_summary(Variant $variant)
    {
        return [
            'variant_id' => (int) $variant->id,
            'sku' => $variant->sku,
            'base_price' => $this->money($variant->base_price),
            'base_sale_price' => $this->money($variant->base_sale_price),
            'base_cost_of_goods' => $this->money($variant->base_cost_of_goods),
            'track_inventory' => (bool) $variant->track_inventory,
            'available_quantity' => $variant->available_quantity === null ? null : (int) $variant->available_quantity,
        ];
    }

    /**
     * Get the admin page of a product.
     *
     * @since 1.0.0
     *
     * @param int $product_id Product ID.
     *
     * @return string
     */
    protected function product_edit_url(int $product_id)
    {
        return admin_url('admin.php?page=kirki-ecommerce#/products/' . $product_id);
    }
}
