<?php

/**
 * Account - Orders Page Template.
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

$orders   = view_data('orders', []);
$has_more_pages = $orders['has_more_pages'] ?? false;
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar'); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content" x-data="accountOrders()">
                <div class="kecom-account-orders">
                    <div class="kecom-account-panel-header">
                        <h3 class="kecom-account-panel-header-title">
                            <?php esc_html_e('Orders', 'kirki-ecommerce'); ?>
                        </h3>
                    </div>

                    <!-- Shared Orders Table Partial -->
                    <?php include_view('site.account.orders.table', ['orders' => $orders['results'] ?? []]); ?>

                    <?php if ($has_more_pages) { ?>
                        <div class="kecom-flex kecom-justify-center kecom-mt-9">
                            <button class="kecom-btn kecom-btn-primary"
                                :class="{ 'kecom-btn-loading': isLoading }"
                                :disabled="isLoading"
                                x-show="hasMorePages" 
                                @click="fetchOrders()">
                                <?php esc_html_e('Load More', 'kirki-ecommerce'); ?>
                            </button>
                        </div>
                    <?php } ?>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
