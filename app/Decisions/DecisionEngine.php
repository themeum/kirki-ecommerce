<?php

namespace Kirki\Ecommerce\App\Decisions;

use Kirki\Ecommerce\App\Decisions\Conditions\Condition;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\Constants\LogicalOperator;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Evaluates rule conditions against a decision context and applies the actions of matching rules.
 *
 * @since 1.0.0
 */
class DecisionEngine
{
    /** @var DecisionContext|null Context the current rules are applied to. */
    protected $context;

    /** @var array<string, class-string<Condition>> Condition class names keyed by condition type. */
    protected $conditions = [];

    /** @var array<string, class-string<Action>> Action class names keyed by action type. */
    protected $actions = [];

    /**
     * Set up the engine with the available condition and action classes.
     *
     * @since 1.0.0
     *
     * @param array<string, string> $conditions Condition class names keyed by condition type.
     * @param array<string, string> $actions    Action class names keyed by action type.
     */
    public function __construct($conditions, $actions)
    {
        $this->conditions = $conditions;
        $this->actions = $actions;
    }

    /**
     * Get the context the engine last applied rules to.
     *
     * @since 1.0.0
     *
     * @return DecisionContext|null Null before any rules have been applied.
     */
    public function get_context()
    {
        return $this->context;
    }

    /**
     * Apply every rule whose conditions pass to the context.
     *
     * @since 1.0.0
     *
     * @param DecisionContext                  $context Context to evaluate and modify.
     * @param array<int, array<string, mixed>> $rules   Rules, each with conditions, an action and an optional relation (AND by default).
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
     * Check if multiple conditions pass based on relation (AND/OR).
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $conditions Condition definitions, each with type, operator and value.
     * @param string                           $relation   AND requires all conditions to pass, OR requires any.
     * @return bool False when there are no conditions.
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
     * Check if the condition passes.
     *
     * Unknown condition types never pass. Fails when the configured class is missing
     * or is not a Condition.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $condition_data Condition definition with type, operator and value.
     * @return bool
     * @throws \Exception When the configured condition class does not exist or is not a Condition.
     */
    public function passes(array $condition_data)
    {
        $type = $condition_data['type'];

        if (!isset($this->conditions[$type])) {
            return false;
        }

        /* translators: %s: condition type */
        throw_if(!class_exists($this->conditions[$type]), sprintf(__('Condition %s does not exist', 'kirki-ecommerce'), $type));

        $condition_instance = new $this->conditions[$type]();

        /* translators: %s: condition type */
        throw_if(!$condition_instance instanceof Condition, sprintf(__('Condition %s does not implement Condition interface', 'kirki-ecommerce'), $type));

        return $condition_instance->evaluate(
            $this->context,
            $condition_data['operator'],
            $this->normalize_value($condition_data['value'])
        );
    }

    /**
     * Apply action.
     *
     * Unknown action types are ignored.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $action_data Action definition with type and value.
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

    /**
     * Decode a JSON object or array string into a PHP array.
     *
     * @since 1.0.0
     *
     * @param mixed $value Condition value as stored on the rule.
     * @return mixed The decoded array, or the value unchanged when it is not a JSON object/array string.
     */
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
