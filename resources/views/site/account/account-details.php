<?php

/**
 * Account Details Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$user = view_data('user') ?: wp_get_current_user();
$first_name = $user->first_name ?: '';
$last_name = $user->last_name ?: '';
$display_name = $user->display_name ?: '';
$email = $user->user_email ?: '';
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['current_page' => 'account-details']); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content">
                <div class="kecom-account-details">
                    <div class="kecom-account-panel-header">
                        <h3 class="kecom-account-panel-header-title"><?php esc_html_e('Account Details', 'kirki-ecommerce'); ?></h3>
                    </div>

                    <form method="post" action="" class="kecom-account-details-form">
                        <?php wp_nonce_field('kecom_save_account_details', 'kecom_account_nonce'); ?>

                        <!-- Personal Info Section -->
                        <div class="kecom-account-details-section">
                            <h4 class="kecom-account-details-section-title"><?php esc_html_e('Personal Information', 'kirki-ecommerce'); ?></h4>
                            <div class="kecom-account-details-section-grid">
                                <div class="kecom-field">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('First name', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        name="account_first_name"
                                        class="kecom-input"
                                        value="<?php echo esc_attr($first_name); ?>"
                                        required
                                    />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Last name', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        name="account_last_name"
                                        class="kecom-input"
                                        value="<?php echo esc_attr($last_name); ?>"
                                        required
                                    />
                                </div>

                                <div class="kecom-field kecom-field-full">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Display name', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="text"
                                        name="account_display_name"
                                        class="kecom-input"
                                        value="<?php echo esc_attr($display_name); ?>"
                                        required
                                    />
                                    <span class="kecom-field-help">
                                        <?php esc_html_e('This will be how your name is displayed in the account section and in reviews.', 'kirki-ecommerce'); ?>
                                    </span>
                                </div>

                                <div class="kecom-field kecom-field-full">
                                    <label class="kecom-field-label kecom-field-label-required"><?php esc_html_e('Email address', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="email"
                                        name="account_email"
                                        class="kecom-input"
                                        value="<?php echo esc_attr($email); ?>"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Password Change Section -->
                        <div class="kecom-account-details-section">
                            <h4 class="kecom-account-details-section-title"><?php esc_html_e('Password Change', 'kirki-ecommerce'); ?></h4>
                            <div class="kecom-account-details-section-grid">
                                <div class="kecom-field kecom-field-full">
                                    <label class="kecom-field-label"><?php esc_html_e('Current password (leave blank to leave unchanged)', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="password"
                                        name="password_current"
                                        class="kecom-input"
                                        autocomplete="current-password"
                                    />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label"><?php esc_html_e('New password (leave blank to leave unchanged)', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="password"
                                        name="password_1"
                                        class="kecom-input"
                                        autocomplete="new-password"
                                    />
                                </div>

                                <div class="kecom-field">
                                    <label class="kecom-field-label"><?php esc_html_e('Confirm new password', 'kirki-ecommerce'); ?></label>
                                    <input
                                        type="password"
                                        name="password_2"
                                        class="kecom-input"
                                        autocomplete="new-password"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button -->
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
