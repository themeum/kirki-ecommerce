<?php

/**
 * Cart Item Quantity Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

$product        = $data['product'] ?? [];
$attributes     = $product['attributes'] ?? [];
$item           = $data['item'] ?? [];
$unit_price     = $data['unit_price'] ?? '';
$item_id        = esc_attr($item['id'] ?? '');
$formatted_item = "cartData.formatted_items['{$item_id}']";
?>

<div class="kecom-cart-item-info">
    <div class="kecom-cart-item-details">
        <a href="<?php echo esc_url(Url::get_product_url($product['slug'])); ?>" class="kecom-cart-item-details-title"><?php echo esc_html($product['title']); ?></a>
        <?php if (!empty($attributes)) : ?>
            <div class="kecom-cart-item-details-attributes">
                <?php foreach ($attributes as $attribute) : ?>
                    <span><?php echo esc_html($attribute); ?></span>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    <div class="kecom-cart-item-pricing">
        <span class="kecom-cart-item-pricing-total" x-text="<?php echo esc_attr($formatted_item); ?>?.total"></span>
        <span class="kecom-cart-item-pricing-product-total"
            x-show="<?php echo esc_attr($formatted_item); ?>?.total !== <?php echo esc_attr($formatted_item); ?>?.product_total"
            x-text="<?php echo esc_attr($formatted_item); ?>?.product_total"></span>
    </div>
</div>