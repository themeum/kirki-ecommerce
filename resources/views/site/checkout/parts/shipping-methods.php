<?php
/**
 * Payment Methods Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);
?>

<!-- Shipping Methods -->
<div class="kecom-shipping-section">
    <h2 class="kecom-section-title"><?php esc_html_e('Shipping Method', 'kirki-ecommerce'); ?></h2>
    <div class="kecom-shipping-methods">
        <?php foreach ($available_shipping_methods as $shipping) : ?>
            <label class="kecom-radio kecom-shipping-option">
                <input class="kecom-radio-input" 
                        type="radio" 
                        name="shipping_method" 
                        value="<?php echo esc_attr($shipping["id"]); ?>" 
                        x-model="selectedShippingMethod" 
                        @change="setShippingMethod('<?php echo esc_attr($shipping["id"]); ?>')" checked>
                <div class="kecom-radio-label">
                    <span class="kecom-shipping-name">
                        <?php echo esc_html($shipping["name"]); ?>
                    </span>
                </div>
                <div class="kecom-shipping-price">
                    <?php echo esc_html($shipping["cost"]); ?>
                </div>
            </label>
        <?php endforeach; ?>
    </div>
</div>
