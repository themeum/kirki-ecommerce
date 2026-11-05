<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;

/**
 * Sends the new-order email to the customer again.
 *
 * @since 1.0.0
 */
class ResendOrderEmailTool extends OrderActionTool
{
    /** @var string */
    protected $description = 'Send the order confirmation email to the customer of one order again. The order status must allow "resend-order-email". '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return $this->order_identifier_schema($schema);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function action(array $params)
    {
        return OrderAction::RESEND_ORDER_EMAIL;
    }
}
