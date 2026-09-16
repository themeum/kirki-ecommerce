<?php

/**
 * Order Products Part
 *
 * @package Kirki\Ecommerce\Templates
 *
 * @var array $data
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;

extract($data);

$cart_items  = $cart['items'] ?? [];
$items_count = $cart['items_count'] ?? count($cart_items);
?>

<!-- Product List -->
<div class="kecom-products-section">
    <div class="kecom-products-section-title">
        <h2 class="kecom-section-title">
            <?php esc_html_e('Order Summary', 'kirki-ecommerce'); ?>
            <span class="kecom-text-subdued">(<?php
            /* translators: %d: Number of cart items */
            echo esc_html(sprintf(_n('%d item', '%d items', $items_count, 'kirki-ecommerce'), $items_count));
            ?>)</span>
        </h2>
        <a href="<?php echo esc_url(Url::get_cart_url()); ?>" class="kecom-products-section-modify" aria-label="<?php esc_attr_e('Modify cart', 'kirki-ecommerce'); ?>">
            <?php Icon::render('edit', ['size' => 16]); ?>
        </a>
    </div>
    <div class="kecom-product-list">
        <?php foreach ($cart_items as $item) :
            $product = $item['product'] ?? null;

            if (!$product) {
                continue;
            }

            // Product image from CartResource media.
            $media     = $product['media'] ?? null;
            $image_url = $media['sizes']['thumbnail']['url']
                ?? $media['url']
                ?? (!empty($media['id']) ? wp_get_attachment_image_url($media['id'], 'thumbnail') : null)
                ?: Assets::get_url('images/product-fallback.webp');

            $quantity = $item['quantity'] ?? 1;
            $attributes = $product['attributes'] ?? [];
            ?>
            <div class="kecom-product-item">
                <div class="kecom-product-image-wrapper">
                    <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($product['title'] ?? ''); ?>" class="kecom-product-image">
                    <span class="kecom-product-qty-badge"><?php echo esc_html($quantity); ?></span>
                </div>
                <div class="kecom-product-info">
                    <a href="<?php echo esc_url(Url::get_product_url($product['slug'] ?? '')); ?>" class="kecom-product-name"><?php echo esc_html($product['title'] ?? ''); ?></a>

                    <?php if (!empty($attributes)) : ?>
                        <p class="kecom-product-variant"><?php echo esc_html(implode(' | ', $attributes)); ?></p>
                    <?php endif; ?>

                    <div class="kecom-product-coupons" x-cloak>
                        <template x-for="appliedProductCoupon in (getItem(<?php echo (int) $item['id']; ?>)?.applied_product_coupons || [])" :key="appliedProductCoupon.code">
                            <div class="kecom-product-coupon">
                                <span class="kecom-product-coupon-icon">
                                    <?php Icon::render('tag', ['size' => 12]); ?>
                                </span>
                                <span class="kecom-product-coupon-text" x-text="formatCouponDiscount(appliedProductCoupon)"></span>
                            </div>
                        </template>
                    </div>
                </div>
                <div class="kecom-product-price-wrapper">
                    <span class="kecom-product-price" x-text="getItem(<?php echo (int) $item['id']; ?>)?.display_subtotal_money_object?.display"></span>
                    <span class="kecom-product-discount"
                        x-show="Boolean(getItem(<?php echo (int) $item['id']; ?>)?.display_strikethrough_price_money_object?.display)"
                        x-text="getItem(<?php echo (int) $item['id']; ?>)?.display_strikethrough_price_money_object?.display"
                        x-cloak></span>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>