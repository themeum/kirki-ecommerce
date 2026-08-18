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
            <main class="kecom-account-content">
                <div class="kecom-account-orders">
                    <div class="kecom-account-panel-header">
                        <h3 class="kecom-account-panel-header-title">
                            <?php esc_html_e('Orders', 'kirki-ecommerce'); ?>
                        </h3>
                    </div>

                    <!-- Shared Orders Table Partial -->
                    <?php include_view('site.account.orders-table'); ?>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
