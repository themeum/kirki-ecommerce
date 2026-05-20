<?php

use Kirki\Ecommerce\App\Decisions\Actions\AddShippingCostAction;
use Kirki\Ecommerce\App\Decisions\Actions\DisableShippingMethodAction;
use Kirki\Ecommerce\App\Decisions\Actions\MultiplyShippingCostAction;
use Kirki\Ecommerce\App\Decisions\Actions\SetProductTaxExemptAction;
use Kirki\Ecommerce\App\Decisions\Actions\SetProductTaxRateAction;
use Kirki\Ecommerce\App\Decisions\Actions\SetShippingTaxRateAction;
use Kirki\Ecommerce\App\Decisions\Conditions\DestinationRegionCondition;
use Kirki\Ecommerce\App\Decisions\Conditions\ProductCategoryCondition;
use Kirki\Ecommerce\App\Decisions\Conditions\ProductProfileCondition;
use Kirki\Ecommerce\App\Decisions\Actions\SetFreeShippingAction;
use Kirki\Ecommerce\App\Decisions\Actions\SetShippingCostAction;
use Kirki\Ecommerce\App\Decisions\Conditions\CartWeightCondition;
use Kirki\Ecommerce\App\Decisions\Conditions\CartSubtotalCondition;
use Kirki\Ecommerce\App\Decisions\Conditions\ShippingProfileCondition;
use Kirki\Ecommerce\App\Decisions\Conditions\TaxProfileCondition;

return [
    'conditions' => [
        'product_profile' => ProductProfileCondition::class,
        'tax_profile' => TaxProfileCondition::class,
        'destination_region' => DestinationRegionCondition::class,
        'cart_weight' => CartWeightCondition::class,
        'cart_subtotal' => CartSubtotalCondition::class,
        'shipping_profile' => ShippingProfileCondition::class,
        'product_categories' => ProductCategoryCondition::class,
    ],
    'actions' => [
        'set_shipping_cost' => SetShippingCostAction::class,
        'add_shipping_cost' => AddShippingCostAction::class,
        'multiply_shipping_cost' => MultiplyShippingCostAction::class,
        'set_free_shipping' => SetFreeShippingAction::class,
        'disable_shipping_method' => DisableShippingMethodAction::class,
        'set_product_tax_rate' => SetProductTaxRateAction::class,
        'set_shipping_tax_rate' => SetShippingTaxRateAction::class,
        'set_product_tax_exempt' => SetProductTaxExemptAction::class,
    ],
];
