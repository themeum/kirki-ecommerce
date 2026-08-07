<?php

/**
 * Cart Item Quantity Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;


use Kirki\Ecommerce\App\Supports\Icon;

$item           = $data['item'] ?? [];
$max_quantity   = $data['max_quantity'] ?? 1;
?>

<div class="kecom-cart-item-quantity">
    <div class="kecom-quantity">
        <button class="kecom-quantity-btn" type="button" aria-label="Remove item" @click="remove(<?php echo esc_html($item['id']); ?>)" x-show="quantity === 1"> <?php Icon::render('trash'); ?></button>
        <button class="kecom-quantity-btn" type="button" aria-label="Decrease" @click.debounce.200ms="decrement" x-show="quantity > 1"><?php Icon::render('minus'); ?></button>
        <input class="kecom-quantity-input" type="number" :value="quantity" @input.debounce.200ms="setValue($el.value)" min="1" max="<?php echo esc_html($max_quantity); ?>" :disabled="quantity >= max" aria-label="Quantity">
        <button class="kecom-quantity-btn" type="button" aria-label="Increase" @click.debounce.200ms="increment" :disabled="quantity >= max"> <?php Icon::render('plus'); ?></button>
    </div>
    <button class="kecom-btn kecom-btn-outline kecom-cart-item-remove" type="button" aria-label="Remove item" x-show="quantity > 1" @click="remove(<?php echo esc_html($item['id']); ?>)" :disabled="loading">
        <?php Icon::render('trash'); ?>
    </button>
</div>