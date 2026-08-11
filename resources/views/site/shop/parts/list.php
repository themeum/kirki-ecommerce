<?php

/**
 * Product List Template
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\include_view;

$products = $data['products'] ?? [];

foreach ($products as $product) {
    include_view('site.shop.parts.product-card', ['product' => $product]);
}
