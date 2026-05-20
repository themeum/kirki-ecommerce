<?php

namespace Kirki\Ecommerce\Contracts;

interface ServiceProvider
{
    /**
     * Register the service provider.
     *
     * @param array $args
     * @return void
     */
    public function register(...$args);
}
