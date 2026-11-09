<?php

/**
 * Meta box for adding Kirki Ecommerce shortcodes to a navigation menu.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

$items = $data['items'] ?? [];

?>
<div id="kecom-nav-menu-items" class="posttypediv">
    <div class="tabs-panel tabs-panel-active">
        <ul class="categorychecklist form-no-clear">
            <?php foreach ($items as $index => $item) : ?>
                <?php $placeholder = -1 - (int) $index; ?>
                <li>
                    <label class="menu-item-title">
                        <input type="checkbox" class="menu-item-checkbox" value="1" name="menu-item[<?php echo esc_attr($placeholder); ?>][menu-item-object-id]">
                        <?php echo esc_html($item['label']); ?>
                    </label>
                    <input type="hidden" class="menu-item-type" name="menu-item[<?php echo esc_attr($placeholder); ?>][menu-item-type]" value="custom">
                    <input type="hidden" class="menu-item-title" name="menu-item[<?php echo esc_attr($placeholder); ?>][menu-item-title]" value="<?php echo esc_attr($item['label']); ?>">
                    <input type="hidden" class="menu-item-url" name="menu-item[<?php echo esc_attr($placeholder); ?>][menu-item-url]" value="<?php echo esc_attr($item['url']); ?>">
                    <input type="hidden" class="menu-item-classes" name="menu-item[<?php echo esc_attr($placeholder); ?>][menu-item-classes]" value="<?php echo esc_attr($item['class']); ?>">
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
    <p class="button-controls">
        <span class="add-to-menu">
            <input type="submit" class="button-secondary submit-add-to-menu right" value="<?php esc_attr_e('Add to Menu', 'kirki-ecommerce'); ?>" name="add-post-type-menu-item" id="submit-kecom-nav-menu-items">
            <span class="spinner"></span>
        </span>
    </p>
</div>
