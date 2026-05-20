<?php

namespace Kirki\Ecommerce\Contracts;

interface Capability
{
    /**
     * Execute the action logic.
     *
     * @return void
     */
    public function handle();

    /**
     * Get the capabilities .
     *
     * @param string $role
     * @return array
     */
    public function get_capabilities($role = null);
}
