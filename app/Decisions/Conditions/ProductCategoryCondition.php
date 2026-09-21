<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

/**
 * Decision condition that matches on the product's categories.
 *
 * @since 1.0.0
 */
class ProductCategoryCondition extends Condition
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return Conditions::PRODUCT_CATEGORY;
    }

    /**
     * Compare the context's product category IDs with the value.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context  Context to read from.
     * @param string          $operator Comparison operator.
     * @param mixed           $value    Value configured on the rule's condition.
     * @return bool
     */
    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $categories = $context->get_product_categories();

        return $this->compare($categories, $operator, $value);
    }
}
