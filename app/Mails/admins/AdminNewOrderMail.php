<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\collection;

class AdminNewOrderMail extends Mailer
{
    /** @var Order */
    protected $order;
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function option_key()
    {
        return 'admin_emails.order_notifications.new_order';
    }

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
                'label' => __('View this Order', 'kirki-ecommerce'),
                'link' => Url::get_order_edit_url($order['id']),
            ]),
            'shipping_tracking_number' => $order['shipping_tracking']['tracking_number'] ?? '',
            'shipping_tracking_url' => $order['shipping_tracking']['tracking_url'] ?? '',
            'customer_name' => collection([$order['customer']['first_name'] ?? '', $order['customer']['last_name'] ?? ''])->filter(fn($name) => !empty($name))->join(' '),
            'customer_note' => $this->get_content('emails.parts.order.customer-note', ['order' => $order]),
        ];
    }
}
