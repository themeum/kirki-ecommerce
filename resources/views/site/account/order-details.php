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
use Kirki\Ecommerce\App\Supports\Url;
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
                <div class="kecom-order-details-page">
                    <!-- Top Navigation & Order Title Bar -->
                    <div class="kecom-order-details-header">
                        <div class="kecom-order-details-header-left">
                            <a href="<?php echo esc_url(Url::get_account_url('orders')); ?>" class="kecom-btn kecom-btn-outline kecom-btn-icon kecom-btn-sm" aria-label="<?php esc_attr_e('Back to orders', 'kirki-ecommerce'); ?>">
                                <?php Icon::render('arrow-left'); ?>
                            </a>
                            <div class="kecom-order-details-title-wrap">
                                <div class="kecom-order-details-heading-row">
                                    <h1 class="kecom-order-details-title"><?php esc_html_e('Orders #2314', 'kirki-ecommerce'); ?></h1>
                                    <span class="kecom-badge kecom-badge-success-light">
                                        <?php esc_html_e('Processing', 'kirki-ecommerce'); ?>
                                    </span>
                                </div>
                                <span class="kecom-order-details-placed"><?php esc_html_e('Placed on Oct 17, 2026', 'kirki-ecommerce'); ?></span>
                            </div>
                        </div>
                    </div>

                    <!-- 2-Column Content Grid -->
                    <div class="kecom-order-details-grid">
                        <!-- Left Column (Status Stepper + Address Info) -->
                        <div class="kecom-order-details-col-left">
                            <!-- Card 1: Order Status Timeline -->
                            <div class="kecom-card kecom-order-status-card">
                                <h3 class="kecom-card-title"><?php esc_html_e('Order Status', 'kirki-ecommerce'); ?></h3>

                                <div class="kecom-order-stepper">
                                    <div class="kecom-order-step">
                                        <div class="kecom-order-step-indicator">
                                            <span class="kecom-order-step-dot"></span>
                                        </div>
                                        <div class="kecom-order-step-content">
                                            <h4 class="kecom-order-step-title"><?php esc_html_e('Order received', 'kirki-ecommerce'); ?></h4>
                                            <span class="kecom-order-step-date">October 15, 2026</span>
                                        </div>
                                    </div>

                                    <div class="kecom-order-step">
                                        <div class="kecom-order-step-indicator">
                                            <span class="kecom-order-step-dot"></span>
                                        </div>
                                        <div class="kecom-order-step-content">
                                            <h4 class="kecom-order-step-title"><?php esc_html_e('Payment confirmed', 'kirki-ecommerce'); ?></h4>
                                            <span class="kecom-order-step-date">October 15, 2026</span>
                                        </div>
                                    </div>

                                    <div class="kecom-order-step">
                                        <div class="kecom-order-step-indicator">
                                            <span class="kecom-order-step-dot"></span>
                                        </div>
                                        <div class="kecom-order-step-content">
                                            <h4 class="kecom-order-step-title"><?php esc_html_e('Order processing', 'kirki-ecommerce'); ?></h4>
                                            <span class="kecom-order-step-date">October 16, 2026</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Card 2: Contact, Payment & Address Information (2x2 Grid) -->
                            <div class="kecom-card kecom-order-info-card">
                                <div class="kecom-order-info-grid">
                                    <!-- Contact Information -->
                                    <div class="kecom-order-info-block">
                                        <h4 class="kecom-order-info-title">
                                            <?php esc_html_e('Contact Information', 'kirki-ecommerce'); ?>
                                        </h4>
                                        <div class="kecom-order-info-content">
                                            <p class="kecom-order-info-text">Bradley Lawlor</p>
                                            <p class="kecom-order-info-text">bradley.lawlor@email.com</p>
                                        </div>
                                    </div>

                                    <!-- Payment Information -->
                                    <div class="kecom-order-info-block">
                                        <h4 class="kecom-order-info-title">
                                            <?php esc_html_e('Payment', 'kirki-ecommerce'); ?>
                                        </h4>
                                        <div class="kecom-order-info-content">
                                            <p class="kecom-order-info-text">Visa •••• 1234</p>
                                        </div>
                                    </div>

                                    <!-- Shipping Address -->
                                    <div class="kecom-order-info-block">
                                        <h4 class="kecom-order-info-title">
                                            <?php esc_html_e('Shipping Address', 'kirki-ecommerce'); ?>
                                        </h4>
                                        <div class="kecom-order-address-lines">
                                            <p>Bradley Lawlor</p>
                                            <p>123 Main Street</p>
                                            <p>Anytown, CA 90210</p>
                                            <p>United States</p>
                                        </div>
                                    </div>

                                    <!-- Billing Address -->
                                    <div class="kecom-order-info-block">
                                        <h4 class="kecom-order-info-title">
                                            <?php esc_html_e('Billing Address', 'kirki-ecommerce'); ?>
                                        </h4>
                                        <div class="kecom-order-address-lines">
                                            <p>Bradley Lawlor</p>
                                            <p>123 Main Street</p>
                                            <p>Anytown, CA 90210</p>
                                            <p>United States</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column (Products List & Total Breakdown) -->
                        <div class="kecom-order-details-col-right">
                            <div class="kecom-card kecom-order-summary-card">
                                <!-- Order Items List -->
                                <div class="kecom-order-items-list">
                                    <!-- Item 1 -->
                                    <div class="kecom-order-item-row">
                                        <div class="kecom-order-item-thumb-wrap">
                                            <div class="kecom-order-item-thumb">
                                                <div class="kecom-order-item-thumb-placeholder">
                                                    <?php Icon::render('box'); ?>
                                                </div>
                                            </div>
                                            <span class="kecom-order-item-qty">1</span>
                                        </div>

                                        <div class="kecom-order-item-details">
                                            <h4 class="kecom-order-item-name">Basic Heavy Weight T-shirt</h4>
                                            <span class="kecom-order-item-cat">Handcrafted Apparel</span>
                                            <span class="kecom-order-item-variant">L • Blue</span>
                                        </div>

                                        <div class="kecom-order-item-price">
                                            <span>$12.00</span>
                                        </div>
                                    </div>

                                    <!-- Item 2 -->
                                    <div class="kecom-order-item-row">
                                        <div class="kecom-order-item-thumb-wrap">
                                            <div class="kecom-order-item-thumb">
                                                <div class="kecom-order-item-thumb-placeholder">
                                                    <?php Icon::render('box'); ?>
                                                </div>
                                            </div>
                                            <span class="kecom-order-item-qty">1</span>
                                        </div>

                                        <div class="kecom-order-item-details">
                                            <h4 class="kecom-order-item-name">Basic Heavy Weight T-shirt</h4>
                                            <span class="kecom-order-item-cat">Handcrafted Apparel</span>
                                            <span class="kecom-order-item-variant">M • Green</span>
                                        </div>

                                        <div class="kecom-order-item-price">
                                            <span>$12.00</span>
                                        </div>
                                    </div>

                                    <!-- Item 3 -->
                                    <div class="kecom-order-item-row">
                                        <div class="kecom-order-item-thumb-wrap">
                                            <div class="kecom-order-item-thumb">
                                                <div class="kecom-order-item-thumb-placeholder">
                                                    <?php Icon::render('box'); ?>
                                                </div>
                                            </div>
                                            <span class="kecom-order-item-qty">1</span>
                                        </div>

                                        <div class="kecom-order-item-details">
                                            <h4 class="kecom-order-item-name">Basic Heavy Weight T-shirt</h4>
                                            <span class="kecom-order-item-cat">Handcrafted Apparel</span>
                                            <span class="kecom-order-item-variant">S • Black</span>
                                        </div>

                                        <div class="kecom-order-item-price">
                                            <span>$12.00</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Summary Totals Breakdown -->
                                <div class="kecom-order-pricing-breakdown">
                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label"><?php esc_html_e('Subtotal', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-pricing-value">$36.00</span>
                                    </div>

                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label">
                                            <?php esc_html_e('Shipping', 'kirki-ecommerce'); ?>
                                        </span>
                                        <span class="kecom-pricing-value">$12.00</span>
                                    </div>

                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label">
                                            <?php esc_html_e('Taxes', 'kirki-ecommerce'); ?>
                                        </span>
                                        <span class="kecom-pricing-value">$0.00</span>
                                    </div>

                                    <div class="kecom-pricing-row">
                                        <span class="kecom-pricing-label"><?php esc_html_e('Discount', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-pricing-value">-$7.00</span>
                                    </div>

                                    <div class="kecom-pricing-row kecom-pricing-row-total">
                                        <span class="kecom-pricing-label"><?php esc_html_e('Total', 'kirki-ecommerce'); ?></span>
                                        <span class="kecom-pricing-value">$41.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
