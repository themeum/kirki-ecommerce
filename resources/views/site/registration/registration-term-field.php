<?php

/**
 * Registration Terms and Condition Template Part.
 *
 * @todo will be used later.
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

?>

<div class="kecom-registration-terms-field">
    <label class="kecom-checkbox">
        <input required class="kecom-checkbox-input" x-bind="<?php echo esc_attr(sprintf("register('accept_terms', {
                    required: '%s'
                })", __('You must accept the terms of service', 'kirki-ecommerce'))); ?>" name="accept_terms" type="checkbox">
        <span class="kecom-checkbox-label">
            <?php esc_html_e('I agree to the ', 'kirki-ecommerce'); ?>
            <a href="#" class="kecom-checkbox-link"><?php esc_html_e('Terms of service', 'kirki-ecommerce'); ?></a>
            <?php esc_html_e(' and ', 'kirki-ecommerce'); ?>
            <a href="#" class="kecom-checkbox-link"><?php esc_html_e('Privacy Policy', 'kirki-ecommerce'); ?></a>
        </span>
    </label>
</div>