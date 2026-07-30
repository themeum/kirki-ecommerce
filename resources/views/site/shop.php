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

use Kirki\Ecommerce\App\Supports\Icon;
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

<?php Template::get_header();
?>

<div class="kecom-products-page">
    <div class="kecom-container">
        <nav class="kecom-breadcrumb" aria-label="<?php echo esc_attr__('Breadcrumb', 'kirki-ecommerce'); ?>">
            <ol class="kecom-breadcrumb-list">
                <li class="kecom-breadcrumb-item">
                    <a class="kecom-breadcrumb-link" href="<?php echo esc_url(home_url('/')); ?>">
                        <?php echo esc_html__('Home', 'kirki-ecommerce'); ?>
                    </a>
                </li>
                <li class="kecom-breadcrumb-item" aria-current="page">
                    <?php echo esc_html__('Shop', 'kirki-ecommerce'); ?>
                </li>
            </ol>
        </nav>

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
            <?php
            foreach ($products as $product) {
                include_view('site.shop.parts.product-card', ['product' => $product]);
            }
            ?>
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
            <div class="kecom-pagination">
                <?php if (!$data->products->on_first_page()) : ?>
                    <a href="<?php echo esc_url($pagination_url($current_page - 1)); ?>" class="kecom-page-link">
                        <?php Icon::render('chevron-left'); ?>
                    </a>
                <?php endif; ?>

                <?php for ($i = 1; $i <= $last_page; $i++) : ?>
                    <?php if ($i === $current_page) : ?>
                        <span class="kecom-page-link active"><?php echo esc_html($i); ?></span>
                    <?php else : ?>
                        <a href="<?php echo esc_url($pagination_url($i)); ?>" class="kecom-page-link"><?php echo esc_html($i); ?></a>
                    <?php endif; ?>
                <?php endfor; ?>

                <?php if ($data->products->has_more_page()) : ?>
                    <a href="<?php echo esc_url($pagination_url($current_page + 1)); ?>" class="kecom-page-link">
                        <?php Icon::render('chevron-right'); ?>
                    </a>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php Template::get_footer();
?>
