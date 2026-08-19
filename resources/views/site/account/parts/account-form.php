<?php

/**
 * Account - Account Details Profile Form Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
?>

<form @submit.prevent="saveProfile" class="kecom-account-details-form kecom-form">
    <!-- Personal Information Card -->
    <div class="kecom-card kecom-account-details-card">
        <div class="kecom-form-row">
            <div class="kecom-field">
                <label for="kecom_first_name" class="kecom-field-label"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="kecom_first_name"
                    name="first_name"
                    class="kecom-input"
                    x-model="profileData.first_name"
                />
            </div>

            <div class="kecom-field">
                <label for="kecom_last_name" class="kecom-field-label"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                <input
                    type="text"
                    id="kecom_last_name"
                    name="last_name"
                    class="kecom-input"
                    x-model="profileData.last_name"
                />
            </div>
        </div>

        <div class="kecom-field">
            <label for="kecom_email" class="kecom-field-label"><?php esc_html_e('Email', 'kirki-ecommerce'); ?></label>
            <input
                type="email"
                id="kecom_email"
                name="email"
                class="kecom-input"
                :value="profileData.email"
                readonly
            />
        </div>

        <!-- Reset Password Action Button -->
        <button
            type="button"
            class="kecom-btn kecom-btn-secondary kecom-btn-block"
            @click.prevent="openPasswordModal"
        >
            <?php Icon::render('key'); ?>
            <span><?php esc_html_e('Reset Password', 'kirki-ecommerce'); ?></span>
        </button>
    </div>

    <!-- Save Changes Button -->
    <div class="kecom-account-details-actions">
        <button
            type="submit"
            class="kecom-btn kecom-btn-primary"
            :class="{ 'kecom-btn-loading': profileLoading }"
            :disabled="profileLoading"
        >
            <?php esc_html_e('Save Changes', 'kirki-ecommerce'); ?>
        </button>
    </div>
</form>
