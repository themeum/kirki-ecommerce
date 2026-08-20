<?php

/**
 * Account Orders - Empty State Partial.
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
            <img src="<?php echo esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/empty-state.svg'); ?>" alt="<?php esc_attr_e('No orders yet', 'kirki-ecommerce'); ?>" width="88" height="88">
        </div>
        <h3 class="kecom-orders-empty-title"><?php esc_html_e('No orders yet', 'kirki-ecommerce'); ?></h3>
        <p class="kecom-orders-empty-desc"><?php esc_html_e('When you place an order, it will appear here.', 'kirki-ecommerce'); ?></p>
        <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary">
            <?php esc_html_e('Start shopping', 'kirki-ecommerce'); ?>
        </a>
    </div>
</div>
