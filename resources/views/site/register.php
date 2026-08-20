<?php

/**
 * Registration Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\session;

?>

<?php Template::get_header(); ?>

<div class="kecom-auth-container">
    <div class="kecom-auth-form-wrapper">
        <div class="kecom-auth-header">
            <h3 class="kecom-auth-header-title"><?php _e('Sign up', 'kirki-ecommerce'); ?></h3>
            <div class="kecom-auth-header-content">
                <span><?php _e('Already have an account?', 'kirki-ecommerce'); ?></span>
                <a href="<?php echo esc_url(Url::get_login_url()); ?>">
                    <?php _e('Login', 'kirki-ecommerce'); ?>
                </a>
            </div>
            <!-- Errors -->
            <?php if (session()->has('errors')) : ?>
                <div class="kecom-alert kecom-alert-error">
                    <?php Icon::render('information'); ?>
                    <?php foreach (session('errors') as $error) : ?>
                        <?php echo esc_html($error); ?>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        <form class="kecom-auth-form" x-data="form({
            defaultValues: {
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                password_confirmation: '',
                ajax_nonce: window.kirki_ecommerce.ajax_nonce,
            },
            mode: 'onChange'
        })" method="post" @submit.prevent="handleSubmit(() => $el.submit(), () => { return false; })">
            <input type="hidden" name="ajax_nonce" x-bind="register('ajax_nonce')">
            <div class="kecom-field" :class="errors.first_name ? 'kecom-field-error-state' : ''">
                <label class="kecom-field-label" for="kecom-first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                <input class="kecom-input" type="text" id="kecom-first-name" name="first_name" x-bind="<?php printf("register('first_name', {
                    required: '%s'
                })", __('First name is required', 'kirki-ecommerce')) ?>" placeholder="<?php esc_html_e('First name', 'kirki-ecommerce'); ?>">
                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
            </div>
            <div class="kecom-field" :class="errors.last_name ? 'kecom-field-error-state' : ''">
                <label class="kecom-field-label" for="kecom-last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                <input class="kecom-input" type="text" id="kecom-last-name" name="last_name" x-bind="<?php printf("register('last_name', {
                    required: '%s'
                })", __('Last name is required', 'kirki-ecommerce')) ?>" placeholder="<?php esc_html_e('Last name', 'kirki-ecommerce'); ?>">
                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
            </div>
            <div class="kecom-field" :class="errors.email ? 'kecom-field-error-state' : ''">
                <label class="kecom-field-label" for="kecom-email"><?php esc_html_e('Email', 'kirki-ecommerce'); ?></label>
                <input class="kecom-input" type="email" id="kecom-email" name="email" x-bind="<?php printf("register('email', {
                    required: '%s',
                    email: true
                })", __('Email is required', 'kirki-ecommerce')) ?>" placeholder="<?php esc_html_e('name@example.com', 'kirki-ecommerce'); ?>">
                <span class="kecom-field-error" x-show="errors.email" x-text="errors.email"></span>
            </div>
            <div class="kecom-field" :class="errors.password ? 'kecom-field-error-state' : ''">
                <div class="kecom-password-field-label">
                    <label class="kecom-field-label" for="kecom-password"><?php esc_html_e('Password', 'kirki-ecommerce'); ?></label>
                </div>
                <div class="kecom-password-input" x-data="{ showPassword: false }">
                    <input class="kecom-input" :type="showPassword ? 'text' : 'password'" id="kecom-password" name="password" x-bind="<?php printf("register('password', {
                    required: '%s',
                    minLength: { value: 8, message: '%s' }
                })", __('Password is required', 'kirki-ecommerce'), __('Minimum password length is 8 characters', 'kirki-ecommerce')) ?>" placeholder="<?php _e('Type your password', 'kirki-ecommerce'); ?>">
                    <template x-if="showPassword">
                        <span class="kecom-password-input-show" @click="showPassword = false"><?php Icon::render('eye'); ?></span>
                    </template>
                    <template x-if="!showPassword">
                        <span class="kecom-password-input-show" @click="showPassword = true"><?php Icon::render('eye-off'); ?></span>
                    </template>
                </div>
                <span class="kecom-field-error" x-show="errors.password" x-text="errors.password"></span>
            </div>
            <div class="kecom-field" :class="errors.password_confirmation ? 'kecom-field-error-state' : ''">
                <div class="kecom-password-field-label">
                    <label class="kecom-field-label" for="kecom-password_confirmation"><?php esc_html_e('Confirm Password', 'kirki-ecommerce'); ?></label>
                </div>
                <div class="kecom-password-input" x-data="{ showPassword: false }">
                    <input class="kecom-input" :type="showPassword ? 'text' : 'password'" id="kecom-password_confirmation" name="password_confirmation" x-bind="<?php printf("register('password_confirmation', {
                    required: '%s',
                    validate: (value) => value === values.password || '%s'
                })", __('Confirm password is required', 'kirki-ecommerce'), __('Password does not match', 'kirki-ecommerce')) ?>" placeholder="<?php _e('Confirm your password', 'kirki-ecommerce'); ?>">
                    <template x-if="showPassword">
                        <span class="kecom-password-input-show" @click="showPassword = false"><?php Icon::render('eye'); ?></span>
                    </template>
                    <template x-if="!showPassword">
                        <span class="kecom-password-input-show" @click="showPassword = true"><?php Icon::render('eye-off'); ?></span>
                    </template>
                </div>
                <span class="kecom-field-error" x-show="errors.password_confirmation" x-text="errors.password_confirmation"></span>
            </div>
            <button type="submit" class="kecom-btn kecom-btn-primary" :disable="isSubmitting"><?php esc_html_e('Sign up', 'kirki-ecommerce'); ?></button>
        </form>
    </div>
</div>

<?php Template::get_footer(); ?>