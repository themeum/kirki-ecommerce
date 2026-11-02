<?php

/**
 * Manual concurrency check for stock, coupon, order, refund and invoice number changes.
 *
 * Run through bin/concurrency-stress.sh, which starts many copies of the "worker"
 * mode at the same moment. Each copy is a separate PHP process with its own
 * database connection, which the PHPUnit suite cannot do. It changes real rows
 * of the Docker development site, so it saves what it touches and restores it.
 *
 * Usage (WP-CLI): wp eval-file bin/concurrency-stress.php <mode> <scenario> [start_at]
 * Modes: setup, worker, verify, cleanup.
 * Scenarios: reserve, release, coupon, cancel, refund, edit, checkout, invoice_first, invoice_year.
 */

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\Framework\Wordpress\Models\Option as OptionModel;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\with_prefix;

if (!defined('WP_CLI') || !WP_CLI) {
    exit("Run this file with WP-CLI: wp eval-file bin/concurrency-stress.php <mode> <scenario>\n");
}

$mode = $args[0] ?? '';
$scenario = $args[1] ?? '';
$state_file = sys_get_temp_dir() . '/kecom-stress-' . $scenario . '.json';
$invoice_option_keys = [OptionKeys::LAST_INVOICE_NUMBER, OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR];
$invoice_start = 500;

$read_state = fn() => json_decode((string) file_get_contents($state_file), true) ?: [];
$write_state = fn(array $state) => file_put_contents($state_file, wp_json_encode($state));
$request = function (string $method, string $path, array $params = []) {
    wp_set_current_user(1);
    $request = new WP_REST_Request($method, '/kirki/ecommerce/v1/' . ltrim($path, '/'));
    $request->set_body_params($params);

    return rest_do_request($request);
};

/**
 * Build a manual order payload for a variant.
 *
 * Uses the default shipping zone of the Docker development site (Bangladesh, state 771).
 */
$order_payload = fn(array $items) => [
    'items' => $items,
    'currency_code' => 'USD',
    'payment_provider' => 'paypal',
    'shipping_method' => 'method-0001',
    'is_manual' => true,
    'customer_first_name' => 'Stress',
    'customer_last_name' => 'Test',
    'customer_email' => 'stress@example.com',
    'shipping_first_name' => 'Stress',
    'shipping_last_name' => 'Test',
    'shipping_address_line1' => '1 Test Road',
    'shipping_city' => 'Dhaka',
    'shipping_state' => '771',
    'shipping_postal_code' => '1200',
    'shipping_country' => 'BD',
    'billing_first_name' => 'Stress',
    'billing_last_name' => 'Test',
    'billing_address_line1' => '1 Test Road',
    'billing_city' => 'Dhaka',
    'billing_state' => '771',
    'billing_postal_code' => '1200',
    'billing_country' => 'BD',
];

/**
 * Place a manual order for a variant and return its ID.
 */
$place_order = function (int $variant_id, int $quantity) use ($request, $order_payload) {
    $response = $request('POST', 'orders', $order_payload([['variant_id' => $variant_id, 'quantity' => $quantity]]));
    $body = json_decode(wp_json_encode($response->get_data()), true);

    if ($response->get_status() !== 201) {
        WP_CLI::error('Could not place a stress order: ' . wp_json_encode($body));
    }

    return (int) $body['data']['id'];
};

/**
 * Read the invoice counter rows so cleanup can put them back; placing an order moves the counter.
 */
$save_invoice_rows = function () use ($invoice_option_keys) {
    $rows = [];

    foreach ($invoice_option_keys as $key) {
        $row = OptionModel::query()->where('option_name', with_prefix($key))->first();
        $rows[$key] = $row ? ['value' => $row->option_value, 'autoload' => $row->autoload] : null;
    }

    return $rows;
};

$check = function (string $label, bool $passed, string $detail) {
    WP_CLI::log(($passed ? 'PASS' : 'FAIL') . ' ' . $label . ' (' . $detail . ')');

    if (!$passed) {
        exit(1);
    }
};

switch ($mode) {
    case 'setup':
        if (file_exists($state_file)) {
            WP_CLI::error('A previous ' . $scenario . ' run left its state behind. Run the cleanup mode first so the saved rows are restored.');
        }

        $variant = Variant::query()->order_by('id')->first();
        $state = ['variant_id' => (int) $variant->id, 'original' => [
            'available_quantity' => (int) $variant->available_quantity,
            'committed_quantity' => (int) $variant->committed_quantity,
            'track_inventory' => (bool) $variant->track_inventory,
            'allow_back_order' => (bool) $variant->allow_back_order,
        ], 'invoice_rows' => $save_invoice_rows(), 'general_option' => get_option(with_prefix('general')), 'max_order_id' => (int) Order::query()->max('id')];
        $update = ['track_inventory' => true, 'allow_back_order' => false];

        // Save the original rows before changing anything, so cleanup can restore them even if setup stops half way.
        $write_state($state);

        if ($scenario === 'reserve') {
            $update += ['available_quantity' => 3, 'committed_quantity' => 0];
        } elseif ($scenario === 'release') {
            $update += ['available_quantity' => 0, 'committed_quantity' => 4];
        } elseif ($scenario === 'checkout') {
            // Real checkouts: more shoppers than stock, each placing a whole order.
            $update += ['available_quantity' => 3, 'committed_quantity' => 0];
        } elseif (strpos($scenario, 'invoice_') === 0) {
            // Real checkouts with plenty of stock: every order must get its own invoice number.
            $update += ['available_quantity' => 100, 'committed_quantity' => 0];

            foreach ($invoice_option_keys as $key) {
                OptionModel::query()->where('option_name', with_prefix($key))->delete();
            }

            $is_year_scenario = $scenario === 'invoice_year';
            $general = get_option(with_prefix('general'));
            $general['invoice_number'] = [
                'prefix' => 'STRESS-',
                'suffix' => '',
                'sequence' => str_pad((string) $invoice_start, 6, '0', STR_PAD_LEFT),
                'apply_year_prefix' => $is_year_scenario,
                'reset_sequence_every_year' => $is_year_scenario,
            ];
            update_option(with_prefix('general'), $general);

            if ($is_year_scenario) {
                // The counter is far ahead and last used last year: the first order of this year must restart it.
                OptionModel::create(['option_name' => with_prefix(OptionKeys::LAST_INVOICE_NUMBER), 'option_value' => 9000, 'autoload' => 'yes']);
                OptionModel::create(['option_name' => with_prefix(OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR), 'option_value' => (int) gmdate('Y') - 1, 'autoload' => 'yes']);
            }
        } elseif ($scenario === 'coupon') {
            $coupon = Coupon::create([
                'title' => 'Stress coupon',
                'code' => 'STRESS' . wp_generate_password(6, false),
                'discount_type' => 'free_shipping',
                'eligible_item_type' => 'all_products',
                'is_active' => true,
                'has_usage_limit' => true,
                'usage_limit' => 3,
            ]);
            $state['coupon_id'] = (int) $coupon->id;
            $write_state($state);
        } else {
            // cancel, refund and edit: one stress order, plus a bystander order for cancel whose reservation must stay untouched.
            $update += ['available_quantity' => 50, 'committed_quantity' => 0];
            Variant::where('id', $variant->id)->update($update);
            $state['order_id'] = $place_order((int) $variant->id, 1);
            $write_state($state);

            if ($scenario === 'cancel') {
                $state['bystander_order_id'] = $place_order((int) $variant->id, 2);
                $write_state($state);
            }

            if ($scenario === 'edit') {
                $state['item_id'] = (int) OrderItem::where('order_id', $state['order_id'])->first()->id;
                $write_state($state);
            }

            $update = [];

            if ($scenario === 'refund') {
                Order::where('id', $state['order_id'])->update(['payment_status' => 'paid', 'fulfillment_status' => 'delivered']);
                $order = Order::find($state['order_id']);
                $state['refundable'] = (int) ($order->invoiced_total - $order->invoiced_shipping_total);
            }
        }

        if ($update) {
            Variant::where('id', $variant->id)->update($update);
        }

        $write_state($state);
        WP_CLI::log('setup ' . $scenario . ' ok');
        break;

    case 'worker':
        $state = $read_state();
        $start_at = (float) ($args[2] ?? 0);

        while (microtime(true) < $start_at) {
            usleep(200);
        }

        try {
            if ($scenario === 'reserve') {
                $result = app(InventoryService::class)->reserve_stock($state['variant_id'], 1);
            } elseif ($scenario === 'release') {
                $result = app(InventoryService::class)->release_reserved_stock($state['variant_id'], 1);
            } elseif ($scenario === 'coupon') {
                $result = app(CouponService::class)->claim_usage($state['coupon_id']);
            } elseif ($scenario === 'checkout' || strpos($scenario, 'invoice_') === 0) {
                $response = $request('POST', 'orders', $order_payload([['variant_id' => $state['variant_id'], 'quantity' => 1]]));
                $result = $response->get_status() === 201;

                if (!$result) {
                    WP_CLI::log('REASON ' . substr((string) wp_json_encode($response->get_data()), 0, 160));
                }
            } elseif ($scenario === 'cancel') {
                $result = $request('PATCH', 'orders/' . $state['order_id'] . '/action', ['action' => 'cancel-order'])->get_status() === 200;
            } elseif ($scenario === 'edit') {
                $payload = $order_payload([['id' => $state['item_id'], 'variant_id' => $state['variant_id'], 'quantity' => 3]]) + ['id' => $state['order_id']];
                $result = $request('PUT', 'orders/' . $state['order_id'], $payload)->get_status() === 200;
            } else {
                $amount = $state['refundable'] / 100;
                $result = $request('POST', 'orders/' . $state['order_id'] . '/refunds', ['order_id' => $state['order_id'], 'invoiced_amount' => $amount, 'reason' => 'stress'])->get_status() === 200;
            }

            WP_CLI::log('RESULT ' . ($result ? 'ok' : 'rejected'));
        } catch (Throwable $e) {
            WP_CLI::log('RESULT rejected ' . $e->getMessage());
        }
        break;

    case 'verify':
        $state = $read_state();

        $variant = Variant::find($state['variant_id']);
        $available = (int) $variant->available_quantity;
        $committed = (int) $variant->committed_quantity;

        if ($scenario === 'reserve') {
            $check('stock never below zero', $available >= 0, 'available=' . $available);
            $check('exactly the stock was reserved', $available === 0 && $committed === 3, 'available=' . $available . ' committed=' . $committed);
        } elseif ($scenario === 'release') {
            $check('committed never below zero', $committed >= 0, 'committed=' . $committed);
            $check('released exactly what was committed', $committed === 0 && $available === 4, 'available=' . $available . ' committed=' . $committed);
        } elseif ($scenario === 'coupon') {
            $count = (int) Coupon::find($state['coupon_id'])->current_usage_count;
            $check('coupon usage never above limit', $count <= 3, 'usage=' . $count);
            $check('coupon used exactly up to the limit', $count === 3, 'usage=' . $count);
        } elseif (strpos($scenario, 'invoice_') === 0) {
            $numbers = Order::where('id', '>', $state['max_order_id'])->get()->pluck('invoice_number')->all();
            $sequences = array_map(fn($number) => (int) substr($number, -6), $numbers);
            sort($sequences);

            $check('every order was placed', count($numbers) > 1, 'orders=' . count($numbers));
            $check('no invoice number was given twice', count(array_unique($numbers)) === count($numbers), implode(',', $numbers));
            $check('numbers are consecutive from the start', $sequences === range($invoice_start, $invoice_start + count($numbers) - 1), implode(',', $sequences));
        } elseif ($scenario === 'checkout') {
            $orders = Order::where('id', '>', $state['max_order_id'])->get();
            $invoice_numbers = $orders->pluck('invoice_number')->all();
            $check('stock never below zero', $available >= 0, 'available=' . $available);
            $check('every unit was sold once', $orders->count() === 3 && $available === 0 && $committed === 3, 'orders=' . $orders->count() . ' available=' . $available . ' committed=' . $committed);
            $check('invoice numbers are different', count(array_unique($invoice_numbers)) === count($invoice_numbers), implode(',', $invoice_numbers));
        } elseif ($scenario === 'cancel') {
            $check('stock released once, bystander reservation kept', $committed === 2 && $available === 48, 'available=' . $available . ' committed=' . $committed);
        } elseif ($scenario === 'edit') {
            $check('edits reserved only the real difference', $committed === 3 && $available === 47, 'available=' . $available . ' committed=' . $committed);
        } else {
            $refunds = Refund::where('order_id', $state['order_id'])->count();
            $check('order refunded once', $refunds === 1, 'refunds=' . $refunds);
        }
        break;

    case 'cleanup':
        $state = $read_state();

        if (!$state) {
            WP_CLI::log('cleanup ' . $scenario . ': nothing saved, nothing to restore');
            break;
        }

        if (isset($state['invoice_rows'])) {
            foreach ($invoice_option_keys as $key) {
                OptionModel::query()->where('option_name', with_prefix($key))->delete();

                if (!empty($state['invoice_rows'][$key])) {
                    OptionModel::create(['option_name' => with_prefix($key), 'option_value' => $state['invoice_rows'][$key]['value'], 'autoload' => $state['invoice_rows'][$key]['autoload']]);
                }
            }
        }

        if (isset($state['general_option']) && is_array($state['general_option'])) {
            // Put the whole stored settings group back as it was, including an invoice setting that was never saved (null).
            update_option(with_prefix('general'), $state['general_option']);
        }

        if (isset($state['original'])) {
            Variant::where('id', $state['variant_id'])->update($state['original']);
        }

        foreach (['order_id', 'bystander_order_id'] as $key) {
            if (!empty($state[$key])) {
                Refund::where('order_id', $state[$key])->delete();
                Order::where('id', $state[$key])->delete();
            }
        }

        if (!empty($state['coupon_id'])) {
            Coupon::where('id', $state['coupon_id'])->delete();
        }

        if (isset($state['max_order_id'])) {
            Order::where('id', '>', $state['max_order_id'])->where('customer_email', 'stress@example.com')->delete();
        }

        @unlink($state_file);
        WP_CLI::log('cleanup ' . $scenario . ' ok');
        break;

    default:
        WP_CLI::error('Unknown mode "' . $mode . '". Use setup, worker, verify or cleanup.');
}
