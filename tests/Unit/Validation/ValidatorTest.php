<?php

namespace Kirki\Ecommerce\Tests\Unit\Validation;

use Kirki\Ecommerce\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use Kirki\Ecommerce\Validation\Validator;

class ValidatorTest extends TestCase
{
    public function test_it_passes_when_all_rules_are_satisfied(): void
    {
        $validator = Validator::make(
            ['name' => 'Widget', 'price' => 10],
            ['name' => 'required|string', 'price' => 'required|integer']
        );

        $this->assertTrue($validator->is_valid());
        $this->assertSame(['name' => 'Widget', 'price' => 10], $validator->validated());
    }

    public function test_it_collects_errors_for_invalid_fields(): void
    {
        $validator = Validator::make(
            ['name' => ''],
            ['name' => 'required|string']
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('name', $validator->get_errors());
    }

    public function test_validate_throws_validation_exception_on_failure(): void
    {
        $validator = Validator::make(['email' => 'not-an-email'], ['email' => 'email']);

        $this->expectException(ValidationException::class);
        $validator->validate();
    }

    public function test_it_validates_wildcard_array_fields(): void
    {
        $validator = Validator::make(
            [
                'items' => [
                    ['name' => 'A'],
                    ['name' => ''],
                ],
            ],
            ['items.*.name' => 'required|string']
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('items.1.name', $validator->get_errors());
    }

    public function test_it_builds_nested_validated_data_from_dot_notation(): void
    {
        $validator = Validator::make(
            [
                'user' => [
                    'profile' => [
                        'name' => 'Jane',
                    ],
                ],
            ],
            ['user.profile.name' => 'required|string']
        );

        $this->assertTrue($validator->is_valid());
        $this->assertSame(
            [
                'user' => [
                    'profile' => [
                        'name' => 'Jane',
                    ],
                ],
            ],
            $validator->validated()
        );
    }

    public function test_strict_type_rules_pass_when_any_strict_rule_matches(): void
    {
        $validator = Validator::make(
            ['value' => 42],
            ['value' => 'string|integer']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_strict_type_rules_fail_when_no_strict_rule_matches(): void
    {
        $validator = Validator::make(
            ['value' => 42.5],
            ['value' => 'string|integer']
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('value', $validator->get_errors());
    }

    public function test_apply_if_adds_rules_when_callback_returns_true(): void
    {
        $validator = Validator::make(
            ['enabled' => true, 'code' => ''],
            ['enabled' => 'boolean']
        );

        $validator->apply_if('code', 'required|string', function (array $data) {
            return !empty($data['enabled']);
        });

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('code', $validator->get_errors());
    }

    public function test_apply_if_skips_rules_when_callback_returns_false(): void
    {
        $validator = Validator::make(
            ['enabled' => false, 'code' => ''],
            ['enabled' => 'boolean']
        );

        $validator->apply_if('code', 'required|string', function (array $data) {
            return !empty($data['enabled']);
        });

        $this->assertTrue($validator->is_valid());
    }

    public function test_it_supports_closure_validation_rules(): void
    {
        $validator = Validator::make(
            ['slug' => 'Invalid Slug'],
            [
                'slug' => [
                    function ($value) {
                        return $value === 'valid-slug' ? true : 'Slug must be valid-slug.';
                    },
                ],
            ]
        );

        $this->assertTrue($validator->is_failed());
        $this->assertSame(['Slug must be valid-slug.'], $validator->get_errors()['slug']);
    }

    public function test_it_reports_error_when_wildcard_target_is_not_an_array(): void
    {
        $validator = Validator::make(
            ['items' => 'not-an-array'],
            ['items.*.name' => 'required|string']
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('items', $validator->get_errors());
    }
}
