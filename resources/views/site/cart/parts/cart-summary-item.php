<?php

/**
 * Cart Summary Item Part
 * 
 * @package Kirki\Ecommerce\Templates
 *
 */

defined('ABSPATH') || exit;

$title = $data['title'] ?? '';
?>

<div class="kecom-cart-summary-item">
    <span class="kecom-cart-summary-item-title"><?php echo esc_html($title); ?></span>
    <span class="kecom-cart-summary-item-value" x-text="<?php echo !empty($data['text']) ? esc_js($data['text']) : '-'; ?>"><?php echo empty($data['text']) ? '-' : ''; ?></span>
</div>