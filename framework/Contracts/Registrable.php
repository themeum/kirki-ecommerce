<?php

namespace Kirki\Ecommerce\Contracts;

/**
 * Contract for registering something like post type, taxonomies etc.
 *
 * @since 1.0.0
 */
interface Registrable
{
    /**
     * Register something.
     *
     * @return void
     */
    public function register();
}
