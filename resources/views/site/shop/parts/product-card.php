<?php

/**
 * Product Card Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 *
 * @var array $data comes from shop.php via list.php.
 *            Each product is a ShopProductResource array.
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Icon;

$product = $data['product'] ?? null;

if (! is_array($product) || empty($product)) {
    return;
}

$title                   = $product['title'];
$product_url             = $product['product_url'];
$image_url               = ! empty( $product['image_url'] ) ? $product['image_url'] : Assets::get_url('images/product-fallback.webp');
$ribbon_text             = $product['ribbon_text'];
$category_name           = $product['category_name'];
$display_price           = $product['display_price'];
$formatted_regular_price = $product['formatted_regular_price'];
$in_sale                 = $product['in_sale'];
$out_of_stock            = $product['out_of_stock'];
$has_variants            = $product['has_variants'];
$variant_id              = $product['variant_id'];
$cart_url                = $product['cart_url'];
?>
<div class="kecom-product-card">
    <a href="<?php echo esc_url($product_url); ?>" class="kecom-product-card-image">
        <?php if (!empty($ribbon_text)) : ?>
            <span class="kecom-product-card-ribbon"><?php echo esc_html($ribbon_text); ?></span>
        <?php endif; ?>
        <?php if ($image_url) : ?>
            <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($title); ?>" loading="lazy">
        <?php endif; ?>
    </a>

    <div class="kecom-product-card-body">
        <?php if ($category_name) : ?>
            <span class="kecom-product-card-category"><?php echo esc_html($category_name); ?></span>
        <?php endif; ?>
        <a href="<?php echo esc_url($product_url); ?>" class="kecom-product-card-title"><?php echo esc_html($title); ?></a>
    </div>

    <div class="kecom-product-card-footer">
        <div class="kecom-product-card-price-wrapper">
            <span class="kecom-product-card-price">
                <?php echo esc_html($display_price); ?>
            </span>
            <?php if ($in_sale) : ?>
                <span class="kecom-product-card-price-discount"><?php echo esc_html($formatted_regular_price); ?></span>
            <?php endif; ?>
        </div>
        <?php if ($has_variants || $out_of_stock) { ?>
            <a href="<?php echo esc_url($product_url); ?>" class="kecom-btn kecom-btn-primary kecom-btn-block kecom-product-card-add-to-cart">
                <span><?php esc_html_e('Details', 'kirki-ecommerce'); ?></span>
            </a>
        <?php } else { ?>
        <div x-data="addToCart({ variantId: <?php echo esc_attr($variant_id); ?>, cartUrl: '<?php echo esc_url($cart_url); ?>', buttonText: '<?php echo esc_html__('Add to Cart', 'kirki-ecommerce'); ?>', imageUrl: '<?php echo esc_url( $image_url ); ?>', containerClass: 'kecom-products-page' })">
            <button
                type="button"
                class="kecom-btn kecom-btn-primary kecom-btn-block kecom-product-card-add-to-cart"
                @click="add(1)"
                :disabled="loading"
                :class="{ 'kecom-btn-loading': loading }"
            >
                <?php Icon::render('cart'); ?>
                <span x-text="buttonText"></span>
            </button>
        </div>
        <?php } ?>
    </div>
</div>
