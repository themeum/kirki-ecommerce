<?php

/**
 * Cart Item Part
 *
 * @package Kirki\Ecommerce\Templates
 */

use Kirki\Ecommerce\App\Supports\Icon;

defined('ABSPATH') || exit;



?>
<template x-for="item in cartData.items.slice(0,maxItems)" >
<div class="kecom-cart-item" :id="item.id" x-data="quantitySelector({ min:1, max: item.product.max_quantity ? parseInt(item.product.max_quantity) : undefined, initial: item.quantity, onChange: (q) => update(item.id, q) })">
    <div class="kecom-cart-item-image">
        <img :src="item.product.media" :alt="item.product.title">
    </div>
    <div class="kecom-cart-item-container">
        <div class="kecom-cart-item-info">
            <div class="kecom-cart-item-details">
                <a :href="item.product.slug" class="kecom-cart-item-details-title" x-text="item.product.title"></a>
                    <div class="kecom-cart-item-details-attributes">
                        <template x-for="attribute in item.product.attributes">
                            <span x-text="attribute"></span>
                        </template>
                    </div>
            </div>
            <div class="kecom-cart-item-pricing">
                <span class="kecom-cart-item-pricing-total" x-text="cartData.formatted_items[item.id].total"></span>
                <span class="kecom-cart-item-pricing-product-total"
                    x-show="cartData.formatted_items[item.id].total !== cartData.formatted_items[item.id].product_total"
                    x-text="cartData.formatted_items[item.id].product_total"></span>
            </div>
        </div>
        <div class="kecom-cart-item-quantity">
            <div class="kecom-quantity kecom-quantity-sm">
                <button class="kecom-quantity-btn" type="button" aria-label="Remove item" @click="remove(item.id)" x-show="quantity === 1"> <?php Icon::render('trash'); ?></button>
                <button class="kecom-quantity-btn" type="button" aria-label="Decrease" @click.debounce.200ms="decrement" x-show="quantity > 1"><?php Icon::render('minus'); ?></button>
                <input class="kecom-quantity-input" type="number" :value="quantity" @input.debounce.200ms="setValue($el.value, $el)" @change="handleBlur($el)" min="1" max="item.product.max_quantity ? parseInt(item.product.max_quantity) : undefined" aria-label="Quantity">
                <button class="kecom-quantity-btn" type="button" aria-label="Increase" @click.debounce.200ms="increment" :disabled="isMax"> <?php Icon::render('plus'); ?></button>
            </div>
            <button class="kecom-btn kecom-btn-outline kecom-cart-item-remove" type="button" aria-label="Remove item" x-show="quantity > 1" @click="remove(item.id)" :disabled="loading">
                <?php Icon::render('trash'); ?>
            </button>
        </div>
    </div>
</div>
</template>