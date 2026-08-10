<?php

/**
 * Cart Item Image Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Assets;

$media   = $data['media'] ?? [];
$product = $data['product'] ?? [];
?>
<div class="kecom-cart-item-image">
    <?php if (!empty($media) && isset($media['url'])): ?>
        <img src="<?php echo esc_url($media['url']); ?>" alt="<?php echo esc_attr($product['title']); ?>">
    <?php else: ?>
        <img src="<?php echo esc_url(Assets::get_url('images/product-fallback.webp')); ?>" alt="<?php echo esc_attr($product['title']); ?>">
    <?php endif; ?>
</div>