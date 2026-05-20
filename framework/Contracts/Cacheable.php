<?php

namespace Kirki\Ecommerce\Contracts;

interface Cacheable
{
    /**
     * Get the cache key.
     *
     * @return string
     */
    public function cache(?string $path = null);
}
