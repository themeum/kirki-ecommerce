<?php

/**
 * Contact Information Part for Checkout
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;

$is_logged_in = is_user_logged_in();
$current_user = $is_logged_in ? wp_get_current_user() : null;
$user_name    = $current_user ? (trim($current_user->first_name . ' ' . $current_user->last_name) ?: $current_user->display_name) : '';
$user_email   = $current_user ? $current_user->user_email : '';
$avatar_url   = $current_user ? get_avatar_url($current_user->ID, array('size' => 96)) : '';
$login_url    = Url::get_login_url(Url::get_checkout_url());
?>

<div class="kecom-contact-section">
    <div class="kecom-contact-header">
        <h2 class="kecom-section-title"><?php esc_html_e('Contact', 'kirki-ecommerce'); ?></h2>
        <?php if (! $is_logged_in) : ?>
            <span class="kecom-contact-login-prompt">
                <?php esc_html_e('Already have an account?', 'kirki-ecommerce'); ?>
                <a href="<?php echo esc_url($login_url); ?>" class="kecom-link"><?php esc_html_e('Login', 'kirki-ecommerce'); ?></a>
            </span>
        <?php endif; ?>
    </div>

    <?php if ($is_logged_in) : ?>
        <div class="kecom-contact-user-card">
            <?php if ($avatar_url) : ?>
                <img class="kecom-contact-avatar" src="<?php echo esc_url($avatar_url); ?>" alt="<?php echo esc_attr($user_name); ?>" width="44" height="44">
            <?php endif; ?>
            <div class="kecom-contact-user-info">
                <span class="kecom-contact-user-name"><?php echo esc_html($user_name); ?></span>
                <span class="kecom-contact-user-email"><?php echo esc_html($user_email); ?></span>
            </div>
        </div>
    <?php else : ?>
        <form id="contact-form" class="kecom-contact-form kecom-form" x-data="form({
            defaultValues: {
                customer_email: ''
            },
            mode: 'onChange'
        })" x-on:kecom:contact-form:validate.window="await validateForm(); $dispatch('kecom:contact-form:validated', { isValid })">
            <div class="kecom-field" x-bind="fieldWrapper('customer_email')">
                <label class="kecom-field-label" for="contact-email"><?php esc_html_e('Email address', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="email"
                    id="contact-email"
                    name="customer_email"
                    placeholder="you@email.com"
                    x-bind="register('customer_email', {
                        required: '<?php esc_html_e('Email address is required', 'kirki-ecommerce'); ?>',
                        email: '<?php esc_html_e('Please enter a valid email address', 'kirki-ecommerce'); ?>'
                    })">
                <span class="kecom-field-error" x-show="errors.customer_email" x-text="errors.customer_email"></span>
                <span class="kecom-field-help"><?php esc_html_e('You are currently checking out as a guest.', 'kirki-ecommerce'); ?></span>
            </div>
        </form>
    <?php endif; ?>
</div>
