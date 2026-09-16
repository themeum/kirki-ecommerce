<?php

/**
 * Account - Order Details Page Template.
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
            <?php include_view('site.account.sidebar', ['current_page' => 'orders', 'pages' => $pages]); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content">
                <?php include_view('site.account.orders.details', ['order' => view_data('order'), 'activities' => view_data('activities'), 'show_back_to_orders' => true]); ?>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>