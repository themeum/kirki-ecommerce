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

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$shop_page_url = Url::get_shop_url();
$data = (object) view_data();
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

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper kecom-products-page" x-data="shop()">
    <div class="kecom-container">
        <?php
        include_view(
            'site.shop.parts.breadcrumb',
            [
                'items' => [
                    ['label' => __('Home', 'kirki-ecommerce'), 'url' => home_url('/')],
                ],
                'current' => __('Shop', 'kirki-ecommerce'),
            ]
        );
        ?>

        <div class="kecom-products-page-header">
            <h1 class="kecom-products-page-title">
                <?php echo esc_html__('Shop', 'kirki-ecommerce'); ?>
            </h1>

            <?php
            include_view(
                'site.shop.parts.meta',
                [
                    'data' => $data,
                    'shop_page_url' => $shop_page_url,
                    'current_sort_by' => $current_sort_by,
                    'has_filters' => $has_filters,
                ]
            )
            ?>
        </div>

        <div class="kecom-products-grid">
            <?php include_view('site.shop.parts.list', ['products' => $products]);?>
        </div>

        <div class="kecom-pagination-container">
            <?php Template::render_pagination($data->products); ?>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
