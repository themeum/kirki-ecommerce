<?php

/**
 * Account Page Template.
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

$pages = view_data('pages', [])
?>

<?php Template::get_header(); ?>

<div class="kecom-container">
    <div class="kecom-account-page">
        <!-- page navigation start -->
        <?php include_view('site.account.sidebar', ['pages' => $pages]); ?>
        <!-- page navigation end -->
        <!-- page content start -->
        <div class="kecom-account-page-main">
            <h1 class="kecom-account-page-title"><?php esc_html_e('Dashboard', 'kirki-ecommerce'); ?></h1>
            <div class="kecom-account-page-info"><?php esc_html_e('Comming Soon', 'kirki-ecommerce'); ?></div>
        </div>
        <!-- page content end -->
    </div>
</div>

<?php Template::get_footer(); ?>