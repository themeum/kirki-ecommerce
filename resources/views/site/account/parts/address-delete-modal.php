<?php

/**
 * Account - Delete Address Confirmation Modal Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
?>

<!-- Delete Address Confirmation Modal Backdrop -->
<div
    class="kecom-modal-backdrop"
    x-show="deleteModalOpen"
    x-transition.opacity
    x-cloak
></div>

<!-- Delete Address Confirmation Modal -->
<div
    class="kecom-modal"
    x-show="deleteModalOpen"
    x-transition
    x-cloak
    @keydown.escape.window="cancelDelete"
>
    <div
        class="kecom-modal-content kecom-modal-content-sm kecom-address-delete-modal-content"
        @click.outside="cancelDelete"
    >
        <button
            type="button"
            class="kecom-modal-header-close"
            @click.prevent="cancelDelete"
            aria-label="<?php esc_attr_e('Close', 'kirki-ecommerce'); ?>"
        >
            <?php Icon::render('cross', ['size' => 16]); ?>
        </button>

        <div class="kecom-address-delete-modal-body">
            <div class="kecom-address-delete-icon-wrap">
                <?php Icon::render('trash', ['size' => 24]); ?>
            </div>

            <div class="kecom-address-delete-modal-text">
                <h3 class="kecom-address-delete-modal-title">
                    <?php esc_html_e('Delete address', 'kirki-ecommerce'); ?>
                </h3>
                <p class="kecom-address-delete-modal-desc">
                    <?php esc_html_e('Are you sure you want to delete this address? This action cannot be undone.', 'kirki-ecommerce'); ?>
                </p>
            </div>

            <div class="kecom-address-delete-modal-actions">
                <button
                    type="button"
                    class="kecom-btn kecom-btn-outline kecom-btn-lg kecom-btn-block"
                    @click="cancelDelete"
                >
                    <?php esc_html_e('Cancel', 'kirki-ecommerce'); ?>
                </button>
                <button
                    type="button"
                    class="kecom-btn kecom-btn-destructive kecom-btn-lg kecom-btn-block"
                    :class="{ 'kecom-btn-loading': loading }"
                    :disabled="loading"
                    @click="confirmDelete"
                >
                    <?php esc_html_e('Delete', 'kirki-ecommerce'); ?>
                </button>
            </div>
        </div>
    </div>
</div>
