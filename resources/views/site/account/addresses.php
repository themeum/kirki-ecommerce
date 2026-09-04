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

use Kirki\Ecommerce\App\Supports\Icon;
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
                    <!-- Page Header -->
                    <div class="kecom-account-addresses-header">
                        <h1 class="kecom-account-addresses-title"><?php esc_html_e('Addresses', 'kirki-ecommerce'); ?></h1>
                        <button type="button" class="kecom-btn kecom-btn-primary" @click="openAddModal">
                            <?php Icon::render('plus', ['size' => 16]); ?>
                            <span><?php esc_html_e('Add Address', 'kirki-ecommerce'); ?></span>
                        </button>
                    </div>

                    <!-- Address Cards Grid -->
                    <div class="kecom-account-addresses-grid" x-show="addresses.length > 0">
                        <template x-for="address in addresses" :key="address.id">
                            <?php include_view('site.account.parts.address-card'); ?>
                        </template>
                    </div>

                    <!-- Empty State -->
                    <div class="kecom-account-addresses-empty" x-show="addresses.length === 0" x-cloak>
                        <p class="kecom-empty-text"><?php esc_html_e('No addresses added yet.', 'kirki-ecommerce'); ?></p>
                    </div>

                    <!-- Add/Edit Address Modal -->
                    <?php include_view('site.account.parts.address-modal'); ?>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
