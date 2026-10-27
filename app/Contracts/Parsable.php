<?php

namespace Kirki\Ecommerce\App\Contracts;

defined('ABSPATH') || exit;

/**
 * Contract for a parser that transforms a content string.
 *
 * @since 1.0.0
 */
interface Parsable
{
    /**
     * Parse the content and return the transformed result.
     *
     * @since 1.0.0
     *
     * @param string $content Raw content to parse.
     * @return string Parsed content.
     */
    public function parse(string $content);
}
