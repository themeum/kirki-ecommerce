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
use Kirki\Ecommerce\App\Mails\Admins\AdminOrderCancelledMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminOrderFailedMail;
use Kirki\Ecommerce\App\Mails\Admins\AdminOutOfStockMail;
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
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use WP_CLI\Context\Admin;

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
                AdminOrderNotification::NEW_ORDER => AdminNewOrderMail::class,
                AdminOrderNotification::CANCELLED_ORDER => AdminOrderCancelledMail::class,
                AdminOrderNotification::FAILED_ORDER => AdminOrderFailedMail::class,
            ],
            'user' => [
                AdminUserNotification::RESET_PASSWORD => AdminResetPasswordMail::class,
            ],
            'inventory' => [
                AdminInventoryNotification::LOW_STOCK => AdminLowStockMail::class,
                AdminInventoryNotification::OUT_OF_STOCK => AdminOutOfStockMail::class,
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
     * Resolve a recipient type / group / key combination to a mailer backed by sample data.
     *
     * @since 1.0.0
     *
     * @param string $type  Recipient type: customer or admin.
     * @param string $group Notification group: order, user or inventory.
     * @param string $key   Notification key within the group, such as new_order.
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

        $variant = new Variant(array_merge($product_data, ['product_id' => $product_data['id'] ?? null]));
        $variant->set_relation('product', $product);
        $variant->set_relation('attribute_values', collection($product_data['attribute_values'] ?? [])->map(function ($attribute_value) {
            return new AttributeValue($attribute_value);
        }));

        return $variant;
    }
}
