<?php

/**
 * Cart Items Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;

?>
<div class="kecom-cart-items-header">
    <div class="kecom-cart-items-header-title">
        <h4 class="kecom-cart-items-header-title-heading"><?php _e('Your Cart', 'kirki-ecommerce'); ?></h4>
        <span class="kecom-cart-items-header-title-count" x-text="`(${cartData.items_count})`"></span>
    </div>
    <div class="kecom-cart-items-header-actions">
        <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-cart-items-header-actions-link"><?php _e('Continue Shopping', 'kirki-ecommerce'); ?></a>
    </div>
</div>