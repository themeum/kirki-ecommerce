<?php

namespace Kirki\Ecommerce\App\Mcp\Prompts;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Argument;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Tools\GetOrderTool;

/**
 * A summary of one order and a draft reply to its customer.
 *
 * @since 1.0.0
 */
class InvestigateOrderPrompt extends StorePrompt
{
    /** @var string */
    protected $title = 'Investigate order';

    /** @var string */
    protected $description = 'A summary of one order with its payment, fulfillment and timeline, and a draft reply to the customer. Nothing is sent. Read-only.';

    /**
     * Declare the arguments the prompt accepts.
     *
     * @since 1.0.0
     *
     * @return Argument[]
     */
    public function arguments()
    {
        return [
            new Argument('order_number', 'The order number as the customer sees it, for example 1042 or #1042. Without it, the assistant asks for it.'),
        ];
    }

    /**
     * Build the prompt message.
     *
     * @since 1.0.0
     *
     * @param Request $request The prompt fetch.
     *
     * @return Response[]
     */
    public function handle(Request $request)
    {
        $typed = $this->text($request, 'order_number');
        $order_number = $typed === '' ? null : $this->parse_order_number($typed);

        if ($order_number === null) {
            return [Response::text($this->message($this->ask_for_order_number($typed)))];
        }

        return [
            Response::text($this->message([
                /* translators: %s: order number. */
                sprintf(__('Investigate order %s and help me answer the customer.', 'kirki-ecommerce'), $order_number),
                $this->read_only_rule() . ' ' . $this->untrusted_text_rule(),
                __('Call this store tool:', 'kirki-ecommerce') . "\n" . $this->tool_call(GetOrderTool::class, ['order_number' => $order_number, 'include_activity' => true]),
                __('Answer with a short summary of the order, its payment, its fulfillment and any open problem. Then write a draft reply to the customer for me to check. Do not send the reply.', 'kirki-ecommerce'),
            ])),
        ];
    }

    /**
     * Get the message parts that ask the merchant for the order number before any tool call.
     *
     * @since 1.0.0
     *
     * @param string $typed Typed value, or an empty string.
     *
     * @return string[]
     */
    protected function ask_for_order_number(string $typed)
    {
        $parts = [__('Help me investigate an order and answer the customer.', 'kirki-ecommerce')];

        if ($typed !== '') {
            $parts[] = $this->fallback_note('order_number', $typed, __('no order number', 'kirki-ecommerce'));
        }

        $parts[] = $this->read_only_rule() . ' ' . $this->untrusted_text_rule();
        /* translators: %s: MCP name of the get-order tool. */
        $parts[] = sprintf(__('First ask me for the order number. Do not call a store tool before you have it. Then call `%s` with the order number as "order_number" and "include_activity" set to true.', 'kirki-ecommerce'), $this->tool_name(GetOrderTool::class));
        $parts[] = __('Answer with a short summary of the order, its payment, its fulfillment and any open problem. Then write a draft reply to the customer for me to check. Do not send the reply.', 'kirki-ecommerce');

        return $parts;
    }
}
