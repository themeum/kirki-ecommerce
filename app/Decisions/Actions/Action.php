<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

interface Action
{
    /**
     * Get the type of the action.
     *
     * @return string
     */
    public function get_type();

    /**
     * Execute the action.
     *
     * @param DecisionContext $context
     * @param mixed $value
     * @return void
     */
    public function execute(DecisionContext $context, $value);
}
