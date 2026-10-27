<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;

/**
 * Records the payment of an unpaid order, for example a bank transfer or cash on delivery.
 *
 * @since 1.0.0
 */
class MarkOrderPaidTool extends OrderActionTool
{
    /** @var bool */
    protected $open_world = false;

    /** @var string */
    protected $description = 'Record that an unpaid order is paid, for example after a bank transfer or cash on delivery arrived. The order status must allow "mark-as-paid". '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return $this->order_identifier_schema($schema) + [
            'payment_provider' => $schema->string()
                ->description('ID of the payment provider that took the payment, from the checkout-and-payments resource. Optional; the order keeps its provider when empty.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $params = $this->validate_order_arguments($arguments, ['payment_provider' => 'nullable|string|max:100']);

        if (!empty($params['payment_provider']) && !Payment::get_provider($params['payment_provider'])) {
            $this->reject(['payment_provider' => [__('The "payment_provider" is not a payment provider of this store. See the checkout-and-payments resource.', 'kirki-ecommerce')]]);
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
        return OrderAction::MARK_AS_PAID;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function action_fields(array $params)
    {
        return ['payment_provider' => $params['payment_provider'] ?? null];
    }

    /**
     * Show the current and the new payment provider.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview_fields(array $params, Order $order)
    {
        return [
            'payment_provider' => [
                'current' => $order->payment_provider,
                'new' => $params['payment_provider'] ?? $order->payment_provider,
            ],
        ];
    }
}
