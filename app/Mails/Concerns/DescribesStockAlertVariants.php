<?php

namespace Kirki\Ecommerce\App\Mails\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Supports\Url;

/**
 * Builds the template variables of a stock alert about one or more variants.
 *
 * @since 1.0.0
 */
trait DescribesStockAlertVariants
{
    /** @var Variant[] */
    protected $variants = [];

    /**
     * Get the template variables describing the alert's variants.
     *
     * Single-value variables list the distinct values of every variant. The
     * restock link opens the product when all variants belong to one product,
     * otherwise the products list.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function get_stock_alert_variables()
    {
        $variants = array_map(fn(Variant $variant) => VariantResource::make($variant), $this->variants);
        $product_ids = array_values(array_unique(array_map(fn(Variant $variant) => (int) $variant->product_id, $this->variants)));
        $restock_url = count($product_ids) === 1 ? Url::get_product_edit_url($product_ids[0]) : Url::get_products_admin_url();
        $single_variant = count($variants) === 1 ? $variants[0] : null;

        return [
            'variants' => $variants,
            'product_name' => $this->join_distinct(array_map(fn(Variant $variant) => (string) ($variant->product->title ?? ''), $this->variants)),
            'variant_name' => $single_variant ? implode(', ', $single_variant['attribute_value_labels']) : '',
            'sku' => $this->join_distinct(array_map(fn(Variant $variant) => (string) $variant->sku, $this->variants)),
            'available_quantity' => $single_variant ? $single_variant['available_quantity'] : '',
            'product_restock_link' => $this->get_content('emails.parts.link', [
                'label' => __('Restock Now', 'kirki-ecommerce'),
                'link' => $restock_url,
            ]),
            'product_restock_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Restock Now', 'kirki-ecommerce'),
                'link' => $restock_url,
            ]),
            'product_stock_info' => $this->get_content('emails.parts.product.stock-info', ['variants' => $variants]),
        ];
    }

    /**
     * Join the distinct, non-empty values with commas.
     *
     * @since 1.0.0
     *
     * @param string[] $values Values to join.
     * @return string
     */
    protected function join_distinct(array $values)
    {
        return implode(', ', array_unique(array_filter($values, fn($value) => $value !== '')));
    }
}
