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
?>

<div class="kirki-ecom-shop-page-meta">
    <div>
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

        esc_html_e('Reliable gear for every journey. Filter to find your ideal match.', 'kirki-ecommerce');
        ?>
    </div>
    
    <div>
        <div style="display: flex;gap:15px;align-items:center;">
            <select name="sort_by" id="sort_by">
                <option value="recommended" <?php selected($current_sort_by, 'recommended'); ?>><?php esc_html_e('Recommended', 'kirki-ecommerce'); ?></option>
                <option value="low_to_high" <?php selected($current_sort_by, 'low_to_high'); ?>><?php esc_html_e('Price: Low to High', 'kirki-ecommerce'); ?></option>
                <option value="high_to_low" <?php selected($current_sort_by, 'high_to_low'); ?>><?php esc_html_e('Price: High to Low', 'kirki-ecommerce'); ?></option>
            </select>
            <?php //if ($has_filters) : ?>
                <!-- <a style="font-size: 15px;white-space: nowrap;" href="<?php echo esc_url($shop_page_url); ?>"><?php esc_html_e('Clear Filters', 'kirki-ecommerce'); ?></a> -->
            <?php //endif; ?>
        </div>
    </div>
</div>

<script>
(function() {
    const shopMeta = document.querySelector('.kirki-ecom-shop-page-meta');
    if (!shopMeta) return;

    shopMeta.addEventListener('change', function (e) {
        if (!e.target.matches('select[name="sort_by"]')) return;

        const params = new URLSearchParams(window.location.search);

        // Update sort
        params.set('sort_by', e.target.value);

        // Reset pagination
        params.delete('current_page');

        const queryString = params.toString();
        const url = window.location.pathname + (queryString ? '?' + queryString : '');

        window.location.href = url;
    });
})();
</script>