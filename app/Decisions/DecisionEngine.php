<?php

namespace Kirki\Ecommerce\App\Decisions;

use Kirki\Ecommerce\App\Decisions\Conditions\Condition;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\Constants\LogicalOperator;
use Exception;

class DecisionEngine
{
    protected $context;
    protected $conditions = [];
    protected $actions = [];

    public function __construct($conditions, $actions)
    {
        $this->conditions = $conditions;
        $this->actions = $actions;
    }

    /**
     * Get the context
     *
     * @return DecisionContext
     */
    public function get_context()
    {
        return $this->context;
    }

    /**
     * Apply rules
     *
     * @param DecisionContext $context
     * @param array $rules
     * @return void
     */
    public function apply_rules(DecisionContext $context, array $rules)
    {
        $this->context = $context;

        foreach ($rules as $rule) {
            if ($this->passes_conditions($rule['conditions'], $rule['relation'] ?? 'AND')) {
                $this->apply_action($rule['action']);
            }
        }
    }

    /**
     * Check if multiple conditions pass based on relation (AND/OR)
     *
     * @param array $conditions
     * @param string $relation
     * @return bool
     */
    public function passes_conditions(array $conditions, $relation = 'AND')
    {
        if (empty($conditions)) {
            return false;
        }

        $relation = strtoupper($relation);

        foreach ($conditions as $condition) {
            $passes = $this->passes($condition);

            if ($relation === LogicalOperator::OR && $passes) {
                return true;
            }

            if ($relation === LogicalOperator::AND && !$passes) {
                return false;
            }
        }

        return $relation === LogicalOperator::AND;
    }

    /**
     * Check if the condition passes
     *
     * @param array $condition_data
     * @return bool
     */
    public function passes(array $condition_data)
    {
        $type = $condition_data['type'];

        if (!isset($this->conditions[$type])) {
            return false;
        }

        if (!class_exists($this->conditions[$type])) {
            throw new Exception(sprintf(__('Condition %s does not exist', 'kirki-ecommerce'), $type));
        }

        $condition_instance = new $this->conditions[$type]();

        if (!$condition_instance instanceof Condition) {
            throw new Exception(sprintf(__('Condition %s does not implement Condition interface', 'kirki-ecommerce'), $type));
        }

        return $condition_instance->evaluate(
            $this->context,
            $condition_data['operator'],
            $this->normalize_value($condition_data['value'])
        );
    }

    /**
     * Apply action
     *
     * @param array $action_data
     * @return void
     */
    public function apply_action(array $action_data)
    {
        $type = $action_data['type'];

        if (isset($this->actions[$type])) {
            $action_instance = new $this->actions[$type]();
            $action_instance->execute(
                $this->context,
                $action_data['value']
            );
        }
    }

    protected function normalize_value($value)
    {
        if (!is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);

        if ($trimmed === '' || ($trimmed[0] !== '{' && $trimmed[0] !== '[')) {
            return $value;
        }

        $decoded = json_decode($value, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        return $value;
    }
}
