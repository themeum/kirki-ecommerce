<?php

namespace Kirki\Ecommerce\App\Mcp\Prompts;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Argument;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Tools\ProductPerformanceTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesBreakdownTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesTrendTool;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;

/**
 * A review of a period: wins, losses, top products and categories, coupons, countries and suggested actions.
 *
 * @since 1.0.0
 */
class WeeklyReviewPrompt extends StorePrompt
{
    const COMPARISONS = ['previous_period', 'previous_year'];

    const RANGE_ALIASES = [
        'last week' => 'last_7',
        'last 7 days' => 'last_7',
        'last 30 days' => 'last_30',
        'last 90 days' => 'last_90',
        'last 12 months' => 'last_12_months',
        'last year' => 'last_12_months',
        'this month' => 'month_to_date',
        'this year' => 'year_to_date',
    ];

    const COMPARISON_ALIASES = [
        'last period' => 'previous_period',
        'last year' => 'previous_year',
    ];

    const DEFAULTS = ['range' => 'last_7', 'compare' => 'previous_period'];

    /** @var string */
    protected $title = 'Weekly review';

    /** @var string */
    protected $description = 'A review of the last 7 days or another period: wins, losses, top products and categories, coupon and country results, and three suggested actions. Read-only.';

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
            new Argument('range', 'The period, for example last week, last 30 days or this month. Presets: ' . implode(', ', $this->ranges()) . '. Default: last_7.'),
            new Argument('compare', 'The earlier period to compare with, for example last period or last year. Presets: previous_period, previous_year. Default: previous_period.'),
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
        $choices = [
            'range' => [$this->ranges(), static::RANGE_ALIASES],
            'compare' => [static::COMPARISONS, static::COMPARISON_ALIASES],
        ];
        $period = static::DEFAULTS;
        $notes = [];

        foreach ($choices as $argument => list($values, $aliases)) {
            $typed = $this->text($request, $argument);
            $parsed = $typed === '' ? null : $this->parse_choice($typed, $values, $aliases);

            if ($parsed !== null) {
                $period[$argument] = $parsed;
            } elseif ($typed !== '') {
                $notes[] = $this->fallback_note($argument, $typed, $period[$argument]);
            }
        }

        $calls = [
            $this->tool_call(SalesReportTool::class, $period),
            $this->tool_call(SalesTrendTool::class, $period),
            $this->tool_call(ProductPerformanceTool::class, $period + ['by' => 'product']),
            $this->tool_call(ProductPerformanceTool::class, $period + ['by' => 'category']),
            $this->tool_call(SalesBreakdownTool::class, $period + ['by' => 'coupon']),
            $this->tool_call(SalesBreakdownTool::class, $period + ['by' => 'country']),
        ];

        $parts = [
            /* translators: 1: range preset, 2: comparison. */
            sprintf(__('Give me a review of the store for the range "%1$s", compared with "%2$s".', 'kirki-ecommerce'), $period['range'], $period['compare']),
        ];
        $parts = array_merge($parts, $notes);
        $parts[] = $this->read_only_rule();
        $parts[] = __('Call these store tools:', 'kirki-ecommerce') . "\n" . implode("\n", $calls);
        $parts[] = __('Answer with the wins and the losses against the earlier period, the top products and categories, the coupon and country results, and three suggested actions.', 'kirki-ecommerce');

        return [Response::text($this->message($parts))];
    }

    /**
     * Get the range presets that the prompt accepts: every analytics preset except custom.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function ranges()
    {
        return array_values(array_diff(AnalyticsRangeResolver::PRESETS, ['custom']));
    }
}
