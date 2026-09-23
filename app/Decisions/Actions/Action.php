<?php

namespace Kirki\Ecommerce\App\Decisions\Actions;

use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Contract for a decision action that modifies a decision context when its rule matches.
 *
 * @since 1.0.0
 */
interface Action
{
    /**
     * Get the type of the action.
     *
     * @since 1.0.0
     *
     * @return string One of the Actions constants, used to look the action up in a rule.
     */
    public function get_type();

    /**
     * Execute the action.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context Context to modify.
     * @param mixed           $value   Value configured on the rule's action.
     * @return void
     */
    public function execute(DecisionContext $context, $value);
}
