<?php

namespace Kirki\Ecommerce\App\Mails;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\admins\AdminOrderCancelledMail;
use Kirki\Ecommerce\App\Mails\admins\AdminOrderCompletedMail;
use Kirki\Ecommerce\App\Mails\admins\AdminOrderConfirmationMail;
use Kirki\Ecommerce\App\Mails\admins\AdminOrderFailedMail;
use Kirki\Ecommerce\App\Mails\admins\AdminOrderOnHoldMail;
use Kirki\Ecommerce\App\Mails\admins\AdminOrderProcessingMail;
use Kirki\Ecommerce\App\Mails\admins\AdminOrderRefundedMail;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderCancelledMail;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderCompletedMail;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderConfirmationMail;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderFailedMail;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderOnHoldMail;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderProcessingMail;
use Kirki\Ecommerce\App\Mails\customers\CustomerOrderRefundedMail;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;

class EmailNotificationRegistry
{
    /**
     * Order-event notification key => [customer mail class, admin mail class].
     *
     * @var array
     */
    protected static $order_notification_classes = [
        'order_confirmation' => [CustomerOrderConfirmationMail::class, AdminOrderConfirmationMail::class],
        'order_processing' => [CustomerOrderProcessingMail::class, AdminOrderProcessingMail::class],
        'order_on_hold' => [CustomerOrderOnHoldMail::class, AdminOrderOnHoldMail::class],
        'order_completed' => [CustomerOrderCompletedMail::class, AdminOrderCompletedMail::class],
        'order_refunded' => [CustomerOrderRefundedMail::class, AdminOrderRefundedMail::class],
        'order_cancelled' => [CustomerOrderCancelledMail::class, AdminOrderCancelledMail::class],
        'order_failed' => [CustomerOrderFailedMail::class, AdminOrderFailedMail::class],
    ];

    /**
     * Resolve a recipient type / group / key combination to a ready-to-use
     * Mailer instance backed by sample data, or null if the combination is
     * not one of the known notifications.
     *
     * @param string $type
     * @param string $group
     * @param string $key
     * @return Mailer|null
     */
    public static function resolve(string $type, string $group, string $key)
    {
        if (!in_array($type, ['customer', 'admin'], true)) {
            return null;
        }

        if ($group === 'order' && isset(static::$order_notification_classes[$key])) {
            [$customer_class, $admin_class] = static::$order_notification_classes[$key];
            $mail_class = $type === 'admin' ? $admin_class : $customer_class;

            return $mail_class::make(static::build_sample_order());
        }

        if ($group === 'user' && $key === 'reset_password') {
            return ResetPasswordNotificationMail::make(static::build_sample_customer(), "{$type}_emails.user_notifications.reset_password");
        }

        if ($type === 'admin' && $group === 'inventory' && $key === 'low_stock') {
            return LowStockNotificationMail::make(static::build_sample_variant(), 'admin_emails.inventory_notifications.low_stock');
        }

        return null;
    }

    /**
     * Build an in-memory sample order (never persisted).
     *
     * @return Order
     */
    protected static function build_sample_order()
    {
        $order_data = json_decoded_data(resource_path('data/sample/order.json')) ?? [];
        $items_data = json_decoded_data(resource_path('data/sample/order-items.json')) ?? [];

        $order = new Order($order_data);
        $order->created_at = $order_data['paid_at'] ?? gmdate('Y-m-d H:i:s');

        $items = collection($items_data)->map(function ($item) {
            return new OrderItem($item);
        });

        $order->set_relation('items', $items);
        $order->set_relation('refunds', collection());

        return $order;
    }

    /**
     * Build an in-memory sample customer (never persisted).
     *
     * @return Customer
     */
    protected static function build_sample_customer()
    {
        $customer_data = json_decoded_data(resource_path('data/sample/customer.json')) ?? [];

        return new Customer($customer_data);
    }

    /**
     * Build an in-memory sample product variant (never persisted).
     *
     * @return Variant
     */
    protected static function build_sample_variant()
    {
        $product_data = json_decoded_data(resource_path('data/sample/product.json')) ?? [];

        $product = new Product([
            'id' => $product_data['id'] ?? null,
            'title' => $product_data['title'] ?? '',
        ]);

        $variant = new Variant([
            'product_id' => $product_data['id'] ?? null,
            'sku' => $product_data['sku'] ?? '',
            'available_quantity' => $product_data['available_quantity'] ?? 0,
            'low_stock_threshold' => $product_data['low_stock_threshold'] ?? 0,
        ]);
        $variant->set_relation('product', $product);

        return $variant;
    }
}
