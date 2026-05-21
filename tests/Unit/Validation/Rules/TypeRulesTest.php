<?php

namespace Kirki\Ecommerce\Tests\Unit\Validation\Rules;

use Kirki\Ecommerce\Tests\Unit\TestCase;
use Kirki\Ecommerce\Validation\Validator;
use stdClass;

class TypeRulesTest extends TestCase
{
    public function test_string_rule_requires_string_values(): void
    {
        $validator = Validator::make(['name' => 123], ['name' => 'string']);

        $this->assertTrue($validator->is_failed());
    }

    public function test_integer_rule_requires_integer_values(): void
    {
        $validator = Validator::make(['count' => '10.5'], ['count' => 'integer']);

        $this->assertTrue($validator->is_failed());
    }

    public function test_float_rule_requires_float_values(): void
    {
        $validator = Validator::make(['rate' => 'not-a-float'], ['rate' => 'float']);

        $this->assertTrue($validator->is_failed());
    }

    public function test_boolean_rule_accepts_boolean_strings(): void
    {
        $validator = Validator::make(['enabled' => 'true'], ['enabled' => 'boolean']);

        $this->assertTrue($validator->is_valid());
    }

    public function test_array_rule_requires_array_values(): void
    {
        $validator = Validator::make(['tags' => 'one,two'], ['tags' => 'array']);

        $this->assertTrue($validator->is_failed());
    }

    public function test_object_rule_requires_object_values(): void
    {
        $validator = Validator::make(['meta' => ['key' => 'value']], ['meta' => 'object']);

        $this->assertTrue($validator->is_failed());
    }

    public function test_object_rule_passes_for_objects(): void
    {
        $validator = Validator::make(['meta' => new stdClass()], ['meta' => 'object']);

        $this->assertTrue($validator->is_valid());
    }

    public function test_number_rule_accepts_numeric_strings(): void
    {
        $validator = Validator::make(['amount' => '12.50'], ['amount' => 'number']);

        $this->assertTrue($validator->is_valid());
    }

    public function test_nullable_rule_allows_null_values(): void
    {
        $validator = Validator::make(['note' => null], ['note' => 'nullable|string']);

        $this->assertTrue($validator->is_valid());
    }

    public function test_nullable_rule_allows_empty_strings(): void
    {
        $validator = Validator::make(['note' => ''], ['note' => 'nullable|string']);

        $this->assertTrue($validator->is_valid());
    }
}
