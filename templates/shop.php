<?php

/**
 * Shop Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Helpers\TemplateHelper;
use Kirki\Ecommerce\Wordpress\SiteRoute;

$page = SiteRoute::route_param('page', 1);
$products = SiteRoute::route_data('products', []);
?>

<?php TemplateHelper::get_header(); ?>

<div class="kirki-ecom-page-wrapper">
    <h1><?php echo esc_html__('Shop', 'kirki-ecommerce'); ?></h1>

    <div class="kirki-ecom-products">
        <?php
        foreach ($products as $product) {
            TemplateHelper::load_template('shop/parts/product-card', ['product' => $product], false);
        }
        ?>
    </div>
</div>

<?php TemplateHelper::get_footer(); ?>