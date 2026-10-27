<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Models\Order;

/**
 * Finds one order by "order_id" or "order_number". The class must have an OrderService in $order_service and use ValidatesArguments.
 *
 * @since 1.0.0
 */
trait FindsOrders
{
    /**
     * Get the schema of the "order_id" and "order_number" arguments.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema Schema builder.
     *
     * @return array<string, mixed>
     */
    protected function order_identifier_schema(JsonSchema $schema)
    {
        return [
            'order_id' => $schema->integer()
                ->min(1)
                ->description('Order ID, from the find-orders tool. Send this or "order_number".'),
            'order_number' => $schema->string()
                ->description('Order number, as the customer sees it. Send this or "order_id".'),
        ];
    }

    /**
     * Get the validation rules of the "order_id" and "order_number" arguments.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function order_identifier_rules()
    {
        return [
            'order_id' => 'nullable|integer|min:1',
            'order_number' => 'nullable|string|max:100',
        ];
    }

    /**
     * Get the validation messages of the "order_id" and "order_number" arguments.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function order_identifier_messages()
    {
        $message = $this->order_identifier_message();

        return [
            'order_id.integer' => $message,
            'order_id.min' => $message,
            'order_number.string' => $message,
            'order_number.max' => $message,
        ];
    }

    /**
     * Reject the arguments when they have neither "order_id" nor "order_number".
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return void
     */
    protected function require_order_identifier(array $params)
    {
        if (empty($params['order_id']) && empty($params['order_number'])) {
            $message = $this->order_identifier_message();
            $this->reject(['order_id' => [$message], 'order_number' => [$message]]);
        }
    }

    /**
     * Find the order by ID, else by order number.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return Order|null
     */
    protected function find_order(array $params)
    {
        $order_id = $params['order_id'] ?? null;

        if (empty($order_id)) {
            $match = Order::query()->where('order_number', (string) $params['order_number'])->first(['id']);
            $order_id = $match === null ? null : $match->id;
        }

        return empty($order_id) ? null : $this->order_service->find_order((int) $order_id);
    }

    /**
     * Get the message for an order that was not found.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function order_not_found_message()
    {
        return __('The order was not found. Check the "order_id" or "order_number", or use the find-orders tool.', 'kirki-ecommerce');
    }

    /**
     * Get the message for a missing or not valid order identifier.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function order_identifier_message()
    {
        return __('Send "order_id" (an integer) or "order_number".', 'kirki-ecommerce');
    }
}
