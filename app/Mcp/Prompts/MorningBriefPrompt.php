<?php

namespace Kirki\Ecommerce\App\Mcp\Prompts;

defined('ABSPATH') || exit;

use DateTimeImmutable;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Argument;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\Order\OrderListStatus;
use Kirki\Ecommerce\App\Mcp\Tools\FindOrdersTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;
use Kirki\Ecommerce\App\Mcp\Tools\StockLevelsTool;

/**
 * A short brief on one day's results, the orders that need action, and the stock that needs attention.
 *
 * @since 1.0.0
 */
class MorningBriefPrompt extends StorePrompt
{
    const ORDER_STATUSES = [
        OrderListStatus::ORDER_PLACED,
        OrderListStatus::ORDER_PROCESSING,
        OrderListStatus::ORDER_ON_HOLD,
        OrderListStatus::PAYMENT_FAILED,
    ];

    /** @var string */
    protected $title = 'Morning brief';

    /** @var string */
    protected $description = 'A short brief on one day\'s results against the same weekday last week, the orders that need action, and the stock that needs attention. Read-only.';

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
            new Argument('date', 'The day to report, not after today, for example 2026-10-25, today or yesterday. Default: yesterday.'),
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
        $typed = $this->text($request, 'date');
        $yesterday = $this->today()->modify('-1 day')->format('Y-m-d');
        $parsed = $typed === '' ? null : $this->parse_date($typed);
        $date = $parsed ?? $yesterday;

        $compare_date = (new DateTimeImmutable($date))->modify('-7 days')->format('Y-m-d');
        $calls = [
            $this->tool_call(SalesReportTool::class, ['range' => 'custom', 'from' => $date, 'to' => $date, 'compare' => 'custom', 'compare_from' => $compare_date, 'compare_to' => $compare_date]),
        ];

        foreach (static::ORDER_STATUSES as $status) {
            $calls[] = $this->tool_call(FindOrdersTool::class, ['status' => $status]);
        }

        $calls[] = $this->tool_call(StockLevelsTool::class, ['status' => 'attention']);

        $parts = [
            /* translators: 1: the reported day, 2: the comparison day. */
            sprintf(__('Give me a short morning brief for %1$s, compared with %2$s (the same weekday one week earlier).', 'kirki-ecommerce'), $date, $compare_date),
        ];

        if ($typed !== '' && $parsed === null) {
            $parts[] = $this->fallback_note('date', $typed, $date);
        }

        $parts[] = $this->read_only_rule() . ' ' . $this->untrusted_text_rule();
        $parts[] = __('Call these store tools:', 'kirki-ecommerce') . "\n" . implode("\n", $calls);
        $parts[] = __('Answer with at most five lines of results: net sales, orders and average order value with their change, the number of orders in each status (use the "total" of each order list), and the stock that needs attention. Then give a short action list for today.', 'kirki-ecommerce');

        return [Response::text($this->message($parts))];
    }
}
