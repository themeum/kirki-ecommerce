<?php

/**
 * Registration Page Template.
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
            <h3 class="kecom-login-header-title"><?php _e('Sign up', 'kirki-ecommerce'); ?></h3>
            <div class="kecom-login-header-content">
                <span><?php _e('Already have an account?', 'kirki-ecommerce'); ?></span>
                <a href="<?php echo Url::get_login_url(); ?>">
                    <?php _e('Login', 'kirki-ecommerce'); ?>
                </a>
            </div>
        </div>
        <form class="kecom-login-form" x-data="form({
            defaultValues: {
                first_name: '',
                last_name: '',
                email: '',
                password: '', 
                accept_terms: false
            },
            mode: 'onBlur'
            })" method="post" x-on:submit="handleSubmit((data)=>{
                console.log(data);
                return true;
            })">
            <div class="kecom-field" :class="errors.first_name ? 'kecom-field-error-state' : ''">
                <label class="kecom-field-label" for="kecom-first-name"><?php _e('First Name', 'kirki-ecommerce'); ?></label>
                <input class="kecom-input" type="text" id="kecom-first-name" name="first_name" x-bind="register('first_name', {
                    required: 'First name is required'
                })" placeholder="<?php _e('First name', 'kirki-ecommerce'); ?>">
                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
            </div>
            <div class="kecom-field" :class="errors.last_name ? 'kecom-field-error-state' : ''">
                <label class="kecom-field-label" for="kecom-last-name"><?php _e('Last Name', 'kirki-ecommerce'); ?></label>
                <input class="kecom-input" type="text" id="kecom-last-name" name="last_name" x-bind="register('last_name', {
                    required: 'Last name is required'
                })" placeholder="<?php _e('Last name', 'kirki-ecommerce'); ?>">
                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
            </div>
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
            <div class="kecom-registration-terms-field">
                <label class="kecom-checkbox">
                    <input required class="kecom-checkbox-input" x-bind="register('accept_terms', {
                    required: 'You must accept the terms of service'
                })" name="accept_terms" type="checkbox">
                    <span class="kecom-checkbox-label">
                        <?php _e('I agree to the ', 'kirki-ecommerce'); ?>
                        <a href="#" class="kecom-checkbox-link"><?php _e('Terms of service', 'kirki-ecommerce'); ?></a>
                        <?php _e(' and ', 'kirki-ecommerce'); ?>
                        <a href="#" class="kecom-checkbox-link"><?php _e('Privacy Policy', 'kirki-ecommerce'); ?></a>
                    </span>
                </label>
            </div>
            <button type="submit" class="kecom-btn kecom-btn-primary" :disable="isSubmitting"><?php _e('Sign up', 'kirki-ecommerce'); ?></button>
        </form>
    </div>
</div>