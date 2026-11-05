<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Models\Order;

/**
 * Moves an order to the next fulfillment step, or adds its tracking data.
 *
 * @since 1.0.0
 */
class UpdateFulfillmentTool extends OrderActionTool
{
    const ACTIONS = [
        OrderAction::MARK_AS_PROCESSING,
        OrderAction::MARK_AS_SHIPPED,
        OrderAction::ADD_TRACKING,
        OrderAction::MARK_AS_DELIVERED,
        OrderAction::MARK_AS_HOLD,
        OrderAction::RESUME_FULFILLMENT,
    ];

    /** @var string */
    protected $description = 'Move one order to a fulfillment step, or add its carrier and tracking number. The order status must allow the action; the order-lifecycle resource lists the allowed actions. '
        . 'Some actions send an email to the customer; the preview lists them. Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return $this->order_identifier_schema($schema) + [
            'action' => $schema->string()
                ->enum(static::ACTIONS)
                ->description('Fulfillment action to run.'),
            'carrier' => $schema->string()
                ->description('Shipping carrier, for example DHL. Required for "add-tracking".'),
            'tracking_number' => $schema->string()
                ->description('Tracking number. Required for "add-tracking".'),
            'tracking_url' => $schema->string()
                ->description('Tracking URL. Optional, for "add-tracking" only.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $params = $this->validate_order_arguments($arguments, [
            'action' => 'required|string|in:' . implode(',', static::ACTIONS),
            'carrier' => 'nullable|string|max:100',
            'tracking_number' => 'nullable|string|max:100',
            'tracking_url' => 'nullable|string|url|max:500',
        ], [
            'action.required' => $this->one_of_message('action', static::ACTIONS),
            'action.in' => $this->one_of_message('action', static::ACTIONS),
            'tracking_url.url' => __('The "tracking_url" must be a full URL that starts with http:// or https://.', 'kirki-ecommerce'),
        ]);

        if ($params['action'] === OrderAction::ADD_TRACKING) {
            $errors = [];

            foreach (['carrier', 'tracking_number'] as $field) {
                if (empty($params[$field])) {
                    /* translators: %s: argument name. */
                    $errors[$field] = [sprintf(__('Send "%s" for the "add-tracking" action.', 'kirki-ecommerce'), $field)];
                }
            }

            if (!empty($errors)) {
                $this->reject($errors);
            }
        }

        return $params;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function action(array $params)
    {
        return $params['action'];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function action_fields(array $params)
    {
        if ($params['action'] !== OrderAction::ADD_TRACKING) {
            return [];
        }

        return [
            'carrier' => $params['carrier'],
            'tracking_number' => $params['tracking_number'],
            'tracking_url' => $params['tracking_url'] ?? null,
        ];
    }

    /**
     * Show the current and the new tracking data for "add-tracking".
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview_fields(array $params, Order $order)
    {
        if ($params['action'] !== OrderAction::ADD_TRACKING) {
            return [];
        }

        return [
            'tracking' => [
                'current' => [
                    'carrier' => $order->shipping_carrier,
                    'tracking_number' => $order->shipping_tracking_number,
                    'tracking_url' => $order->shipping_tracking_url,
                ],
                'new' => $this->action_fields($params),
            ],
        ];
    }
}
