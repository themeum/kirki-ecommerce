<?php

namespace Kirki\Ecommerce\App\Mcp\Prompts;

defined('ABSPATH') || exit;

use DateTimeImmutable;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Argument;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Tools\SalesBreakdownTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;

/**
 * A table of one month's totals for the accountant.
 *
 * @since 1.0.0
 */
class MonthlyClosePrompt extends StorePrompt
{
    const BREAKDOWNS = ['tax_region', 'payment_method', 'shipping_method'];

    /** @var string */
    protected $title = 'Monthly close';

    /** @var string */
    protected $description = 'A table of one month\'s totals for the accountant: sales totals, tax by region, and totals by payment method and shipping method. Read-only.';

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
            new Argument('month', 'The month to close, not after the current month, for example 2026-09, September, September 2026 or last month. Default: last month.'),
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
        $typed = $this->text($request, 'month');
        $today = $this->today();
        $last_month = $today->modify('first day of last month')->format('Y-m');
        $parsed = $typed === '' ? null : $this->parse_month($typed);
        $month = $parsed ?? $last_month;

        $first_day = new DateTimeImmutable($month . '-01');
        $is_current_month = $month === $today->format('Y-m');
        $from = $first_day->format('Y-m-d');
        $to = $is_current_month ? $today->format('Y-m-d') : $first_day->format('Y-m-t');
        $range = ['range' => 'custom', 'from' => $from, 'to' => $to];

        $calls = [$this->tool_call(SalesReportTool::class, $range)];

        foreach (static::BREAKDOWNS as $by) {
            $calls[] = $this->tool_call(SalesBreakdownTool::class, $range + ['by' => $by, 'limit' => AnalyticsQueryService::MAX_LIMIT]);
        }

        $parts = [
            /* translators: 1: month, 2: first day, 3: last day. */
            sprintf(__('Give me the monthly close for %1$s (%2$s to %3$s) for my accountant.', 'kirki-ecommerce'), $month, $from, $to),
        ];

        if ($typed !== '' && $parsed === null) {
            $parts[] = $this->fallback_note('month', $typed, $month);
        }

        if ($is_current_month) {
            $parts[] = __('This month is not complete. Say so at the top of the answer.', 'kirki-ecommerce');
        }

        $parts[] = $this->read_only_rule();
        $parts[] = __('Call these store tools:', 'kirki-ecommerce') . "\n" . implode("\n", $calls);
        $parts[] = __('Answer with one table: gross sales, discounts, returns, net sales, shipping, taxes and total sales, then tax by region, then totals by payment method and by shipping method. Give the currency.', 'kirki-ecommerce');

        return [Response::text($this->message($parts))];
    }
}
