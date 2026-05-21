<?php

namespace Kirki\Ecommerce\Tests\Unit\Validation\Rules;

use Kirki\Ecommerce\Tests\Unit\TestCase;
use Kirki\Ecommerce\Validation\Validator;

class DateRulesTest extends TestCase
{
    public function test_date_rule_accepts_db_date_format(): void
    {
        $validator = Validator::make(
            ['starts_on' => '2024-05-01'],
            ['starts_on' => 'date']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_date_rule_rejects_invalid_dates(): void
    {
        $validator = Validator::make(
            ['starts_on' => '2024-13-40'],
            ['starts_on' => 'date']
        );

        $this->assertTrue($validator->is_failed());
    }

    public function test_datetime_rule_accepts_db_datetime_format(): void
    {
        $validator = Validator::make(
            ['published_at' => '2024-05-01 14:30:00'],
            ['published_at' => 'datetime']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_date_format_rule_accepts_custom_format(): void
    {
        $validator = Validator::make(
            ['starts_on' => '01-05-2024'],
            ['starts_on' => 'date_format:d-m-Y']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_after_rule_passes_when_date_is_after_reference_field(): void
    {
        $this->bind_date_manager();

        $validator = Validator::make(
            [
                'starts_on' => '2024-01-01',
                'ends_on' => '2024-06-01',
            ],
            ['ends_on' => 'after:starts_on']
        );

        $this->assertTrue($validator->is_valid());
    }

    public function test_after_rule_fails_when_date_is_before_reference_field(): void
    {
        $this->bind_date_manager();

        $validator = Validator::make(
            [
                'starts_on' => '2024-06-01',
                'ends_on' => '2024-01-01',
            ],
            ['ends_on' => 'after:starts_on']
        );

        $this->assertTrue($validator->is_failed());
    }
}
