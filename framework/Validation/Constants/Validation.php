<?php

namespace Kirki\Ecommerce\Validation\Constants;

use Kirki\Ecommerce\Validation\Rules\AfterRule;
use Kirki\Ecommerce\Validation\Rules\ArrayRule;
use Kirki\Ecommerce\Validation\Rules\BooleanRule;
use Kirki\Ecommerce\Validation\Rules\DateFormatRule;
use Kirki\Ecommerce\Validation\Rules\DateRule;
use Kirki\Ecommerce\Validation\Rules\DateTimeRule;
use Kirki\Ecommerce\Validation\Rules\EmailRule;
use Kirki\Ecommerce\Validation\Rules\EmailUniqueRule;
use Kirki\Ecommerce\Validation\Rules\ExistsRule;
use Kirki\Ecommerce\Validation\Rules\FloatRule;
use Kirki\Ecommerce\Validation\Rules\GreaterThanEqualRule;
use Kirki\Ecommerce\Validation\Rules\GreaterThanRule;
use Kirki\Ecommerce\Validation\Rules\InRule;
use Kirki\Ecommerce\Validation\Rules\IntegerRule;
use Kirki\Ecommerce\Validation\Rules\IsValidImageIdRule;
use Kirki\Ecommerce\Validation\Rules\LessThanEqualRule;
use Kirki\Ecommerce\Validation\Rules\LessThanRule;
use Kirki\Ecommerce\Validation\Rules\MaxRule;
use Kirki\Ecommerce\Validation\Rules\MinRule;
use Kirki\Ecommerce\Validation\Rules\NotInRule;
use Kirki\Ecommerce\Validation\Rules\NullableRule;
use Kirki\Ecommerce\Validation\Rules\NumberRule;
use Kirki\Ecommerce\Validation\Rules\ObjectRule;
use Kirki\Ecommerce\Validation\Rules\ProhibitedIfRule;
use Kirki\Ecommerce\Validation\Rules\RegexRule;
use Kirki\Ecommerce\Validation\Rules\RequiredIfExists;
use Kirki\Ecommerce\Validation\Rules\RequiredIfRule;
use Kirki\Ecommerce\Validation\Rules\RequiredIfSiblingRule;
use Kirki\Ecommerce\Validation\Rules\RequiredRule;
use Kirki\Ecommerce\Validation\Rules\SameAsRule;
use Kirki\Ecommerce\Validation\Rules\Sanitizer;
use Kirki\Ecommerce\Validation\Rules\StringRule;
use Kirki\Ecommerce\Validation\Rules\UniqueRule;
use Kirki\Ecommerce\Validation\Rules\UrlRule;
use Kirki\Ecommerce\Validation\Rules\UserExists;

class Validation
{
    /**
     * The rules to validator method map
     * 
     * @var array
     * 
     * @since 3.3.0
     */
    const RULE_MAP = [
        'required' => RequiredRule::class,
        'string' => StringRule::class,
        'array' => ArrayRule::class,
        'object' => ObjectRule::class,
        'boolean' => BooleanRule::class,
        'integer' => IntegerRule::class,
        'number' => NumberRule::class,
        'float' => FloatRule::class,
        'email' => EmailRule::class,
        'email_unique' => EmailUniqueRule::class,
        'unique' => UniqueRule::class,
        'url' => UrlRule::class,
        'exists' => ExistsRule::class,
        'min' => MinRule::class,
        'max' => MaxRule::class,
        'in' => InRule::class,
        'not_in' => NotInRule::class,
        'regex' => RegexRule::class,
        'sanitize' => Sanitizer::class,
        'same_as' => SameAsRule::class,
        'nullable' => NullableRule::class,
        'date' => DateRule::class,
        'datetime' => DateTimeRule::class,
        'date_format' => DateFormatRule::class,
        'is_valid_image_id' => IsValidImageIdRule::class,
        'required_if' => RequiredIfRule::class,
        'required_if_sibling' => RequiredIfSiblingRule::class,
        'prohibited_if' => ProhibitedIfRule::class,
        'required_if_exists' => RequiredIfExists::class,
        'user_exists' => UserExists::class,
        'after' => AfterRule::class,
        'gt' => GreaterThanRule::class,
        'gte' => GreaterThanEqualRule::class,
        'lt' => LessThanRule::class,
        'lte' => LessThanEqualRule::class,
    ];
}
