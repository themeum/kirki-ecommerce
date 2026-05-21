<?php

namespace Kirki\Ecommerce\Tests\Unit\Validation\Rules;

use Kirki\Ecommerce\Tests\Unit\TestCase;
use Kirki\Ecommerce\Validation\Validator;

class ConditionalRulesTest extends TestCase
{
    public function test_required_if_passes_when_trigger_field_does_not_match(): void
    {
        $validator = Validator::make(
            ['type' => 'standard', 'extra' => ''],
            ['extra' => 'required_if:type,premium']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_required_if_fails_when_trigger_field_matches_and_value_is_empty(): void
    {
        $validator = Validator::make(
            ['type' => 'premium', 'extra' => ''],
            ['extra' => 'required_if:type,premium']
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('extra', $validator->get_errors());
    }

    public function test_required_if_sibling_validates_within_parent_array(): void
    {
        $validator = Validator::make(
            [
                'line' => [
                    'kind' => 'gift',
                    'message' => '',
                ],
            ],
            ['line.message' => 'required_if_sibling:kind,gift']
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('line.message', $validator->get_errors());
    }

    public function test_prohibited_if_fails_when_condition_matches_and_value_is_present(): void
    {
        $validator = Validator::make(
            ['status' => 'draft', 'published_at' => '2024-01-01'],
            ['published_at' => 'prohibited_if:status,draft']
        );

        $this->assertTrue($validator->is_failed());
        $this->assertArrayHasKey('published_at', $validator->get_errors());
    }

    public function test_prohibited_if_passes_when_field_is_empty(): void
    {
        $validator = Validator::make(
            ['status' => 'draft', 'published_at' => ''],
            ['published_at' => 'prohibited_if:status,draft']
        );

        $this->assertTrue($validator->is_valid());
    }
}
