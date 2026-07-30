<?php

/**
 * Shop Page Meta Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;
extract($data);

$current_sort_by = in_array($current_sort_by, ['recommended', 'low_to_high', 'high_to_low'], true) ? $current_sort_by : 'recommended';
$product_filter_config = wp_json_encode(['initialSortBy' => $current_sort_by]);
?>

<div class="kecom-products-page-meta">
    <div class="kecom-products-page-meta-description">
        <?php
        // $first_item = $data->products->first_item();
        // $last_item = $data->products->last_item();
        // $total = $data->products->total();

        // if ($first_item && $last_item) {
        //     /* translators: 1: first item index, 2: last item index, 3: total products */
        //     printf(
        //         esc_html__('Showing %1$d-%2$d of %3$d products', 'kirki-ecommerce'),
        //         $first_item,
        //         $last_item,
        //         $total
        //     );
        // } else {
        //     esc_html_e('No products found', 'kirki-ecommerce');
        // }

        esc_html_e('Reliable gear for every journey. Sort to find your ideal match.', 'kirki-ecommerce');
        ?>
    </div>
    
    <div class="kecom-products-page-meta-sortby" x-data="<?php echo esc_attr('productFilter(' . $product_filter_config . ')'); ?>">
        <label for="sort_by"><?php esc_html_e('Sort by:', 'kirki-ecommerce'); ?></label>
        <select name="sort_by" id="sort_by" x-model="sortBy" @change="applySort($event.target.value)">
            <option value="recommended" <?php selected($current_sort_by, 'recommended'); ?>><?php esc_html_e('Recommended', 'kirki-ecommerce'); ?></option>
            <option value="low_to_high" <?php selected($current_sort_by, 'low_to_high'); ?>><?php esc_html_e('Price: Low to High', 'kirki-ecommerce'); ?></option>
            <option value="high_to_low" <?php selected($current_sort_by, 'high_to_low'); ?>><?php esc_html_e('Price: High to Low', 'kirki-ecommerce'); ?></option>
        </select>
    </div>
</div>
