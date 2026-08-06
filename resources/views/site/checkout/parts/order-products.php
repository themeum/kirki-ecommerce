<?php
/**
 * Order Products Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\Url;

$cart_items = $cart['items'] ?? [];
$items_count = $cart['items_count'] ?? count($cart_items);
$currency_code = $cart['currency']['code'] ?? 'USD';
?>

<!-- Product List -->
<div class="kecom-products-section">
    <div class="kecom-products-section-title">
        <h2 class="kecom-section-title"><?php esc_html_e('Order Summary', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php echo esc_html($items_count); ?>)</span></h2>
        <a href="<?php echo esc_url(Url::get_cart_url()); ?>" class="kecom-products-section-modify"><?php esc_html_e('Modify', 'kirki-ecommerce'); ?></a>
    </div>
    <div class="kecom-product-list">
        <?php foreach ($cart_items as $item) :
            $product = $item['product'] ?? null;

            if (!$product) {
                continue;
            }

            // Product image from CartResource media.
            $media = $product['media'] ?? null;
            $image_url = null;

            if (!empty($media['url'])) {
                $image_url = $media['url'];
            } elseif (!empty($media['id'])) {
                $image_url = wp_get_attachment_image_url($media['id'], 'thumbnail');
            }

            if (!$image_url) {
                $image_url = Assets::get_url('images/product-fallback.webp');
            }

            // Prices from CartResource.
            $price = $product['price'] ?? 0;
            $sale_price = $product['sale_price'] ?? 0;
            $quantity = $item['quantity'] ?? 1;
            $item_total = $item['total'] ?? 0;
            $item_subtotal = $item['subtotal'] ?? 0;

            $formatted_total = Money::format_from_decimal($item_total, $currency_code);
            $has_sale = $sale_price->isGreaterThan(0) && !$sale_price->isEqualTo($price);
            $formatted_regular_total = $has_sale ? Money::format_from_decimal($price->multipliedBy($quantity), $currency_code) : '';
            ?>
        <div class="kecom-product-item">
            <div class="kecom-product-image-wrapper">
                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($product['title'] ?? ''); ?>" class="kecom-product-image">
                <span class="kecom-product-qty-badge"><?php echo esc_html($quantity); ?></span>
            </div>
            <div class="kecom-product-info">
                <a href="<?php echo esc_url(Url::get_product_url($product['slug'])) ?>" class="kecom-product-name"><?php echo esc_html($product['title'] ?? ''); ?></a>
            </div>
            <div class="kecom-product-price-wrapper">
                <span class="kecom-product-price"><?php echo esc_html($formatted_total); ?></span>
                <?php if ($formatted_regular_total) : ?>
                    <span class="kecom-product-discount"><?php echo esc_html($formatted_regular_total); ?></span>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
