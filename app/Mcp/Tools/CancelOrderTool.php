<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Models\Order;

/**
 * Cancels an order with a reason. It does not refund a payment.
 *
 * @since 1.0.0
 */
class CancelOrderTool extends OrderActionTool
{
    /** @var array<string, mixed> */
    protected $meta = ['anthropic/requiresUserInteraction' => true];

    /** @var string */
    protected $description = 'Cancel one order and store the reason. A cancelled order allows no more actions. This tool does not refund a payment. The order status must allow "cancel-order". '
        . 'The cancel emails go to the customer and the store administrators. Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return $this->order_identifier_schema($schema) + [
            'reason' => $schema->string()
                ->description('Why the order is cancelled, 1 to 500 characters. It is stored on the order.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $message = __('Send the "reason", 1 to 500 characters.', 'kirki-ecommerce');

        return $this->validate_order_arguments($arguments, ['reason' => 'required|string|min:1|max:500'], [
            'reason.required' => $message,
            'reason.min' => $message,
            'reason.max' => $message,
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function action(array $params)
    {
        return OrderAction::CANCEL_ORDER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function action_fields(array $params)
    {
        return ['reason' => $params['reason']];
    }

    /**
     * Show the reason and the effect of the cancellation.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview_fields(array $params, Order $order)
    {
        return [
            'reason' => $params['reason'],
            'effects' => [
                __('A cancelled order allows no more actions.', 'kirki-ecommerce'),
                __('No payment is refunded.', 'kirki-ecommerce'),
            ],
        ];
    }
}
