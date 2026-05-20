<?php

namespace Kirki\Ecommerce\Contracts;

interface Exportable
{
    /**
     * Export data as an DTO instance.
     *
     * @return \Kirki\Ecommerce\DTO|mixed
     * @throws \Exception
     * */
    public function export();
}
