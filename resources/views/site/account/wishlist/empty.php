<?php

/**
 * Account Wishlist - Empty State Partial.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;
?>

<div class="kecom-card kecom-orders-empty-card">
    <div class="kecom-orders-empty-state">
        <div class="kecom-orders-empty-icon">
            <img src="<?php echo esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/empty-wishlist.svg'); ?>" alt="<?php esc_attr_e('Your Wishlist is empty', 'kirki-ecommerce'); ?>" width="88" height="88">
        </div>
        <h3 class="kecom-orders-empty-title"><?php esc_html_e('Your Wishlist is empty', 'kirki-ecommerce'); ?></h3>
        <p class="kecom-orders-empty-desc"><?php esc_html_e('Save items you love by tapping the heart icon on any product. They\'ll show up here.', 'kirki-ecommerce'); ?></p>
        <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary">
            <?php esc_html_e('Start shopping', 'kirki-ecommerce'); ?>
        </a>
    </div>
</div>
