<?php

namespace Kirki\Ecommerce\Exceptions;

use RuntimeException;

class MultipleRecordsFoundException extends RuntimeException
{
    protected $count;

    public function __construct($count, $code = 0, $previous = null)
    {
        $this->count = $count;

        parent::__construct(sprintf('%d records were found', $count, $code, $previous));
    }

    public function get_count()
    {
        return $this->count;
    }
}
