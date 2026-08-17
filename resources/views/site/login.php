<?php

/**
 * Login Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Login;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

$validation_errors = get_transient(Login::LOGIN_TRANSIENT_ERROR_KEY);
?>
<?php Template::get_header(); ?>

<div class="kecom-login-container">
    <div class="kecom-login-form-wrapper">
        <div class="kecom-login-header">
            <h3 class="kecom-login-header-title"><?php _e('Login', 'kirki-ecommerce'); ?></h3>
            <div class="kecom-login-header-content">
                <span><?php _e('Don\'t have an account?', 'kirki-ecommerce'); ?></span>
                <a href="<?php echo Url::get_registration_url(); ?>">
                    <?php _e('Sign up', 'kirki-ecommerce'); ?>
                </a>
            </div>
        </div>
        <?php if (!empty($validation_errors)): ?>
            <div class="kecom-alert kecom-alert-error">
                <?php foreach ($validation_errors as $error): ?>
                    <?php echo $error['message']; ?>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <form class="kecom-login-form" x-data="form({
            defaultValues: {
                email: '',
                password: '', 
                remember: '',
                ajax_nonce: window.kirki_ecommerce.ajax_nonce,
            },
            mode: 'onBlur'
            })" method="post" @submit.prevent="handleSubmit(() => $el.submit(), () => { return false; })">
            <input type="hidden" name="ajax_nonce" x-bind="register('ajax_nonce')">
            <div class="kecom-field" :class="errors.email ? 'kecom-field-error-state' : ''">
                <label class="kecom-field-label" for="kecom-email"><?php _e('Email', 'kirki-ecommerce'); ?></label>
                <input class="kecom-input" type="email" id="kecom-email" name="email" x-bind="register('email', {
                    required: 'Email is required',
                    email: true
                })" placeholder="<?php _e('name@example.com', 'kirki-ecommerce'); ?>">
                <span class="kecom-field-error" x-show="errors.email" x-text="errors.email"></span>
            </div>
            <div class="kecom-field" :class="errors.password ? 'kecom-field-error-state' : ''">
                <div class="kecom-password-field-label">
                    <label class="kecom-field-label" for="kecom-password"><?php _e('Password', 'kirki-ecommerce'); ?></label>
                    <a class="kecom-forgot-password-label" href="#"><?php _e('Forgot password ?', 'kirki-ecommerce'); ?></a>
                </div>
                <div class="kecom-password-input" x-data="{ showPassword: false }">
                    <input class="kecom-input" :type="showPassword ? 'text' : 'password'" id="kecom-password" name="password" x-bind="register('password', {
                    required: 'Password is required',
                })" placeholder="<?php _e('Type your password', 'kirki-ecommerce'); ?>">
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
                <label class="kecom-checkbox-label" for="kecom-input-remember"><?php _e('Remember me', 'kirki-ecommerce'); ?></label>
            </div>
            <button type="submit" class="kecom-btn kecom-btn-primary" :disable="isSubmitting"><?php _e('Login', 'kirki-ecommerce'); ?></button>
        </form>
    </div>
</div>
<?php delete_transient(Login::LOGIN_TRANSIENT_ERROR_KEY);
?>

<?php Template::get_footer() ?>