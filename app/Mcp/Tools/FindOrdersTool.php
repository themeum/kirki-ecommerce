<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderListStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\DTO\Order\OrderListFilterDTO;
use Kirki\Ecommerce\App\Mcp\Concerns\MasksPersonalData;
use Kirki\Ecommerce\App\Mcp\Concerns\PagesResults;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Finds orders with the filters of the admin order list. Customer data is masked.
 *
 * @since 1.0.0
 */
class FindOrdersTool extends StoreReadTool
{
    use MasksPersonalData;
    use PagesResults;

    const SORT_COLUMNS = ['created_at', 'invoiced_total'];

    const SORT_ORDERS = ['asc', 'desc'];

    /** @var string */
    protected $description = 'Find orders of the store with the filters of the admin order list, newest first. '
        . 'Use it for questions such as "which orders are not shipped yet?" or "show the orders of last week". '
        . 'Each order has its ID, number, dates, statuses, total and item count. The customer email is masked and only the first name is shown. '
        . 'Use the get-order tool with "order_id" for the full order.';

    /** @var OrderService */
    protected $order_service;

    /**
     * Create the tool with the order service.
     *
     * @since 1.0.0
     *
     * @param OrderService $order_service Service of the admin order list.
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
    public function input_schema(JsonSchema $schema)
    {
        return array_merge([
            'search' => $schema->string()
                ->description('Part of an order number, a customer email or a shipping name. A full email also matches.'),
            'status' => $schema->string()
                ->enum(OrderListStatus::get_constant_values())
                ->description('Order status, as in the admin order list.'),
            'fulfillment_status' => $schema->string()
                ->enum(FulfillmentStatus::get_constant_values())
                ->description('Fulfillment status.'),
            'payment_status' => $schema->string()
                ->enum(PaymentStatus::get_constant_values())
                ->description('Payment status.'),
            'customer_id' => $schema->integer()
                ->min(1)
                ->description('Customer ID, from the find-customers tool.'),
            'shipping_method' => $schema->string()
                ->description('Shipping method ID.'),
            'from' => $schema->string()
                ->pattern('^\d{4}-\d{2}-\d{2}$')
                ->description('First creation day, Y-m-d, in the site time zone.'),
            'to' => $schema->string()
                ->pattern('^\d{4}-\d{2}-\d{2}$')
                ->description('Last creation day, Y-m-d, in the site time zone.'),
            'sort_by' => $schema->string()
                ->enum(static::SORT_COLUMNS)
                ->default('created_at')
                ->description('Sort by creation date or by order total.'),
            'sort_order' => $schema->string()
                ->enum(static::SORT_ORDERS)
                ->default('desc')
                ->description('Sort direction.'),
        ], $this->page_schema($schema));
    }

    /**
     * Find the orders that match the arguments.
     *
     * @since 1.0.0
     *
     * @param Request $request Tool arguments.
     *
     * @return Response
     * @throws ValidationException When an argument is not valid.
     */
    public function handle(Request $request)
    {
        $params = $this->validate_find($request->all());
        [$page, $per_page] = $this->page_arguments($params);

        $orders = $this->order_service->paginated_orders(OrderListFilterDTO::from_array([
            'search' => $params['search'] ?? null,
            'status' => $params['status'] ?? null,
            'fulfillment_status' => $params['fulfillment_status'] ?? null,
            'payment_status' => $params['payment_status'] ?? null,
            'customer_id' => $params['customer_id'] ?? null,
            'shipping_method' => $params['shipping_method'] ?? null,
            'from_date' => $params['from'] ?? null,
            'to_date' => $params['to'] ?? null,
            'sort_by' => $params['sort_by'] ?? 'created_at',
            'sort_order' => $params['sort_order'] ?? 'desc',
            'page' => $page,
            'limit' => $per_page,
        ]));

        return Response::structured([
            'orders' => array_values(array_map([$this, 'order_row'], $orders->items()->all())),
            'pagination' => $this->pagination($orders),
        ]);
    }

    /**
     * Validate the filters, the sort and the page.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $arguments Tool arguments.
     *
     * @return array<string, mixed> The validated arguments.
     * @throws ValidationException When an argument is not valid.
     */
    protected function validate_find(array $arguments)
    {
        $statuses = OrderListStatus::get_constant_values();
        $fulfillment_statuses = FulfillmentStatus::get_constant_values();
        $payment_statuses = PaymentStatus::get_constant_values();
        $from_message = __('Enter a start date "from" as Y-m-d.', 'kirki-ecommerce');
        $to_message = __('Enter an end date "to" as Y-m-d.', 'kirki-ecommerce');
        $customer_message = __('The "customer_id" must be an integer of 1 or more.', 'kirki-ecommerce');

        $params = $this->validate_arguments($arguments, array_merge([
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:' . implode(',', $statuses),
            'fulfillment_status' => 'nullable|string|in:' . implode(',', $fulfillment_statuses),
            'payment_status' => 'nullable|string|in:' . implode(',', $payment_statuses),
            'customer_id' => 'nullable|integer|min:1',
            'shipping_method' => 'nullable|string|max:100',
            'from' => 'nullable|date|format:Y-m-d',
            'to' => 'nullable|date|format:Y-m-d',
            'sort_by' => 'nullable|string|in:' . implode(',', static::SORT_COLUMNS),
            'sort_order' => 'nullable|string|in:' . implode(',', static::SORT_ORDERS),
        ], $this->page_rules()), array_merge([
            'search.string' => __('The "search" must be text of at most 100 characters.', 'kirki-ecommerce'),
            'search.max' => __('The "search" must be text of at most 100 characters.', 'kirki-ecommerce'),
            'status.in' => $this->one_of_message('status', $statuses),
            'fulfillment_status.in' => $this->one_of_message('fulfillment_status', $fulfillment_statuses),
            'payment_status.in' => $this->one_of_message('payment_status', $payment_statuses),
            'customer_id.integer' => $customer_message,
            'customer_id.min' => $customer_message,
            'shipping_method.max' => __('The "shipping_method" must be text of at most 100 characters.', 'kirki-ecommerce'),
            'from.date' => $from_message,
            'from.format' => $from_message,
            'to.date' => $to_message,
            'to.format' => $to_message,
            'sort_by.in' => $this->one_of_message('sort_by', static::SORT_COLUMNS),
            'sort_order.in' => $this->one_of_message('sort_order', static::SORT_ORDERS),
        ], $this->page_messages()));

        if (!empty($params['from']) && !empty($params['to']) && $params['from'] > $params['to']) {
            $this->reject(['from' => [__('The start date "from" cannot be after the end date "to".', 'kirki-ecommerce')]]);
        }

        return $params;
    }

    /**
     * Shape one order into a compact row with masked customer data.
     *
     * @since 1.0.0
     *
     * @param Order $order Order of the list.
     *
     * @return array<string, mixed>
     */
    protected function order_row(Order $order)
    {
        return [
            'order_id' => (int) $order->id,
            'order_number' => $order->order_number,
            'created_at' => $this->datetime($order->created_at),
            'status' => $order->order_status,
            'fulfillment_status' => $order->fulfillment_status,
            'payment_status' => $order->payment_status,
            'invoiced_total' => $this->money($order->invoiced_total, $order->currency_code),
            'base_total' => $this->money($order->base_total),
            'items_count' => (int) $order->items_count,
            'customer' => [
                'customer_id' => $order->customer_id === null ? null : (int) $order->customer_id,
                'first_name' => $this->first_name($order->customer_first_name),
                'email' => $this->mask_email($order->customer_email),
            ],
        ];
    }
}
