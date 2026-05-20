<?php

namespace Kirki\Ecommerce\Contracts;

interface Importable
{
    /**
     * Import data from an external source.
     * 
     * @return mixed
     * 
     * @throws \Exception
     */
    public function import();
}
