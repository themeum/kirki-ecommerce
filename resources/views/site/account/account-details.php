<?php

/**
 * Account - Account Details Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$user = view_data('user') ?: wp_get_current_user();
$first_name = $user->first_name ?: '';
$last_name = $user->last_name ?: '';
$display_name = $user->display_name ?: '';
$email = $user->user_email ?: '';

$pages = view_data('pages');
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['current_page' => 'account-details', 'pages' => $pages]); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content">
                <div class="kecom-account-details-page">
                    <h1 class="kecom-account-details-title"><?php esc_html_e('Account Details', 'kirki-ecommerce'); ?></h1>

                    <form method="post" action="" class="kecom-account-details-form kecom-form">
                        <?php wp_nonce_field('kecom_save_account_details', 'kecom_account_nonce'); ?>

                        <!-- Card 1: Personal Information -->
                        <div class="kecom-card kecom-account-details-card">
                            <div class="kecom-form-row">
                                <div class="kecom-field">
                                    <label for="kecom_first_name" class="kecom-field-label"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        id="kecom_first_name"
                                        name="account_first_name"
                                        class="kecom-input"
                                        value="<?php echo esc_attr($first_name); ?>"
                                    />
                                </div>

                                <div class="kecom-field">
                                    <label for="kecom_last_name" class="kecom-field-label"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        id="kecom_last_name"
                                        name="account_last_name"
                                        class="kecom-input"
                                        value="<?php echo esc_attr($last_name); ?>"
                                    />
                                </div>
                            </div>

                            <div class="kecom-field">
                                <label for="kecom_display_name" class="kecom-field-label">
                                    <?php esc_html_e('Display name', 'kirki-ecommerce'); ?>
                                    <span class="kecom-info-tip" title="<?php esc_attr_e('This is how your name will be displayed in the account and in product reviews.', 'kirki-ecommerce'); ?>">ⓘ</span>
                                </label>
                                <input
                                    type="text"
                                    id="kecom_display_name"
                                    name="account_display_name"
                                    class="kecom-input"
                                    value="<?php echo esc_attr($display_name); ?>"
                                />
                            </div>

                            <div class="kecom-field">
                                <label for="kecom_email" class="kecom-field-label"><?php esc_html_e('Email', 'kirki-ecommerce'); ?></label>
                                <input
                                    type="email"
                                    id="kecom_email"
                                    name="account_email"
                                    class="kecom-input"
                                    value="<?php echo esc_attr($email); ?>"
                                />
                            </div>
                        </div>

                        <!-- Card 2: Password Change -->
                        <div class="kecom-card kecom-account-details-card" x-data="{ showNew: false, showConfirm: false }">
                            <div class="kecom-field">
                                <label for="kecom_password_current" class="kecom-field-label"><?php esc_html_e('Current password', 'kirki-ecommerce'); ?></label>
                                <input
                                    type="password"
                                    id="kecom_password_current"
                                    name="password_current"
                                    class="kecom-input"
                                    autocomplete="current-password"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div class="kecom-field">
                                <label for="kecom_password_1" class="kecom-field-label"><?php esc_html_e('New password', 'kirki-ecommerce'); ?></label>
                                <div class="kecom-input-wrap">
                                    <input
                                        :type="showNew ? 'text' : 'password'"
                                        type="password"
                                        id="kecom_password_1"
                                        name="password_1"
                                        class="kecom-input"
                                        autocomplete="new-password"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" class="kecom-input-icon-btn" @click="showNew = !showNew" aria-label="<?php esc_attr_e('Toggle password visibility', 'kirki-ecommerce'); ?>">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                            <line x1="2" x2="22" y1="2" y2="22" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div class="kecom-field">
                                <label for="kecom_password_2" class="kecom-field-label"><?php esc_html_e('Confirm new password', 'kirki-ecommerce'); ?></label>
                                <div class="kecom-input-wrap">
                                    <input
                                        :type="showConfirm ? 'text' : 'password'"
                                        type="password"
                                        id="kecom_password_2"
                                        name="password_2"
                                        class="kecom-input"
                                        autocomplete="new-password"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" class="kecom-input-icon-btn" @click="showConfirm = !showConfirm" aria-label="<?php esc_attr_e('Toggle password visibility', 'kirki-ecommerce'); ?>">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                            <line x1="2" x2="22" y1="2" y2="22" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Save Changes Button -->
                        <div class="kecom-account-details-actions">
                            <button type="submit" class="kecom-btn kecom-btn-primary">
                                <?php esc_html_e('Save Changes', 'kirki-ecommerce'); ?>
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
