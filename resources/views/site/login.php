<?php

/**
 * Login Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;


?>

<div class="kecom-login-container">
    <div class="kecom-login-form-wrapper">
        <div class="kecom-login-header">
            <h3 class="kecom-login-header-title"><?php _e('Login', 'kirki-ecommerce'); ?></h3>
            <div class="kecom-login-header-content">
                <span><?php _e('Don\'t have an account?', 'kirki-ecommerce'); ?></span>
                <a href="<?php echo Url::get_registration_url('register'); ?>">
                    <?php _e('Sign up', 'kirki-ecommerce'); ?>
                </a>
            </div>
        </div>
        <form class="kecom-login-form" x-data="form({
            defaultValues: {
                email: '',
                password: '', 
            },
            mode: 'onBlur'
            })" method="post" @submit.prevent="handleSubmit((data) => {
            console.log(data); 
            })">
            <div class="kecom-field">
                <label class="kecom-field-label" for="kecom-email"><?php _e('Email', 'kirki-ecommerce'); ?></label>
                <input class="kecom-input" type="email" id="kecom-email" name="email" x-bind="register('email', {
                    required: 'Email is required',
                    email: true
                })" placeholder="<?php _e('name@example.com', 'kirki-ecommerce'); ?>">
                <span class="kecom-field-error" x-show="errors.email" x-text="errors.email" style="display: none;"></span>
            </div>
            <div class="kecom-field">
                <div class="kecom-password-field-label">
                    <label class="kecom-field-label" for="kecom-password"><?php _e('Password', 'kirki-ecommerce'); ?></label>
                    <a class="kecom-forgot-password-label" href="#"><?php _e('Forgot password ?', 'kirki-ecommerce'); ?></a>
                </div>
                <div class="kecom-password-input">
                    <input class="kecom-input" type="password" id="kecom-password" name="password" x-bind="register('password', {
                    required: 'Password is required',
                })" placeholder="<?php _e('Type your password', 'kirki-ecommerce'); ?>">
                    <span class="kecom-password-input-show"><?php Icon::render('eye-off'); ?></span>
                </div>
                <span class="kecom-field-error" x-show="errors.password" x-text="errors.password" style="display: none;"></span>
            </div>
            <label class="kecom-checkbox">
                <input class="kecom-checkbox-input" type="checkbox">
                <span class="kecom-checkbox-label"><?php _e('Remember me', 'kirki-ecommerce'); ?></span>
            </label>
            <button type="submit" class="kecom-btn kecom-btn-primary" :disable="isSubmitting"><?php _e('Login', 'kirki-ecommerce'); ?></button>
        </form>
        <div class="kecom-login-social">
            <div class="kecom-login-social-divider">
                <div class="kecom-divider"></div>
                <span class="kecom-divider-text"><?php _e('or continue with', 'kirki-ecommerce'); ?></span>
                <div class="kecom-divider"></div>
            </div>
            <div class="kecom-login-social-btn-container">
                <button class="kecom-btn kecom-btn-outline kecom-google-btn">
                    <?php Icon::render('google', ['size' => 24]); ?>
                </button>
                <button class="kecom-btn kecom-btn-outline kecom-facebook-btn">
                    <?php Icon::render('facebook', ['size' => 24]); ?>
                </button>
            </div>

        </div>
    </div>
</div>