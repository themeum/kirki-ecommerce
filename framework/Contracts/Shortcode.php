<?php

namespace Kirki\Ecommerce\Contracts;

interface Shortcode
{
    /**
     * Get the shortcode name.
     *
     * @return string
     */
    public function get_name();

    /**
     * The shortcode callback function.
     *
     * @param array $attributes
     * @param string $content
     * @param string $shortcode_tag
     * @return string
     */
    public function callback($attributes, string $content = '', string $shortcode_tag = '');
}
