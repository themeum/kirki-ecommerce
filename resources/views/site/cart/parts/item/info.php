<?php

/**
 * Cart Item Quantity Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

$product = $data['product'] ?? [];
$categories = $product['categories'] ?? [];
$attributes = $product['attributes'] ?? [];
$item = $data['item'] ?? [];
$unit_price = $data['unit_price'] ?? '';
?>

<div class="kecom-cart-item-info">
    <div class="kecom-cart-item-details">
        <a href="<?php echo esc_url(Url::get_product_url($product['slug'])); ?>" class="kecom-cart-item-details-title"><?php echo esc_html($product['title']); ?></a>
        <?php if (!empty($categories)) : ?>
            <span class="kecom-cart-item-details-categories"><?php echo esc_html($categories[count($categories) - 1]['name']); ?></span>
        <?php endif; ?>

        <?php if (!empty($attributes)) : ?>
            <span class="kecom-cart-item-details-attributes"><?php echo esc_html(implode(" • ", $attributes)); ?></span>
        <?php endif; ?>

    </div>
    <div class="kecom-cart-item-pricing">
        <template x-if="cartData.formatted_items['<?php echo $item['id']; ?>'].total !== cartData.formatted_items['<?php echo $item['id']; ?>'].product_total">
            <div class="kecom-cart-item-pricing-wrapper">
                <span class="kecom-cart-item-pricing-total" x-text="cartData.formatted_items['<?php echo $item['id']; ?>'].total"></span>
                <span class="kecom-cart-item-pricing-product-total" x-text="cartData.formatted_items['<?php echo $item['id']; ?>'].product_total"></span>
            </div>
        </template>
        <template x-if="cartData.formatted_items['<?php echo $item['id']; ?>'].total === cartData.formatted_items['<?php echo $item['id']; ?>'].product_total">
            <h6 class="kecom-cart-item-pricing-total" x-text="cartData.formatted_items['<?php echo $item['id']; ?>'].total"></h6>
        </template>
        <h6 class="kecom-cart-item-pricing-each"><?php printf(__('%s each', 'kirki-ecommerce'), $unit_price) ?></h6>
    </div>
</div>