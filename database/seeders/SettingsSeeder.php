<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $keys = [
            OptionKeys::GENERAL_SETTINGS,
            OptionKeys::PRODUCT_SETTINGS,
            OptionKeys::SHIPPING_SETTINGS,
            OptionKeys::PAYMENT_SETTINGS,
            OptionKeys::TAX_SETTINGS,
            OptionKeys::CHECKOUT_SETTINGS,
            OptionKeys::CURRENCY_SETTINGS,
        ];

        foreach ($keys as $key) {
            $method = 'create_' . $key . '_settings';
            $data = $this->$method();
            Option::set($data['key'], $data['data']);
        }

        Log::info('SettingsSeeder run successfully');
    }

    protected function create_general_settings()
    {
        return [
            'key' => OptionKeys::GENERAL_SETTINGS,
            'data' => [
                "store_name" => "Kirki Ecommerce",
                "store_logo" => 7,
                "store_email" => "info@kirki.com",
                "store_phone" => null,
                "store_address" => [
                    "address_line_1" => null,
                    "address_line_2" => null,
                    "city" => null,
                    "state" => null,
                    "postal_code" => null,
                    "country" => null
                ],
                "selling_location_type" => "all-countries",
                "selling_countries" => [],
                "order_id_prefix" => null,
                "order_id_suffix" => null,
                "invoice_id_prefix" => null,
                "invoice_id_sequence" => null,
                "invoice_id_suffix" => null,
                "invoice_counter_reset_schedule" => null
            ]
        ];
    }

    protected function create_product_settings()
    {
        return [
            'key' => OptionKeys::PRODUCT_SETTINGS,
            'data' => [
                "shop_page" => null,
                "weight_unit" => "kg",
                "dimension_unit" => "m",
                "display_layout" => null,
                "is_enabled_reviews" => true,
                "is_enabled_star_ratings" => true,
                "is_unit_price_visible" => true,
                "barcode_generation" => [
                    "data_origin" => "SKU",
                    "format" => "Code 128 (recommended for SKU/internal use)",
                    "width" => 2.5,
                    "height" => 1.5,
                    "country_of_origin" => "Bangladesh",
                    "is_human_readable_text_visible" => false,
                    "is_product_name_visible" => false,
                    "is_country_of_origin_visible" => false
                ]
            ]
        ];
    }

    protected function create_shipping_settings()
    {
        return [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => [
                "shipping_zones" => [
                    [
                        "id" => "zone-0001",
                        "is_enabled" => true,
                        "title" => "All Countries",
                        "regions" => [
                            [
                                "country" => "BD",
                                "states" => [
                                    "751",
                                    "771"
                                ]
                            ]
                        ],
                        "shipping_methods" => [
                            [
                                "id" => "method-0001",
                                "is_enabled" => true,
                                "name" => "Standard Delivery",
                                "type" => "flat_rate",
                                "amount" => 14,
                                "is_taxable" => true,
                                "description" => null,
                                "shipping_rules" => [
                                    [
                                        "relation" => "AND",
                                        "conditions" => [
                                            [
                                                "type" => "product_profile",
                                                "operator" => "=",
                                                "value" => "fragile"
                                            ]
                                        ],
                                        "action" => [
                                            "type" => "set_shipping_cost",
                                            "value" => 5
                                        ]
                                    ],
                                    [
                                        "relation" => "AND",
                                        "conditions" => [
                                            [
                                                "type" => "shipping_profile",
                                                "operator" => "=",
                                                "value" => "2"
                                            ]
                                        ],
                                        "action" => [
                                            "type" => "add_shipping_cost",
                                            "value" => 50
                                        ]
                                    ]
                                ]
                            ],
                            [
                                "id" => "method-0002",
                                "is_enabled" => true,
                                "name" => "Local Pickup",
                                "type" => "local_pickup",
                                "address" => null,
                                "has_fee" => false,
                                "amount" => 9,
                                "description" => null,
                                "has_pick_time" => false,
                                "pickup_time_start" => null,
                                "pickup_time_end" => null,
                                "shipping_rules" => [
                                    [
                                        "relation" => "AND",
                                        "conditions" => [
                                            [
                                                "type" => "product_profile",
                                                "operator" => "=",
                                                "value" => "fragile"
                                            ]
                                        ],
                                        "action" => [
                                            "type" => "set_shipping_cost",
                                            "value" => 5
                                        ]
                                    ]
                                ]
                            ],
                            [
                                "id" => "method-0003",
                                "is_enabled" => true,
                                "name" => "Rate by Weight",
                                "type" => "weight",
                                "ranges" => [
                                    [
                                        "from" => 0,
                                        "to" => 1,
                                        "amount" => 5
                                    ],
                                    [
                                        "from" => 1,
                                        "to" => 2,
                                        "amount" => 10
                                    ]
                                ],
                                "amount" => 30,
                                "is_free_shipping_enabled" => false,
                                "free_shipping_min_amount" => 10,
                                "is_taxable" => false,
                                "description" => null,
                                "shipping_rules" => [
                                    [
                                        "relation" => "AND",
                                        "conditions" => [
                                            [
                                                "type" => "product_profile",
                                                "operator" => "=",
                                                "value" => "fragile"
                                            ]
                                        ],
                                        "action" => [
                                            "type" => "shipping_cost",
                                            "value" => 5
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ],
                "shipping_carriers" => [
                    [
                        "is_enabled" => true,
                        "name" => "DHL",
                        "type" => "flat_rate",
                        "rate" => 10,
                        "is_taxable" => true,
                        "description" => null,
                        "shipping_rules" => [
                            [
                                "relation" => "AND",
                                "conditions" => [
                                    [
                                        "type" => "product_profile",
                                        "operator" => "=",
                                        "value" => "fragile"
                                    ]
                                ],
                                "action" => [
                                    "type" => "shipping_cost",
                                    "value" => 5
                                ]
                            ]
                        ]
                    ]
                ]
            ],
        ];
    }

    protected function create_payment_settings()
    {
        return [
            "key" => "payment",
            "data" => [
                "payment_gateways" => [
                    [
                        "id" => "fdsf",
                        "is_enabled" => true,
                        "is_manual" => true,
                        "name" => "Cash on Delivery",
                        "icon" => "cash",
                        "instructions" => "Cash on Delivery"
                    ],
                    [
                        "id" => "stripe",
                        "is_enabled" => true,
                        "is_manual" => false,
                        "name" => "Stripe",
                        "icon" => "cash",
                        "instructions" => "Stripe Patment Gateway",
                        "config" => []
                    ]
                ]
            ]
        ];
    }

    protected function create_tax_settings()
    {
        return [
            "key" => "tax",
            "data" => [
                "is_enabled_taxed_price" => false,
                "is_tax_inclusive_price" => false,
                "is_shipping_tax_enabled" => false,
                "tax_regions" => [
                    [
                        "code" => "EU",
                        "name" => "European Union",
                        "is_enabled" => true,
                        "type" => "oss",
                        "product_tax" => [
                            [
                                "country" => "AT",
                                "rate" => 20
                            ],
                            [
                                "country" => "BE",
                                "rate" => 21
                            ]
                        ],
                        "shipping_tax" => [
                            [
                                "country" => "AT",
                                "rate" => 20
                            ],
                            [
                                "country" => "BE",
                                "rate" => 21
                            ]
                        ],
                        "rules" => [
                            [
                                "relation" => "AND",
                                "conditions" => [
                                    [
                                        "type" => "product_categories",
                                        "operator" => "in",
                                        "value" => [1]
                                    ]
                                ],
                                "action" => [
                                    "type" => "set_product_tax_rate",
                                    "value" => 3.5
                                ]
                            ]
                        ]
                    ],
                    [
                        "code" => "BD",
                        "name" => "Bangladesh",
                        "is_enabled" => true,
                        "is_central_tax_enabled" => true,
                        "central_product_tax" => 20,
                        "central_shipping_tax" => 20,
                        "product_tax" => [
                            [
                                "state" => "1200",
                                "rate" => 20
                            ],
                            [
                                "state" => "1250",
                                "rate" => 21
                            ]
                        ],
                        "shipping_tax" => [
                            [
                                "state" => "1200",
                                "rate" => 20
                            ],
                            [
                                "state" => "1250",
                                "rate" => 21
                            ]
                        ],
                        "rules" => [
                            [
                                "relation" => "AND",
                                "conditions" => [
                                    [
                                        "type" => "shipping_profile",
                                        "operator" => "=",
                                        "value" => "laptop"
                                    ]
                                ],
                                "action" => [
                                    "type" => "set_product_tax_rate",
                                    "value" => 5
                                ]
                            ]
                        ]
                    ]
                ],
                "tax_services" => [],
                "tax_ids" => []
            ]
        ];
    }

    protected function create_checkout_settings()
    {
        return [
            'key' => 'checkout',
            'data' => [
                "is_allowed_guest_checkout" => true,
                "checkout_configuration" => [
                    "address_line_validation" => "required",
                    "phone_number_validation" => "required",
                    "company_name_validation" => "optional",
                    "company_id_validation" => "optional",
                    "vat_identification_number_validation" => "optional",
                    "has_apply_coupon_code" => true
                ],
                "is_terms_and_conditions_visible" => true,
                "terms_and_conditions_content" => "[site_name] © 2022 All Rights Reserved.\nPrivacy & Policy - Terms & Conditions",
                "is_privacy_policy_visible" => true,
                "privacy_policy_content" => "[site_name] © 2022 All Rights Reserved.\nPrivacy & Policy - Terms & Conditions"
            ],
        ];
    }

    public function create_currency_settings()
    {
        return [
            "key" => "currency",
            "data" => [
                "base_currency" => "USD",
                "currency_format" => "short",
                "currency_position" => "before",
                "thousand_separator" => ",",
                "decimal_separator" => ".",
                "is_automatic_update_enabled" => true,
                "api_provider" => null,
                "api_config" => []
            ]
        ];
    }
}
