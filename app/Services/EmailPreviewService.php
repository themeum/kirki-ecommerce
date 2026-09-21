<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Admins\AdminLowStockMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminOrderConfirmationMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminResetPasswordMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderConfirmationMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerResetPasswordMail;
use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;
use function Kirki\Ecommerce\Framework\user;

/**
 * Builds sample-data mailers so notification emails can be previewed.
 *
 * @since 1.0.0
 */
class EmailPreviewService
{
    /**
     * Mail classes keyed by recipient type, then notification group, then notification key.
     *
     * @var array<string, array<string, array<string, string>>>
     */
    protected $notification_classes = [
        'admin' => [
            'order' => [
                'order_confirmation' => AdminOrderConfirmationMail::class,
            ],
            'user' => [
                'reset_password' => AdminResetPasswordMail::class,
            ],
            'inventory' => [
                'low_stock' => AdminLowStockMail::class,
            ],
        ],
        'customer' => [
            'order' => [
                'order_confirmation' => CustomerOrderConfirmationMail::class,
            ],
            'user' => [
                'reset_password' => CustomerResetPasswordMail::class,
            ],
        ],
    ];

    /**
     * Resolve a recipient type / group / key combination to a mailer backed by sample data.
     *
     * @since 1.0.0
     *
     * @param string $type  Recipient type: customer or admin.
     * @param string $group Notification group: order, user or inventory.
     * @param string $key   Notification key within the group, such as order_confirmation.
     * @return Mailer|null Null when the combination is not a known notification.
     */
    public function resolve_mailer(string $type, string $group, string $key)
    {
        if (!in_array($type, ['customer', 'admin'], true) || !in_array($group, ['order', 'user', 'inventory'], true)) {
            return null;
        }

        $mail_class = $this->notification_classes[$type][$group][$key] ?? null;

        if ($mail_class) {
            if ($group === 'order') {
                return $mail_class::make(static::get_sample_order());
            }

            if ($group === 'user') {
                return $mail_class::make(static::get_sample_user());
            }

            if ($group === 'inventory') {
                return $mail_class::make(static::get_sample_variant());
            }
        }

        return null;
    }

    /**
     * Get an in-memory sample order, with items and no refunds (never persisted).
     *
     * @since 1.0.0
     *
     * @return Order
     */
    protected function get_sample_order()
    {
        $order_data = json_decoded_data(resource_path('data/sample/email/order.json')) ?? [];
        $items_data = json_decoded_data(resource_path('data/sample/email/order-items.json')) ?? [];

        $order = new Order($order_data);
        $order->created_at = $order_data['created_at'] ?? gmdate('Y-m-d H:i:s');

        $items = collection($items_data)->map(function ($item) {
            return new OrderItem($item);
        });

        $order->set_relation('items', $items);
        $order->set_relation('refunds', collection());

        return $order;
    }

    /**
     * Get the user used as the sample recipient, which is the current user.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Wordpress\User
     */
    protected function get_sample_user()
    {
        return user();
    }

    /**
     * Get an in-memory sample product variant, with its product (never persisted).
     *
     * @since 1.0.0
     *
     * @return Variant
     */
    protected function get_sample_variant()
    {
        $product_data = json_decoded_data(resource_path('data/sample/email/product.json')) ?? [];

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
