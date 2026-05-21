<?php

namespace Kirki\Ecommerce\Tests\Unit\Validation\Rules;

use Kirki\Ecommerce\Tests\Unit\TestCase;
use Kirki\Ecommerce\Validation\Validator;

class ComparisonRulesTest extends TestCase
{
    public function test_min_rule_validates_string_length(): void
    {
        $validator = Validator::make(
            ['code' => 'ab'],
            ['code' => 'string|min:3']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_max_rule_validates_string_length(): void
    {
        $validator = Validator::make(
            ['code' => 'abcdef'],
            ['code' => 'string|max:3']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_min_rule_validates_numeric_values(): void
    {
        $validator = Validator::make(
            ['quantity' => 2],
            ['quantity' => 'integer|min:5']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_gt_rule_validates_numeric_comparison(): void
    {
        $validator = Validator::make(
            ['price' => 5],
            ['price' => 'integer|gt:10']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_gte_rule_passes_on_equal_values(): void
    {
        $validator = Validator::make(
            ['price' => 10],
            ['price' => 'integer|gte:10']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_lt_rule_validates_numeric_comparison(): void
    {
        $validator = Validator::make(
            ['discount' => 15],
            ['discount' => 'integer|lt:10']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_lte_rule_passes_on_equal_values(): void
    {
        $validator = Validator::make(
            ['discount' => 10],
            ['discount' => 'integer|lte:10']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_in_rule_accepts_allowed_values(): void
    {
        $validator = Validator::make(
            ['status' => 'active'],
            ['status' => 'in:active,inactive,pending']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_not_in_rule_rejects_disallowed_values(): void
    {
        $validator = Validator::make(
            ['status' => 'deleted'],
            ['status' => 'not_in:deleted,archived']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_same_as_rule_requires_matching_field_value(): void
    {
        $validator = Validator::make(
            ['password' => 'secret', 'password_confirmation' => 'different'],
            [
                'password' => 'required|string',
                'password_confirmation' => 'same_as:password',
            ]
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('password_confirmation', $validator->get_errors());
    }
}
