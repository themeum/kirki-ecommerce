<?php

/**
 * Account - Wishlist Page Template.
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

$wishlists = view_data('wishlists') ?? [];
$wishlist_items = $wishlists->items()->all();
?>

<?php Template::get_header(); ?>
<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
         <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar'); ?>
            <!-- Right Content Area -->
            <main class="kecom-account-content" x-data="accountWishlist()">
                <?php  if (empty($wishlist_items)) : ?>
                    <?php include_view('site.account.wishlist.empty'); ?>
                <?php else : ?>
                <div class="kecom-account-wishlist" x-data="pagination('kecom-products-grid','kecom-pagination-container', 'kecom-account-panel-header','/account/wishlist/items')">
                    <div class="kecom-account-panel-header">
                        <h3 class="kecom-account-panel-header-title">
                            <?php esc_html_e('Wishlist', 'kirki-ecommerce'); ?>
                            <span class="kecom-wishlist-count"><?php echo '(' . esc_html($wishlists->total()) . ')'; ?></span>
                        </h3>
                        <button class="kecom-btn kecom-btn-outline" @click="emptyWishlist()">
                            <?php esc_html_e('Clear Wishlist', 'kirki-ecommerce'); ?>
                        </button>
                    </div>

                    <!-- Shared Wishlists Table Partial -->
                     <div class="kecom-products-grid">
                        <?php foreach ($wishlist_items as $wishlist) : ?>
                            <?php  include_view('site.shop.parts.product-card', ['product' => $wishlist , 'context' => 'account']); ?>
                        <?php endforeach; ?>
                     </div>
                     <div class="kecom-pagination-container">
                        <?php Template::render_pagination($wishlists); ?>
                     </div>
                </div>  
                <?php endif; ?>
            </main>
         </div>
    </div>
</div>

<?php Template::get_footer(); ?>
        