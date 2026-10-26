<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;

/**
 * How the Analytics page and the analytics tools count sales, orders, returns and customers.
 *
 * @since 1.0.0
 */
class AnalyticsDefinitionsResource extends StoreResource
{
    /** @var string */
    protected $title = 'Analytics definitions';

    /** @var string */
    protected $description = 'How the Analytics page and the analytics tools count sales, orders, returns and customers, the range presets and comparisons, the chart granularity and the top-N limit. Read it to explain the numbers in the same way as the Analytics page.';

    /** @var string */
    protected $uri = 'kecom://store/analytics-definitions';

    /** @var string[] */
    protected $audience = ['assistant'];

    /** @var float */
    protected $priority = 1.0;

    /**
     * Read the analytics definitions.
     *
     * @since 1.0.0
     *
     * @param Request $request The read, which carries no arguments.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        return Response::structured([
            'counting_rules' => [
                'paid_orders' => __('A sale is an order whose payment status is paid, refunding or refunded. It is dated by the day the order was paid, or by the day it was created when it has no paid date.', 'kirki-ecommerce'),
                'placed_orders' => __('Placed orders are all orders whose payment status is not failed, unpaid and cancelled orders included. They are dated by the day they were created. A failed order is never counted.', 'kirki-ecommerce'),
                'returns' => __('A return is a completed refund on a paid order, dated by the day the refund last changed. Pending and cancelled refunds are not counted. The sale keeps its own day.', 'kirki-ecommerce'),
                'customers' => __('A customer is matched by the customer on the order, then by a customer with the same email, then by the order email. A guest and a registered customer with the same email are one customer. A first paid order makes a new customer.', 'kirki-ecommerce'),
                'money' => __('Amounts are added up in minor units of the base currency. Orders in an earlier base currency are left out.', 'kirki-ecommerce'),
                'formulas' => __('Net sales = gross sales - discounts - returns. Total sales = net sales + shipping charges + taxes. Shipping charges are the shipping total minus the tax on shipping. Product net sales and sales by location do not subtract returns.', 'kirki-ecommerce'),
            ],
            'range_presets' => array_values(AnalyticsRangeResolver::PRESETS),
            'default_range' => AnalyticsRangeResolver::DEFAULT_PRESET,
            'comparisons' => array_values(AnalyticsRangeResolver::COMPARISONS),
            'granularity' => [
                'day' => sprintf('1-%d', AnalyticsRangeResolver::DAILY_MAX_DAYS),
                'week' => sprintf('%d-%d', AnalyticsRangeResolver::DAILY_MAX_DAYS + 1, AnalyticsRangeResolver::WEEKLY_MAX_DAYS),
                'month' => sprintf('%d+', AnalyticsRangeResolver::WEEKLY_MAX_DAYS + 1),
            ],
            'max_limit' => AnalyticsQueryService::MAX_LIMIT,
            'time_zone' => __('Every date is put on a day in the time zone of the caller. MCP calls send no browser time zone, so the site time zone applies.', 'kirki-ecommerce'),
            'notes' => [
                __('The Home page calculates its own net sales in a different way, so it can show a different value from the Analytics page.', 'kirki-ecommerce'),
                __('Categories are read as they are now. Stock has no history.', 'kirki-ecommerce'),
            ],
        ]);
    }
}
