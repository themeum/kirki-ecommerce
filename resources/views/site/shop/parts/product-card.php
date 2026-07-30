<?php

/**
 * Product Card Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 *
 * @var array $data comes from shop.php file.
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;

if (!isset($data['product']) || !is_object($data['product'])) {
    return;
}

/**
 * @var Product $product.
 */
$product = $data['product'];

$variants = $product->variants()->get();
$variant = $variants->first();

if (!$variant) {
    return;
}

$regular_price = $variant->price;
$sale_price = $variant->sale_price;

$manager = new MoneyManager();
$formatted_regular_price = $manager->format($manager->from_minor($regular_price));

$formatted_sale_price = '';

if ($sale_price > 0) {
    $formatted_sale_price = $manager->format($manager->from_minor($sale_price));
}

$category = $product->categories()->first();
$media = $product->media()->first();
$image_url = null;
if ($media) {
    $image_url = wp_get_attachment_image_url($media->ID, 'thumbnail');
}

$product_url = Url::get_product_url($product->slug);
?>
<div class="kecom-product-card">
    <a href="<?php echo esc_url($product_url); ?>" class="kecom-product-card-image">
        <?php if (!empty($product->ribbon)) : ?>
            <span class="kecom-product-card-ribbon"><?php echo esc_html($product->ribbon); ?></span>
        <?php endif; ?>
        <?php if ($image_url) : ?>
            <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($product->title); ?>">
        <?php endif; ?>
    </a>

    <div class="kecom-product-card-body">
        <?php if ($category) : ?>
            <span class="kecom-product-card-category"><?php echo esc_html($category->name); ?></span>
        <?php endif; ?>
        <a href="<?php echo esc_url($product_url); ?>" class="kecom-product-card-title"><?php echo esc_html($product->title); ?></a>
    </div>

    <div class="kecom-product-card-footer">
        <div class="kecom-product-card-price-wrapper">
            <span class="kecom-product-card-price">
                <?php echo esc_html($sale_price > 0 ? $formatted_sale_price : $formatted_regular_price); ?>
            </span>
            <?php if ($sale_price > 0) : ?>
                <span class="kecom-product-card-price-discount"><?php echo esc_html($formatted_regular_price); ?></span>
            <?php endif; ?>
        </div>
        <button
            type="button"
            class="kecom-btn kecom-btn-primary kecom-btn-sm kecom-product-card-add-to-cart"
            x-data="addToCart({ variantId: <?php echo esc_attr((int) $variant->id); ?>, qty: 1 })"
            @click="add"
            :disabled="loading"
            :class="{ 'kecom-btn-loading': loading }"
        >
            <?php Icon::render('cart'); ?>
            <span x-show="!loading"><?php echo esc_html__('Add', 'kirki-ecommerce'); ?></span>
        </button>
    </div>
</div>
