<?php

namespace Kirki\Ecommerce\Tests\Support;

trait CountsCurrencyQueries
{
    /**
     * SELECT statements on the currencies table seen since counting started.
     *
     * @var string[]
     * @since 1.0.0
     */
    protected $currency_queries = [];

    /**
     * Callback that records the statements, kept so it can be removed again.
     *
     * @var callable|null
     * @since 1.0.0
     */
    protected $currency_query_listener;

    /**
     * Start counting SELECT queries on the currencies table.
     *
     * Hooks the WordPress `query` filter, so it sees every statement that goes
     * through `$wpdb`. Calling it again resets the count.
     *
     * @return void
     * @since 1.0.0
     */
    protected function start_counting_currency_queries(): void
    {
        $this->stop_counting_currency_queries();

        global $wpdb;

        $table = $wpdb->prefix . 'kirki_ecommerce_currencies';

        $this->currency_queries = [];
        $this->currency_query_listener = function ($query) use ($table) {
            if (stripos(ltrim($query), 'SELECT') === 0 && strpos($query, $table) !== false) {
                $this->currency_queries[] = $query;
            }

            return $query;
        };

        add_filter('query', $this->currency_query_listener);
    }

    /**
     * Stop counting. The recorded statements stay available.
     *
     * @return void
     * @since 1.0.0
     */
    protected function stop_counting_currency_queries(): void
    {
        if ($this->currency_query_listener !== null) {
            remove_filter('query', $this->currency_query_listener);
            $this->currency_query_listener = null;
        }
    }

    /**
     * Get the number of SELECT queries on the currencies table since counting started.
     *
     * @return int
     * @since 1.0.0
     */
    protected function currency_query_count(): int
    {
        return count($this->currency_queries);
    }

    /**
     * Assert that at most the given number of currencies queries ran.
     *
     * The failure message lists the statements, so a repeated query is easy to find.
     *
     * @param int    $maximum Largest allowed number of queries.
     * @param string $message Optional failure context.
     * @return void
     * @since 1.0.0
     */
    protected function assert_currency_queries_at_most(int $maximum, string $message = ''): void
    {
        $this->assertLessThanOrEqual(
            $maximum,
            $this->currency_query_count(),
            trim($message . ' Currency queries (' . count($this->currency_queries) . '): ' . implode(' | ', $this->currency_queries))
        );
    }
}
