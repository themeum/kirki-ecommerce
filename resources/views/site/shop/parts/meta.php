<?php

/**
 * Shop Page Meta Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

use Kirki\Ecommerce\App\Supports\Icon;

defined('ABSPATH') || exit;

$current_sort_by = $data['current_sort_by'] ?? 'recommended';
$has_filters = $data['has_filters'] ?? false;
$search = $data['search'] ?? '';

$short_by_options = ['recommended', 'low_to_high', 'high_to_low'];
$current_sort_by = in_array($current_sort_by, $short_by_options, true) ? $current_sort_by : 'recommended';
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
    
    <div class="kecom-products-page-meta-right">
        <!-- Search toggle -->
        <div class="kecom-products-search" x-data>
            <button
                type="button"
                class="kecom-btn kecom-btn-outline kecom-btn-icon kecom-products-search-btn"
                :class="{ 'is-visible': searchBtnVisible }"
                @click="openSearch()"
                aria-label="<?php esc_attr_e('Open search', 'kirki-ecommerce'); ?>"
            >
                <?php Icon::render('search') ?>
            </button>
            <div
                class="kecom-products-search-field"
                :class="{ 'is-open': searchOpen }"
            >
                <?php Icon::render('search', ['class' => 'kecom-products-search-field-icon']); ?>
                <input
                    id="kecom-search-input"
                    type="text"
                    class="kecom-products-search-input"
                    placeholder="<?php esc_html_e('Search products...', 'kirki-ecommerce'); ?>"
                    name="search"
                    x-model="searchQuery"
                    @keydown.enter.prevent="search()"
                    @keydown.escape="closeSearch()"
                    value="<?php echo esc_attr($search); ?>"
                >
                <button
                    type="button"
                    class="kecom-products-search-clear"
                    :class="{ 'is-visible': searchQuery }"
                    @click="applySearch('')"
                    aria-label="<?php esc_attr_e('Clear search', 'kirki-ecommerce'); ?>"
                >
                    <?php Icon::render('cross', ['size' => 14]); ?>
                </button>
            </div>
        </div>
    
        <div class="kecom-products-page-meta-sortby">
            <label for="sort_by"><?php esc_html_e('Sort by:', 'kirki-ecommerce'); ?></label>
            <select name="sort_by" id="sort_by" x-model="sortBy" @change="applySort($event.target.value)">
                <option value="recommended" <?php selected($current_sort_by, 'recommended'); ?>><?php esc_html_e('Recommended', 'kirki-ecommerce'); ?></option>
                <option value="low_to_high" <?php selected($current_sort_by, 'low_to_high'); ?>><?php esc_html_e('Price: Low to High', 'kirki-ecommerce'); ?></option>
                <option value="high_to_low" <?php selected($current_sort_by, 'high_to_low'); ?>><?php esc_html_e('Price: High to Low', 'kirki-ecommerce'); ?></option>
            </select>
        </div>
    </div>
</div>
