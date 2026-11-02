<?php
/**
 * Seeds WooCommerce with demo data to test the migration.
 *
 * Usage: ./wpcli eval-file wp-content/plugins/kirki-ecommerce/dev-tools/seed-woocommerce.php [products] [orders]
 *
 * Defaults to 100 products and 1000 orders. Safe to run again: products are
 * found by SKU (SEED-0001...), orders are counted by the `_kecom_seed` meta, and
 * only the missing ones are created. Nothing existing is changed or deleted.
 */

if ( ! defined( 'ABSPATH' ) || ! class_exists( 'WooCommerce' ) ) {
	WP_CLI::error( 'Run this with WP-CLI on a site where WooCommerce is active.' );
}

$product_target = isset( $args[0] ) ? (int) $args[0] : 100;
$order_target   = isset( $args[1] ) ? (int) $args[1] : 1000;

set_time_limit( 0 );
mt_srand( 20260101 );

add_filter( 'pre_wp_mail', '__return_true' );
add_filter( 'woocommerce_can_reduce_order_stock', '__return_false' );
add_filter( 'woocommerce_defer_transactional_emails', '__return_true' );
add_filter( 'woocommerce_email_enabled_new_order', '__return_false' );
add_filter( 'woocommerce_email_enabled_customer_processing_order', '__return_false' );
add_filter( 'woocommerce_email_enabled_customer_completed_order', '__return_false' );
add_filter( 'woocommerce_email_enabled_customer_on_hold_order', '__return_false' );
add_filter( 'woocommerce_email_enabled_customer_refunded_order', '__return_false' );
add_filter( 'woocommerce_email_enabled_cancelled_order', '__return_false' );
add_filter( 'woocommerce_email_enabled_failed_order', '__return_false' );
add_filter( 'woocommerce_email_enabled_customer_note', '__return_false' );
add_filter( 'woocommerce_email_enabled_customer_new_account', '__return_false' );
add_filter( 'woocommerce_email_enabled_customer_invoice', '__return_false' );

function kecom_seed_pick( array $items ) {
	return $items[ mt_rand( 0, count( $items ) - 1 ) ];
}

function kecom_seed_term_ids( $taxonomy, array $names ) {
	$ids = array();
	foreach ( $names as $name ) {
		$term = term_exists( $name, $taxonomy );
		if ( ! $term ) {
			$term = wp_insert_term( $name, $taxonomy );
		}
		if ( ! is_wp_error( $term ) ) {
			$ids[] = (int) ( is_array( $term ) ? $term['term_id'] : $term );
		}
	}
	return $ids;
}

/* ---------- Taxonomies ---------- */

$category_ids = kecom_seed_term_ids(
	'product_cat',
	array( 'Apparel', 'Footwear', 'Accessories', 'Home & Living', 'Electronics', 'Beauty', 'Sports', 'Books' )
);
$tag_ids      = kecom_seed_term_ids(
	'product_tag',
	array( 'New', 'Bestseller', 'Eco', 'Limited', 'Gift', 'Summer', 'Winter', 'Premium' )
);

/* ---------- Products ---------- */

$adjectives = array( 'Classic', 'Modern', 'Urban', 'Rustic', 'Compact', 'Deluxe', 'Essential', 'Vintage', 'Smart', 'Cozy' );
$nouns      = array( 'Jacket', 'Sneaker', 'Backpack', 'Lamp', 'Headphones', 'Serum', 'Yoga Mat', 'Notebook', 'Mug', 'Watch', 'Scarf', 'Speaker', 'Wallet', 'Bottle', 'Cushion' );
$sizes      = array( 'S', 'M', 'L', 'XL' );
$colors     = array( 'Black', 'White', 'Navy', 'Olive' );

$products_created = 0;
$product_ids      = array();

for ( $i = 1; $i <= $product_target; $i++ ) {
	$sku      = sprintf( 'SEED-%04d', $i );
	$existing = wc_get_product_id_by_sku( $sku );

	if ( $existing ) {
		$product_ids[] = $existing;
		continue;
	}

	$is_variable = 0 === $i % 4;
	$name        = kecom_seed_pick( $adjectives ) . ' ' . kecom_seed_pick( $nouns ) . ' ' . $i;
	$price       = mt_rand( 5, 300 ) + ( mt_rand( 0, 1 ) ? 0.99 : 0 );

	if ( $is_variable ) {
		$product = new WC_Product_Variable();
		$attr_s  = new WC_Product_Attribute();
		$attr_s->set_name( 'Size' );
		$attr_s->set_options( $sizes );
		$attr_s->set_position( 0 );
		$attr_s->set_visible( true );
		$attr_s->set_variation( true );
		$attr_c = new WC_Product_Attribute();
		$attr_c->set_name( 'Color' );
		$attr_c->set_options( $colors );
		$attr_c->set_position( 1 );
		$attr_c->set_visible( true );
		$attr_c->set_variation( true );
		$product->set_attributes( array( $attr_s, $attr_c ) );
	} else {
		$product = new WC_Product_Simple();
		$product->set_regular_price( (string) $price );
		if ( 0 === $i % 5 ) {
			$product->set_sale_price( (string) round( $price * 0.8, 2 ) );
		}
		if ( 0 !== $i % 9 ) {
			$product->set_manage_stock( true );
			$product->set_stock_quantity( mt_rand( 0, 200 ) );
		} else {
			$product->set_stock_status( 'outofstock' );
		}
		$product->set_weight( (string) ( mt_rand( 1, 50 ) / 10 ) );
		$product->set_length( (string) mt_rand( 5, 60 ) );
		$product->set_width( (string) mt_rand( 5, 40 ) );
		$product->set_height( (string) mt_rand( 2, 30 ) );
	}

	$product->set_name( $name );
	$product->set_sku( $sku );
	$product->set_status( 0 === $i % 17 ? 'draft' : 'publish' );
	$product->set_description( "Demo product {$i}. " . str_repeat( 'Made for testing the WooCommerce migration. ', 3 ) );
	$product->set_short_description( "Short description for demo product {$i}." );
	$product->set_featured( 0 === $i % 13 );
	$product->set_category_ids( array( kecom_seed_pick( $category_ids ) ) );
	$product->set_tag_ids( array_unique( array( kecom_seed_pick( $tag_ids ), kecom_seed_pick( $tag_ids ) ) ) );
	$product->update_meta_data( '_kecom_seed', '1' );
	$product_id = $product->save();

	if ( $is_variable ) {
		$base = (float) $price;
		foreach ( $sizes as $size ) {
			foreach ( array_slice( $colors, 0, 2 ) as $color ) {
				$variation = new WC_Product_Variation();
				$variation->set_parent_id( $product_id );
				$variation->set_attributes(
					array(
						'size'  => $size,
						'color' => $color,
					)
				);
				$variation->set_sku( sprintf( '%s-%s-%s', $sku, $size, strtoupper( substr( $color, 0, 2 ) ) ) );
				$variation->set_regular_price( (string) ( $base + mt_rand( 0, 10 ) ) );
				$variation->set_manage_stock( true );
				$variation->set_stock_quantity( mt_rand( 0, 80 ) );
				$variation->save();
			}
		}
		WC_Product_Variable::sync( $product_id );
	}

	$product_ids[] = $product_id;
	++$products_created;
}

WP_CLI::log( "Products: {$products_created} created, " . count( $product_ids ) . ' total seeded.' );

/* ---------- Customers ---------- */

$first_names = array( 'Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Mason', 'Sophia', 'Lucas', 'Mia', 'Ethan', 'Amelia', 'Leo' );
$last_names  = array( 'Khan', 'Rahman', 'Smith', 'Garcia', 'Brown', 'Miller', 'Davis', 'Lopez', 'Wilson', 'Clark' );
$countries   = array(
	array( 'US', 'New York', '10001' ),
	array( 'GB', 'London', 'SW1A 1AA' ),
	array( 'BD', 'Dhaka', '1207' ),
	array( 'DE', 'Berlin', '10115' ),
	array( 'CA', 'Toronto', 'M5H 2N2' ),
);

$customer_ids = array();

for ( $i = 1; $i <= 60; $i++ ) {
	$email = "seed-customer-{$i}@example.com";
	$user  = get_user_by( 'email', $email );

	if ( ! $user ) {
		$first   = kecom_seed_pick( $first_names );
		$last    = kecom_seed_pick( $last_names );
		$place   = kecom_seed_pick( $countries );
		$user_id = wp_insert_user(
			array(
				'user_login'   => "seed_customer_{$i}",
				'user_pass'    => wp_generate_password( 24 ),
				'user_email'   => $email,
				'first_name'   => $first,
				'last_name'    => $last,
				'display_name' => "{$first} {$last}",
				'role'         => 'customer',
			)
		);
		if ( is_wp_error( $user_id ) ) {
			continue;
		}
		$customer = new WC_Customer( $user_id );
		$customer->set_billing_first_name( $first );
		$customer->set_billing_last_name( $last );
		$customer->set_billing_email( $email );
		$customer->set_billing_phone( '+1555' . mt_rand( 1000000, 9999999 ) );
		$customer->set_billing_address_1( mt_rand( 1, 999 ) . ' Demo Street' );
		$customer->set_billing_city( $place[1] );
		$customer->set_billing_postcode( $place[2] );
		$customer->set_billing_country( $place[0] );
		$customer->set_shipping_first_name( $first );
		$customer->set_shipping_last_name( $last );
		$customer->set_shipping_address_1( mt_rand( 1, 999 ) . ' Demo Street' );
		$customer->set_shipping_city( $place[1] );
		$customer->set_shipping_postcode( $place[2] );
		$customer->set_shipping_country( $place[0] );
		$customer->save();
		$user = get_user_by( 'id', $user_id );
	}

	$customer_ids[] = $user->ID;
}

WP_CLI::log( 'Customers: ' . count( $customer_ids ) . ' registered seeded.' );

/* ---------- Coupons ---------- */

$coupon_specs = array(
	array( 'SEED10', 'percent', 10 ),
	array( 'SEED20', 'percent', 20 ),
	array( 'SEED5OFF', 'fixed_cart', 5 ),
	array( 'SEED15OFF', 'fixed_cart', 15 ),
	array( 'SEEDITEM3', 'fixed_product', 3 ),
	array( 'SEEDCAP', 'percent', 25 ),
);

$coupon_codes = array();

foreach ( $coupon_specs as $index => $spec ) {
	$code = $spec[0];
	if ( ! wc_get_coupon_id_by_code( $code ) ) {
		$coupon = new WC_Coupon();
		$coupon->set_code( $code );
		$coupon->set_discount_type( $spec[1] );
		$coupon->set_amount( (string) $spec[2] );
		$coupon->set_description( "Demo coupon {$code}" );
		if ( 3 === $index ) {
			$coupon->set_usage_limit( 500 );
			$coupon->set_minimum_amount( '50' );
		}
		if ( 5 === $index ) {
			$coupon->set_date_expires( time() + YEAR_IN_SECONDS );
		}
		$coupon->save();
	}
	$coupon_codes[] = $code;
}

WP_CLI::log( 'Coupons: ' . count( $coupon_codes ) . ' seeded.' );

/* ---------- Orders ---------- */

$existing_orders = count(
	wc_get_orders(
		array(
			'limit'      => -1,
			'return'     => 'ids',
			'meta_key'   => '_kecom_seed',
			'meta_value' => '1',
			'status'     => array_keys( wc_get_order_statuses() ),
		)
	)
);
$orders_to_make  = max( 0, $order_target - $existing_orders );

$statuses = array(
	'completed'  => 55,
	'processing' => 15,
	'on-hold'    => 6,
	'pending'    => 6,
	'cancelled'  => 7,
	'refunded'   => 4,
	'failed'     => 4,
);
$status_bag = array();
foreach ( $statuses as $status => $weight ) {
	$status_bag = array_merge( $status_bag, array_fill( 0, $weight, $status ) );
}

$gateways = array(
	'bacs'   => 'Direct bank transfer',
	'cheque' => 'Check payments',
	'cod'    => 'Cash on delivery',
);

$published_ids = array_values(
	array_filter(
		$product_ids,
		static function ( $id ) {
			return 'publish' === get_post_status( $id );
		}
	)
);

$progress = \WP_CLI\Utils\make_progress_bar( 'Creating orders', $orders_to_make );
$created  = 0;
$now      = time();

for ( $n = 0; $n < $orders_to_make; $n++ ) {
	$order = wc_create_order(
		array(
			'status'      => 'pending',
			'customer_id' => mt_rand( 1, 100 ) <= 70 ? kecom_seed_pick( $customer_ids ) : 0,
		)
	);

	$created_at = $now - mt_rand( 0, 365 * DAY_IN_SECONDS );
	$order->set_date_created( $created_at );

	$line_count = mt_rand( 1, 4 );
	for ( $l = 0; $l < $line_count; $l++ ) {
		$product = wc_get_product( kecom_seed_pick( $published_ids ) );
		if ( $product && $product->is_type( 'variable' ) ) {
			$children = $product->get_children();
			$product  = wc_get_product( kecom_seed_pick( $children ) );
		}
		if ( $product ) {
			$order->add_product( $product, mt_rand( 1, 3 ) );
		}
	}

	$place = kecom_seed_pick( $countries );
	if ( $order->get_customer_id() ) {
		$customer = new WC_Customer( $order->get_customer_id() );
		$billing  = $customer->get_billing();
		$shipping = $customer->get_shipping();
		$order->set_address( $billing, 'billing' );
		$order->set_address( $shipping, 'shipping' );
	} else {
		$first = kecom_seed_pick( $first_names );
		$last  = kecom_seed_pick( $last_names );
		$guest = array(
			'first_name' => $first,
			'last_name'  => $last,
			'email'      => 'seed-guest-' . mt_rand( 1, 250 ) . '@example.com',
			'phone'      => '+1555' . mt_rand( 1000000, 9999999 ),
			'address_1'  => mt_rand( 1, 999 ) . ' Guest Avenue',
			'city'       => $place[1],
			'postcode'   => $place[2],
			'country'    => $place[0],
		);
		$order->set_address( $guest, 'billing' );
		$order->set_address( $guest, 'shipping' );
	}

	if ( mt_rand( 1, 100 ) <= 80 ) {
		$shipping_item = new WC_Order_Item_Shipping();
		$shipping_item->set_method_title( 'Flat rate' );
		$shipping_item->set_method_id( 'flat_rate' );
		$shipping_item->set_total( (string) kecom_seed_pick( array( 5, 8, 12 ) ) );
		$order->add_item( $shipping_item );
	}

	if ( mt_rand( 1, 100 ) <= 8 ) {
		$fee = new WC_Order_Item_Fee();
		$fee->set_name( 'Gift wrapping' );
		$fee->set_total( '3.00' );
		$order->add_item( $fee );
	}

	$order->calculate_totals( false );

	if ( mt_rand( 1, 100 ) <= 20 ) {
		$order->apply_coupon( kecom_seed_pick( $coupon_codes ) );
	}

	$gateway = kecom_seed_pick( array_keys( $gateways ) );
	$order->set_payment_method( $gateway );
	$order->set_payment_method_title( $gateways[ $gateway ] );
	$order->set_customer_note( 0 === $n % 15 ? 'Please leave at the door.' : '' );
	$order->update_meta_data( '_kecom_seed', '1' );

	$status = kecom_seed_pick( $status_bag );
	if ( in_array( $status, array( 'completed', 'processing', 'refunded' ), true ) ) {
		$order->set_date_paid( $created_at + HOUR_IN_SECONDS );
	}
	if ( in_array( $status, array( 'completed', 'refunded' ), true ) ) {
		$order->set_date_completed( $created_at + DAY_IN_SECONDS );
	}
	$order->set_status( $status );
	$order->save();

	$order->add_order_note( 'Order placed from the demo seeder.', 0, false );
	if ( 'completed' === $status ) {
		$order->add_order_note( 'Order shipped and delivered.', 0, false );
	}
	if ( 0 === $n % 25 ) {
		$order->add_order_note( 'Customer asked about delivery time.', 0, true );
	}

	if ( 'completed' === $status && 0 === $n % 12 ) {
		$items = $order->get_items();
		$first_item = reset( $items );
		if ( $first_item ) {
			wc_create_refund(
				array(
					'order_id'   => $order->get_id(),
					'amount'     => (float) $first_item->get_total(),
					'reason'     => 'Customer returned the item.',
					'line_items' => array(
						$first_item->get_id() => array(
							'qty'          => $first_item->get_quantity(),
							'refund_total' => (float) $first_item->get_total(),
						),
					),
					'restock_items' => false,
				)
			);
		}
	}

	++$created;
	$progress->tick();

	if ( 0 === $created % 100 ) {
		wp_cache_flush();
	}
}

$progress->finish();

WP_CLI::success( "Seeded: {$products_created} new products, {$created} new orders ({$existing_orders} already existed)." );
