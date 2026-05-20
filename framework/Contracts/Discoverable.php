<?php

namespace Kirki\Ecommerce\Contracts;

interface Discoverable
{
    /**
     * Discover from the file system.
     *
     * @return void
     */
    public function discover();
}
