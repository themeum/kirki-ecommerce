<?php

/**
 * Shop Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Helpers\TemplateHelper;
use Kirki\Ecommerce\Wordpress\SiteRoute;

$page     = SiteRoute::route_param('page', 1);
$products = SiteRoute::route_data('products', []);
?>

<?php TemplateHelper::get_header(); ?>

<div style="max-width:960px;margin:2rem auto;padding:0 1.5rem;">

    <h1><?php echo esc_html__('Shop', 'kirki-ecommerce'); ?></h1>

    <?php if (!empty($products)) : ?>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.25rem;margin-top:1.5rem;">
            <?php foreach ($products as $product) : ?>
                <?php TemplateHelper::load_template('shop/parts/product-card', ['product' => $product], false); ?>
            <?php endforeach; ?>
        </div>
    <?php else : ?>
        <p style="color:#71717a;"><?php echo esc_html__('No products found.', 'kirki-ecommerce'); ?></p>
    <?php endif; ?>

</div>

<?php TemplateHelper::get_footer(); ?>
