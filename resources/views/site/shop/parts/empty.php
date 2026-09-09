<?php

/**
 * Shop - Empty Products State Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\request;

$has_filters = !empty(request()->text('search'))
    || (!empty(request()->text('sort_by')) && request()->text('sort_by') !== 'recommended')
    || !empty(request()->text('category'))
    || !empty(request()->text('brand'))
    || !empty(request()->text('min_price'))
    || !empty(request()->text('max_price'))
    || !empty(request()->text('attribute'));
?>

<div class="kecom-products-empty">
    <div class="kecom-products-empty-icon">
        <img src="<?php echo esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/empty-product.svg'); ?>" alt="<?php esc_attr_e('No products found', 'kirki-ecommerce'); ?>" width="88" height="88">
    </div>

    <?php if ($has_filters) : ?>
        <h3 class="kecom-products-empty-title"><?php esc_html_e('No matching products found', 'kirki-ecommerce'); ?></h3>
        <p class="kecom-products-empty-desc"><?php esc_html_e('We couldn\'t find any products matching your search or filter criteria.', 'kirki-ecommerce'); ?></p>
        <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-primary">
            <?php esc_html_e('Clear all filters', 'kirki-ecommerce'); ?>
        </a>
    <?php else : ?>
        <h3 class="kecom-products-empty-title"><?php esc_html_e('No products yet', 'kirki-ecommerce'); ?></h3>
        <p class="kecom-products-empty-desc"><?php esc_html_e('There are currently no products available in our shop. Please check back soon!', 'kirki-ecommerce'); ?></p>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="kecom-btn kecom-btn-primary">
            <?php esc_html_e('Back to Home', 'kirki-ecommerce'); ?>
        </a>
    <?php endif; ?>
</div>
