<?php

/**
 * Account Orders List Partial.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

use function Kirki\Ecommerce\Framework\include_view;

defined('ABSPATH') || exit;

$orders = $data['orders'] ?? [];
if (empty($orders)) {
    include_view('site.account.orders.empty');
    return;
}
?>
<div class="kecom-table-wrap">
    <table class="kecom-table kecom-table-spaced kecom-orders-table">
        <tbody>
            <?php foreach ($orders as $order) { ?>
                <?php include_view('site.account.orders.row', ['order' => $order]); ?>
            <?php } ?>
        </tbody>
    </table>
</div>