<?php

/**
 * Account - Addresses Page Template.
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

$pages = view_data('pages');
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['pages' => $pages]); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content" x-data="accountAddresses()">
                <div class="kecom-account-addresses-page">
                    <h1 class="kecom-account-addresses-title"><?php esc_html_e('Addresses', 'kirki-ecommerce'); ?></h1>

                    <!-- Address Cards Grid -->
                    <div class="kecom-account-addresses-grid" x-show="!editingAddress">
                        <?php include_view('site.account.parts.address-card', ['type' => 'shipping', 'title' => __('Shipping Address', 'kirki-ecommerce')]); ?>
                        <?php include_view('site.account.parts.address-card', ['type' => 'billing', 'title' => __('Billing Address', 'kirki-ecommerce')]); ?>
                    </div>

                    <!-- Edit Address Form Box -->
                    <?php include_view('site.account.parts.address-form'); ?>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
