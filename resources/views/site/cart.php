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
    <div class="kecom-cart-grid">
        <!-- Left Part -->
        <div class="kecom-cart-items">
            <div class="kecom-cart-items-header">
                <div class="kecom-cart-items-header-title">
                    <h4 class="kecom-cart-items-header-title-heading"><?php _e('Your Cart', 'kirki-ecommerce'); ?></h4>
                    <span class="kecom-cart-items-header-title-count" x-text="`(${cartData.items_count})`"></span>
                </div>
                <div class="kecom-cart-items-header-actions">
                    <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-cart-items-header-actions-link"><?php _e('Continue Shopping', 'kirki-ecommerce'); ?></a>
                </div>
            </div>
            <?php if (count($items)) : ?>
                <?php foreach ($items as $item) :
                    include_view('site.cart.parts.cart-item', ['item' => $item]);
                ?>
                <?php endforeach; ?>
            <?php else : ?>
                <h4 class="kecom-cart-items-empty-text"><?php _e('No items currently in cart.', 'kirki-ecommerce'); ?></h4>
            <?php endif; ?>
        </div>
        <!-- Right Part -->
        <?php include_view('site.cart.parts.cart-summary'); ?>
    </div>
</div>
<?php Template::get_footer(); ?>