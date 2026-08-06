<?php

/**
 * Cart Items Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;


use function Kirki\Ecommerce\Framework\include_view;

$items    = $data['items'] ?? [];
$currency = $data['currency'] ?? [];

?>

<div class="kecom-cart-items">
    <?php include_view('site.cart.parts.cart-header'); ?>
    <?php if (count($items)): ?>
        <?php foreach ($items as $item):
            include_view('site.cart.parts.cart-item', ['item' => $item, 'currency' => $currency]);
        ?>
        <?php endforeach; ?>
    <?php else: ?>
        <h4 class="kecom-cart-items-empty-text"><?php _e('No items currently in cart.', 'kirki-ecommerce'); ?></h4>
    <?php endif; ?>
</div>