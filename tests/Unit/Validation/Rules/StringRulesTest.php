<?php

namespace Kirki\Ecommerce\Tests\Unit\Validation\Rules;

use Kirki\Ecommerce\Tests\Unit\TestCase;
use Kirki\Ecommerce\Validation\Validator;

class StringRulesTest extends TestCase
{
    public function test_regex_rule_validates_pattern(): void
    {
        $validator = Validator::make(
            ['sku' => 'ABC-123'],
            ['sku' => 'regex:/^[A-Z]{3}-\d{3}$/']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_regex_rule_rejects_non_matching_values(): void
    {
        $validator = Validator::make(
            ['sku' => 'abc-123'],
            ['sku' => 'regex:/^[A-Z]{3}-\d{3}$/']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_email_rule_accepts_valid_email(): void
    {
        $validator = Validator::make(
            ['email' => 'user@example.com'],
            ['email' => 'email']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_email_rule_rejects_invalid_email(): void
    {
        $validator = Validator::make(
            ['email' => 'not-an-email'],
            ['email' => 'email']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_url_rule_accepts_valid_url(): void
    {
        $validator = Validator::make(
            ['website' => 'https://example.com/path'],
            ['website' => 'url']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_url_rule_rejects_invalid_url(): void
    {
        $validator = Validator::make(
            ['website' => 'not-a-url'],
            ['website' => 'url']
        );

        $this->assertTrue($validator->is_failed());
    }
}
