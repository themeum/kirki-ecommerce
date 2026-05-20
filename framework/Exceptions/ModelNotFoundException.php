<?php

namespace Kirki\Ecommerce\Exceptions;

use Kirki\Ecommerce\Supports\Arr;

/**
 * Exception thrown when a model (database record) is not found.
 *
 * @package Kirki\Ecommerce\Exceptions
 */
class ModelNotFoundException extends NotFoundException
{
    /**
     * The model class name being queried.
     * 
     * @var string
     */
    protected $model;

    /**
     * The IDs or route keys that were searched for.
     * 
     * @var mixed
     */
    protected $ids;

    /**
     * Create a new ModelNotFoundException instance.
     *
     * @param string $model The model class name.
     * @param mixed $ids The ID(s) or route key(s) searched for.
     */
    public function __construct($model, $ids = [])
    {
        $this->model = $model;
        $this->ids = $ids;
        $this->prepare_message();
    }

    /**
     * Set the model class name for the exception.
     *
     * @param string $model The model class name.
     * @return void
     */
    public function set_model($model)
    {
        $this->model = $model;
        $this->prepare_message();
    }

    /**
     * Set the IDs or route keys that were searched for.
     *
     * @param mixed $ids The ID(s) or route key(s).
     * @return void
     */
    public function set_ids($ids)
    {
        $this->ids = $ids;
        $this->prepare_message();
    }

    /**
     * Get the model class name.
     *
     * @return string
     */
    public function get_model()
    {
        return $this->model;
    }

    /**
     * Get the ID(s) or route key(s).
     *
     * @return mixed
     */
    public function get_ids()
    {
        return $this->ids;
    }

    /**
     * Prepare the exception message using the model and ids.
     *
     * @return void
     */
    protected function prepare_message()
    {
        $ids = Arr::wrap($this->ids);
        $this->message = sprintf(
            __('No query results for model [%s] with ids: %s', 'kirki-ecommerce'),
            $this->model,
            implode(', ', $ids)
        );
    }
}
