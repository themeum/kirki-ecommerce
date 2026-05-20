<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

class ProductCategoryCondition extends Condition
{
    public function get_type()
    {
        return Conditions::PRODUCT_CATEGORY;
    }

    public function evaluate(DecisionContext $context, $operator, $value)
    {
        $categories = $context->get_product_categories();

        return $this->compare($categories, $operator, $value);
    }
}
