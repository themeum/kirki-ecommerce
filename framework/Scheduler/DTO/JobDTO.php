<?php

namespace Kirki\Ecommerce\Scheduler\DTO;

use Kirki\Ecommerce\DTO;

class JobDTO extends DTO
{
    /**
     * The unique identifier for the job.
     *
     * @var int
     */
    public int $id;

    /**
     * The arguments to be passed to the job handler.
     *
     * @var array
     */
    public array $args;

    /**
     * The resolver class or method for the job.
     *
     * @var string
     */
    public string $resolver;
}
