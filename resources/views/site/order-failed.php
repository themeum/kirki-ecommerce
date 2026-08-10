<?php

/**
 * Order Failed Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\view_data;

defined('ABSPATH') || exit;

$order = view_data('order') ?: null;
if (empty($order)) {
    return;
}
?>

<?php Template::get_header(); ?>

<div class="kecom-order-failed-page">
    <div class="kecom-order-failed-card">
        <div class="kecom-order-failed-hero">
            <div class="kecom-order-failed-icon">
               <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="none">
                    <rect width="80" height="80" fill="#ffe5e4" rx="40"/>
                    <path fill="#f49697" d="M62.75 40c0 2.737-3.898 4.802-4.961 7.37-1.024 2.476.31 6.704-1.702 8.717-2.013 2.012-6.241.678-8.717 1.702-2.557 1.063-4.636 4.961-7.37 4.961s-4.812-3.898-7.37-4.961c-2.476-1.024-6.704.31-8.717-1.702-2.012-2.013-.678-6.241-1.702-8.717-1.063-2.557-4.961-4.636-4.961-7.37s3.898-4.812 4.961-7.37c1.024-2.474-.31-6.704 1.702-8.717 2.013-2.012 6.243-.678 8.717-1.702 2.568-1.063 4.636-4.961 7.37-4.961s4.813 3.898 7.37 4.961c2.476 1.024 6.704-.31 8.717 1.702 2.012 2.013.678 6.241 1.702 8.717 1.063 2.568 4.961 4.636 4.961 7.37"/>
                    <path stroke="#d40000" stroke-linecap="round" stroke-width="3.285" d="m47.5 32.5-15 15m15-.001-15-15"/>
                </svg>
            </div>
            <h3 class="kecom-order-failed-title"><?php _e('Payment Failed', 'kirki-ecommerce'); ?></h3>
            <p class="kecom-order-failed-subtitle"><?php _e('Your payment could not be processed. Please try again or use a different payment method.', 'kirki-ecommerce'); ?></p>
        </div>
        <div class="kecom-order-failed-actions">
            <a href="<?php echo esc_url(Url::get_checkout_url()); ?>" class="kecom-btn kecom-btn-destructive kecom-btn-lg kecom-btn-block">
                <?php _e('Try Again', 'kirki-ecommerce'); ?>
            </a>
            <a href="<?php echo esc_url(Url::get_shop_url()); ?>" class="kecom-btn kecom-btn-ghost kecom-btn-lg kecom-btn-block">
                <?php _e('Continue Shopping', 'kirki-ecommerce'); ?>
            </a>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
