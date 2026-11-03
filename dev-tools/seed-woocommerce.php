<?php
/**
 * Seeds WooCommerce with a European Union store (base country Germany, VAT OSS) to test the migration.
 *
 * Usage: ./wpcli eval-file wp-content/plugins/kirki-ecommerce/dev-tools/seed-woocommerce.php [products] [orders] [customers]
 *
 * Defaults to 500 products, 10000 orders and 400 customers. Safe to run again: products are
 * found by SKU (SEED-0001...), orders are counted by the `_kecom_seed` meta, tax rates, tax
 * classes, shipping zones, pages and coupons are found by name or code, and only the missing
 * ones are created. Products, orders, customers, rates and zones that exist are not changed
 * or deleted. The store options (section "Store settings") are always written again, and they
 * replace the values the site has now.
 *
 * What it sets up:
 * - Store: Germany, EUR, metric units, German price format, German date and time format.
 * - Tax (OSS): prices include VAT, VAT follows the shipping country of the customer, one
 *   standard, reduced and zero rate for each of the 27 member states, and a postcode rate.
 * - Shipping: shipping classes and zones for Germany, its islands, the other member states in
 *   groups, non-EU Europe and the rest of the world, with flat rate, free shipping and pickup.
 * - Checkout, account, privacy, inventory, review, coupon, email and payment options, and the
 *   legal pages that an EU shop needs (terms, privacy policy, withdrawal, imprint).
 */

if ( ! defined( 'ABSPATH' ) || ! class_exists( 'WooCommerce' ) ) {
	WP_CLI::error( 'Run this with WP-CLI on a site where WooCommerce is active.' );
}

$product_target  = isset( $args[0] ) ? (int) $args[0] : 500;
$order_target    = isset( $args[1] ) ? (int) $args[1] : 10000;
$customer_target = isset( $args[2] ) ? (int) $args[2] : 400;

set_time_limit( 0 );
ini_set( 'memory_limit', '1024M' ); // phpcs:ignore WordPress.PHP.IniSet -- dev tool.
mt_srand( 20260101 );

add_filter( 'pre_wp_mail', '__return_true' );
add_filter( 'woocommerce_can_reduce_order_stock', '__return_false' );
add_filter( 'woocommerce_defer_transactional_emails', '__return_true' );
foreach ( array( 'new_order', 'customer_processing_order', 'customer_completed_order', 'customer_on_hold_order', 'customer_refunded_order', 'cancelled_order', 'failed_order', 'customer_note', 'customer_new_account', 'customer_invoice' ) as $email_id ) {
	add_filter( "woocommerce_email_enabled_{$email_id}", '__return_false' );
}

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
			$ids[ $name ] = (int) ( is_array( $term ) ? $term['term_id'] : $term );
		}
	}
	return $ids;
}

function kecom_seed_merge_option( $name, array $values ) {
	$current = get_option( $name, array() );
	update_option( $name, array_merge( is_array( $current ) ? $current : array(), $values ) );
}

function kecom_seed_page( $slug, $title, $content ) {
	$existing = get_page_by_path( $slug );
	if ( $existing ) {
		return (int) $existing->ID;
	}
	return (int) wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_name'    => $slug,
			'post_title'   => $title,
			'post_content' => $content,
		)
	);
}

/* ---------- Reference data ---------- */

// Country => array( standard VAT, reduced VAT, one city, one postcode, language of names ).
$eu = array(
	'AT' => array( 20, 10, 'Wien', '1010' ),
	'BE' => array( 21, 6, 'Brussels', '1000' ),
	'BG' => array( 20, 9, 'Sofia', '1000' ),
	'HR' => array( 25, 13, 'Zagreb', '10000' ),
	'CY' => array( 19, 9, 'Nicosia', '1010' ),
	'CZ' => array( 21, 12, 'Praha', '110 00' ),
	'DK' => array( 25, 25, 'København', '1050' ),
	'EE' => array( 24, 13, 'Tallinn', '10111' ),
	'FI' => array( 25.5, 14, 'Helsinki', '00100' ),
	'FR' => array( 20, 5.5, 'Paris', '75001' ),
	'DE' => array( 19, 7, 'Berlin', '10115' ),
	'GR' => array( 24, 13, 'Athens', '105 57' ),
	'HU' => array( 27, 5, 'Budapest', '1051' ),
	'IE' => array( 23, 13.5, 'Dublin', 'D01 F5P2' ),
	'IT' => array( 22, 10, 'Roma', '00184' ),
	'LV' => array( 21, 12, 'Riga', 'LV-1050' ),
	'LT' => array( 21, 9, 'Vilnius', '01103' ),
	'LU' => array( 17, 8, 'Luxembourg', '1111' ),
	'MT' => array( 18, 7, 'Valletta', 'VLT 1117' ),
	'NL' => array( 21, 9, 'Amsterdam', '1012 JS' ),
	'PL' => array( 23, 8, 'Warszawa', '00-001' ),
	'PT' => array( 23, 6, 'Lisboa', '1100-148' ),
	'RO' => array( 21, 11, 'București', '010011' ),
	'SK' => array( 23, 19, 'Bratislava', '811 01' ),
	'SI' => array( 22, 9.5, 'Ljubljana', '1000' ),
	'ES' => array( 21, 10, 'Madrid', '28013' ),
	'SE' => array( 25, 12, 'Stockholm', '111 29' ),
);

$german_cities = array(
	array( 'Berlin', '10115' ),
	array( 'Hamburg', '20095' ),
	array( 'München', '80331' ),
	array( 'Köln', '50667' ),
	array( 'Frankfurt am Main', '60311' ),
	array( 'Stuttgart', '70173' ),
	array( 'Düsseldorf', '40213' ),
	array( 'Leipzig', '04109' ),
	array( 'Dresden', '01067' ),
	array( 'Hannover', '30159' ),
);

// Places that customers and guests order from. Germany is the biggest share, and a few are outside the EU.
$places = array();
foreach ( $german_cities as $city ) {
	for ( $w = 0; $w < 4; $w++ ) {
		$places[] = array( 'DE', $city[0], $city[1] );
	}
}
foreach ( $eu as $code => $row ) {
	if ( 'DE' !== $code ) {
		$places[] = array( $code, $row[2], $row[3] );
		$places[] = array( $code, $row[2], $row[3] );
	}
}
$places[] = array( 'CH', 'Zürich', '8001' );
$places[] = array( 'GB', 'London', 'SW1A 1AA' );
$places[] = array( 'NO', 'Oslo', '0150' );
$places[] = array( 'US', 'New York', '10001' );

$first_names = array( 'Anna', 'Lukas', 'Sophie', 'Jonas', 'Marie', 'Felix', 'Laura', 'Maximilian', 'Emma', 'Paul', 'Lea', 'Elias', 'Giulia', 'Matteo', 'Camille', 'Hugo', 'Ines', 'Pedro', 'Katarzyna', 'Jan' );
$last_names  = array( 'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer', 'Rossi', 'Dubois', 'García', 'Jansen', 'Nowak', 'Novak', 'Andersson', 'Silva' );
$companies   = array( 'Nordlicht GmbH', 'Rheinwerk AG', 'Bergblick UG', 'Sonnental KG', 'Handelshaus Meyer GmbH' );

/* ---------- Store settings ---------- */

$eu_codes = array_keys( $eu );
$selling  = array_merge( $eu_codes, array( 'CH', 'GB', 'NO', 'IS', 'LI' ) );

$options = array(
	// General.
	'woocommerce_store_address'               => 'Musterstraße 12',
	'woocommerce_store_address_2'             => 'Hinterhaus',
	'woocommerce_store_city'                  => 'Berlin',
	'woocommerce_store_postcode'              => '10115',
	'woocommerce_default_country'             => 'DE',
	'woocommerce_allowed_countries'           => 'specific',
	'woocommerce_all_except_countries'        => array(),
	'woocommerce_specific_allowed_countries'  => $selling,
	'woocommerce_ship_to_countries'           => '',
	'woocommerce_specific_ship_to_countries'  => array(),
	'woocommerce_default_customer_address'    => 'base',
	'woocommerce_calc_taxes'                  => 'yes',
	'woocommerce_enable_coupons'              => 'yes',
	'woocommerce_calc_discounts_sequentially' => 'no',
	'woocommerce_currency'                    => 'EUR',
	'woocommerce_currency_pos'                => 'right_space',
	'woocommerce_price_thousand_sep'          => '.',
	'woocommerce_price_decimal_sep'           => ',',
	'woocommerce_price_num_decimals'          => '2',

	// Products.
	'woocommerce_weight_unit'                 => 'kg',
	'woocommerce_dimension_unit'              => 'cm',
	'woocommerce_enable_reviews'              => 'yes',
	'woocommerce_review_rating_verification_label' => 'yes',
	'woocommerce_review_rating_verification_required' => 'no',
	'woocommerce_enable_review_rating'        => 'yes',
	'woocommerce_review_rating_required'      => 'yes',
	'woocommerce_cart_redirect_after_add'     => 'no',
	'woocommerce_enable_ajax_add_to_cart'     => 'yes',
	'woocommerce_manage_stock'                => 'yes',
	'woocommerce_hold_stock_minutes'          => '60',
	'woocommerce_notify_low_stock'            => 'yes',
	'woocommerce_notify_no_stock'             => 'yes',
	'woocommerce_notify_low_stock_amount'     => '5',
	'woocommerce_notify_no_stock_amount'      => '0',
	'woocommerce_hide_out_of_stock_items'     => 'yes',
	'woocommerce_stock_format'                => '',

	// Tax, set up for the One Stop Shop (OSS): consumers pay the VAT rate of the country they are in.
	'woocommerce_prices_include_tax'          => 'yes',
	'woocommerce_tax_based_on'                => 'shipping',
	'woocommerce_shipping_tax_class'          => 'inherit',
	'woocommerce_tax_round_at_subtotal'       => 'no',
	'woocommerce_tax_display_shop'            => 'incl',
	'woocommerce_tax_display_cart'            => 'incl',
	'woocommerce_price_display_suffix'        => 'inkl. MwSt.',
	'woocommerce_tax_total_display'           => 'itemized',

	// Accounts and checkout.
	'woocommerce_enable_guest_checkout'       => 'yes',
	'woocommerce_enable_checkout_login_reminder' => 'yes',
	'woocommerce_enable_signup_and_login_from_checkout' => 'yes',
	'woocommerce_enable_myaccount_registration' => 'yes',
	'woocommerce_registration_generate_username' => 'yes',
	'woocommerce_registration_generate_password' => 'yes',
	'woocommerce_checkout_company_field'      => 'optional',
	'woocommerce_checkout_address_2_field'    => 'optional',
	'woocommerce_checkout_phone_field'        => 'required',
	'woocommerce_checkout_highlight_required_fields' => 'yes',
	'woocommerce_checkout_terms_and_conditions_checkbox_text' => 'Ich habe die {terms} gelesen und bin damit einverstanden.',
	'woocommerce_checkout_privacy_policy_text' => 'Deine personenbezogenen Daten werden verwendet, um deine Bestellung abzuwickeln und deine Erfahrung auf dieser Website zu verbessern. Mehr dazu in unserer {privacy_policy}.',
	'woocommerce_registration_privacy_policy_text' => 'Deine personenbezogenen Daten werden verwendet, um dein Konto zu verwalten. Mehr dazu in unserer {privacy_policy}.',

	// Privacy: account and order data retention, as the GDPR asks for.
	'woocommerce_erasure_request_removes_order_data' => 'no',
	'woocommerce_erasure_request_removes_download_data' => 'yes',
	'woocommerce_allow_bulk_remove_personal_data' => 'no',
	'woocommerce_delete_inactive_accounts'    => array(
		'number' => '24',
		'unit'   => 'months',
	),
	'woocommerce_trash_pending_orders'        => array(
		'number' => '',
		'unit'   => 'days',
	),
	'woocommerce_trash_failed_orders'         => array(
		'number' => '',
		'unit'   => 'days',
	),
	'woocommerce_trash_cancelled_orders'      => array(
		'number' => '',
		'unit'   => 'days',
	),
	'woocommerce_anonymize_refunded_orders'   => array(
		'number' => '',
		'unit'   => 'months',
	),
	'woocommerce_anonymize_completed_orders'  => array(
		'number' => '10',
		'unit'   => 'years',
	),

	// Emails.
	'woocommerce_email_from_name'             => 'Beispiel Shop GmbH',
	'woocommerce_email_from_address'          => 'shop@beispiel-shop.example',
	'woocommerce_email_footer_text'           => 'Beispiel Shop GmbH · Musterstraße 12 · 10115 Berlin · HRB 123456 B · USt-IdNr. DE123456789 · {site_title}',
	'woocommerce_email_base_color'            => '#0b5cad',
	'woocommerce_email_background_color'      => '#f4f6f8',
	'woocommerce_email_body_background_color' => '#ffffff',
	'woocommerce_email_text_color'            => '#2b2f33',

	// Site, for a shop in Germany.
	'blogname'                                => 'Beispiel Shop',
	'blogdescription'                         => 'Dein Online-Shop aus Berlin',
	'timezone_string'                         => 'Europe/Berlin',
	'date_format'                             => 'd.m.Y',
	'time_format'                             => 'H:i',
	'start_of_week'                           => '1',
);

foreach ( $options as $name => $value ) {
	update_option( $name, $value );
}

// Legal pages that an EU shop needs, linked from checkout and the privacy tools.
$terms_page   = kecom_seed_page( 'agb', 'Allgemeine Geschäftsbedingungen', '<p>Demo terms and conditions (AGB) of Beispiel Shop GmbH.</p>' );
$privacy_page = kecom_seed_page( 'datenschutz', 'Datenschutzerklärung', '<p>Demo privacy policy (Datenschutzerklärung).</p>' );
kecom_seed_page( 'widerruf', 'Widerrufsbelehrung', '<p>Demo right of withdrawal: 14 days, as the EU Consumer Rights Directive requires.</p>' );
kecom_seed_page( 'impressum', 'Impressum', '<p>Beispiel Shop GmbH, Musterstraße 12, 10115 Berlin. USt-IdNr. DE123456789.</p>' );
kecom_seed_page( 'versand', 'Versand und Lieferung', '<p>Demo shipping information.</p>' );
update_option( 'woocommerce_terms_page_id', $terms_page );
update_option( 'wp_page_for_privacy_policy', $privacy_page );

// Emails: which are on, and who gets the admin ones.
$email_settings = array(
	'new_order'                 => array(
		'enabled'   => 'yes',
		'recipient' => 'shop@beispiel-shop.example',
	),
	'cancelled_order'           => array(
		'enabled'   => 'yes',
		'recipient' => 'shop@beispiel-shop.example',
	),
	'failed_order'              => array(
		'enabled'   => 'yes',
		'recipient' => 'shop@beispiel-shop.example',
	),
	'customer_on_hold_order'    => array( 'enabled' => 'yes' ),
	'customer_processing_order' => array( 'enabled' => 'yes' ),
	'customer_completed_order'  => array( 'enabled' => 'yes' ),
	'customer_refunded_order'   => array( 'enabled' => 'yes' ),
	'customer_invoice'          => array( 'enabled' => 'yes' ),
	'customer_note'             => array( 'enabled' => 'yes' ),
	'customer_reset_password'   => array( 'enabled' => 'yes' ),
	'customer_new_account'      => array( 'enabled' => 'yes' ),
);
foreach ( $email_settings as $email_id => $values ) {
	kecom_seed_merge_option( "woocommerce_{$email_id}_settings", $values );
}

// Payment methods that are common in Germany. The credentials are fake.
kecom_seed_merge_option(
	'woocommerce_bacs_settings',
	array(
		'enabled'      => 'yes',
		'title'        => 'Überweisung (SEPA)',
		'description'  => 'Bitte überweise den Betrag auf unser Konto. Die Ware wird nach Zahlungseingang versendet.',
		'instructions' => 'Verwendungszweck: deine Bestellnummer.',
	)
);
update_option(
	'woocommerce_bacs_accounts',
	array(
		array(
			'account_name'   => 'Beispiel Shop GmbH',
			'account_number' => '',
			'sort_code'      => '',
			'bank_name'      => 'Berliner Demo Bank',
			'iban'           => 'DE89370400440532013000',
			'bic'            => 'COBADEFFXXX',
		),
	)
);
kecom_seed_merge_option(
	'woocommerce_cod_settings',
	array(
		'enabled' => 'yes',
		'title'   => 'Nachnahme',
	)
);
kecom_seed_merge_option(
	'woocommerce_cheque_settings',
	array(
		'enabled' => 'no',
		'title'   => 'Scheck',
	)
);
kecom_seed_merge_option(
	'woocommerce_paypal_settings',
	array(
		'enabled'      => 'yes',
		'title'        => 'PayPal',
		'email'        => 'zahlung@beispiel-shop.example',
		'receiver_email' => 'zahlung@beispiel-shop.example',
		'api_username' => 'demo-api-user',
		'api_password' => 'demo-api-password',
		'api_signature' => 'demo-api-signature',
	)
);

WP_CLI::log( 'Store settings: Germany, EUR, EU selling countries, tax, checkout, privacy, inventory, emails and payments set.' );

/* ---------- Tax classes and VAT rates (OSS) ---------- */

$tax_class_slugs = WC_Tax::get_tax_class_slugs();
foreach ( array( 'Reduced rate', 'Zero rate' ) as $class_name ) {
	if ( ! in_array( sanitize_title( $class_name ), $tax_class_slugs, true ) ) {
		WC_Tax::create_tax_class( $class_name );
	}
}

global $wpdb;
$rates_created = 0;
$rate_order    = 0;

$ensure_rate = static function ( array $rate, $postcodes = '' ) use ( $wpdb, &$rates_created ) {
	$found = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- dev tool.
		$wpdb->prepare(
			"SELECT tax_rate_id FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_country = %s AND tax_rate_class = %s AND tax_rate_name = %s",
			$rate['tax_rate_country'],
			$rate['tax_rate_class'],
			$rate['tax_rate_name']
		)
	);
	if ( $found ) {
		return;
	}
	$rate_id = WC_Tax::_insert_tax_rate( $rate );
	if ( '' !== $postcodes ) {
		WC_Tax::_update_tax_rate_postcodes( $rate_id, $postcodes );
	}
	++$rates_created;
};

foreach ( $eu as $code => $row ) {
	$classes = array(
		''             => array( $row[0], 'MwSt. ' . $code, 1 ),
		'reduced-rate' => array( $row[1], 'MwSt. ermäßigt ' . $code, 1 ),
		'zero-rate'    => array( 0, 'MwSt. 0 % ' . $code, 0 ),
	);
	foreach ( $classes as $class => $spec ) {
		$ensure_rate(
			array(
				'tax_rate_country'  => $code,
				'tax_rate_state'     => '',
				'tax_rate'           => number_format( (float) $spec[0], 4, '.', '' ),
				'tax_rate_name'      => $spec[1],
				'tax_rate_priority'  => 1,
				'tax_rate_compound'  => 0,
				'tax_rate_shipping'  => $spec[2],
				'tax_rate_order'     => ++$rate_order,
				'tax_rate_class'     => $class,
			)
		);
	}
}

// A rate for some postcodes only: Helgoland is outside the EU VAT area, so it pays no VAT.
$ensure_rate(
	array(
		'tax_rate_country'  => 'DE',
		'tax_rate_state'    => '',
		'tax_rate'          => '0.0000',
		'tax_rate_name'     => 'Helgoland (kein MwSt.)',
		'tax_rate_priority' => 2,
		'tax_rate_compound' => 0,
		'tax_rate_shipping' => 1,
		'tax_rate_order'    => ++$rate_order,
		'tax_rate_class'    => '',
	),
	'27498'
);

WP_CLI::log( "Tax: {$rates_created} VAT rates created (standard, reduced and zero for 27 member states)." );

/* ---------- Shipping classes and zones ---------- */

$shipping_class_ids = kecom_seed_term_ids( 'product_shipping_class', array( 'Sperrgut', 'Zerbrechlich' ) );
$bulky              = $shipping_class_ids['Sperrgut'] ?? 0;
$fragile            = $shipping_class_ids['Zerbrechlich'] ?? 0;

$flat = static function ( $title, $cost, array $extra = array() ) {
	return array(
		'type'     => 'flat_rate',
		'settings' => array_merge(
			array(
				'title'      => $title,
				'tax_status' => 'taxable',
				'cost'       => (string) $cost,
			),
			$extra
		),
	);
};
$free = static function ( $title, $minimum ) {
	return array(
		'type'     => 'free_shipping',
		'settings' => array(
			'title'      => $title,
			'requires'   => $minimum > 0 ? 'min_amount' : '',
			'min_amount' => (string) $minimum,
		),
	);
};
$free_with_coupon = static function ( $title ) {
	return array(
		'type'     => 'free_shipping',
		'settings' => array(
			'title'    => $title,
			'requires' => 'coupon',
		),
	);
};
$pickup = static function ( $title ) {
	return array(
		'type'     => 'local_pickup',
		'settings' => array(
			'title'      => $title,
			'tax_status' => 'none',
			'cost'       => '0',
		),
	);
};
$class_costs = array(
	'class_cost_' . $bulky   => '9.90',
	'class_cost_' . $fragile => '2.50',
	'no_class_cost'          => '0',
	'type'                   => 'class',
);

// Zones in match order. The postcode zone is first, so it wins over the Germany zone.
$zone_specs = array(
	array(
		'name'      => 'Deutschland – Inseln',
		'locations' => array(
			array( 'DE', 'country' ),
		),
		'postcodes' => array( '25980', '25992', '25996', '25997', '25999', '18565', '26486', '26579', '27498' ),
		'methods'   => array(
			$flat( 'DHL Paket Insel', '9.90' ),
		),
	),
	array(
		'name'      => 'Deutschland',
		'locations' => array( array( 'DE', 'country' ) ),
		'methods'   => array(
			$flat( 'DHL Paket', '4.99', $class_costs ),
			$flat( 'DHL Express (nächster Werktag)', '12.90' ),
			$flat( 'Gewichtsabhängig', '3.90 + ( [qty] * 0.5 )' ),
			$free( 'Versandkostenfrei ab 50 €', 50 ),
			$free_with_coupon( 'Kostenloser Versand mit Gutschein' ),
			$pickup( 'Abholung im Store (Berlin)' ),
		),
	),
	array(
		'name'      => 'Westeuropa (AT, BE, NL, LU, FR, IE)',
		'locations' => array( array( 'AT', 'country' ), array( 'BE', 'country' ), array( 'NL', 'country' ), array( 'LU', 'country' ), array( 'FR', 'country' ), array( 'IE', 'country' ) ),
		'methods'   => array(
			$flat( 'DHL Paket International', '7.90', $class_costs ),
			$flat( 'DHL Express Europe', '19.90' ),
			$free( 'Versandkostenfrei ab 100 €', 100 ),
		),
	),
	array(
		'name'      => 'Südeuropa (IT, ES, PT, GR, HR, SI, MT, CY)',
		'locations' => array( array( 'IT', 'country' ), array( 'ES', 'country' ), array( 'PT', 'country' ), array( 'GR', 'country' ), array( 'HR', 'country' ), array( 'SI', 'country' ), array( 'MT', 'country' ), array( 'CY', 'country' ) ),
		'methods'   => array(
			$flat( 'Standardversand Südeuropa', '10.90', $class_costs ),
			$flat( 'Express Südeuropa', '24.90' ),
			$free( 'Versandkostenfrei ab 120 €', 120 ),
		),
	),
	array(
		'name'      => 'Nordeuropa und Baltikum (DK, SE, FI, EE, LV, LT)',
		'locations' => array( array( 'DK', 'country' ), array( 'SE', 'country' ), array( 'FI', 'country' ), array( 'EE', 'country' ), array( 'LV', 'country' ), array( 'LT', 'country' ) ),
		'methods'   => array(
			$flat( 'Standardversand Nordeuropa', '11.90', $class_costs ),
			$flat( 'Express Nordeuropa', '26.90' ),
			$free( 'Versandkostenfrei ab 150 €', 150 ),
		),
	),
	array(
		'name'      => 'Mittel- und Osteuropa (PL, CZ, SK, HU, RO, BG)',
		'locations' => array( array( 'PL', 'country' ), array( 'CZ', 'country' ), array( 'SK', 'country' ), array( 'HU', 'country' ), array( 'RO', 'country' ), array( 'BG', 'country' ) ),
		'methods'   => array(
			$flat( 'Standardversand Osteuropa', '8.90', $class_costs ),
			$flat( 'Express Osteuropa', '21.90' ),
			$free( 'Versandkostenfrei ab 120 €', 120 ),
		),
	),
	array(
		'name'      => 'Europa außerhalb der EU (CH, GB, NO, IS, LI)',
		'locations' => array( array( 'CH', 'country' ), array( 'GB', 'country' ), array( 'NO', 'country' ), array( 'IS', 'country' ), array( 'LI', 'country' ) ),
		'methods'   => array(
			$flat( 'Standardversand (Zoll nicht enthalten)', '17.90', array( 'tax_status' => 'none' ) ),
			$flat( 'Express (Zoll nicht enthalten)', '34.90', array( 'tax_status' => 'none' ) ),
		),
	),
	array(
		'name'      => 'Welt',
		'zone_id'   => 0,
		'locations' => array(),
		'methods'   => array(
			$flat( 'Internationaler Versand', '29.90', array( 'tax_status' => 'none' ) ),
		),
	),
);

$zone_by_name = array();
foreach ( WC_Shipping_Zones::get_zones() as $existing_zone ) {
	$zone_by_name[ $existing_zone['zone_name'] ] = true;
}

$zones_created = 0;
$zone_order    = 0;

foreach ( $zone_specs as $spec ) {
	++$zone_order;
	$is_world = isset( $spec['zone_id'] );

	if ( ! $is_world && isset( $zone_by_name[ $spec['name'] ] ) ) {
		continue;
	}

	$zone = new WC_Shipping_Zone( $is_world ? 0 : null );

	if ( $is_world ) {
		if ( $zone->get_shipping_methods() ) {
			continue;
		}
	} else {
		$zone->set_zone_name( $spec['name'] );
		$zone->set_zone_order( $zone_order );
		foreach ( $spec['locations'] as $location ) {
			$zone->add_location( $location[0], $location[1] );
		}
		foreach ( $spec['postcodes'] ?? array() as $postcode ) {
			$zone->add_location( $postcode, 'postcode' );
		}
		$zone->save();
	}

	foreach ( $spec['methods'] as $position => $method ) {
		$instance_id = $zone->add_shipping_method( $method['type'] );
		update_option( 'woocommerce_' . $method['type'] . '_' . $instance_id . '_settings', $method['settings'] );
	}

	// One method per zone is switched off, so the migration sees a disabled method too.
	$methods = $zone->get_shipping_methods();
	if ( count( $methods ) > 2 && ! $is_world ) {
		$last = end( $methods );
		$wpdb->update( $wpdb->prefix . 'woocommerce_shipping_zone_methods', array( 'is_enabled' => 0 ), array( 'instance_id' => $last->get_instance_id() ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- dev tool.
	}

	++$zones_created;
}

WC_Cache_Helper::get_transient_version( 'shipping', true );

WP_CLI::log( "Shipping: {$zones_created} zones created with flat rate, free shipping and pickup methods." );

/* ---------- Taxonomies ---------- */

$category_ids = kecom_seed_term_ids(
	'product_cat',
	array( 'Bekleidung', 'Schuhe', 'Accessoires', 'Haus & Wohnen', 'Elektronik', 'Kosmetik', 'Sport', 'Bücher', 'Feinkost' )
);
$tag_ids      = array_values(
	kecom_seed_term_ids(
		'product_tag',
		array( 'Neu', 'Bestseller', 'Nachhaltig', 'Limitiert', 'Geschenkidee', 'Sommer', 'Winter', 'Premium', 'Made in Germany' )
	)
);

// A child category and an attribute that is shared by many products.
$sneaker_parent = $category_ids['Schuhe'] ?? 0;
if ( $sneaker_parent && ! term_exists( 'Sneaker', 'product_cat' ) ) {
	$child = wp_insert_term( 'Sneaker', 'product_cat', array( 'parent' => $sneaker_parent ) );
	if ( ! is_wp_error( $child ) ) {
		$category_ids['Sneaker'] = (int) $child['term_id'];
	}
}

/* ---------- Products ---------- */

$adjectives = array( 'Klassischer', 'Moderner', 'Urbaner', 'Rustikaler', 'Kompakter', 'Deluxe', 'Essentieller', 'Vintage', 'Smarter', 'Gemütlicher' );
$nouns      = array( 'Mantel', 'Sneaker', 'Rucksack', 'Lampe', 'Kopfhörer', 'Serum', 'Yogamatte', 'Notizbuch', 'Becher', 'Uhr', 'Schal', 'Lautsprecher', 'Geldbeutel', 'Flasche', 'Kissen' );
$sizes      = array( 'S', 'M', 'L', 'XL' );
$colors     = array( 'Schwarz', 'Weiß', 'Marine', 'Oliv' );

$bulky_categories   = array( 'Haus & Wohnen', 'Sport' );
$fragile_categories = array( 'Elektronik', 'Kosmetik' );
$category_names     = array_keys( array_diff_key( $category_ids, array( 'Sneaker' => true ) ) );

wp_defer_term_counting( true );

$products_created = 0;
$product_ids      = array();

for ( $i = 1; $i <= $product_target; $i++ ) {
	$sku      = sprintf( 'SEED-%04d', $i );
	$existing = wc_get_product_id_by_sku( $sku );

	if ( $existing ) {
		$product_ids[] = $existing;
		continue;
	}

	$category_name = kecom_seed_pick( $category_names );
	$is_variable   = 0 === $i % 4;
	$is_digital    = 'Bücher' === $category_name && 0 === $i % 3;
	$name          = kecom_seed_pick( $adjectives ) . ' ' . kecom_seed_pick( $nouns ) . ' ' . $i;
	$price         = mt_rand( 5, 300 ) + ( mt_rand( 0, 1 ) ? 0.99 : 0 );

	if ( $is_variable ) {
		$product = new WC_Product_Variable();
		$attr_s  = new WC_Product_Attribute();
		$attr_s->set_name( 'Größe' );
		$attr_s->set_options( $sizes );
		$attr_s->set_position( 0 );
		$attr_s->set_visible( true );
		$attr_s->set_variation( true );
		$attr_c = new WC_Product_Attribute();
		$attr_c->set_name( 'Farbe' );
		$attr_c->set_options( $colors );
		$attr_c->set_position( 1 );
		$attr_c->set_visible( true );
		$attr_c->set_variation( true );
		$product->set_attributes( array( $attr_s, $attr_c ) );
		$product->set_weight( (string) ( mt_rand( 2, 30 ) / 10 ) );
		if ( 0 === $i % 8 ) {
			// The parent manages the stock, and the variations follow it.
			$product->set_manage_stock( true );
			$product->set_stock_quantity( mt_rand( 20, 400 ) );
		}
	} else {
		$product = new WC_Product_Simple();
		$product->set_regular_price( (string) $price );
		if ( 0 === $i % 5 ) {
			$product->set_sale_price( (string) round( $price * 0.8, 2 ) );
		}
		if ( 0 === $i % 15 ) {
			// A sale that starts in the future and one that has ended.
			$product->set_date_on_sale_from( time() + 30 * DAY_IN_SECONDS );
			$product->set_date_on_sale_to( time() + 60 * DAY_IN_SECONDS );
		} elseif ( 0 === $i % 25 ) {
			$product->set_date_on_sale_from( time() - 60 * DAY_IN_SECONDS );
			$product->set_date_on_sale_to( time() - 30 * DAY_IN_SECONDS );
		}
		if ( 0 !== $i % 9 ) {
			$product->set_manage_stock( true );
			$product->set_stock_quantity( mt_rand( 0, 200 ) );
			$product->set_low_stock_amount( mt_rand( 2, 10 ) );
			$product->set_backorders( 0 === $i % 11 ? 'notify' : 'no' );
		} else {
			$product->set_stock_status( 'outofstock' );
		}
		if ( ! $is_digital ) {
			$product->set_weight( (string) ( mt_rand( 1, 50 ) / 10 ) );
			$product->set_length( (string) mt_rand( 5, 60 ) );
			$product->set_width( (string) mt_rand( 5, 40 ) );
			$product->set_height( (string) mt_rand( 2, 30 ) );
		}
		if ( 0 === $i % 20 ) {
			$product->set_sold_individually( true );
		}
	}

	if ( $is_digital ) {
		$product->set_virtual( true );
	}

	if ( method_exists( $product, 'set_global_unique_id' ) ) {
		$product->set_global_unique_id( sprintf( '40%011d', $i ) );
	}

	// Books and food pay the reduced VAT rate, and a few digital items the zero rate.
	if ( in_array( $category_name, array( 'Bücher', 'Feinkost' ), true ) ) {
		$product->set_tax_class( 'reduced-rate' );
	} elseif ( 0 === $i % 50 ) {
		$product->set_tax_class( 'zero-rate' );
	}
	if ( 0 === $i % 97 ) {
		$product->set_tax_status( 'none' );
	}

	if ( in_array( $category_name, $bulky_categories, true ) && $bulky ) {
		$product->set_shipping_class_id( $bulky );
	} elseif ( in_array( $category_name, $fragile_categories, true ) && $fragile ) {
		$product->set_shipping_class_id( $fragile );
	}

	$category_set = array( $category_ids[ $category_name ] );
	if ( 'Schuhe' === $category_name && isset( $category_ids['Sneaker'] ) && 0 === $i % 2 ) {
		$category_set[] = $category_ids['Sneaker'];
	}

	$product->set_name( $name );
	$product->set_sku( $sku );
	$product->set_status( 0 === $i % 17 ? 'draft' : 'publish' );
	$product->set_description( "Demoprodukt {$i}. " . str_repeat( 'Zum Testen der WooCommerce-Migration. ', 3 ) );
	$product->set_short_description( "Kurzbeschreibung für Demoprodukt {$i}." );
	$product->set_featured( 0 === $i % 13 );
	$product->set_category_ids( $category_set );
	$product->set_tag_ids( array_unique( array( kecom_seed_pick( $tag_ids ), kecom_seed_pick( $tag_ids ) ) ) );
	$product->update_meta_data( '_kecom_seed', '1' );
	$product_id = $product->save();

	if ( $is_variable ) {
		$base           = (float) $price;
		$parent_manages = 0 === $i % 8;
		foreach ( $sizes as $size ) {
			foreach ( array_slice( $colors, 0, 2 ) as $color ) {
				$variation = new WC_Product_Variation();
				$variation->set_parent_id( $product_id );
				$variation->set_attributes(
					array(
						'grosse' => $size,
						'farbe'  => $color,
					)
				);
				$variation->set_sku( sprintf( '%s-%s-%s', $sku, $size, strtoupper( substr( $color, 0, 2 ) ) ) );
				$variation->set_regular_price( (string) ( $base + mt_rand( 0, 10 ) ) );
				if ( ! $parent_manages ) {
					$variation->set_manage_stock( true );
					$variation->set_stock_quantity( mt_rand( 0, 80 ) );
				}
				if ( 'XL' === $size ) {
					$variation->set_weight( (string) ( mt_rand( 20, 40 ) / 10 ) );
				}
				$variation->save();
			}
		}
		WC_Product_Variable::sync( $product_id );
	}

	$product_ids[] = $product_id;
	++$products_created;

	if ( 0 === $products_created % 100 ) {
		wp_cache_flush();
	}
}

wp_defer_term_counting( false );

WP_CLI::log( "Products: {$products_created} created, " . count( $product_ids ) . ' total seeded.' );

/* ---------- Customers ---------- */

$customer_ids = array();

for ( $i = 1; $i <= $customer_target; $i++ ) {
	$email = "seed-customer-{$i}@example.com";
	$user  = get_user_by( 'email', $email );

	if ( ! $user ) {
		$first   = kecom_seed_pick( $first_names );
		$last    = kecom_seed_pick( $last_names );
		$place   = kecom_seed_pick( $places );
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
		$customer->set_billing_company( 0 === $i % 10 ? kecom_seed_pick( $companies ) : '' );
		$customer->set_billing_email( $email );
		$customer->set_billing_phone( '+49 30 ' . mt_rand( 1000000, 9999999 ) );
		$customer->set_billing_address_1( kecom_seed_pick( array( 'Hauptstraße', 'Bahnhofstraße', 'Gartenweg', 'Schillerstraße', 'Lindenallee' ) ) . ' ' . mt_rand( 1, 99 ) );
		$customer->set_billing_city( $place[1] );
		$customer->set_billing_postcode( $place[2] );
		$customer->set_billing_country( $place[0] );
		$customer->set_shipping_first_name( $first );
		$customer->set_shipping_last_name( $last );
		$customer->set_shipping_address_1( kecom_seed_pick( array( 'Hauptstraße', 'Bahnhofstraße', 'Gartenweg' ) ) . ' ' . mt_rand( 1, 99 ) );
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
	array( 'WILLKOMMEN10', 'percent', 10 ),
	array( 'VERSANDFREI', 'fixed_cart', 0 ),
);

$coupon_codes = array();

foreach ( $coupon_specs as $index => $spec ) {
	$code = $spec[0];
	if ( ! wc_get_coupon_id_by_code( $code ) ) {
		$coupon = new WC_Coupon();
		$coupon->set_code( $code );
		$coupon->set_discount_type( $spec[1] );
		$coupon->set_amount( (string) $spec[2] );
		$coupon->set_description( "Demo-Gutschein {$code}" );
		if ( 3 === $index ) {
			$coupon->set_usage_limit( 500 );
			$coupon->set_minimum_amount( '50' );
		}
		if ( 5 === $index ) {
			$coupon->set_date_expires( time() + YEAR_IN_SECONDS );
			$coupon->set_maximum_amount( '500' );
			$coupon->set_exclude_sale_items( true );
			$coupon->set_individual_use( true );
		}
		if ( 6 === $index ) {
			$coupon->set_usage_limit_per_user( 1 );
			$coupon->set_product_categories( array_filter( array( $category_ids['Bekleidung'] ?? 0, $category_ids['Schuhe'] ?? 0 ) ) );
		}
		if ( 7 === $index ) {
			$coupon->set_free_shipping( true );
			$coupon->set_minimum_amount( '20' );
		}
		$coupon->save();
	}
	if ( 7 !== $index ) {
		$coupon_codes[] = $code;
	}
}

WP_CLI::log( 'Coupons: ' . count( $coupon_specs ) . ' seeded.' );

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
	'paypal' => 'PayPal',
	'bacs'   => 'Überweisung (SEPA)',
	'cod'    => 'Nachnahme',
);
$gateway_bag = array_merge( array_fill( 0, 5, 'paypal' ), array_fill( 0, 3, 'bacs' ), array( 'cod' ) );

// Shipping by destination country: methods that an order can use, taken from the zones above.
$country_methods = array();
foreach ( $zone_specs as $spec ) {
	foreach ( $spec['locations'] as $location ) {
		if ( 'country' === $location[1] && empty( $spec['postcodes'] ) ) {
			foreach ( $spec['methods'] as $method ) {
				if ( 'flat_rate' === $method['type'] ) {
					$country_methods[ $location[0] ][] = $method['settings'];
				} elseif ( 'free_shipping' === $method['type'] && 'min_amount' === $method['settings']['requires'] ) {
					$country_methods[ $location[0] ]['free'] = (float) $method['settings']['min_amount'];
				}
			}
		}
	}
}

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

wp_defer_term_counting( true );

for ( $n = 0; $n < $orders_to_make; $n++ ) {
	$order = wc_create_order(
		array(
			'status'      => 'pending',
			'customer_id' => $customer_ids && mt_rand( 1, 100 ) <= 70 ? kecom_seed_pick( $customer_ids ) : 0,
		)
	);

	$order->set_currency( 'EUR' );
	$order->set_prices_include_tax( true );
	$created_at = $now - mt_rand( 0, 2 * 365 * DAY_IN_SECONDS );
	$order->set_date_created( $created_at );

	// The address first, because the VAT rate follows the shipping country (OSS).
	if ( $order->get_customer_id() ) {
		$customer = new WC_Customer( $order->get_customer_id() );
		$order->set_address( $customer->get_billing(), 'billing' );
		$order->set_address( $customer->get_shipping(), 'shipping' );
	} else {
		$first = kecom_seed_pick( $first_names );
		$last  = kecom_seed_pick( $last_names );
		$place = kecom_seed_pick( $places );
		$guest = array(
			'first_name' => $first,
			'last_name'  => $last,
			'email'      => 'seed-guest-' . mt_rand( 1, 1500 ) . '@example.com',
			'phone'      => '+49 151 ' . mt_rand( 1000000, 9999999 ),
			'address_1'  => kecom_seed_pick( array( 'Marktplatz', 'Kirchgasse', 'Ringstraße' ) ) . ' ' . mt_rand( 1, 99 ),
			'city'       => $place[1],
			'postcode'   => $place[2],
			'country'    => $place[0],
		);
		$order->set_address( $guest, 'billing' );
		$order->set_address( $guest, 'shipping' );
	}

	$subtotal   = 0.0;
	$line_count = mt_rand( 1, 4 );
	for ( $l = 0; $l < $line_count; $l++ ) {
		$product = wc_get_product( kecom_seed_pick( $published_ids ) );
		if ( $product && $product->is_type( 'variable' ) ) {
			$children = $product->get_children();
			$product  = wc_get_product( kecom_seed_pick( $children ) );
		}
		if ( $product ) {
			$quantity = mt_rand( 1, 3 );
			$order->add_product( $product, $quantity );
			$subtotal += (float) $product->get_price() * $quantity;
		}
	}

	$destination = $order->get_shipping_country();
	$methods     = $country_methods[ $destination ] ?? array();
	$free_from   = $methods['free'] ?? null;
	unset( $methods['free'] );
	$has_shipping = mt_rand( 1, 100 ) <= 90;

	if ( $has_shipping ) {
		$shipping_item = new WC_Order_Item_Shipping();
		if ( $methods ) {
			$method = kecom_seed_pick( $methods );
			$cost   = null !== $free_from && $subtotal >= $free_from ? 0 : (float) preg_replace( '/[^0-9.]/', '', explode( ' ', (string) $method['cost'] )[0] );
			$shipping_item->set_method_title( null !== $free_from && $subtotal >= $free_from ? 'Versandkostenfrei' : $method['title'] );
			$shipping_item->set_method_id( null !== $free_from && $subtotal >= $free_from ? 'free_shipping' : 'flat_rate' );
			$shipping_item->set_total( (string) $cost );
		} else {
			$shipping_item->set_method_title( 'Internationaler Versand' );
			$shipping_item->set_method_id( 'flat_rate' );
			$shipping_item->set_total( '29.90' );
		}
		$order->add_item( $shipping_item );
	}

	if ( mt_rand( 1, 100 ) <= 8 ) {
		$fee = new WC_Order_Item_Fee();
		$fee->set_name( 'Geschenkverpackung' );
		$fee->set_total( '3.00' );
		$fee->set_tax_status( 'taxable' );
		$order->add_item( $fee );
	}

	if ( mt_rand( 1, 100 ) <= 20 ) {
		$order->apply_coupon( kecom_seed_pick( $coupon_codes ) );
	}

	// Taxes use the rates of the shipping country, then the totals.
	$order->calculate_totals( true );

	$gateway = kecom_seed_pick( $gateway_bag );
	$order->set_payment_method( $gateway );
	$order->set_payment_method_title( $gateways[ $gateway ] );
	if ( 'paypal' === $gateway ) {
		$order->set_transaction_id( strtoupper( wp_generate_password( 17, false ) ) );
	}
	$order->set_customer_note( 0 === $n % 15 ? 'Bitte beim Nachbarn abgeben.' : '' );
	if ( 0 === $n % 30 ) {
		$order->set_billing_company( kecom_seed_pick( $companies ) );
	}
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

	$order->add_order_note( 'Bestellung aus dem Demo-Seeder.', 0, false );
	if ( 'completed' === $status ) {
		$order->add_order_note( 'Bestellung versendet und zugestellt.', 0, false );
	}
	if ( 0 === $n % 25 ) {
		$order->add_order_note( 'Kunde fragt nach der Lieferzeit.', 0, true );
	}

	$items = $order->get_items();
	if ( ( 'completed' === $status && 0 === $n % 12 ) || ( 'refunded' === $status && $items ) ) {
		$first_item = reset( $items );
		if ( $first_item ) {
			wc_create_refund(
				array(
					'order_id'      => $order->get_id(),
					'amount'        => (float) $first_item->get_total() + (float) $first_item->get_total_tax(),
					'reason'        => 'Widerruf: Kunde hat die Ware zurückgesendet.',
					'line_items'    => array(
						$first_item->get_id() => array(
							'qty'          => $first_item->get_quantity(),
							'refund_total' => (float) $first_item->get_total(),
							'refund_tax'   => array_map( 'floatval', $first_item->get_taxes()['total'] ?? array() ),
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

wp_defer_term_counting( false );
$progress->finish();

WP_CLI::success( "Seeded: {$products_created} new products, {$created} new orders ({$existing_orders} already existed)." );
