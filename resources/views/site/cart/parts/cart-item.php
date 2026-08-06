<?php

/**
 * Cart Item Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\include_view;

$item = $data['item'] ?? [];
$currency = $data['currency'] ?? [];
$product = $item['product'] ?? [];
$media = $product['media'] ?? [];
$quantity = (int) $item['quantity'] ?? 1;
$max_quantity = (int) $product['available_quantity'] ?? 1;
$unit_price = Money::format_from_decimal($product['sale_price'] ?? $product['price'], $currency['code']);

?>

<div class="kecom-cart-item" id="<?php echo esc_html($item['id']); ?>" x-data="<?php printf('quantitySelector({ min:1, max:%d, initial:%d, onChange: (q) => update(%d,q) })', $max_quantity, $quantity, $item['id']); ?>">
    <?php include_view('site.cart.parts.item.image', ['media' => $media, 'product' => $product]); ?>
    <div class="kecom-cart-item-container">
        <?php include_view('site.cart.parts.item.info', ['product' => $product, 'item' => $item, 'unit_price' => $unit_price]); ?>
        <?php include_view('site.cart.parts.item.quantity', ['item' => $item, 'max_quantity' => $max_quantity]); ?>
    </div>
</div>