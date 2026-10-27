<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Actions\Order\PerformOrderAction;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\DTO\Order\PerformOrderActionDTO;
use Kirki\Ecommerce\App\Mcp\Concerns\FindsOrders;
use Kirki\Ecommerce\App\Mcp\Concerns\MasksPersonalData;
use Kirki\Ecommerce\App\Mcp\Resources\OrderLifecycleResource;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Base of the tools that run one order lifecycle action through the order state matrix.
 *
 * @since 1.0.0
 */
abstract class OrderActionTool extends StoreWriteTool
{
    use FindsOrders;
    use MasksPersonalData;

    /** @var bool */
    protected $open_world = true;

    /** @var OrderService */
    protected $order_service;

    /** @var PerformOrderAction */
    protected $perform_action;

    /**
     * Create the tool with the order services.
     *
     * @since 1.0.0
     *
     * @param OrderService       $order_service  Order lookup service.
     * @param PerformOrderAction $perform_action Action that runs an order lifecycle action.
     */
    public function __construct(OrderService $order_service, PerformOrderAction $perform_action)
    {
        $this->order_service = $order_service;
        $this->perform_action = $perform_action;
    }

    /**
     * Get the lifecycle action to run.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return string One of the OrderAction constants.
     */
    abstract protected function action(array $params);

    /**
     * Get the extra fields of the action, such as tracking data or a reason.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return array<string, mixed>
     */
    protected function action_fields(array $params)
    {
        return [];
    }

    /**
     * Validate the order identifier with the rules of the tool.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>  $arguments Arguments without the confirmation token.
     * @param array<string, mixed>  $rules     Rules of the other arguments.
     * @param array<string, string> $messages  Messages of the other arguments.
     *
     * @return array<string, mixed> Validated arguments.
     * @throws ValidationException When an argument is not valid.
     */
    protected function validate_order_arguments(array $arguments, array $rules = [], array $messages = [])
    {
        $params = $this->validate_arguments($arguments, $this->order_identifier_rules() + $rules, $this->order_identifier_messages() + $messages);
        $this->require_order_identifier($params);

        return $params;
    }

    /**
     * Validate the arguments. Tools with more arguments override this.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        return $this->validate_order_arguments($arguments);
    }

    /**
     * Find the order.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $order = $this->find_order($params);

        return $order === null ? Response::error($this->order_not_found_message()) : $order;
    }

    /**
     * Check the action against the state matrix and describe the status change and the emails.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $action = $this->action($params);
        $this->perform_action->guard($target, $action);

        $state = OrderStatus::get_state($target->order_status);

        return array_merge([
            'order_id' => (int) $target->id,
            'order_number' => $target->order_number,
            'action' => $action,
            'order_status' => [
                'current' => $target->order_status,
                'new' => $state['transitions'][$action] ?? $target->order_status,
            ],
            'emails' => $this->emails($action, $target),
        ], $this->preview_fields($params, $target));
    }

    /**
     * Get the extra preview fields of the tool.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param Order                $order  The order.
     *
     * @return array<string, mixed>
     */
    protected function preview_fields(array $params, Order $order)
    {
        return [];
    }

    /**
     * Hash the statuses of the order.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->order_fingerprint($target);
    }

    /**
     * Run the action and get the stored order.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $order = $this->perform_action->execute(PerformOrderActionDTO::from_array(array_merge([
            'order_id' => (int) $target->id,
            'action' => $this->action($params),
            'updated_by' => get_current_user_id(),
        ], $this->action_fields($params))));

        return ['order' => $this->order_summary($this->order_service->find_order_or_fail((int) $order->id))];
    }

    /**
     * Hash the order data that a lifecycle change depends on.
     *
     * @since 1.0.0
     *
     * @param Order $order The order.
     *
     * @return string
     */
    protected function order_fingerprint(Order $order)
    {
        return $this->hash_values([
            $order->order_status,
            $order->fulfillment_status,
            $order->payment_status,
            (bool) $order->is_refund_initiated,
            (string) $order->updated_at,
        ]);
    }

    /**
     * Get the order fields that a lifecycle change shows.
     *
     * @since 1.0.0
     *
     * @param Order $order The order.
     *
     * @return array<string, mixed>
     */
    protected function order_summary(Order $order)
    {
        return [
            'order_id' => (int) $order->id,
            'order_number' => $order->order_number,
            'order_status' => $order->order_status,
            'fulfillment_status' => $order->fulfillment_status,
            'payment_status' => $order->payment_status,
            'shipping_carrier' => $order->shipping_carrier,
            'shipping_tracking_number' => $order->shipping_tracking_number,
            'shipping_tracking_url' => $order->shipping_tracking_url,
            'cancellation_reason_text' => $this->store_text($order->cancellation_reason),
        ];
    }

    /**
     * Get the emails that the action sends, with the masked address and the on or off state.
     *
     * @since 1.0.0
     *
     * @param string $action One of the OrderAction constants.
     * @param Order  $order  The order.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function emails(string $action, Order $order)
    {
        $templates = OrderLifecycleResource::ACTION_EMAILS[$action] ?? [];

        if ($action === OrderAction::MARK_AS_PROCESSING && $order->fulfillment_status === FulfillmentStatus::ON_HOLD) {
            return [];
        }

        $settings = Settings::get(OptionKeys::EMAIL_SETTINGS);

        return array_map(function ($template) use ($settings, $order) {
            list($recipient, $key) = $template;

            return [
                'recipient' => $recipient,
                'template' => $key,
                'to' => $recipient === 'customer' ? $this->mask_email($order->customer_email) : __('store administrators', 'kirki-ecommerce'),
                'is_enabled' => (bool) $settings->get($recipient . '_emails.order_notifications.' . $key . '.is_enabled', false),
            ];
        }, $templates);
    }
}
