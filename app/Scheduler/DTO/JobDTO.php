<?php

namespace Kirki\Ecommerce\App\Scheduler\DTO;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for a claimed queue job handed to the runner.
 *
 * @since 1.0.0
 */
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
