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
use Kirki\Ecommerce\App\Wordpress\SiteRoute;

$shop_page_url = SiteRoute::url('shop');
$data = SiteRoute::route_data('data', null);
$products = $data->products->items()->all();
$current_sort_by = $data->filters->sort_by ?? '';
$current_page = $data->products->get_current_page();
$last_page = $data->products->get_last_page();
$has_filters = !empty($_GET);

$sidebar_data = [
    'categories' => $data->categories ?? [],
    'brands' => $data->brands ?? [],
    'filters' => $data->filters,
];
?>

<?php TemplateHelper::get_header(); ?>

<div class="kirki-ecom-page-wrapper">
    <h1><?php echo esc_html__('Shop', 'kirki-ecommerce'); ?></h1>
    
    <?php
    TemplateHelper::load_template(
        'shop.parts.meta',
        [
            'data' => $data,
            'shop_page_url' => $shop_page_url,
            'current_sort_by' => $current_sort_by,
            'has_filters' => $has_filters,
        ]
    )
    ?>

    <div class="kirki-ecom-container">
        <?php // TemplateHelper::load_template('shop/parts/sidebar', $sidebar_data); ?>
        <div class="kirki-ecom-products">
            <?php
            foreach ($products as $product) {
                TemplateHelper::load_template('shop/parts/product-card', ['product' => $product], false);
            }
            ?>
        </div>
    </div>
    <?php
    if ($last_page > 1) :
                /**
                 * Build a pagination URL preserving all current query params.
                 *
                 * @param int    $page     Target page number.
                 * @param string $base_url Base shop URL.
                 * @return string
                 */
                $pagination_url = function ($page) use ($shop_page_url) {
                    $params = $_GET;
                    $params['current_page'] = $page;
                    return $shop_page_url . '?' . http_build_query($params);
                };
        ?>
            <div class="kirki-ecom-pagination">
                    <?php if (!$data->products->on_first_page()) : ?>
                    <a href="<?php echo esc_url($pagination_url($current_page - 1)); ?>" class="kirki-ecom-page-link">&laquo;</a>
                    <?php endif; ?>

                   <?php for ($i = 1; $i <= $last_page; $i++) : ?>
                        <?php if ($i === $current_page) : ?>
                        <span class="kirki-ecom-page-link active"><?php echo esc_html($i); ?></span>
                        <?php else : ?>
                        <a href="<?php echo esc_url($pagination_url($i)); ?>" class="kirki-ecom-page-link"><?php echo esc_html($i); ?></a>
                        <?php endif; ?>
                   <?php endfor; ?>

                   <?php if ($data->products->has_more_page()) : ?>
                    <a href="<?php echo esc_url($pagination_url($current_page + 1)); ?>" class="kirki-ecom-page-link">&raquo;</a>
                   <?php endif; ?>
                </div>
    <?php endif; ?>
</div>

<?php TemplateHelper::get_footer(); ?>