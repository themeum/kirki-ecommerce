<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\Email\AdminOrderNotification;
use Kirki\Ecommerce\App\Constants\Email\CustomerOrderNotification;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * The order statuses, the actions each status allows, and the emails each action sends.
 *
 * @since 1.0.0
 */
class OrderLifecycleResource extends StoreResource
{
    /**
     * The emails that each order action sends, as [recipient, template] pairs.
     *
     * Copied from the order listeners in app/Listeners/Order. Actions that are not listed send no email.
     * Mark as processing sends no email when it resumes an order that was on hold.
     */
    const ACTION_EMAILS = [
        OrderAction::RESEND_ORDER_EMAIL => [['customer', CustomerOrderNotification::NEW_ORDER]],
        OrderAction::MARK_AS_PROCESSING => [['customer', CustomerOrderNotification::ORDER_PROCESSING]],
        OrderAction::MARK_AS_HOLD => [['customer', CustomerOrderNotification::ORDER_ON_HOLD]],
        OrderAction::MARK_AS_SHIPPED => [['customer', CustomerOrderNotification::ORDER_SHIPPED]],
        OrderAction::MARK_AS_DELIVERED => [['customer', CustomerOrderNotification::ORDER_COMPLETED]],
        OrderAction::CANCEL_ORDER => [['customer', CustomerOrderNotification::CANCELLED_ORDER], ['admin', AdminOrderNotification::CANCELLED_ORDER]],
        OrderAction::CANCEL_FULFILLMENT => [['customer', CustomerOrderNotification::CANCELLED_ORDER], ['admin', AdminOrderNotification::CANCELLED_ORDER]],
    ];

    /** @var string */
    protected $title = 'Order lifecycle';

    /** @var string */
    protected $description = 'The order statuses, the fulfillment, payment and order actions that each status allows, the status that each action leads to, and the emails that each action sends with their on or off state.';

    /** @var string */
    protected $uri = 'kecom://store/order-lifecycle';

    /**
     * Read the order lifecycle.
     *
     * @since 1.0.0
     *
     * @param Request $request The read, which carries no arguments.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        $statuses = [];

        foreach (OrderStatus::get_transition_matrix() as $status => $state) {
            $statuses[] = [
                'status' => $status,
                'fulfillment_status' => $state['fulfillment_status'] ?? null,
                'payment_status' => $state['payment_status'] ?? null,
                'fulfillment_actions' => array_values($state['fulfillment_actions'] ?? []),
                'payment_actions' => array_values($state['payment_actions'] ?? []),
                'order_actions' => array_values($state['order_actions'] ?? []),
                'transitions' => (object) ($state['transitions'] ?? []),
            ];
        }

        return Response::structured([
            'statuses' => $statuses,
            'action_emails' => $this->action_emails(),
            'notes' => [
                __('Refund statuses are not part of this list. Refund actions are not available yet.', 'kirki-ecommerce'),
                __('"mark-as-hold" is in the transitions of some statuses, but it is not in their action lists.', 'kirki-ecommerce'),
                __('"mark-as-processing" sends no email when it resumes an order that was on hold.', 'kirki-ecommerce'),
                __('An action that is not in "action_emails" sends no email.', 'kirki-ecommerce'),
            ],
        ]);
    }

    /**
     * Get the emails that each action sends, with the on or off state of each template.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function action_emails()
    {
        $email = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $rows = [];

        foreach (static::ACTION_EMAILS as $action => $templates) {
            $rows[] = [
                'action' => $action,
                'emails' => array_map(function ($template) use ($email) {
                    list($recipient, $key) = $template;

                    return [
                        'recipient' => $recipient,
                        'template' => $key,
                        'is_enabled' => (bool) $email->get($recipient . '_emails.order_notifications.' . $key . '.is_enabled', false),
                    ];
                }, $templates),
            ];
        }

        return $rows;
    }
}
