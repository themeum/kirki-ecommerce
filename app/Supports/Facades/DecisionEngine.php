<?php

namespace Kirki\Ecommerce\App\Supports\Facades;

use Kirki\Ecommerce\Framework\Facade;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Facade for the decision engine that evaluates conditions and applies rule actions.
 *
 * @method DecisionContext get_context()
 * @method void apply_rules(DecisionContext $context, array $rules)
 * @method bool passes(array $condition_data)
 * @method void apply_action(array $action_data)
 *
 * @see \Kirki\Ecommerce\App\Decisions\DecisionEngine
 *
 * @since 1.0.0
 */
class DecisionEngine extends Facade
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public static function get_accessor()
    {
        return 'decision_engine';
    }
}
