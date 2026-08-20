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

        <form
            x-data="form({
                defaultValues: {
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: ''
                },
                mode: 'onChange'
            })"
            @submit.prevent="handleSubmit((values) => updatePassword(values, () => reset(), (field, msg) => setError(field, msg)))"
        >
            <div class="kecom-modal-body">
                <div class="kecom-field" x-bind="fieldWrapper('current_password')">
                    <label for="kecom_current_password" class="kecom-field-label"><?php esc_html_e('Current password', 'kirki-ecommerce'); ?></label>
                    <div class="kecom-input-password-wrap">
                        <input
                            :type="showCurrentPassword ? 'text' : 'password'"
                            id="kecom_current_password"
                            class="kecom-input"
                            x-bind="register('current_password', { required: '<?php esc_html_e('Current password is required', 'kirki-ecommerce'); ?>' })"
                            placeholder="••••••••••••"
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
                    <span class="kecom-field-error" x-show="errors.current_password" x-text="errors.current_password"></span>
                    <a href="<?php echo esc_url(wp_lostpassword_url()); ?>" class="kecom-forgot-password-link">
                        <?php esc_html_e('Forgot Password?', 'kirki-ecommerce'); ?>
                    </a>
                </div>

                <div class="kecom-field" x-bind="fieldWrapper('new_password')">
                    <label for="kecom_new_password" class="kecom-field-label"><?php esc_html_e('Password', 'kirki-ecommerce'); ?></label>
                    <div class="kecom-input-password-wrap">
                        <input
                            :type="showNewPassword ? 'text' : 'password'"
                            id="kecom_new_password"
                            class="kecom-input"
                            x-bind="register('new_password', {
                                required: '<?php esc_html_e('Password is required', 'kirki-ecommerce'); ?>',
                                minLength: {
                                    value: 8,
                                    message: '<?php esc_html_e('Password must be at least 8 characters long', 'kirki-ecommerce'); ?>'
                                }
                            })"
                            placeholder="••••••••"
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
                    <span class="kecom-field-error" x-show="errors.new_password" x-text="errors.new_password"></span>
                </div>

                <div class="kecom-field" x-bind="fieldWrapper('new_password_confirmation')">
                    <label for="kecom_confirm_password" class="kecom-field-label"><?php esc_html_e('Confirm new password', 'kirki-ecommerce'); ?></label>
                    <div class="kecom-input-password-wrap">
                        <input
                            :type="showConfirmPassword ? 'text' : 'password'"
                            id="kecom_confirm_password"
                            class="kecom-input"
                            x-bind="register('new_password_confirmation', {
                                required: '<?php esc_html_e('Please confirm your new password', 'kirki-ecommerce'); ?>',
                                validate: (val) => val === values.new_password || '<?php esc_html_e('Passwords do not match', 'kirki-ecommerce'); ?>'
                            })"
                            placeholder="••••••••"
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
                    <span class="kecom-field-error" x-show="errors.new_password_confirmation" x-text="errors.new_password_confirmation"></span>
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
