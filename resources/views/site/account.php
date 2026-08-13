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
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-container">
        <div class="kecom-account-page">
            <h1 class="kecom-account-page-title"><?php esc_html_e('Account', 'kirki-ecommerce'); ?></h1>
            <div class="kecom-account-page-info"><?php esc_html_e('Comming Soon', 'kirki-ecommerce'); ?></div>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>