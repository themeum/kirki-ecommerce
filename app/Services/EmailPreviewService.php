<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Email\AdminInventoryNotification;
use Kirki\Ecommerce\App\Constants\Email\AdminOrderNotification;
use Kirki\Ecommerce\App\Constants\Email\AdminUserNotification;
use Kirki\Ecommerce\App\Constants\Email\CustomerOrderNotification;
use Kirki\Ecommerce\App\Constants\Email\CustomerUserNotification;
use Kirki\Ecommerce\App\Mails\Admins\AdminLowStockMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminNewOrderMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminResetPasswordMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerEmailConfirmationMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewAccountMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewOrderMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderCancelMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderCompletedMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderFailedMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderNoteMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderOnHoldMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderProcessingMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderShippedMail;
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

class EmailPreviewService
{
    /**
     * notification key => [ group => [ type => customer mail class, admin mail class ] ].
     *
     * @var array
     */
    protected $notification_classes = [
        'admin' => [
            'order' => [
                AdminOrderNotification::NEW_ORDER => AdminNewOrderMail::class,
            ],
            'user' => [
                AdminUserNotification::RESET_PASSWORD => AdminResetPasswordMail::class,
            ],
            'inventory' => [
                AdminInventoryNotification::LOW_STOCK => AdminLowStockMail::class,
            ],
        ],
        'customer' => [
            'order' => [
                CustomerOrderNotification::NEW_ORDER => CustomerNewOrderMail::class,
                CustomerOrderNotification::CANCELLED_ORDER => CustomerOrderCancelMail::class,
                CustomerOrderNotification::FAILED_ORDER => CustomerOrderFailedMail::class,
                CustomerOrderNotification::ORDER_ON_HOLD => CustomerOrderOnHoldMail::class,
                CustomerOrderNotification::ORDER_PROCESSING => CustomerOrderProcessingMail::class,
                CustomerOrderNotification::ORDER_COMPLETED => CustomerOrderCompletedMail::class,
                CustomerOrderNotification::ORDER_NOTE => CustomerOrderNoteMail::class,
                CustomerOrderNotification::ORDER_SHIPPED => CustomerOrderShippedMail::class,
            ],
            'user' => [
                CustomerUserNotification::RESET_PASSWORD => CustomerResetPasswordMail::class,
                CustomerUserNotification::NEW_CUSTOMER_ACCOUNT => CustomerNewAccountMail::class,
                CustomerUserNotification::CONFIRM_EMAIL_ADDRESS => CustomerEmailConfirmationMail::class,
            ],
        ],
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
     * Get an in-memory sample order (never persisted).
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
     * Get an in-memory sample customer (never persisted).
     *
     * @return Customer
     */
    protected function get_sample_user()
    {
        return user();
    }

    /**
     * Get an in-memory sample product variant (never persisted).
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
