<?php
/**
 * Removes the data that seed-woocommerce.php created, and nothing else.
 *
 * Usage: ./wpcli eval-file wp-content/plugins/kirki-ecommerce/dev-tools/clear-woocommerce-seed.php
 *
 * Deletes orders with the `_kecom_seed` meta, products with a SEED- SKU (and their variations),
 * seed customers, seed coupons, and the tax rates, shipping zones, classes and pages that the
 * seeder adds. Other products, users, rates and zones stay.
 */

if ( ! defined( 'ABSPATH' ) || ! class_exists( 'WooCommerce' ) ) {
	WP_CLI::error( 'Run this with WP-CLI on a site where WooCommerce is active.' );
}

set_time_limit( 0 );
ini_set( 'memory_limit', '1024M' ); // phpcs:ignore WordPress.PHP.IniSet -- dev tool.
global $wpdb;

$order_ids = wc_get_orders(
	array(
		'limit'      => -1,
		'return'     => 'ids',
		'meta_key'   => '_kecom_seed',
		'meta_value' => '1',
		'status'     => array_merge( array_keys( wc_get_order_statuses() ), array( 'trash' ) ),
	)
);
$progress  = \WP_CLI\Utils\make_progress_bar( 'Deleting orders', count( $order_ids ) );
foreach ( $order_ids as $n => $order_id ) {
	$order = wc_get_order( $order_id );
	if ( $order ) {
		foreach ( $order->get_refunds() as $refund ) {
			$refund->delete( true );
		}
		$order->delete( true );
	}
	$progress->tick();
	if ( 0 === ( $n + 1 ) % 100 ) {
		wp_cache_flush();
	}
}
$progress->finish();

$product_ids = $wpdb->get_col( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_sku' AND meta_value LIKE 'SEED-%' AND post_id IN (SELECT ID FROM {$wpdb->posts} WHERE post_type = 'product')" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
foreach ( $product_ids as $product_id ) {
	$product = wc_get_product( $product_id );
	if ( $product ) {
		$product->delete( true );
	}
}

$user_ids = get_users(
	array(
		'search'         => 'seed_customer_*',
		'search_columns' => array( 'user_login' ),
		'fields'         => 'ID',
	)
);
require_once ABSPATH . 'wp-admin/includes/user.php';
foreach ( $user_ids as $user_id ) {
	wp_delete_user( (int) $user_id );
}

$coupons = 0;
foreach ( array( 'SEED10', 'SEED20', 'SEED5OFF', 'SEED15OFF', 'SEEDITEM3', 'SEEDCAP', 'WILLKOMMEN10', 'VERSANDFREI' ) as $code ) {
	$coupon_id = wc_get_coupon_id_by_code( $code );
	if ( $coupon_id ) {
		wp_delete_post( $coupon_id, true );
		++$coupons;
	}
}

// Rates the seeder adds: MwSt. rows for the member states and Helgoland.
$wpdb->query( "DELETE l FROM {$wpdb->prefix}woocommerce_tax_rate_locations l JOIN {$wpdb->prefix}woocommerce_tax_rates r ON r.tax_rate_id = l.tax_rate_id WHERE r.tax_rate_name LIKE 'MwSt.%' OR r.tax_rate_name LIKE 'Helgoland%'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
$rates = $wpdb->query( "DELETE FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_name LIKE 'MwSt.%' OR tax_rate_name LIKE 'Helgoland%'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

$zone_names = array( 'Deutschland – Inseln', 'Deutschland', 'Westeuropa (AT, BE, NL, LU, FR, IE)', 'Südeuropa (IT, ES, PT, GR, HR, SI, MT, CY)', 'Nordeuropa und Baltikum (DK, SE, FI, EE, LV, LT)', 'Mittel- und Osteuropa (PL, CZ, SK, HU, RO, BG)', 'Europa außerhalb der EU (CH, GB, NO, IS, LI)' );
foreach ( WC_Shipping_Zones::get_zones() as $zone_data ) {
	if ( in_array( $zone_data['zone_name'], $zone_names, true ) ) {
		WC_Shipping_Zones::get_zone( $zone_data['id'] )->delete();
	}
}
// The rest of the world zone: remove only methods named by the seeder.
$world = new WC_Shipping_Zone( 0 );
foreach ( $world->get_shipping_methods() as $method ) {
	if ( 'Internationaler Versand' === $method->get_title() ) {
		$world->delete_shipping_method( $method->get_instance_id() );
	}
}

// Terms the seeders created, when nothing uses them any more.
foreach ( array(
	'product_cat'            => array( 'Apparel', 'Footwear', 'Accessories', 'Home & Living', 'Electronics', 'Beauty', 'Sports', 'Books', 'Bekleidung', 'Schuhe', 'Sneaker', 'Accessoires', 'Haus & Wohnen', 'Elektronik', 'Kosmetik', 'Sport', 'Bücher', 'Feinkost' ),
	'product_tag'            => array( 'New', 'Bestseller', 'Eco', 'Limited', 'Gift', 'Summer', 'Winter', 'Premium', 'Neu', 'Nachhaltig', 'Limitiert', 'Geschenkidee', 'Sommer', 'Winter', 'Made in Germany' ),
	'product_shipping_class' => array( 'Sperrgut', 'Zerbrechlich' ),
) as $taxonomy => $names ) {
	foreach ( $names as $name ) {
		$term = get_term_by( 'name', $name, $taxonomy );
		if ( $term && 0 === (int) $term->count ) {
			wp_delete_term( $term->term_id, $taxonomy );
		}
	}
}

WC_Cache_Helper::get_transient_version( 'shipping', true );
wc_delete_product_transients();

WP_CLI::success( sprintf( 'Cleared %d orders, %d products, %d customers, %d coupons, %d tax rates.', count( $order_ids ), count( $product_ids ), count( $user_ids ), $coupons, (int) $rates ) );
