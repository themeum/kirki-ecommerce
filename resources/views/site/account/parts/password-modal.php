<?php

/**
 * Account - Change Password Modal Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
?>

<!-- Change Password Modal Backdrop -->
<div
    class="kecom-modal-backdrop"
    x-show="passwordModalOpen"
    x-transition.opacity
    x-cloak
></div>

<!-- Change Password Modal -->
<div
    class="kecom-modal"
    x-show="passwordModalOpen"
    x-transition
    x-cloak
    @keydown.escape.window="closePasswordModal"
>
    <div
        class="kecom-modal-content kecom-modal-content-md"
        @click.outside="closePasswordModal"
    >
        <div class="kecom-modal-header">
            <div class="kecom-modal-header-with-icon">
                <?php Icon::render('lock'); ?>
                <h3 class="kecom-modal-header-title"><?php esc_html_e('Change account password', 'kirki-ecommerce'); ?></h3>
            </div>
            <button
                type="button"
                class="kecom-modal-header-close"
                @click.prevent="closePasswordModal"
                aria-label="<?php esc_attr_e('Close', 'kirki-ecommerce'); ?>"
            >
                <?php Icon::render('cross'); ?>
            </button>
        </div>

        <form @submit.prevent="updatePassword">
            <div class="kecom-modal-body">
                <template x-if="passwordError">
                    <div class="kecom-alert kecom-alert-danger" x-text="passwordError"></div>
                </template>

                <div class="kecom-field">
                    <label for="kecom_current_password" class="kecom-field-label"><?php esc_html_e('Current password', 'kirki-ecommerce'); ?></label>
                    <div class="kecom-input-password-wrap">
                        <input
                            :type="showCurrentPassword ? 'text' : 'password'"
                            id="kecom_current_password"
                            class="kecom-input"
                            x-model="passwordData.current_password"
                            placeholder="••••••••••••"
                            required
                        />
                        <button
                            type="button"
                            class="kecom-password-toggle-btn"
                            @click="showCurrentPassword = !showCurrentPassword"
                            aria-label="<?php esc_attr_e('Toggle password visibility', 'kirki-ecommerce'); ?>"
                        >
                            <span x-show="!showCurrentPassword"><?php Icon::render('eye-off'); ?></span>
                            <span x-show="showCurrentPassword" x-cloak><?php Icon::render('eye'); ?></span>
                        </button>
                    </div>
                    <a href="<?php echo esc_url(wp_lostpassword_url()); ?>" class="kecom-forgot-password-link">
                        <?php esc_html_e('Forgot Password?', 'kirki-ecommerce'); ?>
                    </a>
                </div>

                <div class="kecom-field">
                    <label for="kecom_new_password" class="kecom-field-label"><?php esc_html_e('Password', 'kirki-ecommerce'); ?></label>
                    <div class="kecom-input-password-wrap">
                        <input
                            :type="showNewPassword ? 'text' : 'password'"
                            id="kecom_new_password"
                            class="kecom-input"
                            x-model="passwordData.password"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            class="kecom-password-toggle-btn"
                            @click="showNewPassword = !showNewPassword"
                            aria-label="<?php esc_attr_e('Toggle password visibility', 'kirki-ecommerce'); ?>"
                        >
                            <span x-show="!showNewPassword"><?php Icon::render('eye-off'); ?></span>
                            <span x-show="showNewPassword" x-cloak><?php Icon::render('eye'); ?></span>
                        </button>
                    </div>
                </div>

                <div class="kecom-field">
                    <label for="kecom_confirm_password" class="kecom-field-label"><?php esc_html_e('Confirm new password', 'kirki-ecommerce'); ?></label>
                    <div class="kecom-input-password-wrap">
                        <input
                            :type="showConfirmPassword ? 'text' : 'password'"
                            id="kecom_confirm_password"
                            class="kecom-input"
                            x-model="passwordData.password_confirmation"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            class="kecom-password-toggle-btn"
                            @click="showConfirmPassword = !showConfirmPassword"
                            aria-label="<?php esc_attr_e('Toggle password visibility', 'kirki-ecommerce'); ?>"
                        >
                            <span x-show="!showConfirmPassword"><?php Icon::render('eye-off'); ?></span>
                            <span x-show="showConfirmPassword" x-cloak><?php Icon::render('eye'); ?></span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="kecom-modal-footer">
                <button
                    type="button"
                    class="kecom-btn kecom-btn-outline"
                    :disabled="passwordLoading"
                    @click.prevent="closePasswordModal"
                >
                    <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
                </button>
                <button
                    type="submit"
                    class="kecom-btn kecom-btn-primary"
                    :class="{ 'kecom-btn-loading': passwordLoading }"
                    :disabled="passwordLoading"
                >
                    <?php esc_html_e('Update password', 'kirki-ecommerce'); ?>
                </button>
            </div>
        </form>
    </div>
</div>
