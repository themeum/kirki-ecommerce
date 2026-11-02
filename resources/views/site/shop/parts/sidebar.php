<?php

/**
 * Shop Sidebar Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 *
 * @var array $data comes from shop.php file.
 */

use Kirki\Ecommerce\App\Supports\Template;

defined('ABSPATH') || exit;


$categories = $data['categories'] ?? [];
$brands = $data['brands'] ?? [];
$selected_category_ids = $data['filters']->category_ids ?? [];
$selected_brand_ids = $data['filters']->brand_ids ?? [];
?>
<div class="kirki-ecom-shop-sidebar" x-data="shopSidebar" @change="applyFilters($event)">
    <?php Template::render_category_filter(__('Categories', 'kirki-ecommerce'), 'kirki-shop-sidebar-categories', 2); ?>

    <h3><?php esc_html_e('Brands', 'kirki-ecommerce'); ?></h3>
    <div>
        <?php foreach ($brands as $brand) : ?>
            <div class="kirki-ecom-sidebar-list">
                <label for="brand_<?php echo esc_attr($brand->id); ?>">
                    <input type="checkbox" id="brand_<?php echo esc_attr($brand->id); ?>" name="brand_ids[]" value="<?php echo esc_attr($brand->id); ?>"<?php checked(in_array($brand->id, $selected_brand_ids)); ?>>
                    <div><?php echo esc_html($brand->name); ?></div>
                </label>
            </div>
        <?php endforeach; ?>
    </div>

    <?php Template::render_attribute_filters(''); ?>
</div>
