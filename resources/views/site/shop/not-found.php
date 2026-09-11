<?php

/**
 * Shop - Product Not Found Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

Template::get_header();
?>

<div class="kecom-product-not-found">
    <div class="kecom-product-not-found-state">
        <div class="kecom-product-not-found-icon">
            <img src="<?php echo esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/empty-product.svg'); ?>" alt="<?php esc_attr_e('Product not found', 'kirki-ecommerce'); ?>" width="88" height="88">
        </div>
        <h1 class="kecom-product-not-found-title"><?php esc_html_e('Product not found', 'kirki-ecommerce'); ?></h1>
        <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary kecom-btn-lg">
            <?php esc_html_e('Browse Products', 'kirki-ecommerce'); ?>
        </a>
    </div>
</div>

<?php Template::get_footer(); ?>
