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

use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;
?>

<?php Template::get_header();?>

<div class="kecom-page-wrapper">
    <div class="kecom-order-tracking-page">
        <main class="kecom-tracking-content">
            <?php if (view_data('errors')) : ?>
            <div class="kecom-alert kecom-alert-error kecom-mt-6 kecom-mb-6">
                <?php Icon::render('information', ['size' => 20]); ?>
                <p>
                    <?php foreach (view_data('errors') as $error) : ?>
                        <?php echo esc_html($error); ?>
                    <?php endforeach; ?>
                </p>
            </div>
                <?php
                include_view('site.account.orders.empty');
                ?>
            <?php else : ?>
                <?php include_view('site.account.orders.details', [ 'order' => view_data('order'), 'activities' => view_data('activities')]); ?>
            <?php endif; ?>
        </main>
    </div>
</div>

<?php Template::get_footer(); ?>