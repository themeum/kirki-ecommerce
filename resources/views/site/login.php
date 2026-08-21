<?php

/**
 * Login Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;

use function Kirki\Ecommerce\Framework\request;
use function Kirki\Ecommerce\Framework\session;
?>

<?php Template::get_header(); ?>

<div class="kecom-auth-container">
    <div class="kecom-auth-form-wrapper">
        <div class="kecom-auth-header">
            <h3 class="kecom-auth-header-title"><?php esc_html_e('Login', 'kirki-ecommerce'); ?></h3>
            <?php if (Utils::registration_enabled()) : ?>
                <div class="kecom-auth-header-content">
                    <span><?php esc_html_e('Don\'t have an account?', 'kirki-ecommerce'); ?></span>
                    <a href="<?php echo esc_url(Url::get_registration_url()); ?>">
                        <?php esc_html_e('Sign up', 'kirki-ecommerce'); ?>
                    </a>
                </div>
            <?php endif; ?>
            <?php if (session()->has('errors')) : ?>
                <div class="kecom-alert kecom-alert-error">
                    <?php Icon::render('information'); ?>
                    <?php foreach (session('errors') as $error) : ?>
                        <?php echo esc_html($error); ?>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if (session()->has('success')) : ?>
                <div class="kecom-alert kecom-alert-success">
                    <?php Icon::render('information'); ?>
                    <?php echo esc_html(session('success')); ?>
                </div>
            <?php endif; ?>
        </div>
        <form class="kecom-auth-form" x-data="form({
            defaultValues: {
                email: '',
                password: '', 
                remember: '',
                ajax_nonce: window.kirki_ecommerce.ajax_nonce,
            },
            mode: 'onChange'
            })" method="post" @submit.prevent="handleSubmit(() => $el.submit(), () => { return false; })">
            <input type="hidden" name="ajax_nonce" x-bind="register('ajax_nonce')">
            <input type="hidden" name="redirect" value="<?php echo esc_url(request('redirect', '')); ?>">
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
                    <a class="kecom-forgot-password-label" href="<?php echo esc_url(wp_lostpassword_url(Url::get_login_url())); ?>"><?php esc_html_e('Forgot password?', 'kirki-ecommerce'); ?></a>
                </div>
                <div class="kecom-password-input" x-data="{ showPassword: false }">
                    <input class="kecom-input" :type="showPassword ? 'text' : 'password'" id="kecom-password" name="password" x-bind="<?php printf("register('password', {
                    required: '%s',
                })", __('Password is required', 'kirki-ecommerce')) ?>" placeholder="<?php esc_html_e('Type your password', 'kirki-ecommerce'); ?>">
                    <template x-if="showPassword">
                        <span class="kecom-password-input-show" @click="showPassword = false"><?php Icon::render('eye'); ?></span>
                    </template>
                    <template x-if="!showPassword">
                        <span class="kecom-password-input-show" @click="showPassword = true"><?php Icon::render('eye-off'); ?></span>
                    </template>
                </div>
                <span class="kecom-field-error" x-show="errors.password" x-text="errors.password"></span>
            </div>
            <div class="kecom-checkbox">
                <input class="kecom-checkbox-input" type="checkbox" id="kecom-input-remember" name="remember" x-bind="register('remember')">
                <label class="kecom-checkbox-label" for="kecom-input-remember"><?php esc_html_e('Remember me', 'kirki-ecommerce'); ?></label>
            </div>
            <button type="submit" class="kecom-btn kecom-btn-primary" :disabled="isSubmitting"><?php esc_html_e('Login', 'kirki-ecommerce'); ?></button>
        </form>
    </div>
</div>
<?php Template::get_footer() ?>