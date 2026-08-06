<?php

/**
 * Cart Page Template.
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

$cart = view_data('cart');
$pricing = $cart['pricing'];
$currency = $cart['currency'];
$items = $cart['items'] ?? [];

?>
<?php Template::get_header(); ?>
<div class="kecom-cart-page" x-data='cart()'>
    <div class="kecom-cart-grid">
        <!-- Left Part -->
        <?php include_view('site.cart.parts.cart-items', ['items' => $items, 'currency' => $currency]); ?>
        <!-- Right Part -->
        <?php include_view('site.cart.parts.cart-summary'); ?>
    </div>
</div>
<?php Template::get_footer(); ?>