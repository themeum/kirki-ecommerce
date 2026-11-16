<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderDeliveredEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderCompletedMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderDeliveredEvent that queues the order-delivered email to the customer.
 *
 * May run inside the order transition's transaction, so it only queues jobs:
 * the queued rows roll back with a failed transition.
 *
 * @since 1.0.0
 */
class SendOrderDeliveredNotificationsListener extends Listener
{
    /**
     * Handle the OrderDeliveredEvent.
     *
     * @since 1.0.0
     *
     * @param OrderDeliveredEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderDeliveredEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderCompletedMail::class, (string) $event->order->customer_email);

        // Send review request notification to customer for delivered products
        try {
            $customer_email = (string) ($event->order->customer_email ?: $event->order->shipping_email ?: $event->order->billing_email);
            if (!empty($customer_email)) {
                $order = $event->order;
                $customer_name = $order->customer_name ?: 'Valued Customer';
                $subject = sprintf(__('[%s] Review your recent purchase - Order #%s', 'kirki-ecommerce'), get_bloginfo('name'), $order->order_number ?: $order->id);
                $items = $order->items ? $order->items : \Kirki\Ecommerce\App\Models\OrderItem::where('order_id', $order->id)->get();
                $item_links = [];
                if ($items) {
                    foreach ($items as $item) {
                        $prod = \Kirki\Ecommerce\App\Models\Product::find($item->product_id);
                        if ($prod) {
                            $item_links[] = sprintf("• %s: %s", $prod->title, \Kirki\Ecommerce\App\Supports\Url::get_product_url($prod->slug) . '#reviews');
                        }
                    }
                }
                if (!empty($item_links)) {
                    $message = sprintf(
                        __("Hello %s,\n\nYour order #%s has been delivered! We would love to know what you think.\n\nPlease take a minute to leave a review on your item(s):\n\n%s\n\nThank you for shopping with us!\n%s", 'kirki-ecommerce'),
                        $customer_name,
                        $order->order_number ?: $order->id,
                        implode("\n", $item_links),
                        get_bloginfo('name')
                    );
                    wp_mail($customer_email, $subject, $message);
                }
            }
        } catch (\Throwable $e) {
            // Silently ignore mail failures
        }
    }
}
