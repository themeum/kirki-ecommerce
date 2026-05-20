<?php

namespace Kirki\Ecommerce\Contracts;

interface Exportable
{
    /**
     * Export data as an DTO instance.
     *
     * @return \Ecommerce\DTO\DTO|mixed
     * @throws \Exception
     * */
    public function export();
}
