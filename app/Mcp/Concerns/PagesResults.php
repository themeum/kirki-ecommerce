<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

/**
 * Pages the results of a list tool. A list tool never returns all rows in one call.
 *
 * @since 1.0.0
 */
trait PagesResults
{
    /**
     * Get the schema of the page and per_page arguments.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema The schema builder.
     *
     * @return array<string, mixed>
     */
    protected function page_schema(JsonSchema $schema)
    {
        return [
            'page' => $schema->integer()
                ->min(1)
                ->default(1)
                ->description('The page of results, from 1.'),
            'per_page' => $schema->integer()
                ->min(1)
                ->max(100)
                ->default(20)
                ->description('The number of results on one page, from 1 to 100.'),
        ];
    }

    /**
     * Get the validation rules of the page and per_page arguments.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function page_rules()
    {
        return [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
    }

    /**
     * Get the validation messages of the page and per_page arguments.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function page_messages()
    {
        $page = __('The "page" must be an integer of 1 or more.', 'kirki-ecommerce');
        $per_page = __('The "per_page" must be an integer from 1 to 100.', 'kirki-ecommerce');

        return [
            'page.integer' => $page,
            'page.min' => $page,
            'per_page.integer' => $per_page,
            'per_page.min' => $per_page,
            'per_page.max' => $per_page,
        ];
    }

    /**
     * Get the page and the page size from the validated arguments, with their defaults.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return int[] The page and the page size.
     */
    protected function page_arguments(array $params)
    {
        return [(int) ($params['page'] ?? 1), (int) ($params['per_page'] ?? 20)];
    }

    /**
     * Get the pagination of a list result.
     *
     * @since 1.0.0
     *
     * @param Paginator $paginator The page of results.
     *
     * @return array<string, int>
     */
    protected function pagination(Paginator $paginator)
    {
        return $this->pagination_of((int) $paginator->get_current_page(), (int) $paginator->get_per_page(), (int) $paginator->total());
    }

    /**
     * Get the pagination of a page from its numbers.
     *
     * @since 1.0.0
     *
     * @param int $page     The page.
     * @param int $per_page The page size.
     * @param int $total    The number of results on all pages.
     *
     * @return array<string, int>
     */
    protected function pagination_of(int $page, int $per_page, int $total)
    {
        return [
            'page' => $page,
            'per_page' => $per_page,
            'total' => $total,
            'total_pages' => (int) ceil($total / max(1, $per_page)),
        ];
    }
}
