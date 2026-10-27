<?php

namespace Kirki\Ecommerce\App\Mails\Customers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\collection;

/**
 * Email sent to a customer when their order is shipped.
 *
 * @since 1.0.0
 */
class CustomerOrderShippedMail extends Mailer
{
    /** @var Order */
    protected $order;

    /**
     * Create the mail for the given order.
     *
     * @since 1.0.0
     *
     * @param Order $order Order the email is about.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function option_key()
    {
        return 'customer_emails.order_notifications.order_shipped';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function with()
    {
        $order = OrderResource::make($this->order);

        return [
            'order' => $order,
            'order_summary' => $this->get_content('emails.parts.order.order-summary', ['order' => $order]),
            'order_number' => $order['order_number'],
            'order_date' => $order['created_at'],
            'order_detail' => $this->get_content('emails.parts.order.order-details', ['order' => $order]),
            'order_view_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('View Your Order', 'kirki-ecommerce'),
                'link' => Url::get_order_tracking_url($order['uuid']),
            ]),
            'shipping_tracking_number' => $order['shipping_tracking']['tracking_number'] ?? '',
            'shipping_tracking_url' => $this->get_content('emails.parts.link', [
                'label' => $order['shipping_tracking']['tracking_url'] ?? '',
                'link' => $order['shipping_tracking']['tracking_url'] ?? '',
            ]),
            'customer_name' => collection([$order['customer']['first_name'] ?? '', $order['customer']['last_name'] ?? ''])->filter(fn($name) => !empty($name))->join(' '),
            'customer_note' => $this->get_content('emails.parts.order.customer-note', ['order' => $order]),
        ];
    }
}
