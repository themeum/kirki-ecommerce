<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Email\CustomerOrderNotification;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Mcp\Concerns\FindsOrders;
use Kirki\Ecommerce\App\Mcp\Concerns\MasksPersonalData;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * Adds a comment to the order timeline, and on request emails it to the customer.
 *
 * @since 1.0.0
 */
class AddOrderNoteTool extends StoreWriteTool
{
    use FindsOrders;
    use MasksPersonalData;

    /** @var bool */
    protected $open_world = true;

    /** @var string */
    protected $description = 'Add a comment to the timeline of one order. With "notify_customer": true, the order-note email also sends the comment to the customer. '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /** @var OrderService */
    protected $order_service;

    /**
     * Create the tool with the order service.
     *
     * @since 1.0.0
     *
     * @param OrderService $order_service Order lookup service.
     */
    public function __construct(OrderService $order_service)
    {
        $this->order_service = $order_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return $this->order_identifier_schema($schema) + [
            'message' => $schema->string()
                ->description('Comment text, 1 to 2000 characters.'),
            'notify_customer' => $schema->boolean()
                ->default(false)
                ->description('Also email the comment to the customer.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $message = __('Send the "message", 1 to 2000 characters.', 'kirki-ecommerce');

        $params = $this->validate_arguments($arguments, $this->order_identifier_rules() + [
            'message' => 'required|string|min:1|max:2000',
            'notify_customer' => 'nullable|boolean',
        ], $this->order_identifier_messages() + [
            'message.required' => $message,
            'message.min' => $message,
            'message.max' => $message,
            'notify_customer.boolean' => __('The "notify_customer" must be true or false.', 'kirki-ecommerce'),
        ]);

        $this->require_order_identifier($params);
        $params['notify_customer'] = !empty($params['notify_customer']);

        return $params;
    }

    /**
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
     * Show the comment and the email that it sends.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $emails = [];

        if ($params['notify_customer']) {
            $emails[] = [
                'recipient' => 'customer',
                'template' => CustomerOrderNotification::ORDER_NOTE,
                'to' => $this->mask_email($target->customer_email),
                'is_enabled' => (bool) Settings::get(OptionKeys::EMAIL_SETTINGS)->get('customer_emails.order_notifications.' . CustomerOrderNotification::ORDER_NOTE . '.is_enabled', false),
            ];
        }

        return [
            'order_id' => (int) $target->id,
            'order_number' => $target->order_number,
            'message' => $params['message'],
            'emails' => $emails,
        ];
    }

    /**
     * The comment is new, so only the existence of the order matters.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->hash_values([(int) $target->id]);
    }

    /**
     * Add the comment.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $activity = OrderActivity::comment((int) $target->id, $params['message'], get_current_user_id() ?: null, $params['notify_customer']);

        return [
            'order_id' => (int) $target->id,
            'order_number' => $target->order_number,
            'activity_id' => (int) $activity->id,
            'message' => $activity->description,
            'notify_customer' => $params['notify_customer'],
        ];
    }
}
