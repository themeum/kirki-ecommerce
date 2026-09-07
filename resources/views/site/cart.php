<?php

/**
 * Cart Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;


use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$cart = view_data('cart');
$items = $cart['items'] ?? [];

?>
<?php Template::get_header(); ?>
<div class="kecom-cart-page" x-data='cart()'>
    <?php if (!empty($items)) : ?>
        <div class="kecom-cart-grid">
            <!-- Left Part -->
            <div class="kecom-cart-items" x-data="{maxItems: 3}">
                <div class="kecom-cart-items-header">
                    <div class="kecom-cart-items-header-title">
                        <h4 class="kecom-cart-items-header-title-heading"><?php _e('Your Cart', 'kirki-ecommerce'); ?></h4>
                        <span class="kecom-cart-items-header-title-count" x-text="`(${cartData.items_count})`"></span>
                    </div>
                    <div class="kecom-cart-items-header-actions">
                        <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-cart-items-header-actions-link"><?php _e('Continue Shopping', 'kirki-ecommerce'); ?></a>
                    </div>
                </div>
                <div>
                    <?php include_view('site.cart.parts.cart-item'); ?>
                </div>
                <div class="kecom-cart-items-expand-btn">
                    <button class="kecom-btn kecom-btn-link" x-text="cartData.items.length - maxItems <= 0 ? '<?php echo esc_html__('Show less', 'kirki-ecommerce'); ?>' : '<?php echo esc_html__('Show more', 'kirki-ecommerce'); ?> (' + (cartData.items.length - maxItems) + ')'" @click="maxItems = cartData.items.length - maxItems <= 0 ? 3 : cartData.items.length"></button>
                </div>
            </div>
            
            <!-- Right Part -->
            <?php include_view('site.cart.parts.cart-summary'); ?>
        </div>
    <?php else : ?>
        <div class="kecom-cart-empty">
            <div class="kecom-cart-empty-icon">
                <img src="<?php echo esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/empty-cart.svg'); ?>" alt="<?php esc_attr_e('Cart is empty', 'kirki-ecommerce'); ?>" width="88" height="88">
            </div>
            <h4 class="kecom-cart-empty-title"><?php esc_html_e('Your cart is empty', 'kirki-ecommerce'); ?></h4>
            <p class="kecom-cart-empty-desc"><?php esc_html_e('Looks like you haven\'t added anything to your cart yet.', 'kirki-ecommerce'); ?></p>
            <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary">
                <?php esc_html_e('Continue shopping', 'kirki-ecommerce'); ?>
            </a>
        </div>
    <?php endif; ?>
</div>
<?php Template::get_footer(); ?>