<?php

namespace Kirki\Ecommerce\App\Contracts;

defined('ABSPATH') || exit;

interface Parsable
{
    /**
     * Parse the content
     * 
     * @param string $content
     * @return string
     */
    public function parse(string $content);
}
