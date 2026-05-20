<?php

namespace Kirki\Ecommerce\Contracts;

interface RewriteRule
{
    /**
     * Get the pattern to match the rewrite rule.
     *
     * @return string
     */
    public function get_pattern(): string;

    /**
     * Get the query string to add to the rewrite rule.
     *
     * @return string
     */
    public function get_query_string(): string;

    /**
     * Get the rule stack to add the rule to.
     *
     * @return string
     */
    public function get_rule_stack(): string;

    /**
     * Get the query vars to add to the rewrite rule.
     *
     * @return array
     */
    public function get_query_vars(): array;

    /**
     * Get the template path to load.
     *
     * @return string
     */
    public function get_template_path(): string;

    /**
     * Handle the rewrite rule to manage adding the rule
     *
     * @return void
     */
    public function handle();
}
