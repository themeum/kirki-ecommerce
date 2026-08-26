<?php

/**
 * Cart Item Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;


use Kirki\Ecommerce\App\Supports\Utils;
use function Kirki\Ecommerce\Framework\include_view;

$item      = $data['item'] ?? [];
$currency  = $data['currency'] ?? [];
$product   = $item['product'] ?? [];
$media     = $product['media'] ?? [];
$quantity  = (int) $item['quantity'] ?? 1;

// Determine the upper bound on quantity in the cart.
// Start with stock (when track_inventory is on and back-orders are NOT allowed).
$limits = [];

if (($product['track_inventory'] ?? false) && ! ($product['allow_back_order'] ?? false)) {
    $limits[] = (int) ($product['available_quantity'] ?? 0);
}

// Respect per-order limit when set.
if (! empty($product['has_limit_per_order']) && ! empty($product['max_per_order'])) {
    $limits[] = (int) $product['max_per_order'];
}

// 'undefined' means no cap (Alpine quantitySelector treats undefined as unlimited).
$max_quantity = empty($limits) ? 'undefined' : min($limits);
$unit_price = $product['base_sale_price'] > 0
    ? $product['base_sale_price_money_object']->display
    : $product['base_price_money_object']->display;

?>

<div class="kecom-cart-item" id="<?php echo esc_html($item['id']); ?>" x-data="<?php printf('quantitySelector({ min:1, max:%s, initial:%d, onChange: (q) => update(%d,q) })', $max_quantity, $quantity, $item['id']); ?>">
    <?php include_view('site.cart.parts.item.image', ['media' => $media, 'product' => $product]); ?>
    <div class="kecom-cart-item-container">
        <?php include_view('site.cart.parts.item.info', ['product' => $product, 'item' => $item, 'unit_price' => $unit_price]); ?>
        <?php include_view('site.cart.parts.item.quantity', ['item' => $item, 'max_quantity' => $max_quantity]); ?>
    </div>
</div>